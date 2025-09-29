const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const TokenBlacklist = require('../models/TokenBlacklist');
const sendEmail = require('../utils/sendEmail');
const generateOTP = require('../utils/generateOTP');
const passwordSchema = require('../utils/passwordValidator');

// ====== SIGNUP ======
exports.signup = async (req, res) => {
  const { firstname, lastname, username, email, password } = req.body;

  try {
    // Check duplicates
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ success: false, message: "Username already taken" });
    }

    // Validate password
    if (!passwordSchema.validate(password)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long, include uppercase, lowercase, 2 numbers, and a special character."
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const otpExpire = Date.now() + 1 * 60 * 1000; // 1 min expiry

    // Send OTP
    try {
      const mailInfo = await sendEmail(email, otp, 1);
      console.log("📧 Nodemailer response (signup):", {
        accepted: mailInfo.accepted,
        rejected: mailInfo.rejected,
        response: mailInfo.response,
      });
    } catch (err) {
      console.error("❌ Email sending failed:", err.message);
      return res.status(500).json({
        success: false,
        message: `Failed to send OTP email: ${err.message}`,
      });
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save user
    const user = new User({
      firstname,
      lastname,
      username,
      email,
      password: hashedPassword,
      otp,
      otpExpire,
    });

    await user.save();

    res.status(201).json({
      success: true,
      message: "User registered successfully, OTP sent",
      email,
    });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};

// ====== VERIFY OTP ======
exports.verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ success: true, message: "User verified, you can login now" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====== LOGIN ======
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Invalid credentials" });

    const token = jwt.sign(
      {
        id: user._id,
        username: user.username,
        type: "user",
        passwordChangedAt: user.passwordChangedAt ? user.passwordChangedAt.getTime() : null
      },
      process.env.TOKEN_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      success: true,
      message: `Welcome ${user.username}`,
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        username: user.username,
        email: user.email,
        phoneNumber: user.phoneNumber || null,
        profilePicture: user.profilePicture || null
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====== RESEND OTP ======
exports.resendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.isVerified) {
      return res.status(400).json({ success: false, message: "User is already verified. Please log in." });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = Date.now() + 1 * 60 * 1000;
    await user.save();

    try {
      const mailInfo = await sendEmail(email, otp, 1);
      console.log("📧 Nodemailer response (resendOTP):", {
        accepted: mailInfo.accepted,
        rejected: mailInfo.rejected,
        response: mailInfo.response,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: `Failed to resend OTP: ${err.message}` });
    }

    res.json({ success: true, message: "OTP resent to email" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====== FORGOT PASSWORD ======
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!user.isVerified) {
      return res.status(400).json({ success: false, message: "Please verify your email first before resetting password." });
    }

    const otp = generateOTP();
    user.otp = otp;
    user.otpExpire = Date.now() + 1 * 60 * 1000;
    await user.save();

    try {
      const mailInfo = await sendEmail(email, otp, 1);
      console.log("📧 Nodemailer response (forgotPassword):", {
        accepted: mailInfo.accepted,
        rejected: mailInfo.rejected,
        response: mailInfo.response,
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: `Failed to send reset OTP: ${err.message}` });
    }

    res.json({ success: true, message: "OTP sent to email for password reset" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====== RESET PASSWORD ======
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (user.otp !== otp || user.otpExpire < Date.now()) {
      return res.status(400).json({ success: false, message: "Invalid or expired OTP" });
    }

    if (!passwordSchema.validate(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long, include uppercase, lowercase, 2 numbers, and a special character."
      });
    }

    // Hash before saving
    user.password = await bcrypt.hash(newPassword, 10);
    user.otp = undefined;
    user.otpExpire = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====== CHANGE PASSWORD ======
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ success: false, message: "Current password is incorrect" });

    if (!passwordSchema.validate(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long, include uppercase, lowercase, 2 numbers, and a special character."
      });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = Date.now();
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ====== LOGOUT ======
exports.logout = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "No token provided" });
    }

    const token = authHeader.split(" ")[1];

    // Blacklist token
    await TokenBlacklist.findOneAndUpdate(
      { token },
      { token },
      { upsert: true, new: true }
    );

    res.json({
      success: true,
      message: "Logged out successfully. Token invalidated."
    });
  } catch (err) {
    res.status(500).json({ error: "Logout failed. Try again later.", details: err.message });
  }
};
