const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./src/models/User');

dotenv.config();

const fixPassword = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const adminId = "9999999999";
        let admin = await User.findOne({ phone: adminId });
        if (admin) {
            admin.password = "Password123";
            await admin.save();
            console.log("Admin password updated to Password123");
        }
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}

fixPassword();
