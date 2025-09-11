const express = require('express');
const router = express.Router();
const otpMiddleware = require('../middlewares/otpMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const { 
    signup, 
    verifyOTP, 
    login, 
    resendOTP,
    changePassword, 
    forgotPassword, 
    resetPassword, 
    logout }
    = require('../controllers/authController');

router.post('/signup', signup);
router.post('/verify-otp', verifyOTP);
router.post('/login', otpMiddleware, login);


router.post('/resend-otp', resendOTP);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/change-password', authMiddleware, changePassword);

router.post('/logout', authMiddleware, logout);
module.exports = router;
