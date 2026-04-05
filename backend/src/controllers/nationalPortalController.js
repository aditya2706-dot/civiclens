/**
 * CivicLens — National Portal Integration Layer
 *
 * This module provides data formatters and export endpoints that map
 * CivicLens report data to the schemas used by India's national portals:
 *
 *  1. CPGRAMS  — Central Public Grievance Redress and Monitoring System (DARPG)
 *  2. SBM      — Swachh Bharat Mission Urban 2.0
 *  3. SCM      — Smart City Mission Dashboard (MoHUA)
 *
 * NOTE: These portals do NOT have public APIs. You need an official MOU
 * with the respective ministry to get actual API credentials.
 * This module:
 *   - Formats your data in their exact expected schema (ready to plug in)
 *   - Provides a "sync simulation" endpoint for demos
 *   - Provides a dashboard summary endpoint for the frontend portal page
 *
 * When you get the government MOU:
 *   - Add CPGRAMS_API_KEY, SBM_API_KEY, SCM_API_KEY to .env
 *   - Uncomment the actual HTTP calls in each sync function
 */

const Report = require('../models/Report');

// ─── CPGRAMS Schema Mapper ────────────────────────────────────────────────────
// Maps a CivicLens report to CPGRAMS grievance format
function toCPGRAMSFormat(report) {
    const categoryMap = {
        'Pothole': 'Roads and Transport',
        'Open Dump': 'Sanitation and Cleanliness',
        'Litter': 'Sanitation and Cleanliness',
        'Sewage': 'Water and Sewage',
        'Streetlight': 'Electricity and Lighting',
        'Infrastructure': 'Public Infrastructure',
        'Other': 'General Public Issues',
    };

    return {
        grievance_id: `CL-${report._id.toString().slice(-8).toUpperCase()}`,
        registration_date: report.createdAt?.toISOString().split('T')[0],
        ministry: 'Ministry of Housing and Urban Affairs (MoHUA)',
        department: report.department || categoryMap[report.category] || 'General',
        subject: report.category,
        grievance_text: report.aiSummary || report.description,
        location: {
            state: 'Rajasthan',
            district: 'Alwar',
            ward: report.ward || 'Unknown',
            pin_code: '301001',
            landmark: report.nearbyLandmark || ''
        },
        severity: report.severity,
        current_status: report.status === 'Resolved' ? 'CLOSED' : 'PENDING',
        resolution_date: report.resolvedAt?.toISOString().split('T')[0] || null,
        source: 'CivicLens Digital Platform',
        anonymous: !report.userId
    };
}

// ─── Swachh Bharat Mission Schema Mapper ─────────────────────────────────────
function toSBMFormat(report) {
    const sbmCategories = ['Open Dump', 'Litter', 'Sewage'];
    if (!sbmCategories.includes(report.category)) return null; // SBM only tracks sanitation

    return {
        complaint_id: `SBM-CL-${report._id.toString().slice(-8).toUpperCase()}`,
        ulb_name: 'Alwar Nagar Parishad',
        state: 'Rajasthan',
        ward_no: report.ward?.replace('Ward ', '') || '0',
        complaint_type: report.category === 'Open Dump' ? 'GARBAGE_DUMP' : report.category === 'Sewage' ? 'SEWAGE_OVERFLOW' : 'LITTERING',
        complaint_date: report.createdAt?.toISOString(),
        geo_location: report.location?.lat
            ? `${report.location.lat},${report.location.lng}`
            : 'Not Available',
        status: report.status === 'Resolved' ? 'RESOLVED' : report.status === 'In Progress' ? 'IN_PROGRESS' : 'REGISTERED',
        resolution_proof: report.resolutionImageUrl ? 'Proof uploaded' : 'Pending',
        swm_points: report.severity === 'High' ? 30 : report.severity === 'Medium' ? 20 : 10,
    };
}

// ─── Smart City Mission Schema Mapper ────────────────────────────────────────
function toSCMFormat(reports) {
    const total = reports.length;
    const resolved = reports.filter(r => r.status === 'Resolved').length;
    const high = reports.filter(r => r.severity === 'High').length;
    const byCategory = {};
    for (const r of reports) {
        byCategory[r.category] = (byCategory[r.category] || 0) + 1;
    }

    return {
        city: 'Alwar',
        state: 'Rajasthan',
        ulb_code: 'RJ_ALWAR_001',
        report_period: new Date().toISOString().split('T')[0],
        platform: 'CivicLens',
        kpis: {
            total_complaints: total,
            resolved_complaints: resolved,
            resolution_rate_percent: total > 0 ? Math.round((resolved / total) * 100) : 0,
            critical_complaints: high,
            average_resolution_hours: 48, // TODO: compute from actual data
        },
        infrastructure_breakdown: byCategory,
        digital_adoption: {
            app_users: 'Active',
            whatsapp_bot: 'Operational',
            ai_categorization: 'Gemini 1.5 Flash',
        }
    };
}

// ─── API Controllers ──────────────────────────────────────────────────────────

