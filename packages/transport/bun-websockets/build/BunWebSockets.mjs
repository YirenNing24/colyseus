import bunExpress from "bun-serve-express";
import { DummyServer, matchMaker, Transport, debugAndPrintError, spliceOne, ServerError, getBearerToken } from "@colyseus/core";
import { WebSocketClient, WebSocketWrapper } from "./WebSocketClient";
class BunWebSockets extends Transport {
  constructor(options = {}) {
    super();
    this.options = options;
    this.clients = [];
    this.clientWrappers = /* @__PURE__ */ new WeakMap();
    this._originalRawSend = null;
    const self = this;
    this.expressApp = bunExpress({
      websocket: {
        ...this.options,
        async open(ws) {
          await self.onConnection(ws);
        },
        message(ws, message) {
          self.clientWrappers.get(ws)?.emit("message", message);
        },
        close(ws, code, reason) {
          spliceOne(self.clients, self.clients.indexOf(ws));
          const clientWrapper = self.clientWrappers.get(ws);
          if (clientWrapper) {
            self.clientWrappers.delete(ws);
            clientWrapper.emit("close", code);
          }
        }
      }
    });
    if (!this.server) {
      this.server = new DummyServer();
    }
  }
  listen(port, hostname, backlog, listeningListener) {
    this._listening = this.expressApp.listen(port, listeningListener);
    this.expressApp.use(`/${matchMaker.controller.matchmakeRoute}`, async (req, res) => {
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
      this._originalRawSend = WebSocketClient.prototype.raw;
    }
    const originalRawSend = this._originalRawSend;
    WebSocketClient.prototype.raw = milliseconds <= Number.EPSILON ? originalRawSend : function() {
      setTimeout(() => originalRawSend.apply(this, arguments), milliseconds);
    };
  }
  async onConnection(rawClient) {
    const wrapper = new WebSocketWrapper(rawClient);
    this.clients.push(rawClient);
    this.clientWrappers.set(rawClient, wrapper);
    const parsedURL = new URL(rawClient.data.url);
    const sessionId = parsedURL.searchParams.get("sessionId");
    const processAndRoomId = parsedURL.pathname.match(/\/[a-zA-Z0-9_\-]+\/([a-zA-Z0-9_\-]+)$/);
    const roomId = processAndRoomId && processAndRoomId[1];
    const room = matchMaker.getRoomById(roomId);
    const client = new WebSocketClient(sessionId, wrapper);
    try {
      if (!room || !room.hasReservedSeat(sessionId, parsedURL.searchParams.get("reconnectionToken"))) {
        throw new Error("seat reservation expired.");
      }
      await room._onJoin(client, rawClient);
    } catch (e) {
      debugAndPrintError(e);
      client.error(e.code, e.message, () => rawClient.close());
    }
  }
  async handleMatchMakeRequest(req, res) {
    const writeHeaders = (req2, res2) => {
      if (res2.destroyed)
        return;
      res2.set(Object.assign(
        {},
        matchMaker.controller.DEFAULT_CORS_HEADERS,
        matchMaker.controller.getCorsHeaders.call(void 0, req2)
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
          const matchedParams = req.path.match(matchMaker.controller.allowedRoomNameChars);
          const roomName = matchedParams && matchedParams.length > 1 ? matchedParams[matchedParams.length - 1] : "";
          writeHeaders(req, res);
          res.json(await matchMaker.controller.getAvailableRooms(roomName || ""));
          break;
        }
        case "POST": {
          if (matchMaker.isGracefullyShuttingDown) {
            throw new ServerError(503, "server is shutting down");
          }
          const matchedParams = req.path.match(matchMaker.controller.allowedRoomNameChars);
          const matchmakeIndex = matchedParams.indexOf(matchMaker.controller.matchmakeRoute);
          let clientOptions = req.body;
          if (clientOptions == null) {
            throw new ServerError(500, "invalid JSON input");
          }
          if (typeof clientOptions === "string" && clientOptions.length > 2) {
            clientOptions = JSON.parse(clientOptions);
          } else if (typeof clientOptions !== "object") {
            clientOptions = {};
          }
          const method = matchedParams[matchmakeIndex + 1];
          const roomName = matchedParams[matchmakeIndex + 2] || "";
          writeHeaders(req, res);
          res.json(await matchMaker.controller.invokeMethod(
            method,
            roomName,
            clientOptions,
            { token: getBearerToken(req.headers["authorization"]), request: req }
          ));
          break;
        }
        default:
          throw new ServerError(500, "invalid request method");
      }
    } catch (e) {
      writeHeaders(req, res);
      res.status(500).json({ code: e.code, error: e.message });
    }
  }
}
export {
  BunWebSockets
};
