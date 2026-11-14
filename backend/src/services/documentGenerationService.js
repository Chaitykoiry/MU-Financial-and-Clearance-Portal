/**
 * Metropolitan University — Document Generation Service
 * 
 * Generates:
 * 1. Official Course Enrollment Paper (PDF)
 * 2. Official Examination Admit Card with embedded QR verification (PDF)
 */

const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

class DocumentGenerationService {
  /**
   * Generates official Metropolitan University Course Enrollment Paper (PDF buffer).
   */
  static async generateCourseEnrollmentPaper({ student, academicTerm, documentNumber, enrolledCourses = [] }) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 40 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Outer Institutional Border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
          .lineWidth(2)
          .strokeColor('#0f2b5c')
          .stroke();

        doc.rect(24, 24, doc.page.width - 48, doc.page.height - 48)
          .lineWidth(0.5)
          .strokeColor('#cbd5e1')
          .stroke();

        // Header Banner
        doc.rect(24, 24, doc.page.width - 48, 80).fill('#0f2b5c');

        doc.fillColor('#ffffff')
          .fontSize(18)
          .font('Helvetica-Bold')
          .text('METROPOLITAN UNIVERSITY', 40, 36, { align: 'center', width: doc.page.width - 80 });

        doc.fontSize(9)
          .font('Helvetica')
          .text('Bateshwar, Sylhet-3103, Bangladesh • Approved by Govt. & UGC', 40, 58, { align: 'center', width: doc.page.width - 80 })
          .text('Office of the Registrar & Controller of Examinations', 40, 70, { align: 'center', width: doc.page.width - 80 });

        // Document Title
        doc.fillColor('#0f2b5c')
          .fontSize(14)
          .font('Helvetica-Bold')
          .text('OFFICIAL COURSE ENROLLMENT PAPER', 40, 120, { align: 'center', width: doc.page.width - 80 });

        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#475569')
          .text(`Academic Session: ${academicTerm?.title || 'Spring Term 2026'}`, 40, 138, { align: 'center', width: doc.page.width - 80 });

        // Status Tag
        doc.rect(doc.page.width / 2 - 110, 155, 220, 22)
          .fillAndStroke('#ecfdf5', '#10b981');
        doc.fillColor('#047857')
          .fontSize(8.5)
          .font('Helvetica-Bold')
          .text('SEMESTER REGISTRATION VERIFIED & CONFIRMED', doc.page.width / 2 - 110, 161, { align: 'center', width: 220 });

        // Student Info Grid
        doc.rect(40, 190, doc.page.width - 80, 95)
          .fillAndStroke('#f8fafc', '#e2e8f0');

        doc.fillColor('#1e293b').fontSize(9);

        // Column 1
        doc.font('Helvetica-Bold').text('Student Name:', 55, 202)
          .font('Helvetica').text(student.user?.fullName || student.fullName, 140, 202);

        doc.font('Helvetica-Bold').text('Student ID:', 55, 220)
          .font('Helvetica-Bold').fillColor('#0f2b5c').text(student.studentIdNumber, 140, 220);

        doc.fillColor('#1e293b').font('Helvetica-Bold').text('Department:', 55, 238)
          .font('Helvetica').text(student.programme?.department?.name || 'Computer Science & Engineering', 140, 238);

        doc.font('Helvetica-Bold').text('Programme:', 55, 256)
          .font('Helvetica').text(student.programme?.title || 'B.Sc. in CSE', 140, 256);

        // Column 2
        doc.font('Helvetica-Bold').text('Batch:', 340, 202)
          .font('Helvetica').text(`Batch ${student.batchNumber || 56}`, 430, 202);

        doc.font('Helvetica-Bold').text('Semester:', 340, 220)
          .font('Helvetica').text(`Semester ${student.currentSemester || 8}`, 430, 220);

        doc.font('Helvetica-Bold').text('Document Ref:', 340, 238)
          .font('Helvetica').text(documentNumber, 430, 238);

        doc.font('Helvetica-Bold').text('Date of Issue:', 340, 256)
          .font('Helvetica').text(new Date().toLocaleDateString('en-GB'), 430, 256);

        // Enrolled Courses Table
        doc.fillColor('#0f2b5c')
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Registered Courses for Current Academic Term', 40, 305);

