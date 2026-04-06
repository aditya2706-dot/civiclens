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
    nearbyLandmark: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Pending', 'Under Review', 'In Progress', 'Resolved', 'Under Audit'],
        default: 'Pending',
    },
    isDisputed: {
        type: Boolean,
        default: false,
    },
    disputeReason: {
        type: String,
    },
    disputeResolvedAt: {
        type: Date,
    },
    deadline: {
        type: Date,
    },
    resolvedAt: {
        type: Date,
        default: null,
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
    }],
    assignedTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    internalNotes: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        text: { type: String, required: true },
        createdAt: { type: Date, default: Date.now }
    }]
}, { timestamps: true });

// Performance Indexes for high-frequency queries and dashboard polling
reportSchema.index({ createdAt: -1 }); // Global recent queries
reportSchema.index({ userId: 1, createdAt: -1 }); // Citizen personal reports
reportSchema.index({ isDuplicateOf: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ department: 1, ward: 1, createdAt: -1 }); // Authority dashboard queries
reportSchema.index({ category: 1, status: 1 });
reportSchema.index({ "location.lat": 1, "location.lng": 1 }); // Map queries fallback

module.exports = mongoose.model('Report', reportSchema);
