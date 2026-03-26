const Report = require('../models/Report');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { analyzeImageGemini, getDepartmentForCategory, translateText } = require('../services/aiService');
const axios = require('axios');
const { getWardFromCoordinates } = require('../utils/wardDetector');

// Simple in-memory cache to reduce repeated DB queries
const _cache = {};
function getCache(key) {
    const item = _cache[key];
    if (item && Date.now() - item.ts < item.ttl) return item.data;
    return null;
}
function setCache(key, data, ttlMs) {
    _cache[key] = { data, ts: Date.now(), ttl: ttlMs };
}
// Invalidate cache when new report is submitted
function clearCache() {
    Object.keys(_cache).forEach(k => delete _cache[k]);
}

// @desc    Analyze uploaded image with Gemini
// @route   POST /api/reports/analyze
// @access  Public
const analyzeImage = async (req, res) => {
    try {
        const { imageBase64, mimeType, location, addressContext } = req.body;

        if (!imageBase64) {
            return res.status(400).json({ message: "Image data is required" });
        }

        // Feature: Automatic Ward Detection (Local Polygon Only)
        // This avoids 429 Status code from external geocoding APIs
        let detectedWard = null;
        if (location && location.lat && location.lng) {
            detectedWard = getWardFromCoordinates(location.lat, location.lng);
        }

        // Pass location to AI so it can do its own internal geocoding as a fallback
        const aiAnalysis = await analyzeImageGemini(imageBase64, mimeType || 'image/jpeg', addressContext, detectedWard, location);
        res.json(aiAnalysis);

    } catch (error) {
        console.error("AI Analysis Error:", error.message);
        res.status(500).json({ message: 'Error analyzing image', error: error.message });
    }
};

// @desc    Submit a new report
// @route   POST /api/reports
// @access  Public (can be anonymous or authenticated)
const submitReport = async (req, res) => {
    try {
        const { imageUrl, location, description, isAnonymous, category, aiSummary, detectedObjects, severity, department, ward } = req.body;

        // SLA Deadlines: High=24h, Medium=48h, Low=72h
        let hoursToAdd = 48;
        if (severity === 'High') hoursToAdd = 24;
        if (severity === 'Low') hoursToAdd = 72;
        const deadline = new Date();
        deadline.setHours(deadline.getHours() + hoursToAdd);

        const resolutionOTP = Math.floor(1000 + Math.random() * 9000).toString();

        // Deduplication Engine: Detect similar open reports within 50 meters
        let duplicateOf = null;
        if (location && location.lat && location.lng && category) {
            const pendingReports = await Report.find({ 
                category: category, 
                status: { $ne: 'Resolved' },
                isDuplicateOf: null // Match only master tickets
            });

            const toRad = x => x * Math.PI / 180;
            for (let pr of pendingReports) {
                if (pr.location && pr.location.lat && pr.location.lng) {
                    const R = 6371e3; // Earth radius in metres
                    const dLat = toRad(location.lat - pr.location.lat);
                    const dLon = toRad(location.lng - pr.location.lng);
                    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                            Math.cos(toRad(pr.location.lat)) * Math.cos(toRad(location.lat)) *
                            Math.sin(dLon/2) * Math.sin(dLon/2);
                    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                    const distance = R * c;

                    // If within 50 meters, flag as duplicate and increment master ticket
                    if (distance <= 50) {
                        duplicateOf = pr._id;
                        await Report.findByIdAndUpdate(pr._id, { $inc: { duplicateCount: 1 } });
                        break;
                    }
                }
            }
        }

        // Step 3: Create Report (already analyzed by frontend)
        const reportData = {
            imageUrl,
            category: category,
            description: description,
            aiSummary: aiSummary,
            detectedObjects: detectedObjects,
            severity: severity,
            location,
            department: department,
            ward: ward,
            deadline: deadline,
            resolutionOTP: resolutionOTP,
            estimatedCost: req.body.estimatedCost || 0,
            estimatedResources: req.body.estimatedResources || "Unknown",
            isDuplicateOf: duplicateOf,
        };

        if (!isAnonymous && req.user) {
            reportData.userId = req.user._id;
            // Award 10 points for creating a report
            await User.findByIdAndUpdate(req.user._id, { $inc: { civicPoints: 10 } });
        }

        const report = await Report.create(reportData);
        // Invalidate cache so the new report appears immediately
        clearCache();

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
        const cached = getCache('reports_list');
        if (cached) {
            res.set('Cache-Control', 'public, max-age=30');
            return res.json(cached);
        }
        
        const reports = await Report.find({})
            .sort({ createdAt: -1 })
            .limit(30)
            .lean();
        
        const now = new Date();
        const sanitizedReports = reports.map(r => ({
            ...r,
            isEscalated: r.status !== 'Resolved' && r.deadline && new Date(r.deadline) < now,
            imageUrl: (r.imageUrl && r.imageUrl.includes('example.com')) ? null : r.imageUrl
        }));
        
        // Cache public dashboard for 30 seconds
        setCache('reports_list', sanitizedReports, 30000);
        res.set('Cache-Control', 'public, max-age=30');
        res.json(sanitizedReports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching reports', error: error.message });
    }
};

// @desc    Get reports assigned to the logged-in citizen
// @route   GET /api/reports/my
// @access  Private
const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ userId: req.user._id })
            .sort({ createdAt: -1 })
            .lean();
            
        const now = new Date();
        const sanitizedReports = reports.map(r => ({
            ...r,
            isEscalated: r.status !== 'Resolved' && r.deadline && new Date(r.deadline) < now,
            imageUrl: (r.imageUrl && r.imageUrl.includes('example.com')) ? null : r.imageUrl
        }));
        
        res.json(sanitizedReports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your reports', error: error.message });
    }
};

