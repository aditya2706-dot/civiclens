require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedMVP() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        
        // 1. Create MVP Citizen
        const existingCitizen = await User.findOne({ email: 'citizen@mvp.com' });
        if (!existingCitizen) {
            await User.create({
                name: 'MVP Citizen',
                email: 'citizen@mvp.com',
                password: 'password123',
                role: 'citizen',
                civicPoints: 150
            });
            console.log("✅ Created Citizen: citizen@mvp.com / password123");
        } else {
            console.log("ℹ️ Citizen already exists.");
        }

        // 2. Create MVP Authority
        const existingAuth = await User.findOne({ username: 'authority_mvp' });
        if (!existingAuth) {
            await User.create({
                name: 'Chief Officer',
                username: 'authority_mvp',
                email: 'authority@gov.in',
                password: 'password123',
                role: 'authority',
                department: 'Sanitation',
                ward: 'Ward 42'
            });
            console.log("✅ Created Authority: authority_mvp / password123");
        } else {
            console.log("ℹ️ Authority already exists.");
        }

        console.log("\n🚀 MVP Sandbox Ready!");
        process.exit(0);
    } catch (err) {
        console.error("SEED_ERROR:", err);
        process.exit(1);
    }
}

seedMVP();
