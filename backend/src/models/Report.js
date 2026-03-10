const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false, // Allow anonymous reports
    },
    imageUrl: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
        enum: ['Litter', 'Open Dump', 'Pothole', 'Streetlight', 'Sewage', 'Other'],
    },
    aiSummary: {
        type: String,
    },
    detectedObjects: [{
        type: String,
    }],
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium',
    },
    location: {
        lat: { type: Number },
        lng: { type: Number },
        address: { type: String }
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'Resolved'],
        default: 'Pending',
    },
    verificationCount: {
        type: Number,
        default: 0,
    },
    department: {
        type: String,
    },
    ward: {
        type: String, // E.g., "Ward 1", "North Zone"
    }
}, { timestamps: true });

module.exports = mongoose.model('Report', reportSchema);
