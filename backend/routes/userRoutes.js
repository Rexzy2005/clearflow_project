const express = require("express");
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const protect = require("../middlewares/authMiddleware");
const User = require("../models/User");

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
    folder: "profile_pictures", // cloudinary folder
    allowed_formats: ["jpg", "jpeg", "png"],
    transformation: [{ width: 400, height: 400, crop: "limit" }],
  },
});
const upload = multer({ storage });

/**
 * 📌 Upload or Change Profile Picture
 * PUT /api/users/profile-picture
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

      // 🧹 Delete old Cloudinary image if exists
      if (user.profilePictureId) {
        await cloudinary.uploader.destroy(user.profilePictureId);
      }

      // 💾 Save new image URL and public_id
      user.profilePicture = req.file.path; // Cloudinary secure URL
      user.profilePictureId =
        req.file.filename || req.file.public_id; // ensure correct public_id
      await user.save();

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
 * 📌 Get User Profile
 * GET /api/users/:id
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
 * 📌 Update User Info (without picture)
 * PUT /api/users/:id
 */
router.put("/:id", protect, async (req, res) => {
  try {
    const { firstname, lastname, username, email, phoneNumber } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { firstname, lastname, username, email, phoneNumber },
      { new: true, runValidators: true }
    ).select("-password -otp -otpExpire");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json(user);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
