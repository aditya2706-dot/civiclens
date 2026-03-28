const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        sparse: true,
    },
    username: {
        type: String,
        unique: true,
        sparse: true,
    },
    phone: {
        type: String,
        unique: true,
        sparse: true,
    },
    password: {
        type: String,
        required: false, // Optional for Google OAuth users
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true,
    },
    avatar: {
        type: String, // Google profile picture URL
    },
    role: {
        type: String,
        enum: ['citizen', 'authority', 'admin', 'user'],
        default: 'citizen',
    },
    department: {
        type: String,
    },
    ward: {
        type: String,
    },
    civicPoints: {
        type: Number,
        default: 0,
    },
}, { timestamps: true });

// Hash password before saving (skip for Google OAuth users)
userSchema.pre('save', async function () {
    if (!this.password || !this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password
userSchema.methods.matchPassword = async function (enteredPassword) {
    if (!this.password) return false; // Google OAuth users have no password
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
