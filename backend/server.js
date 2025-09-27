require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require("./routes/deviceRoutes");
const userRoutes = require("./routes/userRoutes");

const app = express();

// ================== CORS CONFIG ==================
const allowedOrigins = [
  "http://localhost:3000",             // Local frontend (dev)
  "https://clearflowco.netlify.app"    // Netlify frontend (prod)
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like curl, Postman, or mobile apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error("❌ Not allowed by CORS"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ================== MIDDLEWARE ==================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ================== MONGODB CONNECTION ==================
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// ================== ROUTES ==================
app.use('/api/auth', authRoutes);
app.use("/api/device", deviceRoutes);
app.use("/api/user", userRoutes);

// Root route (for testing)
app.get('/', (req, res) => {
  res.json({ message: "ClearFlow API is running" });
});

// ================== START SERVER ==================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ ClearFlow API is running on port ${PORT}`);
});
