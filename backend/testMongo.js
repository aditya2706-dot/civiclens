require('dotenv').config();
const mongoose = require('mongoose');

(async () => {
    try {
        console.log("Connecting...");
        const uri = process.env.MONGODB_URI;
        await mongoose.connect(uri, { 
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 5000
        });
        console.log("Connected.");
        console.log("Querying...");
        const Report = require('./src/models/Report');
        const count = await Report.countDocuments().maxTimeMS(5000);
        console.log("Got count:", count);
        process.exit(0);
    } catch (err) {
        console.error("MongoDB Error:", err);
        process.exit(1);
    }
})();
