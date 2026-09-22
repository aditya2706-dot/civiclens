require('dotenv').config();
const mongoose = require('mongoose');
const Report = require('../models/Report');
const User = require('../models/User');

const MOCK_REPORTS = [
  {
    title: 'Huge pothole near City Palace',
    description: 'There is a massive pothole causing traffic jams near the main gate.',
    category: 'Pothole',
    location: {
      type: 'Point',
      coordinates: [76.6033, 27.5700] // Alwar longitude, latitude
    },
    severity: 'High',
    status: 'Pending',
    upvotes: 12,
    ward: 'Ward 15',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=Pothole',
    cleanAlwarSyncStatus: 'SYNCED'
  },
  {
    title: 'Overflowing Garbage Bin',
    description: 'Garbage has not been collected for 3 days near the bus stand.',
    category: 'Litter',
    location: {
      type: 'Point',
      coordinates: [76.6111, 27.5612]
    },
    severity: 'Medium',
    status: 'In Progress',
    upvotes: 5,
    ward: 'Ward 8',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=Garbage',
    cleanAlwarSyncStatus: 'SYNCED'
  },
  {
    title: 'Streetlight not working',
    description: 'Completely dark street, unsafe for walking at night.',
    category: 'Streetlight',
    location: {
      type: 'Point',
      coordinates: [76.5902, 27.5501]
    },
    severity: 'Medium',
    status: 'Pending',
    upvotes: 2,
    ward: 'Ward 42',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=Streetlight',
    cleanAlwarSyncStatus: 'PENDING'
  },
  {
    title: 'Water pipe leak',
    description: 'Clean drinking water is being wasted on the main road.',
    category: 'Sewage',
    location: {
      type: 'Point',
      coordinates: [76.6150, 27.5800]
    },
    severity: 'High',
    status: 'Resolved',
    upvotes: 20,
    ward: 'Ward 2',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=Water+Leak',
    cleanAlwarSyncStatus: 'FAILED'
  },
  {
    title: 'Broken bench in park',
    description: 'Public park bench is broken and dangerous for kids.',
    category: 'Infrastructure',
    location: {
      type: 'Point',
      coordinates: [76.5850, 27.5650]
    },
    severity: 'Low',
    status: 'Pending',
    upvotes: 1,
    ward: 'Ward 15',
    imageUrl: 'https://via.placeholder.com/400x300.png?text=Broken+Bench',
    cleanAlwarSyncStatus: 'SYNCED'
  }
];

async function seedReports() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        
        const citizen = await User.findOne({ role: 'citizen' });
        const citizenId = citizen ? citizen._id : new mongoose.Types.ObjectId();

        console.log("Clearing old reports...");
        await Report.deleteMany({});

        console.log("Inserting mock reports...");
        const reportsToInsert = MOCK_REPORTS.map(r => ({
            ...r,
            user: citizenId,
            aiSummary: 'Generated mock summary for testing.',
            resolutionOTP: '1234'
        }));

        await Report.insertMany(reportsToInsert);
        console.log(`✅ Successfully seeded ${MOCK_REPORTS.length} reports!`);
        
        process.exit(0);
    } catch (err) {
        console.error("SEED_ERROR:", err);
        process.exit(1);
    }
}

seedReports();
