const express = require('express');
const router = express.Router();
const { protect, adminOrAuthority } = require('../middlewares/authMiddleware');
const {
    getNationalPortalSummary,
    exportCPGRAMS,
    exportSBM,
    exportSCM,
    syncToPortal
} = require('../controllers/nationalPortalController');

// Dashboard summary — authority only
router.get('/summary', protect, adminOrAuthority, getNationalPortalSummary);

// Export endpoints — authority only
router.get('/export/cpgrams', protect, adminOrAuthority, exportCPGRAMS);
router.get('/export/sbm', protect, adminOrAuthority, exportSBM);
router.get('/export/scm', protect, adminOrAuthority, exportSCM);

// Sync simulation / live sync
router.post('/sync/:portal', protect, adminOrAuthority, syncToPortal);

module.exports = router;
