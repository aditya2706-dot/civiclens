/**
 * CivicLens — Monthly Performance Report Generator
 * Generates a professional government-grade PDF report
 *
 * Route: GET /api/reports/monthly-pdf?month=4&year=2026
 * Access: Authority / Admin only
 */

const PDFDocument = require('pdfkit');
const Report = require('../models/Report');

const COLORS = {
    primary:   '#0D47A1',  // Deep Government Blue
    accent:    '#1B5E20',  // Official Green
    danger:    '#B71C1C',
    warning:   '#E65100',
    lightGray: '#F5F5F5',
    midGray:   '#9E9E9E',
    darkText:  '#212121',
};

function drawHorizontalLine(doc, y, color = '#E0E0E0') {
    doc.moveTo(50, y).lineTo(545, y).strokeColor(color).lineWidth(0.5).stroke();
}

function drawFilledRect(doc, x, y, w, h, color) {
    doc.rect(x, y, w, h).fill(color);
}

function slaStatus(report) {
    if (report.status === 'Resolved' && report.resolvedAt && report.deadline) {
        return report.resolvedAt <= report.deadline ? 'Met' : 'Breached';
    }
    if (report.deadline && new Date() > report.deadline && report.status !== 'Resolved') {
        return 'Overdue';
    }
    return 'Active';
}

