const express = require('express');
const router = express.Router();
const { protect, adminOrAuthority } = require('../middlewares/authMiddleware');
const { createBroadcast, getActiveBroadcasts } = require('../controllers/broadcastController');

router.route('/')
    .post(protect, adminOrAuthority, createBroadcast)
    .get(getActiveBroadcasts);

module.exports = router;