// @desc    Get reports assigned to the logged-in authority
// @route   GET /api/reports/authority
// @access  Private/Authority
const getAuthorityReports = async (req, res) => {
    try {
        const { status } = req.query;
        // Dynamically scope cache to the exact user context and query string
        const cacheKey = `auth_reports_${req.user._id}_${status || 'all'}`;
        
        const cached = getCache(cacheKey);
        if (cached) {
            res.set('Cache-Control', 'private, max-age=30');
            return res.json(cached);
        }

        let query = { isDuplicateOf: null };

        if (req.user.role !== 'admin') {
            if (req.user.department && req.user.department !== 'Administration') {
                query.department = req.user.department;
            }
            if (req.user.ward && req.user.ward !== 'All Wards') {
                query.ward = req.user.ward;
            }
        }

        if (status) query.status = status;

        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();
        
        const now = new Date();
        const sanitizedReports = reports.map(r => ({
            ...r,
            isEscalated: r.status !== 'Resolved' && r.deadline && new Date(r.deadline) < now,
            imageUrl: (r.imageUrl && r.imageUrl.includes('example.com')) ? null : r.imageUrl
        }));
        
        // Cache authority dashboard for 30 seconds to block infinite polling lag
        setCache(cacheKey, sanitizedReports, 30000);
        res.set('Cache-Control', 'private, max-age=30');
        res.json(sanitizedReports);
    } catch (error) {
        console.error("Authority reports error:", error);
        res.status(500).json({ message: 'Error fetching authority reports', error: error.message });
    }
};


