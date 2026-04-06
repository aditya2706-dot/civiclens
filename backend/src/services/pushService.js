/**
 * CivicLens — Web Push Notification Service
 *
 * HOW IT WORKS:
 * 1. Each authority officer opens the dashboard and clicks "Enable Notifications"
 * 2. Their browser registers a push subscription → stored in DB linked to their userId
 * 3. When a High severity report comes in for Ward 5 → we find the officer(s) for Ward 5
 *    → send a push notification directly to their phone/browser
 * 4. They see it even if the app is closed — like a WhatsApp notification
 *
 * ROUTING LOGIC:
 * - Match by ward AND/OR department
 * - If no specific match → fallback to all admins/supervisors
 * - One officer can have multiple subscriptions (phone + laptop)
 */

const webpush = require('web-push');
const User = require('../models/User');
const PushSubscription = require('../models/PushSubscription');

// Configure web-push with VAPID keys
webpush.setVapidDetails(
    process.env.VAPID_EMAIL || 'mailto:admin@civiclens.app',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

/**
 * Find all authority users responsible for a given ward/department
 * and send them a push notification.
 */
async function notifyOfficers({ ward, department, title, body, url = '/authority/dashboard', icon = '/favicon.ico' }) {
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
        console.warn('[Push] VAPID keys not configured. Skipping push notification.');
        return;
    }

    try {
        // Find responsible officers: match by ward OR department, fallback to all admins
        let officers = await User.find({
            role: { $in: ['authority', 'supervisor', 'admin'] },
            $or: [
                { ward: ward },
                { department: department },
            ]
        }).select('_id name ward department');

        // If no specific ward officers found, notify all admins (city-wide fallback)
        if (officers.length === 0) {
            officers = await User.find({
                role: { $in: ['admin', 'supervisor'] }
            }).select('_id name');
        }

        if (officers.length === 0) {
            console.log('[Push] No officers found to notify.');
            return;
        }

        const officerIds = officers.map(o => o._id);

        // Get all push subscriptions for those officers
        const subscriptions = await PushSubscription.find({
            userId: { $in: officerIds }
        });

        if (subscriptions.length === 0) {
            console.log('[Push] No push subscriptions found for matching officers. They need to enable notifications.');
            return;
        }

        const payload = JSON.stringify({
            title,
            body,
            icon,
            badge: '/favicon.ico',
            url,
            timestamp: Date.now(),
        });

        // Send to all matching subscriptions in parallel
        const results = await Promise.allSettled(
            subscriptions.map(sub =>
                webpush.sendNotification(
                    {
                        endpoint: sub.endpoint,
                        keys: { p256dh: sub.p256dh, auth: sub.auth }
                    },
                    payload,
                    { TTL: 86400 } // 24 hour TTL — deliver when device comes online
                ).catch(async (err) => {
                    // 410 Gone = subscription expired, clean it up
                    if (err.statusCode === 410) {
                        await PushSubscription.deleteOne({ _id: sub._id });
                        console.log(`[Push] Removed expired subscription for user ${sub.userId}`);
                    }
                    throw err;
                })
            )
        );

        const sent = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        console.log(`[Push] Sent ${sent} notifications, ${failed} failed. Ward: ${ward}, Dept: ${department}`);

    } catch (err) {
        console.error('[Push] Error sending push notifications:', err.message);
    }
}

/**
 * Send a High Severity alert to the responsible ward officer
 */
async function sendHighSeverityPush(report) {
    await notifyOfficers({
        ward: report.ward,
        department: report.department,
        title: `🚨 HIGH SEVERITY: ${report.category}`,
        body: `${report.ward || 'Unknown Ward'} — ${report.aiSummary?.substring(0, 80) || 'Immediate action required.'}`,
        url: '/authority/dashboard',
    });
}

/**
 * Send a general report notification
 */
async function sendNewReportPush(report) {
    await notifyOfficers({
        ward: report.ward,
        department: report.department,
        title: `📋 New ${report.category} Report`,
        body: `${report.ward || 'Unknown Ward'} — ${report.severity} severity`,
        url: '/authority/dashboard',
    });
}

module.exports = { notifyOfficers, sendHighSeverityPush, sendNewReportPush };