        // Table Header
        let tableTop = 325;
        doc.rect(40, tableTop, doc.page.width - 80, 24).fill('#0f2b5c');
        doc.fillColor('#ffffff').fontSize(8.5).font('Helvetica-Bold');
        doc.text('#', 50, tableTop + 7);
        doc.text('Course Code', 75, tableTop + 7);
        doc.text('Course Title', 165, tableTop + 7);
        doc.text('Credits', 380, tableTop + 7);
        doc.text('Type', 440, tableTop + 7);
        doc.text('Status', 500, tableTop + 7);

        // Courses Rows
        const defaultCourses = [
          { code: 'CSE-311', title: 'Compiler Design & Construction', credits: 3.0, type: 'Core Theory' },
          { code: 'CSE-312', title: 'Compiler Design Laboratory', credits: 1.5, type: 'Core Sessional' },
          { code: 'CSE-313', title: 'Artificial Intelligence & Neural Networks', credits: 3.0, type: 'Core Theory' },
          { code: 'CSE-314', title: 'Computer Networks & Distributed Systems', credits: 3.0, type: 'Core Theory' },
          { code: 'CSE-315', title: 'Software Engineering & Architecture', credits: 3.0, type: 'Core Theory' },
          { code: 'CSE-316', title: 'Mobile Application Development Lab', credits: 1.5, type: 'Core Sessional' }
        ];

        const coursesToRender = enrolledCourses.length > 0 ? enrolledCourses : defaultCourses;
        let y = tableTop + 24;
        let totalCredits = 0;

        coursesToRender.forEach((c, index) => {
          const isEven = index % 2 === 0;
          doc.rect(40, y, doc.page.width - 80, 20).fill(isEven ? '#f8fafc' : '#ffffff');
          
          doc.fillColor('#334155').fontSize(8).font('Helvetica');
          doc.text(String(index + 1), 50, y + 6);
          doc.font('Helvetica-Bold').text(c.code, 75, y + 6);
          doc.font('Helvetica').text(c.title, 165, y + 6);
          doc.text(String(c.credits.toFixed(1)), 385, y + 6);
          doc.text(c.type || 'Mandatory', 440, y + 6);
          doc.fillColor('#059669').font('Helvetica-Bold').text('ENROLLED', 500, y + 6);

          totalCredits += Number(c.credits) || 0;
          y += 20;
        });

        // Total Credits Row
        doc.rect(40, y, doc.page.width - 80, 22).fill('#e2e8f0');
        doc.fillColor('#0f2b5c').fontSize(9).font('Helvetica-Bold');
        doc.text('Total Registered Credits for Term:', 220, y + 6);
        doc.text(`${totalCredits.toFixed(1)} Credits`, 380, y + 6);

        // Verification Footer & Digital Seals
        const footerY = 660;
        doc.rect(40, footerY, doc.page.width - 80, 90).fillAndStroke('#f8fafc', '#e2e8f0');

        doc.fillColor('#475569').fontSize(7.5).font('Helvetica');
        doc.text('Institutional Notice:', 55, footerY + 10, { font: 'Helvetica-Bold' });
        doc.text('1. This document serves as official evidence of course registration upon verified semester fee payment.', 55, footerY + 22);
        doc.text('2. Any addition, drop, or withdrawal of courses must adhere to Metropolitan University Academic Regulations.', 55, footerY + 32);
        doc.text('3. Possession of this registration paper is mandatory for attending laboratory sessions and mid-term evaluations.', 55, footerY + 42);

        // Signatures
        doc.strokeColor('#94a3b8').lineWidth(0.5);
        doc.moveTo(70, footerY + 75).lineTo(200, footerY + 75).stroke();
        doc.moveTo(doc.page.width - 200, footerY + 75).lineTo(doc.page.width - 70, footerY + 75).stroke();

        doc.fillColor('#334155').fontSize(7.5).font('Helvetica-Bold');
        doc.text('Student Signature & Date', 70, footerY + 78, { align: 'center', width: 130 });
        doc.text('Authorized Academic Officer', doc.page.width - 200, footerY + 78, { align: 'center', width: 130 });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Generates official Metropolitan University Examination Admit Card (PDF buffer with embedded QR).
   */
  static async generateAdmitCard({ student, session, admitCardNumber, qrToken, examSchedule = [] }) {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A4', margin: 35 });
        const buffers = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => resolve(Buffer.concat(buffers)));

