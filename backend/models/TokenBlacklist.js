const mongoose = require('mongoose');

const tokenBlacklistSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  createdAt: { type: Date, default: Date.now, expires: '1d' } 
  // ⏰ token auto-deletes after 1 day
});


module.exports = mongoose.model('TokenBlacklist', tokenBlacklistSchema);
