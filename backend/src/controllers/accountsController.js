const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const PDFDocument = require('pdfkit');
const { generateSimulatedBankSlipDataUrl, reconcileVerifiedPaymentInTx } = require('./paymentController');

/**
 * Lists all bank deposit slips waiting for Accounts Section verification.
 * Ensures every queue item has a visual slipDocumentUrl for the Side-by-Side Slip Viewer.
 */
const getVerificationQueue = async (req, res) => {
  try {
    const queue = await prisma.paymentTransaction.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, matricOrStaffId: true, email: true, phoneNumber: true } },
            programme: true
          }
        },
        invoice: {
          include: { academicTerm: true }
        },
        installment: true
      },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedQueue = queue.map((item) => {
      if (!item.slipDocumentUrl) {
        return {
          ...item,
          slipDocumentUrl: generateSimulatedBankSlipDataUrl({
            studentName: item.student?.user?.fullName || 'MU Student',
            studentId: item.student?.studentIdNumber || '231-115-042',
            slipNumber: item.slipNumber || 'NRBC-SLIP-77382',
            amountBdt: item.amountBdt,
            purpose: item.purpose,
            bankBranch: item.bankBranch || 'NRBC Bank Campus Branch, Bateshwar',
            depositDate: item.depositDate
              ? new Date(item.depositDate).toISOString().split('T')[0]
              : new Date(item.createdAt).toISOString().split('T')[0],
            txRef: item.transactionReference
          })
        };
      }
      return item;
    });

    res.json({ success: true, count: enrichedQueue.length, queue: enrichedQueue });
  } catch (error) {
    console.error('Error fetching verification queue:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verification queue.' });
  }
};

/**
 * Accounts Officer verifies bank deposit slip and updates student ledger, semester registration, and installment status.
 */
const verifyBankDeposit = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { remarks } = req.body;
    const officerId = req.user.id;

    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        student: { include: { user: true } },
        invoice: { include: { installmentSchedules: true } },
        installment: true
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    if (payment.status === 'VERIFIED') {
      return res.status(400).json({ success: false, message: 'This payment has already been verified.' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const verifiedTx = await tx.paymentTransaction.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedByUserId: officerId,
          verifiedAt: new Date(),
          verificationRemarks: remarks || 'Verified against NRBC Bank Campus Branch daily statement.'
        }
      });

      await reconcileVerifiedPaymentInTx(tx, {
        payment: verifiedTx,
        studentProfile: payment.student,
        verifiedByUserId: officerId,
        remarks
      });

      return verifiedTx;
    });

    await recordAuditLog({
      userId: officerId,
      action: 'BANK_DEPOSIT_VERIFIED',
      entityType: 'PAYMENT_TRANSACTION',
      entityId: payment.id,
      details: {
        slipNumber: payment.slipNumber,
        amountBdt: payment.amountBdt,
        studentIdNumber: payment.student.studentIdNumber,
        remarks
      },
      req
    });

    res.json({
      success: true,
      message: 'Deposit slip verified successfully. Student account credited and installment updated.',
      payment: updated
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ success: false, message: 'Failed to verify bank deposit slip.' });
  }
};

/**
 * Accounts Officer rejects deposit slip.
 */
const rejectBankDeposit = async (req, res) => {
  try {
    const { paymentId } = req.params;
    const { remarks } = req.body;
    const officerId = req.user.id;

    if (!remarks) {
      return res.status(400).json({ success: false, message: 'Rejection reason is required.' });
    }

    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: { student: true }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment record not found.' });
    }

    const updated = await prisma.paymentTransaction.update({
      where: { id: paymentId },
      data: {
        status: 'REJECTED',
        verifiedByUserId: officerId,
        verifiedAt: new Date(),
        verificationRemarks: remarks
      }
    });

    await prisma.notification.create({
      data: {
        userId: payment.student.userId,
        title: 'Bank Deposit Rejected',
        message: `Your deposit submission for ${payment.amountBdt} BDT (Slip #${payment.slipNumber}) was rejected: "${remarks}". Please review and resubmit.`,
        type: 'PAYMENT_UPDATE'
      }
    });

    await recordAuditLog({
      userId: officerId,
      action: 'BANK_DEPOSIT_REJECTED',
      entityType: 'PAYMENT_TRANSACTION',
      entityId: payment.id,
      details: { slipNumber: payment.slipNumber, reason: remarks },
      req
    });

    res.json({
      success: true,
      message: 'Deposit slip marked as rejected.',
      payment: updated
    });
  } catch (error) {
    console.error('Error rejecting payment:', error);
    res.status(500).json({ success: false, message: 'Failed to reject bank deposit.' });
  }
};

