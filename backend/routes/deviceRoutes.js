const express = require("express");
const { addDevice, 
    updateStatus, 
    addAnalytics,
    getUserData ,
    getDevices,
    getStatus,
    getAnalytics, 
} = require("../controllers/deviceController");
const  protect  = require("../middlewares/authMiddleware");

const router = express.Router();

// 📌 Fetch all user data (devices, statuses, analytics)
router.get("/all", protect, getUserData);


// Device management
router.post("/add", protect, addDevice);
router.get("/", protect, getDevices);  

// Component status
router.post("/:deviceId/status", protect, updateStatus);
router.get("/:deviceId/status", protect, getStatus);

// Water quality analytics
router.post("/:deviceId/analytics", protect, addAnalytics);
router.get("/:deviceId/analytics", protect, getAnalytics);


module.exports = router;
