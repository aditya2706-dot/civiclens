const Broadcast = require('../models/Broadcast');

// In-memory cache for dynamic global alerts
const _cache = {};
function getCache(key) {
    const item = _cache[key];
    if (item && Date.now() - item.ts < item.ttl) return item.data;
    return null;
}
function setCache(key, data, ttlMs) {
    _cache[key] = { data, ts: Date.now(), ttl: ttlMs };
}
function clearCache() {
    Object.keys(_cache).forEach(k => delete _cache[k]);
}

// @desc    Create a new broadcast alert
// @route   POST /api/broadcasts
// @access  Private/Authority
const createBroadcast = async (req, res) => {
    try {
        const { title, message, ward, activeHours } = req.body;
        
        const activeUntil = new Date();
        activeUntil.setHours(activeUntil.getHours() + (activeHours || 24));

        const broadcast = await Broadcast.create({
            title,
            message,
            ward: ward || 'All Wards',
            department: req.user.department || 'Administration',
            createdBy: req.user._id,
            activeUntil
        });

        // Invalidate broadcasts cache globally so emergencies push instantly
        clearCache();

        res.status(201).json(broadcast);
    } catch (error) {
        res.status(500).json({ message: 'Error creating broadcast', error: error.message });
    }
};

// @desc    Get active broadcasts for a citizen's ward
// @route   GET /api/broadcasts
// @access  Public
const getActiveBroadcasts = async (req, res) => {
    try {
        const { ward } = req.query;
        const cacheKey = `active_broadcasts_${ward || 'global'}`;
        
        const cached = getCache(cacheKey);
        if (cached) {
            res.set('Cache-Control', 'public, max-age=30');
            return res.json(cached);
        }

        const now = new Date();
        let query = { activeUntil: { $gt: now } };
        if (ward) {
            query.ward = { $in: [ward, 'All Wards'] };
        }

        const broadcasts = await Broadcast.find(query).sort({ createdAt: -1 }).lean();
        
        // Cache the parsed response for 30s to mitigate request spam
        setCache(cacheKey, broadcasts, 30000);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(broadcasts);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching broadcasts', error: error.message });
    }
};

module.exports = { createBroadcast, getActiveBroadcasts };
