require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User');
const Report = require('./src/models/Report');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);

    const nullReports = await Report.find({ userId: { $in: [null, undefined] } });
    console.log(`Found ${nullReports.length} anonymous/null reports.`);
    for (let r of nullReports) {
        console.log(`- ID: ${r._id}, Category: ${r.category}, Desc: ${r.description?.slice(0, 30)}, Created: ${r.createdAt}`);
    }

    mongoose.disconnect();
}
check().catch(console.error);
