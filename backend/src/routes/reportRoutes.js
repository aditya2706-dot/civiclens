const express = require('express');
const router = express.Router();
const {
    analyzeImage,
    submitReport,
    getReports,
    getReportById,
    updateReportStatus,
    verifyReport
} = require('../controllers/reportController');
const { protect, optionalAuth, admin } = require('../middlewares/authMiddleware');

// Public route to get reports and submit (optionally authenticated)
router.route('/').get(getReports).post(optionalAuth, submitReport);

// Public route to analyze image with AI
router.route('/analyze').post(analyzeImage);

// Public route to get specific report and vote
router.route('/:id').get(getReportById);
router.route('/:id/verify').post(verifyReport);

// Admin route to update status
router.route('/:id/status').put(protect, admin, updateReportStatus);

// Auth route to submit report as user (optional depending on frontend implementation, can just use the public one and pass JWT)

module.exports = router;
