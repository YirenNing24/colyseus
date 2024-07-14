import EventEmitter from "events";
import { Protocol, ClientState, getMessageBytes, logger, debugMessage } from "@colyseus/core";
import { Schema } from "@colyseus/schema";
class WebSocketWrapper extends EventEmitter {
  constructor(ws) {
    super();
    this.ws = ws;
  }
}
class WebSocketClient {
  constructor(id, ref) {
    this.id = id;
    this.ref = ref;
    this.state = ClientState.JOINING;
    this._enqueuedMessages = [];
    this.sessionId = id;
  }
  sendBytes(type, bytes, options) {
    debugMessage("send bytes(to %s): '%s' -> %j", this.sessionId, type, bytes);
    this.enqueueRaw(
      getMessageBytes.raw(Protocol.ROOM_DATA_BYTES, type, void 0, bytes),
      options
    );
  }
  send(messageOrType, messageOrOptions, options) {
    debugMessage("send(to %s): '%s' -> %j", this.sessionId, messageOrType, messageOrOptions);
    this.enqueueRaw(
      messageOrType instanceof Schema ? getMessageBytes[Protocol.ROOM_DATA_SCHEMA](messageOrType) : getMessageBytes.raw(Protocol.ROOM_DATA, messageOrType, messageOrOptions),
      options
    );
  }
  enqueueRaw(data, options) {
    if (options?.afterNextPatch) {
      this._afterNextPatchQueue.push([this, arguments]);
      return;
    }
    if (this.state === ClientState.JOINING) {
      this._enqueuedMessages.push(data);
      return;
    }
    this.raw(data, options);
  }
  raw(data, options, cb) {
    if (this.ref.ws.readyState !== WebSocket.OPEN) {
      return;
    }
    this.ref.ws.sendBinary(Buffer.from(data));
  }
  error(code, message = "", cb) {
    this.raw(getMessageBytes[Protocol.ERROR](code, message), void 0, cb);
  }
  get readyState() {
    return this.ref.ws.readyState;
  }
  leave(code, data) {
    this.ref.ws.close(code, data);
  }
  close(code, data) {
    logger.warn("DEPRECATION WARNING: use client.leave() instead of client.close()");
    try {
      throw new Error();
    } catch (e) {
      logger.info(e.stack);
    }
    this.leave(code, data);
  }
  toJSON() {
    return { sessionId: this.sessionId, readyState: this.readyState };
  }
}
export {
  WebSocketClient,
  WebSocketWrapper
};
