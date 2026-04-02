const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');
const OfficialDirectory = require('./src/models/OfficialDirectory');

dotenv.config();

const seedHierarchy = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to DB...");

        // 1. Create a Global Admin if not exists
        const adminId = "9999999999";
        let admin = await User.findOne({ phone: adminId });
        if (!admin) {
            console.log("Creating Admin...");
            admin = await User.create({
                name: "Super Admin",
                phone: adminId,
                role: 'admin',
                ward: 'All Wards',
                department: 'Administration'
            });
        }

        // 2. Pre-authorize a Supervisor for Ward 15
        const supervisorPhone = "8888888888";
        await OfficialDirectory.deleteMany({ phone: supervisorPhone });
        await OfficialDirectory.create({
            phone: supervisorPhone,
            ward: "Ward 15",
            department: "Administration",
            role: "supervisor",
            addedBy: admin._id
        });
        console.log(`Supervisor ${supervisorPhone} authorized for Ward 15.`);

        // 3. Pre-authorize a Field Authority for Ward 15
        const officialPhone = "7777777777";
        await OfficialDirectory.deleteMany({ phone: officialPhone });
        await OfficialDirectory.create({
            phone: officialPhone,
            ward: "Ward 15",
            department: "Sanitation",
            role: "authority",
            addedBy: admin._id
        });
        console.log(`Official ${officialPhone} authorized for Ward 15.`);

        console.log("Hierarchy Seeded Successfully. Use /authority-setup to register these phones.");
        process.exit();
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedHierarchy();
