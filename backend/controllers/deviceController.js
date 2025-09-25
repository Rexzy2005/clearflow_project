const Device = require("../models/Device");
const DeviceData = require("../models/DeviceData");
const Status = require("../models/Status");
const Analytics = require("../models/Analytics");
const OpenAI = require("openai");

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------------- ADD DEVICE ----------------
exports.addDevice = async (req, res) => {
  try {
    const { deviceName, deviceId, location, model } = req.body;

    const device = await Device.create({
      user: req.user._id,
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

// ---------------- LINK DEVICE TO USER ----------------
exports.linkDeviceToUser = async (req, res) => {
  try {
    const { deviceId } = req.body;

    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ error: "Device not found" });

    if (device.user && device.user.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Device already linked to your account" });
    }

    device.user = req.user._id;
    await device.save();

    res.status(200).json({ message: "Device successfully linked to your account", device });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- ADD DEVICE DATA (ESP32) ----------------
exports.addDeviceData = async (req, res) => {
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

    // Find device (ESP32 token not needed)
    const device = await Device.findOne({ deviceId });
    if (!device) return res.status(404).json({ error: "Device not found" });

    const newData = await DeviceData.create({
      user: device.user,
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

    res.status(201).json({ message: "Device data added", data: newData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET DEVICE DATA (DASHBOARD) ----------------
exports.getDeviceData = async (req, res) => {
  try {
    const { deviceId } = req.params;

    const device = await Device.findOne({ deviceId, user: req.user._id });
    if (!device) return res.status(404).json({ error: "Device not found" });

    const data = await DeviceData.find({ device: device._id }).sort({ createdAt: -1 });

    res.json({ device, data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ---------------- STATUS ----------------
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

// ---------------- ANALYTICS ----------------
exports.addAnalytics = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { tds, turbidity, ph, temperature, flowRate } = req.body;

    const device = await Device.findOne({ deviceId, user: req.user._id });
    if (!device) return res.status(404).json({ error: "Device not found" });

    let analytics = await Analytics.findOne({ device: device._id });
    if (analytics) {
      Object.assign(analytics, { tds, turbidity, ph, temperature, flowRate });
    } else {
      analytics = new Analytics({ device: device._id, tds, turbidity, ph, temperature, flowRate });
    }

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

    res.status(201).json({ message: "Analytics added/updated", analytics: populatedAnalytics });
  } catch (error) {
    if (error.response?.status === 401) {
      return res.status(401).json({ error: "Unauthorized: Invalid OpenAI API key" });
    }
    res.status(500).json({ error: error.message });
  }
};

// ---------------- GET USER DATA ----------------
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

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user._id });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

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
