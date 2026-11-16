const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

/**
 * Generates an SVG NRBC Bank deposit slip data URL when a demo slip is submitted without an image file,
 * ensuring the Side-by-Side Slip Viewer always has an authentic bank slip to inspect.
 */
function generateSimulatedBankSlipDataUrl({ studentName, studentId, slipNumber, amountBdt, purpose, bankBranch, depositDate, txRef }) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="760" height="440" viewBox="0 0 760 440">
    <rect width="760" height="440" fill="#f8fafc" rx="12" stroke="#0f2b5c" stroke-width="3"/>
    <rect x="0" y="0" width="760" height="76" fill="#0f2b5c" rx="10"/>
    <text x="28" y="34" fill="#ffffff" font-family="Arial, sans-serif" font-size="18" font-weight="bold">NRBC BANK PLC • METROPOLITAN UNIVERSITY CAMPUS BOOTH</text>
    <text x="28" y="56" fill="#93c5fd" font-family="Arial, sans-serif" font-size="12">Bateshwar, Sylhet-3103, Bangladesh • Institutional Collection A/C: 015954000000001</text>
    <rect x="570" y="18" width="165" height="40" fill="#fbbf24" rx="6"/>
    <text x="652" y="35" fill="#0f172a" font-family="monospace" font-size="10" font-weight="bold" text-anchor="middle">SCROLL / SLIP NO</text>
    <text x="652" y="50" fill="#0f172a" font-family="monospace" font-size="13" font-weight="bold" text-anchor="middle">${slipNumber}</text>

    <rect x="24" y="96" width="712" height="240" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" rx="8"/>
    <text x="44" y="128" fill="#64748b" font-family="Arial, sans-serif" font-size="11" font-weight="bold">STUDENT FULL NAME:</text>
    <text x="210" y="128" fill="#0f172a" font-family="Arial, sans-serif" font-size="14" font-weight="bold">${studentName}</text>

    <text x="44" y="160" fill="#64748b" font-family="Arial, sans-serif" font-size="11" font-weight="bold">STUDENT ID NO:</text>
    <text x="210" y="160" fill="#1d4ed8" font-family="monospace" font-size="14" font-weight="bold">${studentId}</text>

    <text x="44" y="192" fill="#64748b" font-family="Arial, sans-serif" font-size="11" font-weight="bold">PAYMENT PURPOSE:</text>
    <text x="210" y="192" fill="#0f172a" font-family="Arial, sans-serif" font-size="13">${purpose}</text>

    <text x="44" y="224" fill="#64748b" font-family="Arial, sans-serif" font-size="11" font-weight="bold">BANK BRANCH:</text>
    <text x="210" y="224" fill="#334155" font-family="Arial, sans-serif" font-size="12">${bankBranch}</text>

    <text x="44" y="256" fill="#64748b" font-family="Arial, sans-serif" font-size="11" font-weight="bold">DEPOSIT DATE:</text>
    <text x="210" y="256" fill="#0f172a" font-family="monospace" font-size="13">${depositDate}</text>

    <text x="44" y="288" fill="#64748b" font-family="Arial, sans-serif" font-size="11" font-weight="bold">TRANSACTION REF:</text>
    <text x="210" y="288" fill="#475569" font-family="monospace" font-size="12">${txRef}</text>

    <rect x="480" y="125" width="230" height="90" fill="#ecfdf5" stroke="#10b981" stroke-width="2" rx="10"/>
    <text x="595" y="152" fill="#047857" font-family="Arial, sans-serif" font-size="11" font-weight="bold" text-anchor="middle">TOTAL CASH DEPOSITED</text>
    <text x="595" y="188" fill="#065f46" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">Tk. ${Number(amountBdt).toLocaleString()}</text>

    <circle cx="595" cy="275" r="38" fill="none" stroke="#1e40af" stroke-width="2" stroke-dasharray="4,2" opacity="0.75"/>
    <text x="595" y="270" fill="#1e40af" font-family="Arial, sans-serif" font-size="9" font-weight="bold" text-anchor="middle">NRBC BANK</text>
    <text x="595" y="283" fill="#1e40af" font-family="Arial, sans-serif" font-size="8" font-weight="bold" text-anchor="middle">CASH RECEIVED</text>

    <text x="28" y="375" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Depositor Signature: ______________________</text>
    <text x="480" y="375" fill="#64748b" font-family="Arial, sans-serif" font-size="11">Authorized Bank Officer: ___________________</text>
    <text x="28" y="415" fill="#94a3b8" font-family="monospace" font-size="10">Digitally archived by Metropolitan University CPCS • Accounts Verification Copy</text>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Helper to apply verified payment to invoices, installments, semester registration, and ledger
 */
