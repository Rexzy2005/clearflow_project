const express = require("express");
const router = express.Router();
const deviceController = require("../controllers/deviceController");
const authMiddleware = require("../middlewares/authMiddleware");

// Device CRUD
router.post("/add", authMiddleware, deviceController.addDevice);
router.get("/", authMiddleware, deviceController.getDevices);

// ESP32 readings
router.post("/data/:deviceId", authMiddleware, deviceController.addDeviceData);
router.get("/data/:deviceId", authMiddleware, deviceController.getDeviceData);

module.exports = router;