// @desc    Get ward statistics
// @route   GET /api/reports/stats/ward
// @access  Public
const getWardStats = async (req, res) => {
    try {
        const stats = await Report.aggregate([
            {
                $group: {
                    _id: "$ward",
                    totalReports: { $sum: 1 },
                    resolvedReports: {
                        $sum: { $cond: [{ $eq: ["$status", "Resolved"] }, 1, 0] }
                    },
                    pendingReports: {
                        $sum: { $cond: [{ $in: ["$status", ["Pending", "In Progress", "Under Review"]] }, 1, 0] }
                    }
                }
            },
            {
                $project: {
                    ward: { $ifNull: ["$_id", "Unknown Ward"] },
                    totalReports: 1,
                    resolvedReports: 1,
                    pendingReports: 1,
                    resolutionRate: {
                        $cond: [
                            { $eq: ["$totalReports", 0] },
                            0,
                            { $multiply: [{ $divide: ["$resolvedReports", "$totalReports"] }, 100] }
                        ]
                    }
                }
            },
            { $sort: { totalReports: -1 } }
        ]);

        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching ward stats', error: error.message });
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
            if (report.imageUrl && report.imageUrl.includes('example.com')) {
            report.imageUrl = null;
        }
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
        const { status, resolutionImageUrl, otp } = req.body;
        const report = await Report.findById(req.params.id);

        if (report) {
            // Verify OTP if attempting to resolve without a photo
            if (status === 'Resolved' && report.status !== 'Resolved') {
                if (otp) {
                    if (report.resolutionOTP !== otp) {
                        return res.status(400).json({ message: 'Invalid Verification OTP' });
                    }
                } else if (!resolutionImageUrl) {
                    return res.status(400).json({ message: 'Resolution requires either an OTP or a Proof Photo' });
                }
            }

            // Check if status is transitioning to Resolved
            if (status === 'Resolved' && report.status !== 'Resolved' && report.userId) {
                // Award 50 points to the citizen who reported it
                await User.findByIdAndUpdate(report.userId, { $inc: { civicPoints: 50 } });

                // Feature: Target Citizen Notification
                await Notification.create({
                    userId: report.userId,
                    reportId: report._id,
                    title: otp ? 'Issue Resolved via OTP! 🎉' : 'Issue Resolved! 🎉',
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

// @desc    Transfer report to a different department
// @route   PUT /api/reports/:id/transfer
// @access  Private/Admin or Authority
const transferReport = async (req, res) => {
    try {
        const { newDepartment } = req.body;
        const report = await Report.findById(req.params.id);

        if (!report) {
            return res.status(404).json({ message: 'Report not found' });
        }

        const oldDepartment = report.department;
        report.department = newDepartment;
        
        // Add an automatic comment about the transfer
        const transferComment = {
            user: req.user._id,
            text: `System Update: Report transferred from ${oldDepartment} to ${newDepartment}.`,
            isAuthority: true
        };
        report.comments.push(transferComment);

        const updatedReport = await report.save();
        res.json(updatedReport);
    } catch (error) {
        res.status(500).json({ message: 'Error transferring report', error: error.message });
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

// @desc    Get minimal report data for map markers
// @route   GET /api/reports/map
// @access  Public
async function getMapReports(req, res) {
    try {
        const { status, category, ward } = req.query;
        let query = {};

        if (status) query.status = status;
        if (category && category !== 'All') query.category = category;
        if (ward && ward !== 'All Wards') query.ward = ward;

        const cacheKey = `map_${status}_${category}_${ward}`;
        const cached = getCache(cacheKey);
        if (cached) {
            res.set('Cache-Control', 'public, max-age=10');
            return res.json(cached);
        }

        const reports = await Report.find(query)
            .sort({ createdAt: -1 })
            .limit(150)
            .select('location status category severity ward _id')
            .lean(); 
            
        const sanitizedReports = reports.map(r => ({
            ...r,
            imageUrl: (r.imageUrl && r.imageUrl.includes('example.com')) ? null : r.imageUrl
        }));
        
        setCache(cacheKey, sanitizedReports, 10000);
        res.set('Cache-Control', 'public, max-age=10');
        res.json(sanitizedReports);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching map reports', error: error.message });
    }
}

// @desc    Get global statistics (unresolved count)
// @route   GET /api/reports/stats
// @access  Public
const getReportsStats = async (req, res) => {
    try {
        const cacheKey = 'global_stats';
        const cached = getCache(cacheKey);
        if (cached) return res.json(cached);

        const unresolvedCount = await Report.countDocuments({ 
            status: { $in: ['Pending', 'Under Review', 'In Progress'] } 
        });

        const data = { unresolvedCount };
        setCache(cacheKey, data, 30000); // 30s cache
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching stats', error: error.message });
    }
}

module.exports = {
    analyzeImage,
    submitReport,
    getReports,
    getMyReports,
    getAuthorityReports,
    getMapReports,
    getReportsStats,
    getReportById,
    updateReportStatus,
    transferReport,
    verifyReport,
    toggleUpvote,
    addComment,
    translateReport,
    deleteReport,
    getWardStats
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
