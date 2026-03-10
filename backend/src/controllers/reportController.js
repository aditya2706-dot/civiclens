const Report = require('../models/Report');
const { analyzeImageGemini, getDepartmentForCategory } = require('../services/aiService');
const axios = require('axios');

// @desc    Analyze uploaded image with Gemini
// @route   POST /api/reports/analyze
// @access  Public
const analyzeImage = async (req, res) => {
    try {
        const { imageBase64, mimeType, location } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ message: 'Missing imageBase64 data' });
        }

        let addressContext = '';
        if (location && location.lat && location.lng) {
            try {
                // Fetch reverse geocoding from OpenStreetMap Nominatim
                // Requires a User-Agent, so we use a dummy one
                const geoRes = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`, {
                    headers: { 'User-Agent': 'CivicLensApp/1.0' }
                });
                if (geoRes.data && geoRes.data.display_name) {
                    addressContext = geoRes.data.display_name;
                }
            } catch (err) {
                console.error("Geocoding error:", err.message);
            }
        }

        const aiAnalysis = await analyzeImageGemini(imageBase64, mimeType || 'image/jpeg', addressContext);
        res.json(aiAnalysis);

    } catch (error) {
        res.status(500).json({ message: 'Error analyzing image', error: error.message });
    }
};

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Public (can be anonymous or authenticated)
const submitReport = async (req, res) => {
    try {
        const { imageUrl, location, description, isAnonymous, category, aiSummary, detectedObjects, severity, department, ward } = req.body;

        // Step 3: Create Report (already analyzed by frontend)
        const reportData = {
            imageUrl,
            category: category,
            aiSummary: description ? `${description} | AI: ${aiSummary}` : aiSummary,
            detectedObjects: detectedObjects,
            severity: severity,
            location,
            department: department,
            ward: ward,
        };

        if (!isAnonymous && req.user) {
            reportData.userId = req.user._id;
        }

        const report = await Report.create(reportData);
        res.status(201).json(report);

    } catch (error) {
        res.status(500).json({ message: 'Error submitting report', error: error.message });
    }
};

// @desc    Get all reports (with optional filters)
// @route   GET /api/reports
// @access  Public
const getReports = async (req, res) => {
    try {
        const { status, category } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category) query.category = category;

        const reports = await Report.find(query).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error: error.message });
    }
};

// @desc    Get reports assigned to the logged-in authority
// @route   GET /api/reports/authority
// @access  Private/Authority
const getAuthorityReports = async (req, res) => {
    try {
        const { status } = req.query;
        let query = {
            department: req.user.department,
        };

        if (req.user.ward) {
            query.ward = req.user.ward;
        }

        if (status) query.status = status;

        const reports = await Report.find(query).sort({ createdAt: -1 });
        res.json(reports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching authority reports', error: error.message });
    }
};


// @desc    Get a single report by ID
// @route   GET /api/reports/:id
// @access  Public
const getReportById = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id).populate('userId', 'name');
        if (report) {
            res.json(report);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error fetching report', error: error.message });
    }
};

// @desc    Update report status
// @route   PUT /api/reports/:id/status
// @access  Private/Admin
const updateReportStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const report = await Report.findById(req.params.id);

        if (report) {
            report.status = status;
            const updatedReport = await report.save();
            res.json(updatedReport);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error updating report', error: error.message });
    }
};

// @desc    Verify/Vote on a report
// @route   POST /api/reports/:id/verify
// @access  Public
const verifyReport = async (req, res) => {
    try {
        const { isAccurate } = req.body;
        const report = await Report.findById(req.params.id);

        if (report) {
            if (isAccurate) {
                report.verificationCount += 1;
            } else {
                report.verificationCount = Math.max(0, report.verificationCount - 1);
            }
            const updatedReport = await report.save();
            res.json(updatedReport);
        } else {
            res.status(404).json({ message: 'Report not found' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Error verifying report', error: error.message });
    }
};

module.exports = {
    analyzeImage,
    submitReport,
    getReports,
    getAuthorityReports,
    getReportById,
    updateReportStatus,
    verifyReport
};
