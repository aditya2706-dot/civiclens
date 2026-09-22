require('dotenv').config();
const mongoose = require('mongoose');
const { syncReportToCleanAlwar } = require('../services/cleanAlwarBridge');
const Report = require('../models/Report');

async function testSync() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/civiclens');
        console.log("Connected.");

        // Create a mock report for testing
        const mockReport = new Report({
            imageUrl: 'https://via.placeholder.com/150', // placeholder URL
            description: 'This is a test complaint for Clean Alwar Bridge script.',
            category: 'Litter',
            severity: 'Medium',
            location: {
                lat: 27.552990,
                lng: 76.634570,
                address: 'Test Area, Alwar'
            },
            ward: 'Ward 10',
            reporterPhone: '9876543210'
        });

        // Save it so we have a valid ID
        await mockReport.save();
        console.log(`Created mock report with ID: ${mockReport._id}`);

        // Trigger the sync
        console.log("Triggering syncReportToCleanAlwar...");
        await syncReportToCleanAlwar(mockReport);

        // Fetch it again to see the updated status
        const updatedReport = await Report.findById(mockReport._id);
        console.log("=== Sync Result ===");
        console.log(`Status: ${updatedReport.cleanAlwarSyncStatus}`);
        console.log(`Reference ID: ${updatedReport.cleanAlwarReferenceId}`);
        console.log(`Error: ${updatedReport.cleanAlwarSyncError}`);
        
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

testSync();
