const express = require("express");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const protect = require("../middlewares/authMiddleware");
const User = require("../models/User");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const router = express.Router();

// 🔗 Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 📦 Multer-Cloudinary Storage
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 1024, height: 1024, crop: "limit" }],
  },
});
const upload = multer({ storage });

// ✉️ Configure Nodemailer Transport
const transporter = nodemailer.createTransport({
  service: "gmail", // or "smtp.yourprovider.com"
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * 📌 Upload or Change Profile Picture (Token-based)
 */
router.put(
  "/profile-picture",
  protect,
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      if (!req.file || !req.file.path) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const user = await User.findById(req.user._id);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (user.profilePictureId) {
        await cloudinary.uploader.destroy(user.profilePictureId);
      }

      user.profilePicture = req.file.path;
      user.profilePictureId = req.file.public_id;

      await user.save({ validateBeforeSave: false });

      res.json({
        message: "Profile picture updated successfully",
        profilePicture: user.profilePicture,
      });
    } catch (error) {
      console.error("Profile picture upload error:", error);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * 📌 Get User Profile (ID-based)
 */
router.get("/:id", protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -otp -otpExpire"
    );
    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Fetch user error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📌 Update User Info (Token-based) + OTP for sensitive fields
 */
router.put("/me", protect, async (req, res) => {
  try {
    const { firstname, lastname, username, email, phoneNumber } = req.body;

    const updateData = {};
    if (firstname) updateData.firstname = firstname;
    if (lastname) updateData.lastname = lastname;

    const sensitiveFields = {};
    if (username) sensitiveFields.username = username;
    if (email) sensitiveFields.email = email;
    if (phoneNumber) sensitiveFields.phoneNumber = phoneNumber;

    if (
      Object.keys(updateData).length === 0 &&
      Object.keys(sensitiveFields).length === 0
    ) {
      return res.status(400).json({ error: "No valid fields provided" });
    }

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    // If updating sensitive fields, require OTP verification
    if (Object.keys(sensitiveFields).length > 0) {
      const otp = crypto.randomInt(100000, 999999).toString();
      user.otp = otp;
      user.otpExpire = Date.now() + 1 * 60 * 1000; // ⏳ 1 minute expiry
      user.pendingUpdates = sensitiveFields;

      await user.save({ validateBeforeSave: false });

      // ✅ Send OTP by email
      await transporter.sendMail({
        from: `"ClearFlow Security" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Your OTP Code - ClearFlow",
        html: `
          <p>Hello <b>${user.firstname || user.username}</b>,</p>
          <p>You requested to update your profile. Use the OTP below to verify your action:</p>
          <h2>${otp}</h2>
          <p>This OTP will expire in <b>1 minute</b>.</p>
          <p>If you did not request this, please ignore this email.</p>
        `,
      });

      return res.json({ otpRequired: true, message: "OTP sent to your email" });
    }

    // If only non-sensitive fields
    Object.assign(user, updateData);
    await user.save({ validateBeforeSave: false }); // ✅ Allow partial updates

    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * 📌 Verify OTP & apply sensitive updates
 */
router.post("/verify-otp", protect, async (req, res) => {
  try {
    const { otp } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ error: "OTP expired or invalid" });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ error: "Invalid OTP" });
    }

    // Apply pending sensitive updates
    if (user.pendingUpdates) {
      Object.assign(user, user.pendingUpdates);
      user.pendingUpdates = undefined;
    }

    // Clear OTP
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save({ validateBeforeSave: false });

    res.json({ message: "OTP verified, profile updated successfully", user });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