        // Generate QR Code Buffer
        const qrUrl = `https://clearance.metrouni.edu.bd/verify-admit-card/${qrToken}`;
        const qrBuffer = await QRCode.toBuffer(qrUrl, {
          margin: 1,
          width: 90,
          color: { dark: '#0f2b5c', light: '#ffffff' }
        });

        // Outer Institutional Navy Border
        doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40)
          .lineWidth(2.5)
          .strokeColor('#0f2b5c')
          .stroke();

        doc.rect(25, 25, doc.page.width - 50, doc.page.height - 50)
          .lineWidth(0.5)
          .strokeColor('#cbd5e1')
          .stroke();

        // Header Background
        doc.rect(25, 25, doc.page.width - 50, 75).fill('#0f2b5c');

        doc.fillColor('#ffffff')
          .fontSize(17)
          .font('Helvetica-Bold')
          .text('METROPOLITAN UNIVERSITY', 35, 34, { align: 'center', width: doc.page.width - 70 });

        doc.fontSize(8.5)
          .font('Helvetica')
          .text('Bateshwar, Sylhet-3103, Bangladesh • Website: https://metrouni.edu.bd', 35, 54, { align: 'center', width: doc.page.width - 70 })
          .font('Helvetica-Bold')
          .text('OFFICE OF THE CONTROLLER OF EXAMINATIONS', 35, 67, { align: 'center', width: doc.page.width - 70 });

        // Title Ribbon
        doc.fillColor('#0f2b5c')
          .fontSize(13)
          .font('Helvetica-Bold')
          .text('EXAMINATION ADMIT CARD', 35, 112, { align: 'center', width: doc.page.width - 70 });

        doc.fontSize(9)
          .font('Helvetica')
          .fillColor('#475569')
          .text(session?.name || 'Semester Final Examination — Spring 2026', 35, 128, { align: 'center', width: doc.page.width - 70 });

        // Financial Clearance Stamp Box
        doc.rect(doc.page.width / 2 - 130, 144, 260, 20)
          .fillAndStroke('#ecfdf5', '#10b981');
        doc.fillColor('#047857')
          .fontSize(8)
          .font('Helvetica-Bold')
          .text('FINANCIAL CLEARANCE AUDITED & ADMISSION APPROVED', doc.page.width / 2 - 130, 150, { align: 'center', width: 260 });

        // Student Identity & QR Stamp Section
        const idBoxY = 172;
        doc.rect(35, idBoxY, doc.page.width - 70, 110)
          .fillAndStroke('#f8fafc', '#cbd5e1');

        // Embedded QR Code
        doc.image(qrBuffer, doc.page.width - 135, idBoxY + 10, { width: 85, height: 85 });
        doc.fillColor('#0f2b5c').fontSize(6.5).font('Helvetica-Bold');
        doc.text('SCAN TO VERIFY', doc.page.width - 135, idBoxY + 98, { width: 85, align: 'center' });

        // Candidate Details
        doc.fillColor('#1e293b').fontSize(8.5);

        doc.font('Helvetica-Bold').text('Candidate Name:', 50, idBoxY + 12)
          .font('Helvetica').text(student.user?.fullName || student.fullName, 140, idBoxY + 12);

        doc.font('Helvetica-Bold').text('Student ID Number:', 50, idBoxY + 28)
          .font('Helvetica-Bold').fillColor('#0f2b5c').text(student.studentIdNumber, 140, idBoxY + 28);

        doc.fillColor('#1e293b').font('Helvetica-Bold').text('Examination Roll:', 50, idBoxY + 44)
          .font('Helvetica-Bold').text(student.studentIdNumber, 140, idBoxY + 44);

        doc.font('Helvetica-Bold').text('Programme:', 50, idBoxY + 60)
          .font('Helvetica').text(student.programme?.title || 'B.Sc. in Computer Science & Engineering', 140, idBoxY + 60);

        doc.font('Helvetica-Bold').text('Department / School:', 50, idBoxY + 76)
          .font('Helvetica').text('Dept. of Computer Science & Engineering', 140, idBoxY + 76);

        doc.font('Helvetica-Bold').text('Admit Card Number:', 50, idBoxY + 92)
          .font('Helvetica').text(admitCardNumber, 140, idBoxY + 92);

        // Examination Schedule Table
        const schedTop = 295;
        doc.fillColor('#0f2b5c')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Examination Schedule & Invigilator Sign-Off', 35, schedTop);

        doc.rect(35, schedTop + 16, doc.page.width - 70, 22).fill('#0f2b5c');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('Date', 45, schedTop + 23);
        doc.text('Time', 115, schedTop + 23);
        doc.text('Course Code', 185, schedTop + 23);
        doc.text('Course Title', 260, schedTop + 23);
        doc.text('Room', 420, schedTop + 23);
        doc.text('Invigilator Sign', 480, schedTop + 23);

        const defaultSchedule = [
          { date: '18 May 2026', time: '10:00 AM - 01:00 PM', code: 'CSE-311', title: 'Compiler Design', room: 'Hall 301' },
          { date: '21 May 2026', time: '10:00 AM - 01:00 PM', code: 'CSE-313', title: 'Artificial Intelligence', room: 'Hall 301' },
          { date: '24 May 2026', time: '10:00 AM - 01:00 PM', code: 'CSE-314', title: 'Computer Networks', room: 'Hall 302' },
          { date: '27 May 2026', time: '10:00 AM - 01:00 PM', code: 'CSE-315', title: 'Software Architecture', room: 'Hall 301' }
        ];

        let currY = schedTop + 38;
        defaultSchedule.forEach((item, idx) => {
          doc.rect(35, currY, doc.page.width - 70, 24)
            .fillAndStroke(idx % 2 === 0 ? '#f8fafc' : '#ffffff', '#e2e8f0');

          doc.fillColor('#334155').fontSize(7.5).font('Helvetica');
          doc.text(item.date, 45, currY + 8);
          doc.text(item.time, 115, currY + 8);
          doc.font('Helvetica-Bold').text(item.code, 185, currY + 8);
          doc.font('Helvetica').text(item.title, 260, currY + 8);
          doc.text(item.room, 420, currY + 8);
          doc.text('________________', 475, currY + 8);

          currY += 24;
        });

        // Examination Rules
        const rulesY = currY + 12;
        doc.rect(35, rulesY, doc.page.width - 70, 95).fillAndStroke('#fffbeb', '#fde68a');

        doc.fillColor('#92400e').fontSize(8).font('Helvetica-Bold');
        doc.text('MANDATORY EXAMINATION RULES & INSTRUCTIONS FOR CANDIDATES', 45, rulesY + 8);

        doc.fillColor('#78350f').fontSize(7).font('Helvetica');
        const rules = [
          '1. Candidates must bring this printed Admit Card and valid Metropolitan University Student ID Card to every exam.',
          '2. Entry to the examination hall is permitted up to 15 minutes prior to commencement; late entry beyond 30 mins is prohibited.',
          '3. Mobile phones, smartwatches, programmable calculators, and unauthorized digital media are strictly prohibited in the exam hall.',
          '4. Communication between examinees or adopting unfair means will lead to immediate expulsion under University Examination Code.',
          '5. Candidates must sign the attendance sheet and ensure the invigilator signs the corresponding course row above.'
        ];
        let ry = rulesY + 22;
        rules.forEach(r => {
          doc.text(r, 45, ry, { width: doc.page.width - 90 });
          ry += 13;
        });

        // Signatures Section
        const sigY = 720;
        doc.strokeColor('#94a3b8').lineWidth(0.5);
        doc.moveTo(50, sigY + 25).lineTo(180, sigY + 25).stroke();
        doc.moveTo(doc.page.width - 180, sigY + 25).lineTo(doc.page.width - 50, sigY + 25).stroke();

        doc.fillColor('#334155').fontSize(8).font('Helvetica-Bold');
        doc.text('Candidate Signature', 50, sigY + 28, { width: 130, align: 'center' });
        doc.text('Prof. K. M. Jahangir', doc.page.width - 180, sigY + 28, { width: 130, align: 'center' });
        doc.font('Helvetica').fontSize(7).fillColor('#64748b');
        doc.text('Controller of Examinations', doc.page.width - 180, sigY + 38, { width: 130, align: 'center' });

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}

module.exports = DocumentGenerationService;

