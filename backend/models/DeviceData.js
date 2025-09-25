// models/DeviceData.js
const mongoose = require("mongoose");

const deviceDataSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },

    // Sensor readings
    tdsValue: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    sourceLevel: { type: Number, required: true },
    detectionChamberLevel: { type: Number, required: true },
    purificationChamberLevel: { type: Number, required: true },
    destBottomLevel: { type: Number, required: true },
    destTopLevel: { type: Boolean, required: true },
    waterSafe: { type: Boolean, required: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

module.exports = mongoose.model("DeviceData", deviceDataSchema);