/**
 * Generates a ready-to-test Sample NRBC Bank CSV Statement containing all pending queue items
 */
const downloadSampleStatementCsv = async (req, res) => {
  try {
    const pending = await prisma.paymentTransaction.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      include: {
        student: { include: { user: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const header = 'SlipNumber,StudentID,StudentName,AmountBDT,DepositDate,Branch,TransactionReference';
    const rows = pending.map((p) => {
      const dateStr = (p.depositDate ? new Date(p.depositDate) : new Date(p.createdAt)).toISOString().split('T')[0];
      const studentId = p.student?.studentIdNumber || '231-115-042';
      const studentName = (p.student?.user?.fullName || 'Student').replace(/,/g, ' ');
      const slipNo = p.slipNumber || 'NRBC-SLIP-77382';
      const branch = (p.bankBranch || 'NRBC Bank Bateshwar Campus Booth').replace(/,/g, ' -');
      return `${slipNo},${studentId},${studentName},${p.amountBdt},${dateStr},${branch},${p.transactionReference}`;
    });

    if (rows.length === 0) {
      rows.push('NRBC-SLIP-99102,231-115-042,Clara Oswald,6400,2026-02-12,NRBC Bank Bateshwar Campus Booth,MU-PAY-2026-SAMPLE');
    }

    const csvContent = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="NRBC_Bank_Daily_Statement_Spring2026.csv"');
    res.send(csvContent);
  } catch (error) {
    console.error('Error generating sample CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to generate sample bank statement CSV.' });
  }
};

/**
 * Automated Bank Statement CSV Reconciliation Engine
 * Matches uploaded NRBC Bank daily CSV rows against PENDING_VERIFICATION payments.
 */
const reconcileBankStatementCsv = async (req, res) => {
  try {
    const { csvContent } = req.body;
    const officerId = req.user.id;

    if (!csvContent || typeof csvContent !== 'string') {
      return res.status(400).json({ success: false, message: 'Valid CSV content is required for reconciliation.' });
    }

    const lines = csvContent
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);

    if (lines.length < 2) {
      return res.status(400).json({ success: false, message: 'CSV file must contain a header row and at least one transaction row.' });
    }

    const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const slipIdx = headers.findIndex((h) => h.includes('slip') || h.includes('scroll'));
    const studentIdIdx = headers.findIndex((h) => h.includes('studentid') || h === 'id' || h.includes('matric'));
    const amountIdx = headers.findIndex((h) => h.includes('amount'));
    const txRefIdx = headers.findIndex((h) => h.includes('ref') || h.includes('trx'));

    const pendingPayments = await prisma.paymentTransaction.findMany({
      where: { status: 'PENDING_VERIFICATION' },
      include: {
        student: { include: { user: true } }
      }
    });

    const reconciledItems = [];
    const unmatchedRows = [];
    const matchedPaymentIds = new Set();

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map((c) => c.trim());
      const csvSlip = slipIdx >= 0 ? cols[slipIdx] : cols[0];
      const csvStudentId = studentIdIdx >= 0 ? cols[studentIdIdx] : cols[1];
      const csvAmount = amountIdx >= 0 ? parseFloat(cols[amountIdx]) : parseFloat(cols[3] || cols[2]);
      const csvTxRef = txRefIdx >= 0 ? cols[txRefIdx] : null;

      // Match by slipNumber OR transactionReference OR (studentId + amount)
      const match = pendingPayments.find((p) => {
        if (matchedPaymentIds.has(p.id)) return false;
        const slipMatches =
          csvSlip &&
          p.slipNumber &&
          p.slipNumber.toLowerCase() === csvSlip.toLowerCase();
        const refMatches =
          csvTxRef &&
          p.transactionReference &&
          p.transactionReference.toLowerCase() === csvTxRef.toLowerCase();
        const studentAndAmountMatches =
          csvStudentId &&
          p.student?.studentIdNumber?.toLowerCase() === csvStudentId.toLowerCase() &&
          !isNaN(csvAmount) &&
          Math.abs(p.amountBdt - csvAmount) < 1;

        return slipMatches || refMatches || studentAndAmountMatches;
      });

      if (match) {
        matchedPaymentIds.add(match.id);
        await prisma.$transaction(async (tx) => {
          const verifiedTx = await tx.paymentTransaction.update({
            where: { id: match.id },
            data: {
              status: 'VERIFIED',
              verifiedByUserId: officerId,
              verifiedAt: new Date(),
              verificationRemarks: `Auto-reconciled via NRBC Bank Daily CSV Statement (Slip #${csvSlip || match.slipNumber})`
            }
          });

          await reconcileVerifiedPaymentInTx(tx, {
            payment: verifiedTx,
            studentProfile: match.student,
            verifiedByUserId: officerId,
            remarks: 'NRBC Bank CSV Statement Auto-Reconciliation'
          });
        });

        reconciledItems.push({
          rowNumber: i,
          paymentId: match.id,
          transactionReference: match.transactionReference,
          slipNumber: match.slipNumber,
          studentIdNumber: match.student?.studentIdNumber,
          studentName: match.student?.user?.fullName,
          amountBdt: match.amountBdt,
          purpose: match.purpose
        });
      } else {
        unmatchedRows.push({
          rowNumber: i,
          slipNumber: csvSlip || 'N/A',
          studentId: csvStudentId || 'N/A',
          amountBdt: isNaN(csvAmount) ? 0 : csvAmount,
          reason: 'No matching pending slip found or already reconciled'
        });
      }
    }

    await recordAuditLog({
      userId: officerId,
      action: 'NRBC_CSV_STATEMENT_RECONCILED',
      entityType: 'PAYMENT_RECONCILIATION',
      entityId: `CSV-BATCH-${Date.now()}`,
      details: {
        totalRows: lines.length - 1,
        matchedCount: reconciledItems.length,
        unmatchedCount: unmatchedRows.length
      },
      req
    });

    res.json({
      success: true,
      message: `CSV Reconciliation complete: ${reconciledItems.length} deposit(s) automatically verified and credited; ${unmatchedRows.length} unmatched row(s).`,
      summary: {
        totalRowsParsed: lines.length - 1,
        matchedCount: reconciledItems.length,
        unmatchedCount: unmatchedRows.length,
        totalAmountReconciledBdt: reconciledItems.reduce((sum, item) => sum + item.amountBdt, 0)
      },
      reconciledItems,
      unmatchedRows
    });
  } catch (error) {
    console.error('Error reconciling bank CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to process NRBC Bank CSV reconciliation.' });
  }
};

