const mongoose = require("mongoose");

const analyticsSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  tds: { type: Number, required: true },
  turbidity: { type: Number, required: true },
  ph: { type: Number, required: true },
  temperature: { type: Number, required: true },
  flowRate: { type: Number, required: true },

  // AI output fields
  aiAnalysis: { type: String },      // Current analysis
  aiPrediction: { type: String },    // Predictions or risks
  aiSuggestions: { type: String },   // Suggestions or recommendations

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Analytics", analyticsSchema);
