const mongoose = require('mongoose');

/**
 * Stores each authority officer's browser push subscription.
 * One officer can have multiple subscriptions (phone + laptop + tablet).
 * Linked to their userId so we know which ward/department they handle.
 */
const pushSubscriptionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true,
    },
    // The browser-generated push subscription object
    endpoint:   { type: String, required: true, unique: true },
    p256dh:     { type: String, required: true },
    auth:       { type: String, required: true },
    // Device info (for display purposes)
    userAgent:  { type: String },
    createdAt:  { type: Date, default: Date.now },
});

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