/**
 * Exports Department Defaulter List as an Excel-compatible CSV
 */
const exportDefaultersCsv = async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        programme: { include: { department: true } },
        invoices: { include: { installmentSchedules: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        semesterRegistrations: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { studentIdNumber: 'asc' }
    });

    const header = 'StudentID,FullName,Department,Programme,Batch,WaiverPct,TotalBilledBDT,PaidBDT,OutstandingBDT,UnpaidInstallments,SemesterRegStatus';
    const rows = [];

    for (const s of students) {
      const inv = s.invoices?.[0];
      const reg = s.semesterRegistrations?.[0];
      const unpaidInstCount = inv?.installmentSchedules?.filter((i) => i.status !== 'PAID').length || 0;
      const outstanding = inv ? inv.outstandingBalanceBdt : 0;
      const isRegUnpaid = !reg || !reg.isFeePaid;

      if (outstanding > 0 || unpaidInstCount > 0 || isRegUnpaid) {
        rows.push([
          s.studentIdNumber,
          `"${(s.user?.fullName || '').replace(/"/g, '""')}"`,
          s.programme?.department?.code || 'CSE',
          s.programme?.code || 'BSC_CSE',
          s.batchNumber,
          `${s.tuitionWaiverPercentage || 0}%`,
          inv ? inv.totalAmountBdt : 0,
          inv ? inv.paidAmountBdt : 0,
          outstanding,
          unpaidInstCount,
          reg?.isFeePaid ? 'PAID' : 'UNPAID'
        ].join(','));
      }
    }

    const csv = [header, ...rows].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="MU_Defaulter_Report_Spring2026.csv"');
    res.send(csv);
  } catch (error) {
    console.error('Error exporting defaulters CSV:', error);
    res.status(500).json({ success: false, message: 'Failed to export defaulter CSV.' });
  }
};

