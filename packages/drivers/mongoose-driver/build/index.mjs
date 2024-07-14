import { debugDriver } from "@colyseus/core";
import mongoose, { Schema } from "mongoose";
const RoomCacheSchema = new Schema({
  clients: { type: Number, default: 0 },
  locked: { type: Boolean, default: false },
  maxClients: { type: Number, default: Infinity },
  metadata: Schema.Types.Mixed,
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
const RoomCache = mongoose.model("RoomCache", RoomCacheSchema);
class MongooseDriver {
  constructor(connectionURI) {
    if (mongoose.connection.readyState === mongoose.STATES.disconnected) {
      connectionURI = connectionURI || process.env.MONGO_URI || "mongodb://127.0.0.1:27017/colyseus";
      mongoose.connect(connectionURI, {
        autoIndex: true,
        useCreateIndex: true,
        useFindAndModify: true,
        useNewUrlParser: true,
        useUnifiedTopology: true
      });
      debugDriver("\u{1F5C4}\uFE0F Connected to", connectionURI);
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
    await mongoose.disconnect();
  }
}
export {
  MongooseDriver
};