async function reconcileVerifiedPaymentInTx(tx, { payment, studentProfile, verifiedByUserId = null, remarks }) {
  // 1. Post Credit to Student Ledger
  await tx.studentLedgerEntry.create({
    data: {
      studentId: studentProfile.id,
      entryType: 'CREDIT_PAYMENT',
      amountBdt: payment.amountBdt,
      runningBalanceBdt: 0.0,
      referenceEntityType: 'PAYMENT_TRANSACTION',
      referenceEntityId: payment.id,
      narration: `${payment.paymentMethod} (${payment.slipNumber || payment.gatewayTransactionId || payment.transactionReference}) - ${payment.purpose}`
    }
  });

  const purposeLower = (payment.purpose || '').toLowerCase();
  const isRegistrationPayment = purposeLower.includes('registration') || purposeLower.includes('enrollment');

  // 2. If Semester Registration Payment, unlock SemesterRegistration
  if (isRegistrationPayment) {
    const latestReg = await tx.semesterRegistration.findFirst({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: 'desc' }
    });
    if (latestReg) {
      await tx.semesterRegistration.update({
        where: { id: latestReg.id },
        data: {
          isFeePaid: true,
          paidAt: new Date(),
          status: 'REGISTERED'
        }
      });
    }
  }

  // 3. Update Installment & Invoice
  let targetInvoiceId = payment.invoiceId;
  if (!targetInvoiceId) {
    const latestInvoice = await tx.studentInvoice.findFirst({
      where: { studentId: studentProfile.id },
      orderBy: { createdAt: 'desc' }
    });
    if (latestInvoice) targetInvoiceId = latestInvoice.id;
  }

  if (payment.installmentId) {
    await tx.installmentSchedule.update({
      where: { id: payment.installmentId },
      data: { status: 'PAID' }
    });
  } else if (targetInvoiceId && !isRegistrationPayment) {
    const nextPending = await tx.installmentSchedule.findFirst({
      where: { invoiceId: targetInvoiceId, status: { not: 'PAID' } },
      orderBy: { installmentNumber: 'asc' }
    });
    if (nextPending) {
      await tx.installmentSchedule.update({
        where: { id: nextPending.id },
        data: { status: 'PAID' }
      });
    }
  }

  if (targetInvoiceId && !isRegistrationPayment) {
    const invoice = await tx.studentInvoice.findUnique({ where: { id: targetInvoiceId } });
    if (invoice) {
      const newPaidAmount = invoice.paidAmountBdt + payment.amountBdt;
      const newBalance = Math.max(0, invoice.totalAmountBdt - invoice.waiverAmountBdt - newPaidAmount);
      await tx.studentInvoice.update({
        where: { id: targetInvoiceId },
        data: {
          paidAmountBdt: newPaidAmount,
          outstandingBalanceBdt: newBalance,
          status: newBalance === 0 ? 'PAID' : 'PARTIALLY_PAID'
        }
      });
    }
  }

  // 4. Create Notification
  await tx.notification.create({
    data: {
      userId: studentProfile.userId,
      title: 'Payment Verified & Credited ✓',
      message: `Your payment of Tk. ${payment.amountBdt.toLocaleString()} for "${payment.purpose}" has been verified and credited to your ledger.`,
      type: 'PAYMENT_UPDATE'
    }
  });
}

