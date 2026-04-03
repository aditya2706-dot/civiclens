require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

async function quickDiag() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000, socketTimeoutMS: 10000 });
    const db = mongoose.connection.db;

    // User check
    const user = await db.collection('users').findOne({ email: 'goyalaaditya707@gmail.com' }, { projection: { name:1, role:1, ward:1, department:1, isRegistered:1, phone:1 }});
    console.log('USER:', JSON.stringify(user, null, 2));

    // Total reports
    const total = await db.collection('reports').countDocuments({});
    console.log('TOTAL REPORTS IN DB:', total);

    // Reports by this user
    if (user) {
        const myCount = await db.collection('reports').countDocuments({ userId: user._id });
        console.log('REPORTS BY THIS USER:', myCount);
    }

    // Sample report to see what fields they have
    const sample = await db.collection('reports').findOne({}, { projection: { category:1, status:1, ward:1, department:1, userId:1, isDuplicateOf:1 }});
    console.log('SAMPLE REPORT:', JSON.stringify(sample, null, 2));

    await mongoose.disconnect();
}

quickDiag().catch(e => console.error('ERROR:', e.message));
