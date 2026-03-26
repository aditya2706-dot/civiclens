const mongoose = require('mongoose');
require('dotenv').config();
const Report = require('./src/models/Report');

(async () => {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected.");
        console.log("Querying...");
        const reports = await Report.find({}).limit(1).lean();
        console.log("Got reports:", reports.length);
        process.exit(0);
    } catch (err) {
        console.error("Error:", err);
        process.exit(1);
    }
})();
