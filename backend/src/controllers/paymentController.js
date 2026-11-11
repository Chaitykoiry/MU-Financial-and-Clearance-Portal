const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const crypto = require('crypto');

/**
 * Simulates / processes a clearance or department dues payment.
 */
const processPayment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { clearanceRequestId, departmentId, amount, purpose, paymentMethod } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    const reference = `PAY-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

    // Execute payment and clearance update within transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Record payment
      const payment = await tx.payment.create({
        data: {
          studentId,
          clearanceRequestId: clearanceRequestId || null,
          departmentId: departmentId || null,
          amount: parseFloat(amount),
          reference,
          purpose: purpose || 'Department Clearance Dues Settlement',
          paymentMethod: paymentMethod || 'CARD',
          status: 'SUCCESS'
        }
      });

      // 2. If tied to a department approval, mark duesPaid = true
      if (clearanceRequestId && departmentId) {
        await tx.departmentApproval.updateMany({
          where: {
            clearanceRequestId,
            departmentId
          },
          data: {
            duesPaid: true,
            duesAmount: 0.0
          }
        });
      }

      return payment;
    });

    await recordAuditLog({
      userId: studentId,
      action: 'PAYMENT_PROCESSED',
      entityType: 'PAYMENT',
      entityId: result.id,
      details: { reference, amount, purpose, clearanceRequestId, departmentId },
      req
    });

    // Check if all approvals and payments are now settled
    if (clearanceRequestId) {
      const allApprovals = await prisma.departmentApproval.findMany({
        where: { clearanceRequestId }
      });

      const allApproved = allApprovals.every((a) => a.status === 'APPROVED' && a.duesPaid === true);
      if (allApproved) {
        const certificateCode = `CPCS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
        await prisma.clearanceRequest.update({
          where: { id: clearanceRequestId },
          data: {
            status: 'APPROVED',
            certificateCode,
            issuedAt: new Date()
          }
        });
      }
    }

    res.status(201).json({
      success: true,
      message: 'Payment processed successfully.',
      payment: result
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment.' });
  }
};

const getPaymentHistory = async (req, res) => {
  try {
    const where = {};
    if (req.user.role === 'STUDENT') {
      where.studentId = req.user.id;
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        student: { select: { fullName: true, matricOrStaffId: true, email: true } },
        department: { select: { name: true, code: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: payments.length, payments });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch payment history.' });
  }
};

module.exports = {
  processPayment,
  getPaymentHistory
};
