// routes/deviceRoutes.js
const express = require("express");
const router = express.Router();
const Device = require("../models/Device");
const DeviceData = require("../models/DeviceData");
const authMiddleware = require("../middlewares/authMiddleware");

// Route to receive data from ESP32
router.post("/data", authMiddleware, async (req, res) => {
    try {
        const {
            deviceId,
            tdsValue,
            temperature,
            humidity,
            sourceLevel,
            detectionChamberLevel,
            purificationChamberLevel,
            destBottomLevel,
            destTopLevel,
            waterSafe,
        } = req.body;

        // Find the device belonging to the logged-in user
        const device = await Device.findOne({ deviceId, user: req.user.id });
        if (!device) {
            return res
                .status(404)
                .json({ success: false, message: "Device not found for this user" });
        }

        // Save the reading
        const reading = new DeviceData({
            user: req.user.id,
            device: device._id,
            tdsValue,
            temperature,
            humidity,
            sourceLevel,
            detectionChamberLevel,
            purificationChamberLevel,
            destBottomLevel,
            destTopLevel,
            waterSafe,
        });

        await reading.save();
        res
            .status(201)
            .json({ success: true, message: "Reading saved successfully" });
    } catch (err) {
        console.error("❌ Failed to save reading:", err.message);
        res
            .status(500)
            .json({ success: false, message: "Server error", error: err.message });
    }
});

// Optional: get all readings for a specific device
router.get("/data/:deviceId", authMiddleware, async (req, res) => {
    try {
        const device = await Device.findOne({
            deviceId: req.params.deviceId,
            user: req.user.id,
        });
        if (!device)
            return res
                .status(404)
                .json({ success: false, message: "Device not found" });

        const readings = await DeviceData.find({ device: device._id }).sort({
            createdAt: -1,
        });
        res.json({ success: true, data: readings });
    } catch (err) {
        console.error("❌ Failed to fetch readings:", err.message);
        res
            .status(500)
            .json({ success: false, message: "Server error", error: err.message });
    }
});

module.exports = router;
