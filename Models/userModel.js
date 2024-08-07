const mongoose = require('mongoose');
const validator = require('validator');
const bcryptjs = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please enter your name']
    },
    email: {
        type: String,
        required: [true, 'Please enter your email'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please enter a valid email']
    },
    photo: String,
    password: {
        type: String,
        required: [true, 'Please enter a password'],
        minlenght: 8,
        select: false

    },
    confirmPassword: {
        type: String,
        required: [true, 'Please confirm your password'],
        //custom validation will not work above save or create
        validate: {
            validator: function (val) {
                return val === this.password;
            },
            message: "Passwords do not match"
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    passwordResetToken: String,
    passwordResetTokenExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    },
});

userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();

    //encrypt
    this.password = await bcryptjs.hash(this.password, 8);
    this.confirmPassword = undefined;

    next();
});

userSchema.methods.comparePasswords = async function (password, DBPassword) {
    return await bcryptjs.compare(password, DBPassword);
}

userSchema.methods.isPasswordChanged = async function (jwtTimestamp) {
    if (this.passwordChangedAt) {
        const passwordChangedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);

        return jwtTimestamp < passwordChangedTimestamp; // 932950   729600

    }

    return false;
}

userSchema.methods.createResetPasswordToken = async function () {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    this.passwordResetTokenExpires = Date.now() + (10 * 60 * 1000);

    return resetToken;
}

userSchema.pre(/^find/, function (next) {
    //this keyword will point to current query

    this.find({ active: { $ne: false } });

    next();
})


const User = mongoose.model('User', userSchema);

module.exports = User;