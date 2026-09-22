const axios = require('axios');

/**
 * Sends an SMS using the Android SMS Gateway via Cloud API
 *
 * @param {string} to - Destination phone number (+91...)
 * @param {string} category - Issue category
 * @param {string} status - New status (In Progress, Resolved)
 * @param {string} reportId - The report ID suffix
 */
const sendReportStatusSMS = async (to, category, status, reportId) => {
    try {
        const { SMSGATE_URL, SMSGATE_USER, SMSGATE_PASS } = process.env;

        if (!SMSGATE_URL || !SMSGATE_USER || !SMSGATE_PASS) {
            console.log('⚠️ [SMSGATE Service] Credentials missing in .env. SMS disabled.');
            return;
        }

        // Format short report ID for UI string
        const shortId = reportId.toString().slice(-6).toUpperCase();
        
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
        const reportLink = `${frontendUrl}/reports/${reportId}`;
        
        let customMessage = '';
        if (status === 'In Progress') {
            customMessage = `🚧 CivicLens Update\n\nYour ${category} report (#${shortId}) is now marked as "In Progress"!\n\nOfficials are working on it. Track live status or add comments here:\n👉 ${reportLink}`;
        } else if (status === 'Resolved') {
            customMessage = `✅ CivicLens Success\n\nYour ${category} report (#${shortId}) has been resolved!\n\nThank you for keeping our city clean. View the resolution proof photo here:\n👉 ${reportLink}`;
        } else {
            customMessage = `🔔 CivicLens Update\n\nYour ${category} report (#${shortId}) status changed to "${status}".\n\nView details:\n👉 ${reportLink}`;
        }

        // Format phone to standard E.164 if missing '+'
        const formattedPhone = to.startsWith('+') ? to : `+91${to}`; // Default to India +91

        console.log(`📡 [SMSGATE] Sending request to Android Device API for ${formattedPhone}...`);
        
        // Android SMS Gateway POST API format
        const authHeader = `Basic ${Buffer.from(`${SMSGATE_USER}:${SMSGATE_PASS}`).toString('base64')}`;
        
        const response = await axios.post(
            SMSGATE_URL, // e.g. https://api.sms-gate.app/3rdparty/v1/message
            {
                message: customMessage,
                phoneNumbers: [formattedPhone]
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': authHeader
                }
            }
        );

        if (response.status >= 200 && response.status < 300) {
            console.log(`✅ [SMSGATE] Successfully sent SMS to ${formattedPhone}`);
        } else {
            console.error(`❌ [SMSGATE] Attempt failed: HTTP ${response.status}`);
        }
        
        return response.data;

    } catch (error) {
        console.error('❌ [SMSGATE Service Error] Failed to route SMS through Android Gateway:', error.response?.data || error.message);
    }
};

module.exports = {
    sendReportStatusSMS
};
