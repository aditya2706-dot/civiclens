const mongoose = require('mongoose');
const Report = require('./src/models/Report');
require('dotenv').config();

mongoose.set('debug', true);
console.log("Attempting connect to URI:", process.env.MONGODB_URI.substring(0, 40) + "...");

mongoose.connect(process.env.MONGODB_URI, { 
    serverSelectionTimeoutMS: 5000 
}).then(async () => {
    console.log("Connected successfully.");
    try {
        console.log("Querying...");
        const d = await Report.find({}).limit(1).lean();
        console.log("Result:", d.length);
    } catch(e) {
        console.error("Query Error:", e);
    }
    process.exit(0);
}).catch(err => {
    console.error("Connection Error:", err);
    process.exit(1);
});
