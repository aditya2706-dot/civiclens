const axios = require('axios');
const FormData = require('form-data');
const puppeteer = require('puppeteer');
const Report = require('../models/Report');

const CLEAN_ALWAR_URL = 'https://cleanalwar.in/complaint-request.php';

function mapCategory(ourCategory) {
    switch (ourCategory) {
        case 'Garbage':
        case 'Litter':
        case 'Open Dump':
        case 'Sewage': // Mapping sewage here if no better fit
            return 'कचरा / सफाई व्यवस्था (Garbage / Sanitation)';
        case 'Streetlight':
            return 'स्ट्रीट लाइट (Street Light)';
        case 'Road':
        case 'Pothole':
            return 'सड़क / गड्ढे (Road / Potholes)';
        default:
            return 'अन्य (Other)';
    }
}

async function updateReportStatus(reportId, status, refId = null, errorMsg = null) {
    try {
        await Report.findByIdAndUpdate(reportId, {
            cleanAlwarSyncStatus: status,
            cleanAlwarReferenceId: refId,
            cleanAlwarSyncError: errorMsg,
            lastSyncedAt: new Date()
        });
        console.log(`[CleanAlwarBridge] Report ${reportId} synced: ${status} (Ref: ${refId})`);
    } catch (err) {
        console.error(`[CleanAlwarBridge] Error updating report status for ${reportId}:`, err.message);
    }
}

