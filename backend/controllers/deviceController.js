const Device = require("../models/Device");
const Status = require("../models/Status");
const Analytics = require("../models/Analytics");
const OpenAI = require("openai");

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 📌 Add a new device for the logged-in user
exports.addDevice = async (req, res) => {
  try {
    const { deviceName, deviceId, location, model } = req.body;

    const device = await Device.create({
      user: req.user._id,
      //user: req.username,
      deviceName,
      deviceId,
      location,
      model,
    });

    const populatedDevice = await Device.findById(device._id).populate(
      "user",
      "username email"
    );

    res.status(201).json({ message: "Device added successfully", device: populatedDevice });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Update a device's status (only if it belongs to the logged-in user)
exports.updateStatus = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const statusData = req.body;

    const device = await Device.findOne({ deviceId, user: req.user._id });
    if (!device) return res.status(404).json({ error: "Device not found" });

    let status = await Status.findOne({ device: device._id });
    if (status) {
      Object.assign(status, statusData);
    } else {
      status = new Status({ device: device._id, ...statusData });
    }

    await status.save();
    const populatedStatus = await Status.findById(status._id).populate(
      "device",
      "deviceId deviceName location model"
    );

    res.json({ message: "Status updated", status: populatedStatus });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Add water analytics for a device (with AI analysis) — restricted to the owner
exports.addAnalytics = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { tds, turbidity, ph, temperature, flowRate } = req.body;

    const device = await Device.findOne({ deviceId, user: req.user._id });
    if (!device) return res.status(404).json({ error: "Device not found" });

    const analytics = new Analytics({
      device: device._id,
      tds,
      turbidity,
      ph,
      temperature,
      flowRate,
    });

    const prompt = `
You are an expert water quality analyst.
Analyze the following water data and respond in JSON format:
{
  "currentAnalysis": "...",
  "predictions": "...",
  "suggestions": "..."
}

Water Data:
- TDS: ${tds} mg/L
- Turbidity: ${turbidity} NTU
- pH: ${ph}
- Temperature: ${temperature} °C
- Flow Rate: ${flowRate} L/s
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const aiText = response.choices[0].message.content;
    let aiJson = {};
    try {
      aiJson = JSON.parse(aiText);
    } catch {
      aiJson = { currentAnalysis: aiText, predictions: "N/A", suggestions: "N/A" };
    }

    analytics.aiAnalysis = aiJson.currentAnalysis || "No analysis";
    analytics.aiPrediction = aiJson.predictions || "No prediction";
    analytics.aiSuggestions = aiJson.suggestions || "No suggestions";

    await analytics.save();
    const populatedAnalytics = await Analytics.findById(analytics._id).populate(
      "device",
      "deviceId deviceName location model"
    );

    res.status(201).json({ message: "Analytics added", analytics: populatedAnalytics });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Unauthorized: Invalid OpenAI API key" });
    }
    res.status(500).json({ error: error.message });
  }
};

// 📌 Fetch all devices, statuses, and analytics for the logged-in user
exports.getUserData = async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user._id });
    const deviceIds = devices.map((d) => d._id);

    const statuses = await Status.find({ device: { $in: deviceIds } });
    const analytics = await Analytics.find({ device: { $in: deviceIds } });

    res.json({ devices, statuses, analytics });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Fetch only devices for this user
exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user._id });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Fetch only statuses for this user
exports.getStatus = async (req, res) => {
  try {
    const userDevices = await Device.find({ user: req.user._id }).select("_id");
    const statuses = await Status.find({ device: { $in: userDevices } }).populate(
      "device",
      "deviceId deviceName location model"
    );
    res.json(statuses);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Fetch only analytics for this user
exports.getAnalytics = async (req, res) => {
  try {
    const userDevices = await Device.find({ user: req.user._id }).select("_id");
    const analytics = await Analytics.find({ device: { $in: userDevices } }).populate(
      "device",
      "deviceId deviceName location model"
    );
    res.json(analytics);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
