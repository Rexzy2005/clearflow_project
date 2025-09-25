const jwt = require("jsonwebtoken");
const TokenBlacklist = require("../models/TokenBlacklist");
const User = require("../models/User");
const Device = require("../models/Device");

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ error: "No token provided. Authorization denied." });
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res
        .status(401)
        .json({ error: "Token has been invalidated. Please log in again." });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);

    if (decoded.type === "user") {
      // For dashboard user
      const user = await User.findById(decoded.id).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });

      // Check if password changed after token issued
      if (user.passwordChangedAt && decoded.passwordChangedAt) {
        const passwordChangedTime = new Date(user.passwordChangedAt).getTime();
        if (decoded.passwordChangedAt < passwordChangedTime) {
          return res
            .status(401)
            .json({ error: "Password has been changed. Please log in again." });
        }
      }

      req.user = user;
      req.type = "user";
    } else if (decoded.type === "device") {
      // For ESP32 device
      const device = await Device.findOne({ deviceId: decoded.deviceId });
      if (!device) return res.status(404).json({ error: "Device not found" });

      req.device = device;
      req.type = "device";
    } else {
      return res.status(401).json({ error: "Invalid token type" });
    }

    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

module.exports = authMiddleware;
