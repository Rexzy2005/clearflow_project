const User = require('../models/User');

const otpMiddleware = async (req, res, next) => {
    try {
        const { email } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if OTP is still set
        if (user.otp) {
            return res.status(403).json({ error: 'Please verify OTP before continuing' });
        }

        next();
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

module.exports = otpMiddleware;
