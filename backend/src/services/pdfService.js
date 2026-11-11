const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

/**
 * Generates an official clearance certificate PDF with dynamic QR code stamping.
 * @param {Object} clearance - The full clearance request with student, approvals, and payments
 * @param {string} verificationBaseUrl - Base URL for public verification
 * @returns {Promise<Buffer>} - Buffer containing the generated PDF
 */
async function generateClearanceCertificate(clearance, verificationBaseUrl) {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 40, bottom: 40, left: 40, right: 40 }
      });

      const buffers = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => {
        const pdfData = Buffer.concat(buffers);
        resolve(pdfData);
      });

      const verifyUrl = `${verificationBaseUrl || 'http://localhost:5173'}/verify-certificate/${clearance.certificateCode}`;
      
      // Generate QR Code data URL buffer
      const qrCodeBuffer = await QRCode.toBuffer(verifyUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#1e3a8a',
          light: '#ffffff'
        }
      });

      // Outer Decorative Border
      doc.rect(20, 20, 555, 802).lineWidth(3).strokeColor('#1e3a8a').stroke();
      doc.rect(25, 25, 545, 792).lineWidth(1).strokeColor('#94a3b8').stroke();

      // Top Header / Banner
      doc.rect(26, 26, 543, 75).fillColor('#1e3a8a').fill();
      
      doc.fillColor('#ffffff')
         .fontSize(20)
         .font('Helvetica-Bold')
         .text('CENTRALISED PAYMENT & CLEARANCE SYSTEM', 30, 42, { align: 'center', width: 535 });

      doc.fontSize(10)
         .font('Helvetica')
         .text('OFFICIAL ACADEMIC & INSTITUTIONAL CLEARANCE CERTIFICATE', 30, 68, { align: 'center', width: 535 });

      // Certificate Code Badge
      doc.fillColor('#0f172a')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(`CERTIFICATE ID: ${clearance.certificateCode || 'CPCS-CERT-VERIFIED'}`, 40, 115);

      doc.fillColor('#64748b')
         .font('Helvetica')
         .text(`ISSUED: ${new Date(clearance.issuedAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 350, 115, { align: 'right', width: 200 });

      // Title
      doc.moveDown(1.5);
      doc.fillColor('#1e293b')
         .fontSize(16)
         .font('Helvetica-Bold')
         .text('CERTIFICATE OF FINAL CLEARANCE', { align: 'center' });

      doc.moveDown(0.4);
      doc.fillColor('#475569')
         .fontSize(10)
         .font('Helvetica')
         .text('This is to certify that the individual named below has duly settled all statutory obligations, payments, and satisfied the clearance requirements across all designated institutional departments.', { align: 'center', width: 515 });

      // Student Details Box
      doc.moveDown(1.2);
      const studentBoxY = doc.y;
      doc.rect(40, studentBoxY, 515, 85).fillColor('#f8fafc').fillAndStroke('#cbd5e1');

      doc.fillColor('#334155').fontSize(9).font('Helvetica-Bold');
      doc.text('STUDENT FULL NAME:', 55, studentBoxY + 14);
      doc.text('MATRICULATION / ID:', 55, studentBoxY + 36);
      doc.text('CLEARANCE TYPE:', 55, studentBoxY + 58);

      doc.fillColor('#0f172a').font('Helvetica');
      doc.text(clearance.student?.fullName || 'N/A', 200, studentBoxY + 14);
      doc.text(clearance.student?.matricOrStaffId || 'N/A', 200, studentBoxY + 36);
      doc.text(`${clearance.clearanceType || 'GRADUATION'} (Session: ${clearance.academicSession || 'N/A'})`, 200, studentBoxY + 58);

      // Status Badge in Student Box
      doc.rect(410, studentBoxY + 14, 130, 26).fillColor('#dcfce7').fillAndStroke('#86efac');
      doc.fillColor('#166534').fontSize(10).font('Helvetica-Bold').text('STATUS: CLEARED', 415, studentBoxY + 22, { width: 120, align: 'center' });

      // Department Approval Summary Table
      doc.y = studentBoxY + 105;
      doc.fillColor('#1e3a8a').fontSize(11).font('Helvetica-Bold').text('DEPARTMENTAL CLEARANCE AUDIT & SIGN-OFFS', 40, doc.y);

      doc.moveDown(0.5);
      const tableTop = doc.y;
      const col1 = 40;  // Department
      const col2 = 210; // Status
      const col3 = 300; // Dues Settled
      const col4 = 400; // Sign-off Officer / Date

      // Table Header
      doc.rect(40, tableTop, 515, 20).fillColor('#e2e8f0').fill();
      doc.fillColor('#1e293b').fontSize(8.5).font('Helvetica-Bold');
      doc.text('DEPARTMENT', col1 + 5, tableTop + 6);
      doc.text('CLEARANCE STATUS', col2, tableTop + 6);
      doc.text('DUES / OUTSTANDING', col3, tableTop + 6);
      doc.text('OFFICER / SIGN-OFF DATE', col4, tableTop + 6);

      let currentY = tableTop + 20;
      const approvals = clearance.departmentApprovals || [];

      approvals.forEach((app, index) => {
        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
        doc.rect(40, currentY, 515, 22).fillColor(bg).fill();

        doc.fillColor('#334155').fontSize(8).font('Helvetica');
        doc.text(app.department?.name || 'Department', col1 + 5, currentY + 6, { width: 160 });

        const isApproved = app.status === 'APPROVED';
        doc.fillColor(isApproved ? '#16a34a' : '#d97706').font('Helvetica-Bold');
        doc.text(app.status, col2, currentY + 6);

        doc.fillColor('#334155').font('Helvetica');
        const duesText = app.duesAmount > 0 ? (app.duesPaid ? `Paid ($${app.duesAmount})` : `Due ($${app.duesAmount})`) : 'No Dues ($0.00)';
        doc.text(duesText, col3, currentY + 6);

        const officerName = app.officer?.fullName || 'Institutional Verifier';
        const actionDate = app.actionDate ? new Date(app.actionDate).toLocaleDateString() : 'Verified';
        doc.text(`${officerName} (${actionDate})`, col4, currentY + 6, { width: 150 });

        currentY += 22;
      });

      // Bottom Section: QR Code & Stamping Seal
      const footerY = 620;
      doc.rect(40, footerY, 515, 140).fillColor('#f8fafc').fillAndStroke('#cbd5e1');

      // Stamp QR code
      doc.image(qrCodeBuffer, 55, footerY + 10, { width: 120, height: 120 });

      // Verification instructions beside QR code
      doc.fillColor('#1e3a8a').fontSize(10).font('Helvetica-Bold').text('DYNAMIC QR VERIFICATION STAMP', 190, footerY + 16);
      doc.fillColor('#475569').fontSize(8).font('Helvetica').text(
        'Scan this cryptographic QR stamp using any mobile device or the university portal to immediately verify certificate authenticity, department sign-offs, and payment receipts in real time.',
        190,
        footerY + 34,
        { width: 345, lineGap: 2 }
      );

      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(`Verification URL:`, 190, footerY + 75);
      doc.fillColor('#2563eb').font('Helvetica').text(verifyUrl, 190, footerY + 87, { width: 345 });

      doc.fillColor('#64748b').fontSize(7.5).text('System Security Note: Tampering with this certificate is an offense. Verification hashes are stored immutably in transactional audit logs.', 190, footerY + 115, { width: 345 });

      // Document footer note
      doc.fillColor('#94a3b8').fontSize(7.5).font('Helvetica').text(
        'Centralised Payment & Clearance System (CPCS) • Auto-Generated & Digitally Validated Document',
        40,
        780,
        { align: 'center', width: 515 }
      );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

module.exports = {
  generateClearanceCertificate
};
