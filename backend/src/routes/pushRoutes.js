const express = require('express');
const router = express.Router();
const PushSubscription = require('../models/PushSubscription');
const { protect } = require('../middlewares/authMiddleware');

// GET /api/push/vapid-key — Frontend needs this to subscribe
router.get('/vapid-key', (req, res) => {
    res.json({ publicKey: process.env.VAPID_PUBLIC_KEY || '' });
});

// POST /api/push/subscribe — Officer enables notifications on their device
router.post('/subscribe', protect, async (req, res) => {
    try {
        const { endpoint, keys } = req.body;
        if (!endpoint || !keys?.p256dh || !keys?.auth) {
            return res.status(400).json({ message: 'Invalid subscription object' });
        }

        // Upsert — update if already exists (e.g. browser refreshed the subscription)
        await PushSubscription.findOneAndUpdate(
            { endpoint },
            {
                userId: req.user._id,
                endpoint,
                p256dh: keys.p256dh,
                auth: keys.auth,
                userAgent: req.headers['user-agent'] || '',
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Push notifications enabled for your device.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to save push subscription', error: err.message });
    }
});

// DELETE /api/push/unsubscribe — Officer disables notifications on their device
router.delete('/unsubscribe', protect, async (req, res) => {
    try {
        const { endpoint } = req.body;
        await PushSubscription.deleteOne({ endpoint, userId: req.user._id });
        res.json({ success: true, message: 'Push notifications disabled.' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to remove subscription', error: err.message });
    }
});

// GET /api/push/status — Check if current device is subscribed
router.get('/status', protect, async (req, res) => {
    try {
        const count = await PushSubscription.countDocuments({ userId: req.user._id });
        res.json({ subscribed: count > 0, deviceCount: count });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
