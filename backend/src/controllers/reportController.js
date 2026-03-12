const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { analyzeImageGemini, getDepartmentForCategory, translateText } = require('../services/aiService');
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
            // Award 10 points for creating a report
            await User.findByIdAndUpdate(req.user._id, { $inc: { civicPoints: 10 } });
        }

        const report = await Report.create(reportData);

        // Feature: Push Notifications for High Severity
        if (severity === 'High' && department) {
            const authorities = await User.find({ role: 'authority', department: department });
            const notifications = authorities.map(auth => ({
                userId: auth._id,
                reportId: report._id,
                title: 'High Severity Alert 🚨',
                message: `A critical ${category} issue was just reported in your department.`,
                type: 'NEW_REPORT'
            }));
            if (notifications.length > 0) {
                await Notification.insertMany(notifications);
            }
        }

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
        const report = await Report.findById(req.params.id)
            .populate('userId', 'name')
            .populate('comments.user', 'name role department');
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
        const { status, resolutionImageUrl } = req.body;
        const report = await Report.findById(req.params.id);

        if (report) {
            // Check if status is transitioning to Resolved
            if (status === 'Resolved' && report.status !== 'Resolved' && report.userId) {
                // Award 50 points to the citizen who reported it
                await User.findByIdAndUpdate(report.userId, { $inc: { civicPoints: 50 } });

                // Feature: Target Citizen Notification
                await Notification.create({
                    userId: report.userId,
                    reportId: report._id,
                    title: 'Issue Resolved! 🎉',
                    message: `Thank you! The ${report.category} issue you reported has been officially resolved. You earned 50 Civic Points!`,
                    type: 'STATUS_UPDATE'
                });
            }

            report.status = status;
            if (resolutionImageUrl) {
                report.resolutionImageUrl = resolutionImageUrl;
            }
            
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

// @desc    Toggle Upvote (Me Too) on a report
// @route   POST /api/reports/:id/upvote
// @access  Private
const toggleUpvote = async (req, res) => {
    try {
        const report = await Report.findById(req.params.id);
        
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const userId = req.user._id;

        // Check if user has already upvoted
        const hasUpvoted = report.upvotedBy.includes(userId);

        if (hasUpvoted) {
            // Downvote (remove user)
            report.upvotedBy = report.upvotedBy.filter(id => id.toString() !== userId.toString());
            report.upvoteCount -= 1;
        } else {
            // Upvote (add user)
            report.upvotedBy.push(userId);
            report.upvoteCount += 1;
        }

        const updatedReport = await report.save();
        res.json({ upvoteCount: updatedReport.upvoteCount, upvotedBy: updatedReport.upvotedBy });
    } catch (error) {
        res.status(500).json({ message: 'Error toggling upvote', error: error.message });
    }
};

// @desc    Add a comment to a report
// @route   POST /api/reports/:id/comments
// @access  Private
const addComment = async (req, res) => {
    try {
        const { text } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const newComment = {
            user: req.user._id,
            text,
            isAuthority: req.user.role === 'authority' || req.user.role === 'admin'
        };

        report.comments.push(newComment);
        await report.save();

        // Optionally fetch the inserted comment with populated user details to return to frontend
        const populatedReport = await Report.findById(req.params.id).populate('comments.user', 'name role department');
        
        res.status(201).json(populatedReport.comments);
    } catch (error) {
        res.status(500).json({ message: 'Error adding comment', error: error.message });
    }
};

module.exports = {
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
    deleteReport
};

// @desc    Delete a report
// @route   DELETE /api/reports/:id
// @access  Private
async function deleteReport(req, res) {
    try {
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        // Feature: Only authenticated reports can be deleted by their owners
        if (!report.userId) {
            return res.status(400).json({ message: 'Anonymous reports cannot be deleted for audit reasons.' });
        }

        if (report.userId.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'You are not authorized to delete this report.' });
        }

        // Delete associated notifications as well
        await Notification.deleteMany({ reportId: report._id });
        
        await Report.findByIdAndDelete(req.params.id);

        res.json({ message: 'Report deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting report', error: error.message });
    }
}

// @desc    Translate report text to Hindi using Gemini AI
// @route   POST /api/reports/:id/translate
// @access  Public
async function translateReport(req, res) {
    try {
        const report = await Report.findById(req.params.id);
        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const textToTranslate = report.aiSummary || report.category;
        const translated = await translateText(textToTranslate, 'Hindi');

        res.json({ translated });
    } catch (error) {
        res.status(500).json({ message: 'Translation failed', error: error.message });
    }
}