async function syncReportToCleanAlwar(report) {
    try {
        console.log(`[CleanAlwarBridge] Starting sync for report ${report._id}`);
        const category = mapCategory(report.category);
        const name = report.userId?.name || 'Concerned Citizen';
        const mobile = report.reporterPhone || '0000000000'; // Fallback if missing
        const wardNo = report.ward || 'Unknown Ward';
        const locationArea = report.location?.address || 'Unknown Area';
        const complaintDetails = report.description || `Reported via CivicLens. Category: ${report.category}`;

        // Fetch the image as a buffer
        let imageBuffer = null;
        try {
            if (report.imageUrl && !report.imageUrl.includes('example.com')) {
                const imgResponse = await axios.get(report.imageUrl, { responseType: 'arraybuffer' });
                imageBuffer = Buffer.from(imgResponse.data, 'binary');
            }
        } catch (imgErr) {
            console.error(`[CleanAlwarBridge] Failed to fetch image for report ${report._id}:`, imgErr.message);
        }

        // ============================================
        // MODE A: Direct HTTP Multipart POST
        // ============================================
        try {
            console.log(`[CleanAlwarBridge] Attempting Mode A (Axios POST)...`);
            const formData = new FormData();
            formData.append('name', name);
            formData.append('contact', mobile);
            formData.append('ward_no', wardNo.replace(/\D/g, '') || '1'); // Extract digits or default
            formData.append('complaint_area', category);
            formData.append('location', locationArea);
            formData.append('complaint', complaintDetails);
            formData.append('declaration', 'Yes'); // Checkbox value

            if (imageBuffer) {
                formData.append('fileName', imageBuffer, {
                    filename: 'complaint.jpg',
                    contentType: 'image/jpeg',
                });
            }

            const response = await axios.post(CLEAN_ALWAR_URL, formData, {
                headers: formData.getHeaders(),
                timeout: 10000 // 10 second timeout
            });

            // Parse response for success / reference ID. CleanAlwar might just return HTML.
            // This is a naive check; you might need to adjust based on actual portal response.
            if (response.status === 200 && response.data.includes('success')) {
                // Try to extract reference ID if present in the HTML response
                let refId = null;
                const match = response.data.match(/Reference ID:\s*([A-Z0-9]+)/i);
                if (match && match[1]) {
                    refId = match[1];
                } else {
                    refId = 'SYNCED_UNKNOWN_ID'; // Placeholder if ID not found but success detected
                }
                
                await updateReportStatus(report._id, 'SYNCED', refId);
                return; // Success, stop here
            } else {
                throw new Error("Mode A failed: Response did not indicate success.");
            }
        } catch (modeAError) {
            console.warn(`[CleanAlwarBridge] Mode A failed: ${modeAError.message}. Falling back to Mode B.`);
        }

        // ============================================
        // MODE B: Headless Puppeteer Fallback
        // ============================================
        console.log(`[CleanAlwarBridge] Attempting Mode B (Puppeteer)...`);
        let browser = null;
        try {
            browser = await puppeteer.launch({
                headless: "new",
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage'
                ]
            });
            const page = await browser.newPage();
            
            // Speed up loading
            await page.setRequestInterception(true);
            page.on('request', (req) => {
                if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
                    req.abort();
                } else {
                    req.continue();
                }
            });

            await page.goto(CLEAN_ALWAR_URL, { waitUntil: 'networkidle2', timeout: 30000 });

            // Fill form
            await page.type('input[name="name"]', name);
            
            const contactInput = await page.$('input[name="contact"]') || await page.$('input[name="mobile"]');
            if (contactInput) await contactInput.type(mobile);
            
            const wardSelect = await page.$('select[name="ward_no"]');
            if (wardSelect) await page.select('select[name="ward_no"]', wardNo.replace(/\D/g, '') || '1');
            
            const complaintSelect = await page.$('select[name="complaint_area"]') || await page.$('select[name="complaint_type"]');
            if (complaintSelect) {
                // Get the actual name property
                const selectName = await page.evaluate(el => el.name, complaintSelect);
                await page.select(`select[name="${selectName}"]`, category);
            }
            
            const locationInput = await page.$('textarea[name="location"]') || await page.$('input[name="location_area"]');
            if (locationInput) await locationInput.type(locationArea);
            
            const complaintInput = await page.$('textarea[name="complaint"]') || await page.$('textarea[name="message"]');
            if (complaintInput) await complaintInput.type(complaintDetails);

            // Handle file upload if we have an image
            if (imageBuffer) {
                // Puppeteer requires a local file for file inputs.
                const fs = require('fs');
                const os = require('os');
                const path = require('path');
                const tempFilePath = path.join(os.tmpdir(), `complaint_${report._id}.jpg`);
                fs.writeFileSync(tempFilePath, imageBuffer);
                
                const fileInput = await page.$('input[type="file"][name="fileName"]') || await page.$('input[type="file"][name="complaint_image"]');
                if (fileInput) {
                    await fileInput.uploadFile(tempFilePath);
                }
                
                // Cleanup temp file later
                setTimeout(() => fs.unlink(tempFilePath, () => {}), 5000);
            }

            // Check declaration
            await page.evaluate(() => {
                const checkbox = document.querySelector('input[type="checkbox"]');
                if (checkbox) checkbox.checked = true;
            });

            // Submit form
            await Promise.all([
                page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 45000 }),
                page.click('button[type="submit"], input[type="submit"]')
            ]);

            // Check result page
            const pageContent = await page.content();
            if (pageContent.includes('success') || pageContent.includes('Thank you')) {
                 let refId = null;
                 const match = pageContent.match(/Reference ID:\s*([A-Z0-9]+)/i);
                 if (match && match[1]) {
                     refId = match[1];
                 } else {
                     refId = 'SYNCED_PUPPETEER'; 
                 }
                 await updateReportStatus(report._id, 'SYNCED', refId);
            } else {
                 throw new Error("Mode B failed: Success message not found after submission.");
            }

        } catch (modeBError) {
            console.error(`[CleanAlwarBridge] Mode B failed:`, modeBError.message);
            await updateReportStatus(report._id, 'FAILED', null, `Both modes failed. Last error: ${modeBError.message}`);
        } finally {
            if (browser) {
                await browser.close();
            }
        }

    } catch (error) {
        console.error(`[CleanAlwarBridge] Critical error syncing report ${report._id}:`, error);
        await updateReportStatus(report._id, 'FAILED', null, error.message);
    }
}

module.exports = {
    syncReportToCleanAlwar
};
