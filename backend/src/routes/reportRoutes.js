const express = require('express');
const router = express.Router();
const {
    analyzeImage,
    submitReport,
    getReports,
    getAuthorityReports,
    getReportById,
    updateReportStatus,
    verifyReport,
    toggleUpvote,
    addComment,
    translateReport,
    deleteReport,
    getWardStats,
    getMapReports
} = require('../controllers/reportController');
const { protect, optionalAuth, admin, authority, adminOrAuthority } = require('../middlewares/authMiddleware');

// Authority route to get their assigned reports
router.route('/authority').get(protect, adminOrAuthority, getAuthorityReports);

// Public route to get reports and submit (optionally authenticated)
router.route('/').get(getReports).post(optionalAuth, submitReport);

// Public route to analyze image with AI
router.route('/analyze').post(analyzeImage);

// Public route to get lightweight data for map
router.route('/map').get(getMapReports);

// Public route to get ward stats
router.route('/stats/ward').get(getWardStats);

// Public route to get specific report, vote, comment, translate
router.route('/:id').get(getReportById).delete(protect, deleteReport);
router.route('/:id/verify').post(verifyReport);
router.route('/:id/upvote').post(protect, toggleUpvote);
router.route('/:id/comments').post(protect, addComment);
router.route('/:id/translate').post(translateReport);

// Admin/Authority route to update status
router.route('/:id/status').put(protect, adminOrAuthority, updateReportStatus);

// Auth route to submit report as user (optional depending on frontend implementation, can just use the public one and pass JWT)

module.exports = router;
