require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Report = require('./src/models/Report');

async function recoverReports() {
    try {
        console.log("Connecting to Database...");
        await mongoose.connect(process.env.MONGODB_URI, { connectTimeoutMS: 5000 });
        console.log("✔ Connected successfully.");

        const targetEmail = "goyalaaditya707@gmail.com";
        const user = await User.findOne({ email: targetEmail });
        
        if (!user) {
            console.log(`❌ User with email ${targetEmail} not found!`);
            process.exit(1);
        }
        
        console.log(`✔ Found new user account: ${user._id}`);

        // Update all reports that have a null or missing userId
        const result = await Report.updateMany(
            { userId: { $in: [null, undefined] } },
            { $set: { userId: user._id } }
        );

        console.log(`🎉 Successfully assigned ${result.modifiedCount} null/anonymous reports to the new account!`);
        
    } catch (error) {
        console.error("An error occurred:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Database connection closed.");
        process.exit(0);
    }
}

recoverReports();