/**
 * Exports Official PDF Defaulter & Overdue Dues Report
 */
const exportDefaultersPdf = async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: true,
        programme: { include: { department: true } },
        invoices: { include: { installmentSchedules: true }, orderBy: { createdAt: 'desc' }, take: 1 },
        semesterRegistrations: { orderBy: { createdAt: 'desc' }, take: 1 }
      },
      orderBy: { studentIdNumber: 'asc' }
    });

    const defaulters = students.filter((s) => {
      const inv = s.invoices?.[0];
      const reg = s.semesterRegistrations?.[0];
      return (inv && inv.outstandingBalanceBdt > 0) || !reg || !reg.isFeePaid;
    });

    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="MU_Department_Defaulter_Report_Spring2026.pdf"');
      res.send(pdfData);
    });

    // Header
    doc.rect(35, 30, doc.page.width - 70, 65).fill('#0f2b5c');
    doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold').text('METROPOLITAN UNIVERSITY, SYLHET', 40, 42, { align: 'center', width: doc.page.width - 80 });
    doc.fontSize(9).font('Helvetica').text('Accounts & Finance Section • Official Department Defaulter & Overdue Liability Report (Spring 2026)', 40, 64, { align: 'center', width: doc.page.width - 80 });

    doc.fillColor('#0f172a').fontSize(10).font('Helvetica-Bold').text(`Generated On: ${new Date().toLocaleDateString('en-GB')} • Total Accounts with Outstanding Dues: ${defaulters.length}`, 35, 110);

    // Table Header
    let y = 135;
    doc.rect(35, y, doc.page.width - 70, 22).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('STUDENT ID', 42, y + 7);
    doc.text('FULL NAME', 115, y + 7);
    doc.text('PROG / BATCH', 235, y + 7);
    doc.text('WAIVER', 320, y + 7);
    doc.text('REG FEE', 370, y + 7);
    doc.text('UNPAID INST.', 430, y + 7);
    doc.text('OUTSTANDING', 495, y + 7);
    y += 22;

    let totalOutstandingSum = 0;

    defaulters.forEach((s, idx) => {
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
      const inv = s.invoices?.[0];
      const reg = s.semesterRegistrations?.[0];
      const unpaidCount = inv?.installmentSchedules?.filter((i) => i.status !== 'PAID').length || 0;
      const outBdt = inv ? inv.outstandingBalanceBdt : 0;
      totalOutstandingSum += outBdt;

      doc.rect(35, y, doc.page.width - 70, 20).fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff');
      doc.fillColor('#0f172a').fontSize(8).font('Helvetica-Bold').text(s.studentIdNumber, 42, y + 6);
      doc.font('Helvetica').text((s.user?.fullName || '').slice(0, 22), 115, y + 6);
      doc.text(`${s.programme?.code || 'CSE'} (B-${s.batchNumber})`, 235, y + 6);
      doc.text(`${s.tuitionWaiverPercentage || 0}%`, 320, y + 6);
      doc.fillColor(reg?.isFeePaid ? '#059669' : '#dc2626').font('Helvetica-Bold').text(reg?.isFeePaid ? 'PAID' : 'UNPAID', 370, y + 6);
      doc.fillColor('#334155').font('Helvetica').text(`${unpaidCount} / 4`, 438, y + 6);
      doc.fillColor('#dc2626').font('Helvetica-Bold').text(`Tk. ${outBdt.toLocaleString()}`, 495, y + 6);
      y += 20;
    });

    doc.rect(35, y + 6, doc.page.width - 70, 24).fill('#fef2f2');
    doc.fillColor('#991b1b').fontSize(9.5).font('Helvetica-Bold').text(
      `Total Outstanding Tuition & Dues Across ${defaulters.length} Student(s): Tk. ${totalOutstandingSum.toLocaleString()} BDT`,
      45,
      y + 13
    );

    doc.end();
  } catch (error) {
    console.error('Error generating defaulters PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate defaulter PDF report.' });
  }
};

