const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // "Bearer <token>"

  if (!token) {
    return res.status(401).json({ error: 'No token provided. Authorization denied.' });
  }

  try {
    // 🚫 Check if token is blacklisted
    const blacklisted = await TokenBlacklist.findOne({ token });
    if (blacklisted) {
      return res.status(401).json({ error: 'Token has been invalidated. Please log in again.' });
    }

    const decoded = jwt.verify(token, process.env.TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // 🚨 Check if password changed after token was issued
    if (user.passwordChangedAt) {
      const passwordChangedAt = new Date(user.passwordChangedAt).getTime();
      if (decoded.passwordChangedAt === null || decoded.passwordChangedAt < passwordChangedAt) {
        return res.status(401).json({ error: "Password has been changed. Please log in again." });
      }
    }

    req.user = decoded; // { id, username, passwordChangedAt }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

module.exports = authMiddleware;
