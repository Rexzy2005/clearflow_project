const mongoose = require("mongoose");

const statusSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  primaryFilter: { type: String, enum: ["ok", "replace soon", "faulty"], default: "ok" },
  uvLamp: { type: String, enum: ["ok", "replace soon", "faulty"], default: "ok" },
  waterPump: { type: String, enum: ["ok", "faulty"], default: "ok" },
  sensorArray: { type: String, enum: ["ok", "faulty"], default: "ok" },
  lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Status", statusSchema);
