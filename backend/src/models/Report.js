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
    description: {
        type: String,
    },
    resolutionImageUrl: {
        type: String,
    },
    category: {
        type: String,
        required: true,
        enum: ['Litter', 'Open Dump', 'Pothole', 'Streetlight', 'Sewage', 'Infrastructure', 'Other'],
    },
    aiSummary: {
        type: String,
    },
    estimatedCost: {
        type: Number,
    },
    estimatedResources: {
        type: String,
    },
    isDuplicateOf: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Report',
        default: null
    },
    duplicateCount: {
        type: Number,
        default: 0
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
        enum: ['Pending', 'Under Review', 'In Progress', 'Resolved'],
        default: 'Pending',
    },
    deadline: {
        type: Date,
    },
    isEscalated: {
        type: Boolean,
        default: false,
    },
    resolutionOTP: {
        type: String,
    },
    upvotedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    }],
    upvoteCount: {
        type: Number,
        default: 0,
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
    },
    comments: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        isAuthority: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Performance Indexes for high-frequency queries and dashboard polling
reportSchema.index({ isDuplicateOf: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ department: 1, ward: 1 });
reportSchema.index({ category: 1, status: 1 });

module.exports = mongoose.model('Report', reportSchema);
