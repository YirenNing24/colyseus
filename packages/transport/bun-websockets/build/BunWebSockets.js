var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var BunWebSockets_exports = {};
__export(BunWebSockets_exports, {
  BunWebSockets: () => BunWebSockets
});
module.exports = __toCommonJS(BunWebSockets_exports);
var import_bun_serve_express = __toESM(require("bun-serve-express"));
var import_core = require("@colyseus/core");
var import_WebSocketClient = require("./WebSocketClient");
class BunWebSockets extends import_core.Transport {
  constructor(options = {}) {
    super();
    this.options = options;
    this.clients = [];
    this.clientWrappers = /* @__PURE__ */ new WeakMap();
    this._originalRawSend = null;
    const self = this;
    this.expressApp = (0, import_bun_serve_express.default)({
      websocket: {
        ...this.options,
        async open(ws) {
          await self.onConnection(ws);
        },
        message(ws, message) {
          self.clientWrappers.get(ws)?.emit("message", message);
        },
        close(ws, code, reason) {
          (0, import_core.spliceOne)(self.clients, self.clients.indexOf(ws));
          const clientWrapper = self.clientWrappers.get(ws);
          if (clientWrapper) {
            self.clientWrappers.delete(ws);
            clientWrapper.emit("close", code);
          }
        }
      }
    });
    if (!this.server) {
      this.server = new import_core.DummyServer();
    }
  }
  listen(port, hostname, backlog, listeningListener) {
    this._listening = this.expressApp.listen(port, listeningListener);
    this.expressApp.use(`/${import_core.matchMaker.controller.matchmakeRoute}`, async (req, res) => {
      try {
        await this.handleMatchMakeRequest(req, res);
      } catch (e) {
        res.status(500).json({
          code: e.code,
          error: e.message
        });
      }
    });
    this.server.emit("listening");
    return this;
  }
  shutdown() {
    if (this._listening) {
      this._listening.close();
      this.server.emit("close");
    }
  }
  simulateLatency(milliseconds) {
    if (this._originalRawSend == null) {
      this._originalRawSend = import_WebSocketClient.WebSocketClient.prototype.raw;
    }
    const originalRawSend = this._originalRawSend;
    import_WebSocketClient.WebSocketClient.prototype.raw = milliseconds <= Number.EPSILON ? originalRawSend : function() {
      setTimeout(() => originalRawSend.apply(this, arguments), milliseconds);
    };
  }
  async onConnection(rawClient) {
    const wrapper = new import_WebSocketClient.WebSocketWrapper(rawClient);
    this.clients.push(rawClient);
    this.clientWrappers.set(rawClient, wrapper);
    const parsedURL = new URL(rawClient.data.url);
    const sessionId = parsedURL.searchParams.get("sessionId");
    const processAndRoomId = parsedURL.pathname.match(/\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)$/);
    const roomId = processAndRoomId && processAndRoomId[1];
    const room = import_core.matchMaker.getRoomById(roomId);
    const client = new import_WebSocketClient.WebSocketClient(sessionId, wrapper);
    try {
      if (!room || !room.hasReservedSeat(sessionId, parsedURL.searchParams.get("reconnectionToken"))) {
        throw new Error("seat reservation expired.");
      }
      await room._onJoin(client, rawClient);
    } catch (e) {
      (0, import_core.debugAndPrintError)(e);
      client.error(e.code, e.message, () => rawClient.close());
    }
  }
  async handleMatchMakeRequest(req, res) {
    const writeHeaders = (req2, res2) => {
      if (res2.destroyed)
        return;
      res2.set(Object.assign(
        {},
        import_core.matchMaker.controller.DEFAULT_CORS_HEADERS,
        import_core.matchMaker.controller.getCorsHeaders.call(void 0, req2)
      ));
      return true;
    };
    try {
      switch (req.method) {
        case "OPTIONS": {
          writeHeaders(req, res);
          res.status(200).end();
          break;
        }
        case "GET": {
          const matchedParams = req.path.match(import_core.matchMaker.controller.allowedRoomNameChars);
          const roomName = matchedParams && matchedParams.length > 1 ? matchedParams[matchedParams.length - 1] : "";
          writeHeaders(req, res);
          res.json(await import_core.matchMaker.controller.getAvailableRooms(roomName || ""));
          break;
        }
        case "POST": {
          if (import_core.matchMaker.isGracefullyShuttingDown) {
            throw new import_core.ServerError(503, "server is shutting down");
          }
          const matchedParams = req.path.match(import_core.matchMaker.controller.allowedRoomNameChars);
          const matchmakeIndex = matchedParams.indexOf(import_core.matchMaker.controller.matchmakeRoute);
          let clientOptions = req.body;
          if (clientOptions == null) {
            throw new import_core.ServerError(500, "invalid JSON input");
          }
          if (typeof clientOptions === "string" && clientOptions.length > 2) {
            clientOptions = JSON.parse(clientOptions);
          } else if (typeof clientOptions !== "object") {
            clientOptions = {};
          }
          const method = matchedParams[matchmakeIndex + 1];
          const roomName = matchedParams[matchmakeIndex + 2] || "";
          writeHeaders(req, res);
          res.json(await import_core.matchMaker.controller.invokeMethod(
            method,
            roomName,
            clientOptions,
            { token: (0, import_core.getBearerToken)(req.headers["authorization"]), request: req }
          ));
          break;
        }
        default:
          throw new import_core.ServerError(500, "invalid request method");
      }
    } catch (e) {
      writeHeaders(req, res);
      res.status(500).json({ code: e.code, error: e.message });
    }
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  BunWebSockets
});
