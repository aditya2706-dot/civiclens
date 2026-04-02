require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./src/models/Report');

async function test() {
    try {
        console.log("Connecting...");
        await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 2000 });
        console.log("Connected successfully!");
        
        console.log("Querying...");
        const start = Date.now();
        const r = await Report.find({}).limit(1);
        console.log(`Query finished in ${Date.now() - start}ms`);
        mongoose.disconnect();
    } catch (e) {
        console.error("Error:", e.message);
        process.exit(1);
    }
}
test();
