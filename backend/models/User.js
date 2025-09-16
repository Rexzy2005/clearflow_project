const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    firstname: {
        type: String,
        required: [true, "First name is required!"],
        trim: true,
        minlength: [2, "First name must be at least 2 characters"],
    },
    lastname: {
        type: String,
        required: [true, "Last name is required!"],
        trim: true,
        minlength: [2, "Last name must be at least 2 characters"],
    },
    username: { 
        type: String, 
        required: true,
        unique: true,
        trim: true
    },
    email: { 
        type: String, 
        required: true, 
        unique: true,
        lowercase: true,
        trim: true
    },
    password: { 
        type: String, 
        required: true
    },
    otp: { 
        type: String 
    },
    otpExpire: { 
        type: Date 
    },
    isVerified: { 
        type: Boolean, 
        default: false  
    },
    passwordChangedAt: { 
        type: Date 
    },
    profilePicture: { 
        type: String 
    },
    profilePictureId: { 
        type: String 

},

}, { timestamps: true });

// 🔑 Hash password before saving
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();

    this.password = await bcrypt.hash(this.password, 10);

    // update passwordChangedAt if it's not a new user
    if (!this.isNew) {
        this.passwordChangedAt = Date.now();
    }

    next();
});

// 🔑 Compare raw password with hashed password
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// 🔑 Check if password was changed after token was issued
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
