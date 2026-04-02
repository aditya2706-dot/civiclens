require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const jwt = require('jsonwebtoken');

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne({ email: "goyalaaditya707@gmail.com" });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    console.log(token);
    process.exit(0);
})();