const generateMonthlyPDF = async (req, res) => {
    try {
        const now = new Date();
        const month = parseInt(req.query.month) || now.getMonth() + 1;
        const year  = parseInt(req.query.year)  || now.getFullYear();

        const startDate = new Date(year, month - 1, 1);
        const endDate   = new Date(year, month, 0, 23, 59, 59);

        const monthName = startDate.toLocaleString('en-IN', { month: 'long' });

        // Fetch all reports for the month
        const reports = await Report.find({
            createdAt: { $gte: startDate, $lte: endDate }
        }).lean();

        // ── Compute KPIs ───────────────────────────────────────────────────
        const total      = reports.length;
        const resolved   = reports.filter(r => r.status === 'Resolved').length;
        const pending    = reports.filter(r => r.status === 'Pending').length;
        const inProgress = reports.filter(r => r.status === 'In Progress').length;
        const highSev    = reports.filter(r => r.severity === 'High').length;
        const overdue    = reports.filter(r => slaStatus(r) === 'Overdue').length;
        const slaMet     = reports.filter(r => slaStatus(r) === 'Met').length;
        const resRate    = total > 0 ? Math.round((resolved / total) * 100) : 0;
        const slaRate    = resolved > 0 ? Math.round((slaMet / resolved) * 100) : 0;

        // Category breakdown
        const catCounts = {};
        for (const r of reports) {
            catCounts[r.category] = (catCounts[r.category] || 0) + 1;
        }

        // Ward breakdown (top 5)
        const wardCounts = {};
        for (const r of reports) {
            if (r.ward) wardCounts[r.ward] = (wardCounts[r.ward] || 0) + 1;
        }
        const topWards = Object.entries(wardCounts).sort((a,b) => b[1]-a[1]).slice(0, 5);

        // Total estimated cost saved
        const totalCost = reports.reduce((sum, r) => sum + (r.estimatedCost || 0), 0);

        // ── Start PDF ──────────────────────────────────────────────────────
        const doc = new PDFDocument({ margin: 0, size: 'A4' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="CivicLens_${monthName}_${year}_Report.pdf"`);
        doc.pipe(res);

        // ── PAGE 1 ─────────────────────────────────────────────────────────

        // Header banner
        drawFilledRect(doc, 0, 0, 595, 110, COLORS.primary);
        doc.fillColor('white')
           .fontSize(22).font('Helvetica-Bold')
           .text('CIVICLENS', 50, 25)
           .fontSize(10).font('Helvetica')
           .text('AI-Powered Urban Civic Intelligence Platform', 50, 52)
           .fontSize(8)
           .text('Alwar Nagar Parishad  |  Rajasthan, India', 50, 66)
           .fontSize(9).font('Helvetica-Bold')
           .text(`MONTHLY PERFORMANCE REPORT — ${monthName.toUpperCase()} ${year}`, 50, 84);

        // Confidential badge
        drawFilledRect(doc, 430, 30, 115, 22, 'rgba(255,255,255,0.15)');
        doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
           .text('GOVERNMENT CONFIDENTIAL', 434, 36, { width: 108, align: 'center' });

        // Generated date
        doc.fillColor(COLORS.midGray).fontSize(7).font('Helvetica')
           .text(`Generated: ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}  |  CivicLens v2.0`, 50, 120);

        drawHorizontalLine(doc, 132, COLORS.primary);

        // Section: KPI Summary Cards
        doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold')
           .text('EXECUTIVE SUMMARY', 50, 145);
        drawHorizontalLine(doc, 162, '#BBDEFB');

        const kpis = [
            { label: 'Total Complaints', value: total,    color: COLORS.primary },
            { label: 'Resolved',         value: resolved, color: COLORS.accent  },
            { label: 'Pending',          value: pending,  color: COLORS.warning },
            { label: 'Critical Issues',  value: highSev,  color: COLORS.danger  },
        ];

        kpis.forEach((kpi, i) => {
            const x = 50 + i * 125;
            drawFilledRect(doc, x, 170, 118, 65, kpi.color + '15');
            doc.rect(x, 170, 118, 65).strokeColor(kpi.color + '40').lineWidth(1).stroke();
            doc.fillColor(kpi.color).fontSize(28).font('Helvetica-Bold')
               .text(String(kpi.value), x + 8, 183);
            doc.fillColor(COLORS.darkText).fontSize(8).font('Helvetica')
               .text(kpi.label, x + 8, 215, { width: 102 });
        });

        // Resolution & SLA rates
        const y2 = 250;
        drawFilledRect(doc, 50, y2, 240, 45, '#E8F5E9');
        doc.fillColor(COLORS.accent).fontSize(20).font('Helvetica-Bold')
           .text(`${resRate}%`, 60, y2 + 8);
        doc.fillColor(COLORS.darkText).fontSize(8).font('Helvetica')
           .text('Resolution Rate', 60, y2 + 32).text(`(${resolved} of ${total} resolved)`, 60, y2 + 42);

        drawFilledRect(doc, 305, y2, 240, 45, overdue > 0 ? '#FFEBEE' : '#E8F5E9');
        doc.fillColor(overdue > 0 ? COLORS.danger : COLORS.accent).fontSize(20).font('Helvetica-Bold')
           .text(`${overdue}`, 315, y2 + 8);
        doc.fillColor(COLORS.darkText).fontSize(8).font('Helvetica')
           .text('SLA Breach / Overdue Reports', 315, y2 + 32)
           .text(`SLA Compliance Rate: ${slaRate}%`, 315, y2 + 42);

        // Section: Category Breakdown
        const y3 = 315;
        doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold')
           .text('COMPLAINT CATEGORY ANALYSIS', 50, y3);
        drawHorizontalLine(doc, y3 + 16, '#BBDEFB');

        const catY = y3 + 26;
        const categories = Object.entries(catCounts).sort((a,b) => b[1]-a[1]);
        const maxCat = categories[0]?.[1] || 1;
        const barColors = ['#1565C0','#2E7D32','#E65100','#6A1B9A','#00695C','#AD1457','#37474F'];

        categories.slice(0, 7).forEach(([cat, count], i) => {
            const rowY = catY + i * 24;
            const barW = Math.max(4, (count / maxCat) * 300);
            drawFilledRect(doc, 150, rowY + 3, barW, 13, barColors[i % barColors.length] + 'CC');
            doc.fillColor(COLORS.darkText).fontSize(8).font('Helvetica')
               .text(cat, 50, rowY + 5, { width: 95 });
            doc.fillColor(COLORS.darkText).fontSize(8).font('Helvetica-Bold')
               .text(`${count} (${Math.round(count/total*100)}%)`, 458, rowY + 5);
        });

        const y4 = catY + Math.min(categories.length, 7) * 24 + 12;

        // Section: Ward Performance
        doc.fillColor(COLORS.primary).fontSize(11).font('Helvetica-Bold')
           .text('TOP WARDS BY COMPLAINT VOLUME', 50, y4);
        drawHorizontalLine(doc, y4 + 16, '#BBDEFB');

        // Table header
        const tableY = y4 + 24;
        drawFilledRect(doc, 50, tableY, 495, 18, COLORS.primary);
        doc.fillColor('white').fontSize(8).font('Helvetica-Bold')
           .text('Ward', 58, tableY + 5)
           .text('Complaints', 220, tableY + 5)
           .text('% of Total', 340, tableY + 5)
           .text('Priority', 450, tableY + 5);

        topWards.forEach(([ward, count], i) => {
            const rowBg = i % 2 === 0 ? '#FAFAFA' : 'white';
            drawFilledRect(doc, 50, tableY + 18 + i * 20, 495, 20, rowBg);
            const pct = Math.round(count / total * 100);
            const priority = pct > 25 ? 'HIGH' : pct > 15 ? 'MEDIUM' : 'NORMAL';
            const pColor = priority === 'HIGH' ? COLORS.danger : priority === 'MEDIUM' ? COLORS.warning : COLORS.accent;

            doc.fillColor(COLORS.darkText).fontSize(8).font('Helvetica')
               .text(ward, 58, tableY + 23 + i * 20)
               .text(String(count), 220, tableY + 23 + i * 20)
               .text(`${pct}%`, 340, tableY + 23 + i * 20);
            doc.fillColor(pColor).fontSize(7).font('Helvetica-Bold')
               .text(priority, 450, tableY + 23 + i * 20);
            drawHorizontalLine(doc, tableY + 38 + i * 20, '#E0E0E0');
        });

        const y5 = tableY + 18 + topWards.length * 20 + 20;

        // Budget row
        if (totalCost > 0) {
            drawFilledRect(doc, 50, y5, 495, 30, '#E3F2FD');
            doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold')
               .text(`💰  Estimated Infrastructure Cost This Month: ₹${totalCost.toLocaleString('en-IN')}`, 58, y5 + 10);
        }

        // ── Footer ──────────────────────────────────────────────────────────
        drawFilledRect(doc, 0, 780, 595, 60, COLORS.primary);
        doc.fillColor('white').fontSize(7).font('Helvetica')
           .text('This report is auto-generated by CivicLens AI Platform  |  For official use only  |  Alwar Nagar Parishad', 50, 790, { width: 495, align: 'center' })
           .text(`Report Period: 01 ${monthName} ${year} – ${endDate.getDate()} ${monthName} ${year}  |  CivicLens © ${year}`, 50, 806, { width: 495, align: 'center' })
           .text('civiclens.vercel.app  |  Powered by Google Gemini AI', 50, 820, { width: 495, align: 'center' });

        // ── PAGE 2: Full Report Log ────────────────────────────────────────
        if (reports.length > 0) {
            doc.addPage({ margin: 0, size: 'A4' });
            drawFilledRect(doc, 0, 0, 595, 50, COLORS.primary);
            doc.fillColor('white').fontSize(14).font('Helvetica-Bold')
               .text(`DETAILED REPORT LOG — ${monthName.toUpperCase()} ${year}`, 50, 16);
            doc.fillColor('white').fontSize(8).font('Helvetica')
               .text(`Total: ${total} complaints  |  Page 2 of 2`, 50, 36);

            // Table
            const cols = { id: 50, cat: 120, sev: 220, ward: 275, status: 360, sla: 455 };
            const hY = 60;
            drawFilledRect(doc, 50, hY, 495, 18, '#1A237E');
            doc.fillColor('white').fontSize(7).font('Helvetica-Bold')
               .text('ID',       cols.id,     hY + 6)
               .text('Category', cols.cat,    hY + 6)
               .text('Severity', cols.sev,    hY + 6)
               .text('Ward',     cols.ward,   hY + 6)
               .text('Status',   cols.status, hY + 6)
               .text('SLA',      cols.sla,    hY + 6);

            let rY = hY + 18;
            const pageH = 740;

            reports.slice(0, 60).forEach((r, i) => {
                if (rY > pageH) return; // Don't overflow page
                const bg = i % 2 === 0 ? '#FAFAFA' : 'white';
                drawFilledRect(doc, 50, rY, 495, 16, bg);

                const sla = slaStatus(r);
                const slaColor = sla === 'Met' ? COLORS.accent : sla === 'Overdue' ? COLORS.danger : COLORS.midGray;
                const sevColor = r.severity === 'High' ? COLORS.danger : r.severity === 'Medium' ? COLORS.warning : COLORS.accent;

                doc.fillColor(COLORS.darkText).fontSize(6.5).font('Helvetica')
                   .text(r._id.toString().slice(-8).toUpperCase(), cols.id,     rY + 5)
                   .text(r.category || '-',                         cols.cat,    rY + 5)
                   .text(r.ward?.substring(0, 15) || 'N/A',        cols.ward,   rY + 5)
                   .text(r.status || '-',                           cols.status, rY + 5);

                doc.fillColor(sevColor).fontSize(6.5).font('Helvetica-Bold')
                   .text(r.severity || '-', cols.sev, rY + 5);

                doc.fillColor(slaColor).fontSize(6.5).font('Helvetica-Bold')
                   .text(sla, cols.sla, rY + 5);

                rY += 16;
            });

            if (reports.length > 60) {
                doc.fillColor(COLORS.midGray).fontSize(8).font('Helvetica')
                   .text(`... and ${reports.length - 60} more reports. Download full CSV from the CivicLens dashboard.`, 50, rY + 10);
            }

            // Footer pg2
            drawFilledRect(doc, 0, 780, 595, 60, COLORS.primary);
            doc.fillColor('white').fontSize(7).font('Helvetica')
               .text('CivicLens AI Platform  |  Alwar Nagar Parishad  |  CONFIDENTIAL', 50, 795, { width: 495, align: 'center' })
               .text('civiclens.vercel.app', 50, 812, { width: 495, align: 'center' });
        }

        doc.end();

    } catch (err) {
        console.error('[PDF] Error generating report:', err.message);
        res.status(500).json({ message: 'Error generating PDF report', error: err.message });
    }
};

module.exports = { generateMonthlyPDF };