/**
 * Exports Monthly Collection & Waiver Summary Report (PDF)
 */
const exportCollectionsPdf = async (req, res) => {
  try {
    const verifiedPayments = await prisma.paymentTransaction.findMany({
      where: { status: 'VERIFIED' },
      include: {
        student: { include: { user: true, programme: true } }
      },
      orderBy: { verifiedAt: 'desc' }
    });

    const invoices = await prisma.studentInvoice.findMany();
    const totalWaiverExpenditure = invoices.reduce((acc, i) => acc + (i.waiverAmountBdt || 0), 0);
    const totalCollected = verifiedPayments.reduce((acc, p) => acc + p.amountBdt, 0);

    const doc = new PDFDocument({ size: 'A4', margin: 35 });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="MU_Monthly_Collection_Report_Spring2026.pdf"');
      res.send(pdfData);
    });

    doc.rect(35, 30, doc.page.width - 70, 65).fill('#0f2b5c');
    doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold').text('METROPOLITAN UNIVERSITY, SYLHET', 40, 42, { align: 'center', width: doc.page.width - 80 });
    doc.fontSize(9).font('Helvetica').text('Accounts & Finance Section • Monthly Revenue Collection & Scholarship Expenditure Statement', 40, 64, { align: 'center', width: doc.page.width - 80 });

    // Summary KPI Boxes
    doc.rect(35, 110, 250, 50).fillAndStroke('#ecfdf5', '#10b981');
    doc.fillColor('#065f46').fontSize(8.5).font('Helvetica-Bold').text('TOTAL VERIFIED COLLECTIONS', 45, 120);
    doc.fontSize(15).text(`Tk. ${totalCollected.toLocaleString()} BDT`, 45, 136);

    doc.rect(305, 110, 255, 50).fillAndStroke('#fffbeb', '#f59e0b');
    doc.fillColor('#92400e').fontSize(8.5).font('Helvetica-Bold').text('TOTAL TUITION WAIVER EXPENDITURE', 315, 120);
    doc.fontSize(15).text(`Tk. ${totalWaiverExpenditure.toLocaleString()} BDT`, 315, 136);

    let y = 180;
    doc.rect(35, y, doc.page.width - 70, 22).fill('#1e293b');
    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
    doc.text('TRX REF', 42, y + 7);
    doc.text('STUDENT ID & NAME', 135, y + 7);
    doc.text('CHANNEL', 280, y + 7);
    doc.text('PURPOSE', 365, y + 7);
    doc.text('AMOUNT (BDT)', 490, y + 7);
    y += 22;

    verifiedPayments.forEach((p, idx) => {
      if (y > 740) {
        doc.addPage();
        y = 40;
      }
      doc.rect(35, y, doc.page.width - 70, 20).fill(idx % 2 === 0 ? '#f8fafc' : '#ffffff');
      doc.fillColor('#0f172a').fontSize(7.5).font('Helvetica-Bold').text(p.transactionReference, 42, y + 6);
      doc.font('Helvetica').text(`${p.student?.studentIdNumber || ''} ${(p.student?.user?.fullName || '').slice(0, 15)}`, 135, y + 6);
      doc.text(p.paymentMethod.replace(/_/g, ' '), 280, y + 6);
      doc.text((p.purpose || '').slice(0, 24), 365, y + 6);
      doc.fillColor('#059669').font('Helvetica-Bold').text(`Tk. ${p.amountBdt.toLocaleString()}`, 490, y + 6);
      y += 20;
    });

    doc.end();
  } catch (error) {
    console.error('Error generating collections PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate collections PDF report.' });
  }
};

