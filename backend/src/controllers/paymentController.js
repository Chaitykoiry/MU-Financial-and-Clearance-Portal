const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const crypto = require('crypto');

/**
 * Processes a student fee payment or NRBC Bank deposit slip submission.
 */
const processPayment = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      amount,
      purpose,
      paymentMethod = 'NRBC_BANK_DEPOSIT',
      bankBranch,
      slipNumber,
      invoiceId,
      installmentId
    } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    // 1. Resolve StudentProfile
    let studentProfile = await prisma.studentProfile.findFirst({
      where: { userId }
    });

    if (!studentProfile) {
      const defaultProg = await prisma.programme.findFirst();
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId,
          studentIdNumber: req.user.matricOrStaffId || `231-115-094`,
          programmeId: defaultProg.id,
          batchNumber: 56,
          currentSemester: 8,
          cgpa: 3.75
        }
      });
    }

    const txRef = `MU-PAY-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // 2. Transaction execution
    const payment = await prisma.$transaction(async (tx) => {
      const isBankDeposit = paymentMethod === 'NRBC_BANK_DEPOSIT';
      const status = isBankDeposit ? 'PENDING_VERIFICATION' : 'VERIFIED';

      const record = await tx.paymentTransaction.create({
        data: {
          transactionReference: txRef,
          studentId: studentProfile.id,
          invoiceId: invoiceId || null,
          installmentId: installmentId || null,
          paymentMethod: isBankDeposit ? 'NRBC_BANK_DEPOSIT' : 'ONLINE_GATEWAY',
          amountBdt: parseFloat(amount),
          purpose: purpose || 'Spring Term 2026 Tuition Installment',
          bankBranch: bankBranch || 'NRBC Bank, Metropolitan University Campus Branch, Bateshwar',
          slipNumber: slipNumber || `SLIP-${Date.now().toString().slice(-6)}`,
          status
        }
      });

      // If verified (online gateway), credit student ledger
      if (status === 'VERIFIED') {
        await tx.studentLedgerEntry.create({
          data: {
            studentId: studentProfile.id,
            entryType: 'CREDIT_PAYMENT',
            amountBdt: parseFloat(amount),
            runningBalanceBdt: 0.0,
            referenceEntityType: 'PAYMENT_TRANSACTION',
            referenceEntityId: record.id,
            narration: purpose || 'Tuition Fee Settlement'
          }
        });

        if (installmentId) {
          await tx.installmentSchedule.update({
            where: { id: installmentId },
            data: { status: 'PAID' }
          });
        }
      }

      return record;
    });

    await recordAuditLog({
      userId,
      action: 'PAYMENT_TRANSACTION_SUBMITTED',
      entityType: 'PAYMENT_TRANSACTION',
      entityId: payment.id,
      details: { transactionReference: txRef, amount, paymentMethod, slipNumber },
      req
    });

    res.status(201).json({
      success: true,
      message: payment.status === 'VERIFIED'
        ? 'Payment processed and credited successfully.'
        : 'Bank deposit slip submitted to Accounts Section for verification.',
      payment
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment.' });
  }
};

/**
 * Returns student payment history.
 */
const getPaymentHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    let where = {};

    if (req.user.role === 'STUDENT') {
      const studentProfile = await prisma.studentProfile.findFirst({ where: { userId } });
      if (!studentProfile) return res.json({ success: true, count: 0, payments: [] });
      where.studentId = studentProfile.id;
    }

    const payments = await prisma.paymentTransaction.findMany({
      where,
      include: {
        student: {
          include: {
            user: { select: { fullName: true, matricOrStaffId: true, email: true } },
            programme: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    console.error('Error fetching payments:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
};

module.exports = {
  processPayment,
  getPaymentHistory
};
