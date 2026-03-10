const User = require('../models/User');
const OfficialDirectory = require('../models/OfficialDirectory');
const Otp = require('../models/Otp');
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
    const { name, email, password, role, department, ward, authorityCode } = req.body;

    try {
        const userExists = await User.findOne({ email });

        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Secure Authority Registration
        const isRegisteringAsAuthority = role === 'authority';
        if (isRegisteringAsAuthority) {
            const expectedCode = process.env.AUTHORITY_SECRET || 'NAGAR_NIGAM_2026';
            if (authorityCode !== expectedCode) {
                return res.status(403).json({ message: 'Invalid Official Access Code for Government bodies.' });
            }
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'citizen',
            department,
            ward
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                ward: user.ward,
                token: generateToken(user._id),
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({
            $or: [{ email }, { phone: email }]
        });

        if (user && (await user.matchPassword(password))) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                ward: user.ward,
                token: generateToken(user._id),
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                ward: user.ward,
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                department: updatedUser.department,
                ward: updatedUser.ward,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404).json({ message: 'User not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Send OTP to a pre-approved authority phone number
// @route   POST /api/auth/send-otp
// @access  Public
const sendOtp = async (req, res) => {
    const { phone } = req.body;

    try {
        const official = await OfficialDirectory.findOne({ phone });
        if (!official) {
            return res.status(404).json({ message: 'Phone number not recognized as an official.' });
        }

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();

        // Remove old OTPs for this phone
        await Otp.deleteMany({ phone });

        await Otp.create({ phone, otp: otpCode });

        // Simulate SMS sending by logging to console
        console.log(`[SMS SIMULATION] Sending OTP ${otpCode} to ${phone}`);

        res.json({ message: 'OTP sent successfully (check server console)' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Verify OTP and log in / register authority
// @route   POST /api/auth/verify-otp
// @access  Public
const verifyOtp = async (req, res) => {
    const { phone, otp, username, email, password, name } = req.body;

    try {
        const validOtp = await Otp.findOne({ phone, otp });
        if (!validOtp) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        const official = await OfficialDirectory.findOne({ phone });
        if (!official) {
            return res.status(404).json({ message: 'Official record not found' });
        }

        // Verify that the chosen username isn't already taken
        if (username) {
            const usernameTaken = await User.findOne({ username });
            if (usernameTaken && usernameTaken.phone !== phone) {
                return res.status(400).json({ message: 'Username is already taken' });
            }
        }

        // OTP is valid. Clean it up.
        await Otp.deleteMany({ phone });

        // Mark official as registered in OfficialDirectory
        official.isRegistered = true;
        await official.save();

        let user = await User.findOne({ phone });

        if (user) {
            // Resetting/updating password & credentials
            user.password = password;
            if (username) user.username = username;
            if (email) user.email = email;
            if (name) user.name = name;
            await user.save();
        } else {
            // First time setup
            user = await User.create({
                name: name || `Authority (${official.ward})`,
                phone: phone,
                username: username,
                email: email,
                password: password,
                role: 'authority',
                department: official.department,
                ward: official.ward
            });
        }

        res.json({
            _id: user._id,
            name: user.name,
            username: user.username,
            phone: user.phone,
            email: user.email,
            role: user.role,
            department: user.department,
            ward: user.ward,
            token: generateToken(user._id),
        });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    registerUser,
    loginUser,
    getUserProfile,
    updateUserProfile,
    sendOtp,
    verifyOtp
};
