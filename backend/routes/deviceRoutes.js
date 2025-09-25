const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const authMiddleware = require("../middlewares/authMiddleware");

// ---------------- DEVICE MANAGEMENT ----------------
router.post("/add", authMiddleware, deviceController.addDevice); // Add device for logged-in user
router.get("/all", authMiddleware, deviceController.getDevices); // Get all devices for logged-in user

// ---------------- DEVICE DATA (ESP32) ----------------
router.post("/data", deviceController.addDeviceData); // ESP32 sends data (no auth required for ESP32)
router.get("/data/:deviceId", authMiddleware, deviceController.getDeviceData); // Get all readings for dashboard

// ---------------- EXISTING STATUS & ANALYTICS ----------------
router.put("/status/:deviceId", authMiddleware, deviceController.updateStatus);
router.get("/status", authMiddleware, deviceController.getStatus);

router.post("/link", authMiddleware, deviceController.linkDeviceToUser);

router.post("/analytics/:deviceId", authMiddleware, deviceController.addAnalytics);
router.get("/analytics", authMiddleware, deviceController.getAnalytics);

module.exports = router;
