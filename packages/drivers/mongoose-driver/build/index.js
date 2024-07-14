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
  MongooseDriver: () => MongooseDriver
});
module.exports = __toCommonJS(src_exports);
var import_core = require("@colyseus/core");
var import_mongoose = __toESM(require("mongoose"));
const RoomCacheSchema = new import_mongoose.Schema({
  clients: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  maxClients: { type: Number, default: Infinity },
  metadata: import_mongoose.Schema.Types.Mixed,
  name: String,
  private: { type: Boolean, default: false },
  publicAddress: String,
  processId: String,
  roomId: String,
  unlisted: { type: Boolean, default: false }
}, {
  strict: false,
  timestamps: true,
  versionKey: false
});
RoomCacheSchema.index({ name: 1, locked: -1 });
RoomCacheSchema.index({ roomId: 1 });
const RoomCache = import_mongoose.default.model("RoomCache", RoomCacheSchema);
class MongooseDriver {
  constructor(connectionURI) {
    if (import_mongoose.default.connection.readyState === import_mongoose.default.STATES.disconnected) {
      connectionURI = connectionURI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/colyseus";
      import_mongoose.default.connect(connectionURI, {
        autoIndex: true,
        useCreateIndex: true,
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      (0, import_core.debugDriver)("\u{1F5C4}\uFE0F Connected to", connectionURI);
    }
  }
  createInstance(initialValues = {}) {
    return new RoomCache(initialValues);
  }
  async has(roomId) {
    return !!await RoomCache.findOne({ roomId });
  }
  async find(conditions, additionalProjectionFields = {}) {
    return await RoomCache.find(conditions, {
      _id: false,
      clients: true,
      createdAt: true,
      locked: true,
      maxClients: true,
      metadata: true,
      name: true,
      roomId: true,
      ...additionalProjectionFields
    });
  }
  findOne(conditions) {
    return RoomCache.findOne(conditions, {
      _id: 0
    });
  }
  async clear() {
    await RoomCache.deleteMany({});
  }
  async shutdown() {
    await import_mongoose.default.disconnect();
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MongooseDriver
});
