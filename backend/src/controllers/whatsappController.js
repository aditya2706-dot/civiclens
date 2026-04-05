/**
 * CivicLens WhatsApp Bot Controller
 * Uses Meta WhatsApp Business Cloud API (Free)
 *
 * SETUP STEPS FOR USER:
 * 1. Go to https://developers.facebook.com → Create App → Business → WhatsApp
 * 2. Add a test phone number in WhatsApp > API Setup
 * 3. Get your WHATSAPP_TOKEN and WHATSAPP_PHONE_NUMBER_ID from the dashboard
 * 4. Add to backend/.env:
 *      WHATSAPP_TOKEN=your_token
 *      WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
 *      WHATSAPP_VERIFY_TOKEN=civiclens_bot_2024   (any secret string you pick)
 * 5. Set webhook URL in Meta dashboard to: https://your-backend.onrender.com/api/whatsapp/webhook
 * 6. Subscribe to: messages
 */

const axios = require('axios');
const Report = require('../models/Report');
const { analyzeImageGemini, getDepartmentForCategory } = require('../services/aiService');

const WHATSAPP_API = 'https://graph.facebook.com/v19.0';
const TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'civiclens_bot_2024';

// Track user sessions (in-memory, fine for MVP. Use Redis for production)
const userSessions = {};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function sendMessage(to, text) {
    if (!TOKEN || !PHONE_NUMBER_ID) {
        console.warn('[WhatsApp] Credentials not configured. Message not sent.');
        return;
    }
    try {
        await axios.post(`${WHATSAPP_API}/${PHONE_NUMBER_ID}/messages`, {
            messaging_product: 'whatsapp',
            to,
            type: 'text',
            text: { body: text }
        }, {
            headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('[WhatsApp] Send error:', err.response?.data || err.message);
    }
}

async function downloadMediaAsBase64(mediaId) {
    // Step 1: Get the media URL
    const urlRes = await axios.get(`${WHATSAPP_API}/${mediaId}`, {
        headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const mediaUrl = urlRes.data.url;

    // Step 2: Download the actual image
    const imageRes = await axios.get(mediaUrl, {
        responseType: 'arraybuffer',
        headers: { Authorization: `Bearer ${TOKEN}` }
    });

    const base64 = Buffer.from(imageRes.data).toString('base64');
    const mimeType = imageRes.headers['content-type'] || 'image/jpeg';
    return { base64, mimeType };
}

// ─── Webhook Verification (GET) ──────────────────────────────────────────────

const verifyWebhook = (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('[WhatsApp] Webhook verified ✅');
        res.status(200).send(challenge);
    } else {
        console.error('[WhatsApp] Webhook verification failed ❌');
        res.status(403).send('Forbidden');
    }
};

// ─── Incoming Message Handler (POST) ─────────────────────────────────────────

const handleWebhook = async (req, res) => {
    // Always respond 200 immediately to WhatsApp (prevents retries)
    res.status(200).send('OK');

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        const entry = body.entry?.[0];
        const changes = entry?.changes?.[0];
        const value = changes?.value;
        const messages = value?.messages;

        if (!messages || messages.length === 0) return;

        const msg = messages[0];
        const from = msg.from; // Citizen's WhatsApp number
        const msgType = msg.type;

        // ── IMAGE received → Run AI Analysis + Create Report ──
        if (msgType === 'image') {
            await sendMessage(from,
                '📸 *Photo received!*\n\nAnalyzing your image with AI... Please wait a moment.'
            );

            try {
                const mediaId = msg.image.id;
                const caption = msg.image.caption || '';

                // Download image and convert to base64
                const { base64, mimeType } = await downloadMediaAsBase64(mediaId);

                // Run Gemini AI analysis
                const aiAnalysis = await analyzeImageGemini(base64, mimeType, caption || 'Reported via WhatsApp');

                const category = aiAnalysis.suggestedCategory || 'Other';
                const severity = aiAnalysis.computedSeverity || 'Medium';
                const summary = aiAnalysis.summary || 'Issue reported via WhatsApp';
                const department = getDepartmentForCategory(category);

                // SLA deadline
                let hours = severity === 'High' ? 24 : severity === 'Low' ? 72 : 48;
                const deadline = new Date();
                deadline.setHours(deadline.getHours() + hours);

                // Generate OTP
                const resolutionOTP = Math.floor(1000 + Math.random() * 9000).toString();

                // Create the report
                const report = await Report.create({
                    imageUrl: `data:${mimeType};base64,${base64}`,
                    category,
                    description: caption || `Reported via WhatsApp by ${from}`,
                    aiSummary: summary,
                    severity,
                    department,
                    ward: 'WhatsApp Report',
                    nearbyLandmark: caption || '',
                    deadline,
                    resolutionOTP,
                    isAnonymous: true,
                    detectedObjects: aiAnalysis.detectedObjects || [],
                    location: { address: caption || 'Location not provided' }
                });

                // Save session for follow-up location message
                userSessions[from] = { reportId: report._id, otp: resolutionOTP, step: 'awaiting_location' };

                const severityEmoji = severity === 'High' ? '🔴' : severity === 'Medium' ? '🟡' : '🟢';

                await sendMessage(from,
                    `✅ *Report Filed Successfully!*\n\n` +
                    `📋 *Category:* ${category}\n` +
                    `${severityEmoji} *Severity:* ${severity}\n` +
                    `📝 *AI Summary:* ${summary}\n\n` +
                    `🔐 *Your Resolution PIN: ${resolutionOTP}*\n` +
                    `_Keep this safe! The worker must enter this PIN when they resolve your issue._\n\n` +
                    `📍 *One more thing:* Reply with your *location* or the nearest landmark so we can route it correctly.`
                );

            } catch (aiError) {
                console.error('[WhatsApp] AI Analysis failed:', aiError.message);
                await sendMessage(from,
                    '❌ Sorry, we couldn\'t analyze your image. Please try again with a clearer photo.'
                );
            }

        // ── TEXT received → Handle greetings + location follow-up ──
        } else if (msgType === 'text') {
            const text = msg.text.body.trim().toLowerCase();
            const session = userSessions[from];

            // Location follow-up for existing report
            if (session?.step === 'awaiting_location') {
                await Report.findByIdAndUpdate(session.reportId, {
                    'location.address': msg.text.body,
                    nearbyLandmark: msg.text.body
                });
                delete userSessions[from];
                await sendMessage(from,
                    `📍 Location *"${msg.text.body}"* has been added to your report.\n\n` +
                    `Thank you for helping keep Alwar clean! 🏙️\n` +
                    `Track your report at: *civiclens.vercel.app*`
                );

            // Greeting / Help
            } else if (text.includes('hi') || text.includes('hello') || text.includes('help') || text === 'start') {
                await sendMessage(from,
                    `👋 *Welcome to CivicLens!*\n\n` +
                    `I'm your civic issue reporting assistant for *Alwar Nagar Parishad*.\n\n` +
                    `📸 *How to report an issue:*\n` +
                    `Simply send a *photo* of the problem (pothole, garbage, broken streetlight, etc.)\n\n` +
                    `Our AI will automatically:\n` +
                    `✅ Identify the issue\n` +
                    `✅ Assess severity\n` +
                    `✅ Route it to the right department\n` +
                    `✅ Give you a Resolution PIN\n\n` +
                    `_No app download needed. Just send a photo!_ 🚀`
                );

            // Status check
            } else if (text.includes('status') || text.includes('track')) {
                await sendMessage(from,
                    `🔍 *Track your reports here:*\n` +
                    `civiclens.vercel.app/reports\n\n` +
                    `Or share your *Report ID* and I'll check it for you.`
                );

            // Unknown
            } else {
                await sendMessage(from,
                    `📸 To report a civic issue, simply *send a photo!*\n\n` +
                    `Type *"help"* for instructions.`
                );
            }
        }

    } catch (err) {
        console.error('[WhatsApp] Webhook error:', err.message);
    }
};

module.exports = { verifyWebhook, handleWebhook };