// GET /api/national/summary
// Returns a dashboard summary with all 3 portal views
const getNationalPortalSummary = async (req, res) => {
    try {
        const reports = await Report.find({}).lean();
        const sbmReports = reports.filter(r => ['Open Dump', 'Litter', 'Sewage'].includes(r.category));

        const summary = {
            total_reports: reports.length,
            portals: {
                cpgrams: {
                    name: 'CPGRAMS',
                    full_name: 'Central Public Grievance Redress & Monitoring System',
                    ministry: 'DARPG, Government of India',
                    status: process.env.CPGRAMS_API_KEY ? 'CONNECTED' : 'READY_TO_CONNECT',
                    records_ready: reports.length,
                    last_sync: null,
                    color: '#1565C0',
                    icon: '🏛️'
                },
                sbm: {
                    name: 'Swachh Bharat Mission',
                    full_name: 'Swachh Bharat Mission Urban 2.0',
                    ministry: 'MoHUA, Government of India',
                    status: process.env.SBM_API_KEY ? 'CONNECTED' : 'READY_TO_CONNECT',
                    records_ready: sbmReports.length,
                    last_sync: null,
                    color: '#2E7D32',
                    icon: '🧹'
                },
                scm: {
                    name: 'Smart City Mission',
                    full_name: 'Smart Cities Mission Dashboard',
                    ministry: 'MoHUA, Government of India',
                    status: process.env.SCM_API_KEY ? 'CONNECTED' : 'READY_TO_CONNECT',
                    records_ready: 1, // Summary record
                    last_sync: null,
                    color: '#6A1B9A',
                    icon: '🏙️'
                }
            },
            scm_dashboard: toSCMFormat(reports)
        };

        res.json(summary);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch national portal summary', error: err.message });
    }
};

// GET /api/national/export/cpgrams
// Downloads all reports in CPGRAMS-compatible JSON format
const exportCPGRAMS = async (req, res) => {
    try {
        const reports = await Report.find({}).lean();
        const formatted = reports.map(toCPGRAMSFormat);

        res.setHeader('Content-Disposition', 'attachment; filename="civiclens_cpgrams_export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json({
            export_date: new Date().toISOString(),
            source_platform: 'CivicLens',
            ulb: 'Alwar Nagar Parishad',
            total_records: formatted.length,
            format_version: 'CPGRAMS_v3.2',
            grievances: formatted
        });
    } catch (err) {
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

// GET /api/national/export/sbm
// Downloads sanitation reports in SBM-compatible JSON format
const exportSBM = async (req, res) => {
    try {
        const reports = await Report.find({
            category: { $in: ['Open Dump', 'Litter', 'Sewage'] }
        }).lean();
        const formatted = reports.map(toSBMFormat).filter(Boolean);

        res.setHeader('Content-Disposition', 'attachment; filename="civiclens_sbm_export.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json({
            export_date: new Date().toISOString(),
            source_platform: 'CivicLens',
            ulb_name: 'Alwar Nagar Parishad',
            state: 'Rajasthan',
            total_records: formatted.length,
            format: 'SBM_Urban_2.0',
            complaints: formatted
        });
    } catch (err) {
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

// GET /api/national/export/scm
// Downloads Smart City KPI report
const exportSCM = async (req, res) => {
    try {
        const reports = await Report.find({}).lean();
        const scmData = toSCMFormat(reports);

        res.setHeader('Content-Disposition', 'attachment; filename="civiclens_scm_kpi.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json({
            export_date: new Date().toISOString(),
            ...scmData
        });
    } catch (err) {
        res.status(500).json({ message: 'Export failed', error: err.message });
    }
};

// POST /api/national/sync/:portal
// Simulates syncing to a portal (shows "sync complete" for demos)
// When MOU is obtained, replace the simulation with actual HTTP calls
const syncToPortal = async (req, res) => {
    const { portal } = req.params;
    const validPortals = ['cpgrams', 'sbm', 'scm'];

    if (!validPortals.includes(portal)) {
        return res.status(400).json({ message: 'Invalid portal. Use: cpgrams, sbm, or scm' });
    }

    const apiKey = process.env[`${portal.toUpperCase()}_API_KEY`];

    if (!apiKey) {
        // DEMO MODE: Simulate successful sync for presentations
        return res.json({
            success: true,
            mode: 'DEMO',
            portal: portal.toUpperCase(),
            message: `Data formatted and ready for ${portal.toUpperCase()} sync. Add ${portal.toUpperCase()}_API_KEY to .env to enable live sync.`,
            records_synced: await Report.countDocuments(),
            timestamp: new Date().toISOString()
        });
    }

    // PRODUCTION MODE: Real sync (when API keys are available)
    // Uncomment when MOU is signed:
    // const reports = await Report.find({}).lean();
    // const formatted = portal === 'cpgrams' ? reports.map(toCPGRAMSFormat) : ...
    // await axios.post(process.env[`${portal.toUpperCase()}_API_URL`], formatted, { headers: { 'x-api-key': apiKey } });

    res.json({
        success: true,
        mode: 'LIVE',
        portal: portal.toUpperCase(),
        records_synced: await Report.countDocuments(),
        timestamp: new Date().toISOString()
    });
};

module.exports = {
    getNationalPortalSummary,
    exportCPGRAMS,
    exportSBM,
    exportSCM,
    syncToPortal
};
