const { MongoClient } = require('mongodb');
require('dotenv').config();

(async () => {
    let client;
    try {
        const uri = process.env.MONGODB_URI;
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        await client.connect();
        
        console.log("Connected. Getting currentOp...");
        const adminDb = client.db('admin');
        const ops = await adminDb.command({ currentOp: 1 });
        
        const activeOps = ops.inprog.filter(op => op.active && op.ns && op.ns.includes('reports'));
        console.log("Active ops on reports collection:", JSON.stringify(activeOps, null, 2));
        
        // Also check if any index is building
        const creatingIndexes = ops.inprog.filter(op => op.query && op.query.createIndexes);
        console.log("Index builds:", JSON.stringify(creatingIndexes, null, 2));
        
    } catch (err) {
        console.error("Native Driver Error:", err);
    } finally {
        if (client) await client.close();
        process.exit(0);
    }
})();
