require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');

async function test() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const user = await User.findOne({ email: "goyalaaditya707@gmail.com" });
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
        console.log("Token generated:", token.substring(0, 15) + "...");

        const res = await axios.get('http://localhost:5001/api/reports/my', {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Response status:", res.status);
        console.log("Is array:", Array.isArray(res.data));
        console.log("Items count:", res.data.length);
        console.log("Sample ID:", res.data[0] ? res.data[0]._id : "None");
    } catch (err) {
        console.error("Error:", err.message);
        if (err.response) console.error("API response:", err.response.data);
    } finally {
        await mongoose.disconnect();
    }
}
test();
