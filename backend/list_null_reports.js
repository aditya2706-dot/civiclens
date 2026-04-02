require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('./src/models/Report');

async function fix() {
    await mongoose.connect(process.env.MONGODB_URI);
    const nullReports = await Report.find({ userId: { $in: [null, undefined] } });
    console.log(`There are ${nullReports.length} reports without a user.`);
    for (let r of nullReports) {
        console.log(`- ID: ${r._id}, Desc: ${r.description?.slice(0, 30)}`);
    }
    process.exit(0);
}
fix().catch(console.error);
