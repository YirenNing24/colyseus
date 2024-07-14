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
var src_exports = {};
__export(src_exports, {
  FossilDeltaSerializer: () => FossilDeltaSerializer
});
module.exports = __toCommonJS(src_exports);
var import_fossil_delta = __toESM(require("fossil-delta"));
var import_msgpackr = require("msgpackr");
var import_core = require("@colyseus/core");
var import_fast_json_patch = __toESM(require("fast-json-patch"));
class FossilDeltaSerializer {
  constructor() {
    this.id = "fossil-delta";
  }
  reset(newState) {
    this.previousState = newState;
    this.previousStateEncoded = (0, import_msgpackr.pack)(this.previousState);
  }
  getFullState(_) {
    return this.previousStateEncoded;
  }
  applyPatches(clients, previousState) {
    const hasChanged = this.hasChanged(previousState);
    if (hasChanged) {
      this.patches.unshift(import_core.Protocol.ROOM_STATE_PATCH);
      let numClients = clients.length;
      while (numClients--) {
        const client = clients[numClients];
        client.enqueueRaw(this.patches);
      }
    }
    return hasChanged;
  }
  hasChanged(newState) {
    const currentState = newState;
    let changed = false;
    let currentStateEncoded;
    if (newState?.["$changes"]) {
      if (newState["$changes"].changes.size > 0) {
        changed = true;
        currentStateEncoded = (0, import_msgpackr.pack)(currentState);
      }
    } else {
      currentStateEncoded = (0, import_msgpackr.pack)(currentState);
      changed = !currentStateEncoded.equals(this.previousStateEncoded);
    }
    if (changed) {
      this.patches = import_fossil_delta.default.create(this.previousStateEncoded, currentStateEncoded);
      if (import_core.debugPatch.enabled) {
        (0, import_core.debugPatch)(
          "%d bytes, %j",
          this.patches.length,
          import_fast_json_patch.default.compare((0, import_msgpackr.unpack)(this.previousStateEncoded), currentState)
        );
      }
      this.previousState = currentState;
      this.previousStateEncoded = currentStateEncoded;
    }
    return changed;
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  FossilDeltaSerializer
});
