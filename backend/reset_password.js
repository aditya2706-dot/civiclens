require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');

async function forceResetPassword() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✔ Connected successfully.");

        const targetEmail = "goyalaaditya707@gmail.com";
        const user = await User.findOne({ email: targetEmail });
        
        if (!user) {
            console.log(`❌ User with email ${targetEmail} not found!`);
            process.exit(1);
        }
        
        console.log(`✔ Found user account: ${user._id}`);
        user.password = "password123";
        await user.save();
        
        console.log(`🎉 Successfully reset password for ${targetEmail} to: password123`);
        
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed.");
        process.exit(0);
    }
}

forceResetPassword();
