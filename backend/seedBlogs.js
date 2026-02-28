const mongoose = require('mongoose');
require('dotenv').config();
const Blog = require('./src/models/Blog');
const User = require('./src/models/User');

mongoose.connect(process.env.MONGODB_URI)
    .then(async () => {
        await Blog.deleteMany({});

        let admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            admin = await User.findOne({});
        }
        if (!admin) {
            // Create dummy admin if no users exist
            admin = await User.create({ name: 'Admin', email: 'admin@civicai.org', password: 'password', role: 'admin' });
        }

        await Blog.insertMany([
            { title: "How CivicAI is transforming our city's waste management", content: "Waste management is a critical issue...", category: "Waste management", imageUrl: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?auto=format&fit=crop&q=80&w=800", author: admin._id },
            { title: "The impact of reported potholes on road safety", content: "Potholes cause millions of dollars in vehicle damage...", category: "Public safety", imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&q=80&w=800", author: admin._id },
            { title: "Knowing your civic rights: A citizen's guide", content: "Every citizen has the right to a clean and safe environment...", category: "Civic rights", imageUrl: "https://images.unsplash.com/photo-1575313360408-205b38ed6168?auto=format&fit=crop&q=80&w=800", author: admin._id }
        ]);
        console.log('Seeded blogs successfully');
        process.exit(0);
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