/**
 * Downloads official PDF payment receipt for student.
 */
const downloadReceipt = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await prisma.paymentTransaction.findUnique({
      where: { id: paymentId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, matricOrStaffId: true, email: true } },
            programme: true
          }
        },
        verifiedBy: { select: { fullName: true } }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment transaction not found.' });
    }

    const doc = new PDFDocument({ size: 'A5', layout: 'landscape', margins: { top: 25, bottom: 25, left: 25, right: 25 } });
    const buffers = [];
    doc.on('data', buffers.push.bind(buffers));
    doc.on('end', () => {
      const pdfData = Buffer.concat(buffers);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="MU_Receipt_${payment.transactionReference}.pdf"`);
      res.send(pdfData);
    });

    doc.rect(15, 15, 565, 390).lineWidth(2).strokeColor('#0f2b5c').stroke();
    doc.rect(16, 16, 563, 60).fillColor('#0f2b5c').fill();
    doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold').text('METROPOLITAN UNIVERSITY, SYLHET', 20, 26, { align: 'center', width: 555 });
    doc.fontSize(8.5).font('Helvetica').text('Accounts & Finance Section • Official Fee Collection Receipt', 20, 48, { align: 'center', width: 555 });

    doc.fillColor('#0f2b5c').fontSize(10).font('Helvetica-Bold').text('STUDENT PAYMENT RECEIPT', 25, 90);
    doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`REF: ${payment.transactionReference}`, 25, 105);
    doc.text(`DATE: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}`, 430, 105, { align: 'right', width: 140 });

    doc.rect(25, 125, 545, 140).fillColor('#f8fafc').fillAndStroke('#cbd5e1');

    doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold');
    doc.text('STUDENT NAME:', 35, 138);
    doc.text('STUDENT ID:', 35, 158);
    doc.text('PROGRAMME:', 35, 178);
    doc.text('PAYMENT PURPOSE:', 35, 198);
    doc.text('CHANNEL / BRANCH:', 35, 218);
    doc.text('SLIP / TRX NO:', 35, 238);

    const studentUser = payment.student?.user;
    doc.fillColor('#0f172a').font('Helvetica');
    doc.text(studentUser?.fullName || 'Student', 170, 138);
    doc.text(payment.student?.studentIdNumber || '231-115-094', 170, 158, { font: 'Helvetica-Bold' });
    doc.text(payment.student?.programme?.title || 'B.Sc. in Computer Science & Engineering', 170, 178);
    doc.text(payment.purpose, 170, 198);
    doc.text(payment.bankBranch || 'NRBC Bank Campus Branch, Bateshwar', 170, 218);
    doc.text(payment.slipNumber || payment.gatewayTransactionId || 'N/A', 170, 238, { font: 'Helvetica-Bold' });

    doc.rect(380, 138, 175, 45).fillColor('#dcfce7').fillAndStroke('#86efac');
    doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('AMOUNT RECEIVED', 380, 145, { width: 175, align: 'center' });
    doc.fontSize(14).text(`${payment.amountBdt.toLocaleString()} BDT`, 380, 160, { width: 175, align: 'center' });

    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(
      `Verified by: ${payment.verifiedBy?.fullName || 'Automated Gateway / Accounts Section'} on ${payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : 'Instant Record'}`,
      25,
      285
    );

    doc.fillColor('#94a3b8').fontSize(7).text(
      'This is an authoritative, digitally validated receipt issued by Metropolitan University Accounts Section. Bateshwar Campus, Sylhet-3103.',
      25,
      365,
      { align: 'center', width: 545 }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating receipt PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate receipt.' });
  }
};

module.exports = {
  getVerificationQueue,
  verifyBankDeposit,
  rejectBankDeposit,
  downloadSampleStatementCsv,
  reconcileBankStatementCsv,
  exportDefaultersCsv,
  exportDefaultersPdf,
  exportCollectionsPdf,
  downloadReceipt
};
