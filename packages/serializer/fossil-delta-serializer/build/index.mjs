import fossilDelta from "fossil-delta";
import { pack, unpack } from "msgpackr";
import { Protocol, debugPatch } from "@colyseus/core";
import jsonPatch from "fast-json-patch";
class FossilDeltaSerializer {
  constructor() {
    this.id = "fossil-delta";
  }
  reset(newState) {
    this.previousState = newState;
    this.previousStateEncoded = pack(this.previousState);
  }
  getFullState(_) {
    return this.previousStateEncoded;
  }
  applyPatches(clients, previousState) {
    const hasChanged = this.hasChanged(previousState);
    if (hasChanged) {
      this.patches.unshift(Protocol.ROOM_STATE_PATCH);
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
        currentStateEncoded = pack(currentState);
      }
    } else {
      currentStateEncoded = pack(currentState);
      changed = !currentStateEncoded.equals(this.previousStateEncoded);
    }
    if (changed) {
      this.patches = fossilDelta.create(this.previousStateEncoded, currentStateEncoded);
      if (debugPatch.enabled) {
        debugPatch(
          "%d bytes, %j",
          this.patches.length,
          jsonPatch.compare(unpack(this.previousStateEncoded), currentState)
        );
      }
      this.previousState = currentState;
      this.previousStateEncoded = currentStateEncoded;
    }
    return changed;
  }
}
export {
  FossilDeltaSerializer
};
