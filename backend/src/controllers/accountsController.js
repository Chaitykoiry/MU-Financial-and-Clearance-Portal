const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const PDFDocument = require('pdfkit');

/**
 * Lists all bank deposit slips waiting for Accounts Section verification.
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

    res.json({ success: true, count: queue.length, queue });
  } catch (error) {
    console.error('Error fetching verification queue:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch verification queue.' });
  }
};

/**
 * Accounts Officer verifies bank deposit slip and updates student ledger and installment status.
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

    // Execute ledger credit, installment update, and invoice re-calculation in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      // 1. Update Payment Transaction
      const verifiedTx = await tx.paymentTransaction.update({
        where: { id: paymentId },
        data: {
          status: 'VERIFIED',
          verifiedByUserId: officerId,
          verifiedAt: new Date(),
          verificationRemarks: remarks || 'Verified against NRBC Bank Campus Branch daily statement.'
        }
      });

      // 2. Post Credit to Student Ledger
      await tx.studentLedgerEntry.create({
        data: {
          studentId: payment.studentId,
          entryType: 'CREDIT_PAYMENT',
          amountBdt: payment.amountBdt,
          runningBalanceBdt: 0.0,
          referenceEntityType: 'PAYMENT_TRANSACTION',
          referenceEntityId: payment.id,
          narration: `NRBC Bank Deposit (Slip #${payment.slipNumber || 'N/A'}) - ${payment.purpose}`
        }
      });

      // 3. Mark Installment Paid if linked
      if (payment.installmentId) {
        await tx.installmentSchedule.update({
          where: { id: payment.installmentId },
          data: { status: 'PAID' }
        });
      } else if (payment.invoiceId) {
        // Find first pending installment for this invoice
        const nextPendingInstallment = payment.invoice.installmentSchedules.find(
          (inst) => inst.status !== 'PAID'
        );
        if (nextPendingInstallment) {
          await tx.installmentSchedule.update({
            where: { id: nextPendingInstallment.id },
            data: { status: 'PAID' }
          });
        }
      }

      // 4. Update Invoice Balance
      if (payment.invoiceId) {
        const newPaidAmount = payment.invoice.paidAmountBdt + payment.amountBdt;
        const newBalance = Math.max(0, payment.invoice.totalAmountBdt - payment.invoice.waiverAmountBdt - newPaidAmount);

        await tx.studentInvoice.update({
          where: { id: payment.invoiceId },
          data: {
            paidAmountBdt: newPaidAmount,
            outstandingBalanceBdt: newBalance,
            status: newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID'
          }
        });
      }

      // 5. Create in-app notification for student
      await tx.notification.create({
        data: {
          userId: payment.student.userId,
          title: 'Bank Deposit Verified ✓',
          message: `Your payment of ${payment.amountBdt.toLocaleString()} BDT (Slip #${payment.slipNumber}) has been verified by the Accounts Section.`,
          type: 'PAYMENT_UPDATE'
        }
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

    // Notify student
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

    // Outer Border
    doc.rect(15, 15, 565, 390).lineWidth(2).strokeColor('#0f2b5c').stroke();

    // Top Header
    doc.rect(16, 16, 563, 60).fillColor('#0f2b5c').fill();
    doc.fillColor('#ffffff').fontSize(15).font('Helvetica-Bold').text('METROPOLITAN UNIVERSITY, SYLHET', 20, 26, { align: 'center', width: 555 });
    doc.fontSize(8.5).font('Helvetica').text('Accounts & Finance Section • Official Fee Collection Receipt', 20, 48, { align: 'center', width: 555 });

    // Receipt Meta
    doc.fillColor('#0f2b5c').fontSize(10).font('Helvetica-Bold').text('STUDENT PAYMENT RECEIPT', 25, 90);
    doc.fillColor('#475569').fontSize(8).font('Helvetica').text(`REF: ${payment.transactionReference}`, 25, 105);
    doc.text(`DATE: ${new Date(payment.createdAt).toLocaleDateString('en-GB')}`, 430, 105, { align: 'right', width: 140 });

    // Student & Payment Details Box
    doc.rect(25, 125, 545, 140).fillColor('#f8fafc').fillAndStroke('#cbd5e1');

    doc.fillColor('#334155').fontSize(8.5).font('Helvetica-Bold');
    doc.text('STUDENT NAME:', 35, 138);
    doc.text('STUDENT ID:', 35, 158);
    doc.text('PROGRAMME:', 35, 178);
    doc.text('PAYMENT PURPOSE:', 35, 198);
    doc.text('BANK & BRANCH:', 35, 218);
    doc.text('DEPOSIT SLIP NO:', 35, 238);

    const studentUser = payment.student?.user;
    doc.fillColor('#0f172a').font('Helvetica');
    doc.text(studentUser?.fullName || 'Student', 170, 138);
    doc.text(payment.student?.studentIdNumber || '231-115-094', 170, 158, { font: 'Helvetica-Bold' });
    doc.text(payment.student?.programme?.title || 'B.Sc. in Computer Science & Engineering', 170, 178);
    doc.text(payment.purpose, 170, 198);
    doc.text(payment.bankBranch || 'NRBC Bank Campus Branch, Bateshwar', 170, 218);
    doc.text(payment.slipNumber || 'N/A', 170, 238, { font: 'Helvetica-Bold' });

    // Amount Badge
    doc.rect(380, 138, 175, 45).fillColor('#dcfce7').fillAndStroke('#86efac');
    doc.fillColor('#166534').fontSize(8).font('Helvetica-Bold').text('AMOUNT RECEIVED', 380, 145, { width: 175, align: 'center' });
    doc.fontSize(14).text(`${payment.amountBdt.toLocaleString()} BDT`, 380, 160, { width: 175, align: 'center' });

    // Sign-off note
    doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text(
      `Verified by: ${payment.verifiedBy?.fullName || 'Accounts Section Officer'} on ${payment.verifiedAt ? new Date(payment.verifiedAt).toLocaleDateString() : 'Instant Record'}`,
      25,
      285
    );

    doc.fillColor('#94a3b8').fontSize(7).text(
      'This is an authoritative, digitally validated receipt issued by Metropolitan University Accounts Section. Bateshwar Campus, Sylhet-3103.',
      25,
      380,
      { align: 'center', width: 545 }
    );

    doc.end();
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ success: false, message: 'Failed to generate payment receipt.' });
  }
};

module.exports = {
  getVerificationQueue,
  verifyBankDeposit,
  rejectBankDeposit,
  downloadReceipt
};