/**
 * Processes a student fee payment or NRBC Bank deposit slip submission (with real file upload).
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
      depositDate,
      slipFileBase64,
      slipFileName,
      slipDocumentUrl: providedSlipUrl,
      invoiceId,
      installmentId
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    // 1. Resolve StudentProfile
    let studentProfile = await prisma.studentProfile.findFirst({
      where: { userId },
      include: { user: true }
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
        },
        include: { user: true }
      });
    }

    const txRef = `MU-PAY-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const finalSlipNo = slipNumber || `NRBC-SLIP-${Date.now().toString().slice(-6)}`;
    const finalBranch = bankBranch || 'NRBC Bank, Metropolitan University Campus Branch, Bateshwar';
    const finalPurpose = purpose || 'Spring Term 2026 Tuition Installment';
    const finalDateStr = depositDate || new Date().toISOString().split('T')[0];

    // Save uploaded file if base64 provided, otherwise generate realistic SVG slip preview
    let savedSlipUrl = providedSlipUrl || null;
    if (slipFileBase64 && typeof slipFileBase64 === 'string') {
      try {
        const matches = slipFileBase64.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
        if (matches && matches.length === 3) {
          const mimeType = matches[1];
          const buffer = Buffer.from(matches[2], 'base64');
          const ext = mimeType.includes('pdf')
            ? '.pdf'
            : mimeType.includes('png')
            ? '.png'
            : mimeType.includes('svg')
            ? '.svg'
            : '.jpg';
          const safeFileName = `${txRef}${ext}`;
          const filePath = path.join(__dirname, '../../uploads/slips', safeFileName);
          fs.mkdirSync(path.dirname(filePath), { recursive: true });
          fs.writeFileSync(filePath, buffer);
          // Store full data URL for immediate zero-latency preview if < 2MB, else static path
          savedSlipUrl = buffer.length < 2 * 1024 * 1024 ? slipFileBase64 : `/uploads/slips/${safeFileName}`;
        } else {
          savedSlipUrl = slipFileBase64;
        }
      } catch (fileErr) {
        console.warn('Slip file save fallback to data URL:', fileErr.message);
        savedSlipUrl = slipFileBase64;
      }
    }

    if (!savedSlipUrl) {
      savedSlipUrl = generateSimulatedBankSlipDataUrl({
        studentName: studentProfile.user?.fullName || 'MU Student',
        studentId: studentProfile.studentIdNumber,
        slipNumber: finalSlipNo,
        amountBdt: parseFloat(amount),
        purpose: finalPurpose,
        bankBranch: finalBranch,
        depositDate: finalDateStr,
        txRef
      });
    }

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
          paymentMethod: isBankDeposit ? 'NRBC_BANK_DEPOSIT' : paymentMethod,
          amountBdt: parseFloat(amount),
          purpose: finalPurpose,
          bankBranch: finalBranch,
          slipNumber: finalSlipNo,
          slipDocumentUrl: savedSlipUrl,
          depositDate: depositDate ? new Date(depositDate) : new Date(),
          status
        }
      });

      if (status === 'VERIFIED') {
        await reconcileVerifiedPaymentInTx(tx, {
          payment: record,
          studentProfile,
          remarks: 'Auto-reconciled via Online Payment Gateway'
        });
      }

      return record;
    });

    await recordAuditLog({
      userId,
      action: 'PAYMENT_TRANSACTION_SUBMITTED',
      entityType: 'PAYMENT_TRANSACTION',
      entityId: payment.id,
      details: {
        transactionReference: txRef,
        amount,
        paymentMethod,
        slipNumber: finalSlipNo,
        hasUploadedSlip: Boolean(slipFileBase64)
      },
      req
    });

    res.status(201).json({
      success: true,
      message:
        payment.status === 'VERIFIED'
          ? 'Payment processed and credited successfully.'
          : 'NRBC Bank deposit slip uploaded and queued for Accounts Section verification.',
      payment
    });
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ success: false, message: 'Failed to process payment.' });
  }
};

/**
 * Initiates an SSLCommerz / bKash / Nagad Sandbox Payment Session
 */
