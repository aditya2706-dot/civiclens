const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../src/models/User');

async function createAuthority() {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('MONGODB_URI is not defined in .env');
            process.exit(1);
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const email = 'admin@civiclens.com';
        const exists = await User.findOne({ email });
        
        if (exists) {
            console.log('✅ Authority user already exists.');
            console.log(`Login Email: ${email}`);
            console.log('If you forgot the password, you may need to drop the user and recreate.');
        } else {
            console.log('Creating new Authority/Admin user...');
            const admin = new User({
                name: 'City Admin',
                email: email,
                password: 'password123',
                role: 'admin', // The dashboard accepts 'authority' or 'admin'
                department: 'All Departments',
                ward: 'City-wide'
            });
            await admin.save();
            console.log('✅ Admin authority created successfully!');
            console.log(`Login Email: ${email}`);
            console.log('Login Password: password123');
        }
        
    } catch (err) {
        console.error('Error creating authority:', err);
    } finally {
        mongoose.disconnect();
        process.exit(0);
    }
}

createAuthority();
