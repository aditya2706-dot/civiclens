require('dotenv').config({ quiet: true });
const mongoose = require('mongoose');

async function addIndexes() {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
    console.log('✅ Connected');
    const db = mongoose.connection.db;
    const reports = db.collection('reports');
    const users = db.collection('users');

    const indexOps = [
        reports.createIndex({ isDuplicateOf: 1 }),
        reports.createIndex({ ward: 1, status: 1 }),
        reports.createIndex({ department: 1, status: 1 }),
        reports.createIndex({ userId: 1, createdAt: -1 }),
        reports.createIndex({ createdAt: -1 }),
    ];

    const results = await Promise.allSettled(indexOps);
    results.forEach((r, i) => {
        if (r.status === 'fulfilled') console.log(`✅ Index ${i+1} ready`);
        else console.log(`⚠️  Index ${i+1} skipped (already exists)`);
    });

    console.log('✅ All indexes created successfully');
    await mongoose.disconnect();
}

addIndexes().catch(e => console.error('Error:', e.message));