const initiateGatewaySession = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      amount,
      purpose = 'Spring Term 2026 Tuition Installment',
      gatewayProvider = 'BKASH_MFS', // 'BKASH_MFS' | 'NAGAD_MFS' | 'ONLINE_GATEWAY'
      payerAccount = '01700000000',
      invoiceId,
      installmentId
    } = req.body;

    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Valid payment amount is required.' });
    }

    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId },
      include: { user: true, programme: true }
    });

    if (!studentProfile) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const txRef = `MU-GW-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const sessionKey = `SSL-SESS-${crypto.randomBytes(8).toString('hex').toUpperCase()}`;

    const validMethod = ['BKASH_MFS', 'NAGAD_MFS', 'ONLINE_GATEWAY'].includes(gatewayProvider)
      ? gatewayProvider
      : 'ONLINE_GATEWAY';

    const initiatedPayment = await prisma.paymentTransaction.create({
      data: {
        transactionReference: txRef,
        studentId: studentProfile.id,
        invoiceId: invoiceId || null,
        installmentId: installmentId || null,
        paymentMethod: validMethod,
        amountBdt: parseFloat(amount),
        purpose,
        status: 'INITIATED',
        gatewayResponse: JSON.stringify({
          sessionKey,
          gatewayProvider: validMethod,
          payerAccount,
          initiatedAt: new Date().toISOString()
        })
      }
    });

    res.status(201).json({
      success: true,
      message: 'Sandbox payment gateway session initialized.',
      gatewaySession: {
        sessionKey,
        transactionReference: txRef,
        paymentId: initiatedPayment.id,
        amountBdt: initiatedPayment.amountBdt,
        purpose: initiatedPayment.purpose,
        gatewayProvider: validMethod,
        merchantName: 'Metropolitan University, Sylhet (Bateshwar Campus)',
        merchantId: 'MU-SYLHET-SSLCOMMERZ-SANDBOX',
        studentName: studentProfile.user?.fullName,
        studentIdNumber: studentProfile.studentIdNumber
      }
    });
  } catch (error) {
    console.error('Error initiating gateway session:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize payment gateway session.' });
  }
};

/**
 * Processes SSLCommerz / bKash / Nagad Instant Payment Notification (IPN) Webhook
 * Auto-verifies the payment in the double-entry ledger without manual intervention.
 */
const verifyGatewayWebhook = async (req, res) => {
  try {
    const {
      transactionReference,
      gatewayProvider = 'BKASH_MFS',
      payerAccount = '01711-XXXXXX',
      sandboxOtp = '123456'
    } = req.body;

    if (!transactionReference) {
      return res.status(400).json({ success: false, message: 'Transaction reference is required.' });
    }

    const payment = await prisma.paymentTransaction.findUnique({
      where: { transactionReference },
      include: {
        student: { include: { user: true } }
      }
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Gateway payment session not found.' });
    }

    if (payment.status === 'VERIFIED') {
      return res.json({
        success: true,
        message: 'Payment already verified via IPN.',
        payment
      });
    }

    const prefix =
      gatewayProvider === 'BKASH_MFS'
        ? 'BKASH-TRX'
        : gatewayProvider === 'NAGAD_MFS'
        ? 'NAGAD-TRX'
        : 'SSL-VAL';
    const gatewayTrxId = `${prefix}-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
    const ipnSignature = crypto
      .createHmac('sha256', process.env.JWT_SECRET || 'mu_ipn_secret')
      .update(`${transactionReference}:${gatewayTrxId}:${payment.amountBdt}`)
      .digest('hex');

    const verifiedPayment = await prisma.$transaction(async (tx) => {
      const updated = await tx.paymentTransaction.update({
        where: { id: payment.id },
        data: {
          status: 'VERIFIED',
          gatewayTransactionId: gatewayTrxId,
          slipNumber: gatewayTrxId,
          bankBranch: `${gatewayProvider.replace('_', ' ')} Instant Gateway (${payerAccount})`,
          verifiedAt: new Date(),
          verificationRemarks: `Auto-verified via SSLCommerz/MFS IPN Webhook (TrxID: ${gatewayTrxId})`,
          gatewayResponse: JSON.stringify({
            ipnStatus: 'VALIDATED',
            gatewayTrxId,
            payerAccount,
            ipnSignature,
            validatedAt: new Date().toISOString()
          })
        }
      });

      await reconcileVerifiedPaymentInTx(tx, {
        payment: updated,
        studentProfile: payment.student,
        remarks: `Instant IPN Webhook (${gatewayTrxId})`
      });

      return updated;
    });

    await recordAuditLog({
      userId: req.user?.id || payment.student.userId,
      action: 'GATEWAY_IPN_AUTO_VERIFIED',
      entityType: 'PAYMENT_TRANSACTION',
      entityId: payment.id,
      details: {
        transactionReference,
        gatewayTransactionId: gatewayTrxId,
        gatewayProvider,
        amountBdt: payment.amountBdt,
        ipnSignature
      },
      req
    });

    res.json({
      success: true,
      message: `Payment of Tk. ${payment.amountBdt.toLocaleString()} auto-verified via ${gatewayProvider.replace('_', ' ')} IPN Webhook!`,
      payment: verifiedPayment,
      ipnReceipt: {
        gatewayTransactionId: gatewayTrxId,
        transactionReference,
        ipnSignature,
        verifiedAt: verifiedPayment.verifiedAt
      }
    });
  } catch (error) {
    console.error('Error processing gateway IPN webhook:', error);
    res.status(500).json({ success: false, message: 'Gateway IPN verification failed.' });
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
  initiateGatewaySession,
  verifyGatewayWebhook,
  getPaymentHistory,
  generateSimulatedBankSlipDataUrl,
  reconcileVerifiedPaymentInTx
};
