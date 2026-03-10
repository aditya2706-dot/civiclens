const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const OfficialDirectory = require('../models/OfficialDirectory');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

mongoose.connect(process.env.MONGODB_URI);

const officials = [
    {
        phone: '9999999999',
        ward: 'Ward 42',
        department: 'Sanitation'
    },
    {
        phone: '8888888888',
        ward: 'Ward 12',
        department: 'Roads & Infrastructure'
    }
];

const seedData = async () => {
    try {
        await OfficialDirectory.deleteMany();
        console.log('Old records deleted.');

        await OfficialDirectory.insertMany(officials);
        console.log('Pre-approved Officials Seeded Successfully!');

        process.exit();
    } catch (error) {
        console.error('Error with data seeding', error);
        process.exit(1);
    }
};

seedData();
