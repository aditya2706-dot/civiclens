const { MongoClient } = require('mongodb');
require('dotenv').config();

(async () => {
    let client;
    try {
        const uri = process.env.MONGODB_URI;
        console.log("URI found:", !!uri);
        client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("Connecting native...");
        await client.connect();
        console.log("Connected natively. Pinging...");
        await client.db().command({ ping: 1 });
        console.log("Ping successful. Querying 1 doc from reports...");
        
        const col = client.db().collection('reports');
        const docs = await col.find({}).limit(1).toArray();
        console.log(`Query returned ${docs.length} docs`);
        
    } catch (err) {
        console.error("Native Driver Error:", err);
    } finally {
        if (client) await client.close();
        process.exit(0);
    }
})();
