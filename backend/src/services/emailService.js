/**
 * CivicLens — Email Notification Service
 * Uses Nodemailer with Gmail (or any SMTP provider)
 *
 * SETUP: Add to backend/.env:
 *   EMAIL_USER=your_gmail@gmail.com
 *   EMAIL_PASS=your_gmail_app_password   (Not your login password — generate App Password in Google Account)
 *   AUTHORITY_EMAIL=ward_officer@alwar.gov.in  (Who receives High severity alerts)
 *
 * Gmail App Password: Google Account → Security → 2-Step Verification → App Passwords
 */

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// ─── Email Templates ──────────────────────────────────────────────────────────

function getHighSeverityAlertHTML(report) {
    const mapsLink = report.location?.lat
        ? `https://maps.google.com/?q=${report.location.lat},${report.location.lng}`
        : null;

    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"></head>
    <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 0;">
        <div style="max-width: 560px; margin: 24px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #B71C1C, #D32F2F); padding: 24px 28px;">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <span style="font-size: 28px;">🚨</span>
                    <div>
                        <h1 style="color: white; margin: 0; font-size: 18px; font-weight: 800;">HIGH SEVERITY ALERT</h1>
                        <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0 0; font-size: 12px;">CivicLens — Alwar Nagar Parishad</p>
                    </div>
                </div>
            </div>

            <!-- Body -->
            <div style="padding: 28px;">
                <p style="color: #333; font-size: 14px; margin: 0 0 20px 0;">
                    A <strong style="color: #B71C1C;">HIGH SEVERITY</strong> civic issue has been reported and requires your <strong>immediate attention</strong>.
                </p>

                <!-- Details Table -->
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    ${[
                        ['Category', report.category],
                        ['Ward', report.ward || 'Not assigned'],
                        ['Landmark', report.nearbyLandmark || '—'],
                        ['AI Summary', report.aiSummary || report.description || '—'],
                        ['SLA Deadline', report.deadline ? new Date(report.deadline).toLocaleString('en-IN') : '48 hours'],
                        ['Report ID', report._id?.toString().slice(-8).toUpperCase()],
                    ].map(([label, value]) => `
                        <tr>
                            <td style="padding: 8px 12px; background: #f9f9f9; border-radius: 6px; font-size: 12px; color: #666; font-weight: 600; width: 35%; border-bottom: 4px solid white;">${label}</td>
                            <td style="padding: 8px 12px; background: #f9f9f9; font-size: 13px; color: #212121; border-bottom: 4px solid white;">${value}</td>
                        </tr>
                    `).join('')}
                </table>

                <!-- CTA Buttons -->
                <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
                    <a href="${process.env.FRONTEND_URL || 'https://civiclens.vercel.app'}/authority/dashboard"
                       style="background: #1565C0; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">
                        → Open Dashboard
                    </a>
                    ${mapsLink ? `<a href="${mapsLink}" style="background: #2E7D32; color: white; padding: 12px 20px; border-radius: 8px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block;">📍 View on Map</a>` : ''}
                </div>

                <p style="color: #999; font-size: 11px; border-top: 1px solid #eee; padding-top: 16px; margin: 0;">
                    This is an automated alert from CivicLens AI Platform. SLA deadline: ${report.deadline ? new Date(report.deadline).toLocaleString('en-IN') : '48 hours from submission'}.
                    <br>Do not reply to this email.
                </p>
            </div>
        </div>
    </body>
    </html>`;
}

// ─── Exported Functions ───────────────────────────────────────────────────────

/**
 * Send High Severity alert email to authority officers
 */
async function sendHighSeverityAlert(report) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('[Email] Credentials not configured. Alert not sent.');
        return;
    }

    const to = process.env.AUTHORITY_EMAIL || process.env.EMAIL_USER;

    try {
        await transporter.sendMail({
            from: `"CivicLens Alert System" <${process.env.EMAIL_USER}>`,
            to,
            subject: `🚨 HIGH SEVERITY: ${report.category} reported in ${report.ward || 'Alwar'} — Immediate Action Required`,
            html: getHighSeverityAlertHTML(report),
        });
        console.log(`[Email] High severity alert sent to ${to}`);
    } catch (err) {
        console.error('[Email] Failed to send alert:', err.message);
    }
}

/**
 * Send resolution confirmation email to citizen (if they registered with email)
 */
async function sendResolutionEmail(citizenEmail, report) {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !citizenEmail) return;
    try {
        await transporter.sendMail({
            from: `"CivicLens — Alwar Nagar Parishad" <${process.env.EMAIL_USER}>`,
            to: citizenEmail,
            subject: `✅ Your civic issue has been resolved — ${report.category}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 32px;">
                <h2 style="color: #1B5E20;">✅ Issue Resolved!</h2>
                <p>Dear Citizen,</p>
                <p>The <strong>${report.category}</strong> issue you reported in <strong>${report.ward || 'your area'}</strong> has been <strong>officially resolved</strong> by Alwar Nagar Parishad.</p>
                <p style="color: #555;">This was resolved on <strong>${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}</strong>.</p>
                <p style="color: #555;">Thank you for helping keep Alwar clean and safe! You have earned <strong>50 Civic Points</strong>.</p>
                <a href="${process.env.FRONTEND_URL || 'https://civiclens.vercel.app'}/reports" style="background: #1B5E20; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; margin-top: 16px;">View My Reports →</a>
                <p style="color: #aaa; font-size: 11px; margin-top: 24px;">CivicLens — Alwar Nagar Parishad | civiclens.vercel.app</p>
            </div>`
        });
    } catch (err) {
        console.error('[Email] Resolution email failed:', err.message);
    }
}

module.exports = { sendHighSeverityAlert, sendResolutionEmail };
