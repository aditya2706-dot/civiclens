require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function diagnose() {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const users = db.collection('users');
    const reports = db.collection('reports');

    // 1. Find the target user
    const targetUser = await users.findOne({ email: 'goyalaaditya707@gmail.com' });
    if (!targetUser) {
        console.log('❌ User goyalaaditya707@gmail.com NOT FOUND in DB');
    } else {
        console.log('✅ Found User:');
        console.log(`   _id: ${targetUser._id}`);
        console.log(`   name: ${targetUser.name}`);
        console.log(`   role: ${targetUser.role}`);
        console.log(`   ward: ${targetUser.ward}`);
        console.log(`   department: ${targetUser.department}`);
        console.log(`   isRegistered: ${targetUser.isRegistered}`);
    }

    // 2. Find reports submitted by that user
    const myReports = targetUser ? await reports.find({ userId: targetUser._id }).toArray() : [];
    console.log(`\n📋 Reports submitted by goyalaaditya707@gmail.com: ${myReports.length}`);
    myReports.slice(0, 5).forEach((r, i) => {
        console.log(`   [${i+1}] ${r.category} | status: ${r.status} | ward: ${r.ward} | dept: ${r.department}`);
    });

    // 3. Check the admin account
    const adminUser = await users.findOne({ phone: '9999999999' });
    if (adminUser) {
        console.log('\n👑 Admin Account:');
        console.log(`   _id: ${adminUser._id}`);
        console.log(`   role: ${adminUser.role}`);
        console.log(`   ward: ${adminUser.ward}`);
        console.log(`   department: ${adminUser.department}`);
    } else {
        console.log('\n❌ Admin (9999999999) NOT FOUND');
    }

    // 4. Total reports in DB
    const totalReports = await reports.countDocuments({});
    const nonDuplicates = await reports.countDocuments({ isDuplicateOf: null });
    const sampleReports = await reports.find({ isDuplicateOf: null }).limit(5).toArray();

    console.log(`\n📊 Total Reports in DB: ${totalReports}`);
    console.log(`   Non-duplicate (master) reports: ${nonDuplicates}`);
    console.log('\nSample report wards & departments:');
    sampleReports.forEach((r, i) => {
        console.log(`   [${i+1}] ward: "${r.ward}", dept: "${r.department}", status: ${r.status}`);
    });

    // 5. Check if admin can see any reports (admin query is wide open)
    const adminQuery = { isDuplicateOf: null };
    const adminVisibleCount = await reports.countDocuments(adminQuery);
    console.log(`\n🔍 Reports visible to Admin (no filter): ${adminVisibleCount}`);

    await mongoose.disconnect();
    console.log('\n✅ Diagnosis complete.');
}

diagnose().catch(err => {
    console.error('❌ Error:', err.message);
    process.exit(1);
});
