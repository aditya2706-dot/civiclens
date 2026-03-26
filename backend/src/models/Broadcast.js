const mongoose = require('mongoose');

const broadcastSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    ward: {
        type: String,
        default: 'All Wards'
    },
    department: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    activeUntil: {
        type: Date,
        required: true
    }
}, { timestamps: true });

// Performance index for high-frequency dashboard polling
broadcastSchema.index({ activeUntil: 1, ward: 1 });

module.exports = mongoose.model('Broadcast', broadcastSchema);
