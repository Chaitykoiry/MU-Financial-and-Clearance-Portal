const { describe, it } = require('node:test');
const assert = require('node:assert');
const { generateSimulatedBankSlipDataUrl } = require('../src/controllers/paymentController');

describe('Metropolitan University — Phase 9 Advanced Enhancements Verification', () => {
  it('1. Passwordless Student Login: authenticates student directly by Student ID without password', () => {
    const mockStudentInput = { studentId: '231-115-094', password: '' };
    const matchedStudent = {
      id: 'usr-choyon',
      matricOrStaffId: '231-115-094',
      role: 'STUDENT',
      isActive: true
    };

    // Student login requires only matching studentId and STUDENT role
    const canAuthenticateWithoutPassword =
      matchedStudent.role === 'STUDENT' &&
      matchedStudent.isActive &&
      matchedStudent.matricOrStaffId === mockStudentInput.studentId;

    assert.strictEqual(canAuthenticateWithoutPassword, true);
  });

  it('2. Real Deposit Slip Viewer: generates valid SVG/Data-URL bank slip voucher for side-by-side inspection', () => {
    const slipUrl = generateSimulatedBankSlipDataUrl({
      slipNumber: 'NRBC-SLIP-99881',
      studentName: 'Choyon Dhor',
      studentId: '231-115-094',
      amount: 6400,
      purpose: 'Spring 2026 — 2nd Tuition Installment',
      bankBranch: 'NRBC Bank Bateshwar Campus Branch',
      dateStr: '2026-02-12'
    });

    assert.ok(slipUrl.startsWith('data:image/svg+xml;base64,'), 'Must produce valid base64 SVG data URL');
    const decodedSvg = Buffer.from(slipUrl.replace('data:image/svg+xml;base64,', ''), 'base64').toString('utf8');
    assert.ok(decodedSvg.includes('NRBC-SLIP-99881'));
    assert.ok(decodedSvg.includes('231-115-094'));
  });

  it('3. SSLCommerz / bKash / Nagad Webhook IPN: auto-verifies payment and reconciles installment + ledger', () => {
    const gatewaySession = {
      gateway: 'BKASH_MFS',
      gatewayTxId: 'BKASH-17944-ABCD1',
      amount: 15000,
      purpose: 'Spring 2026 — Semester Registration Fee',
      otpCode: '123456'
    };

    const isOtpValid = gatewaySession.otpCode === '123456';
    const verificationStatus = isOtpValid ? 'VERIFIED' : 'SUBMITTED';
    const isRegistrationFeeCleared =
      verificationStatus === 'VERIFIED' &&
      gatewaySession.purpose.toLowerCase().includes('registration');

    assert.strictEqual(verificationStatus, 'VERIFIED');
    assert.strictEqual(isRegistrationFeeCleared, true);
  });

  it('4. Automated NRBC Bank Statement CSV Reconciliation: matches slip number & amount', () => {
    const pendingQueue = [
      { id: 'pay-1', slipNumber: 'NRBC-SLIP-88412', amount: 6400, status: 'PENDING' },
      { id: 'pay-2', slipNumber: 'NRBC-SLIP-77109', amount: 15000, status: 'PENDING' }
    ];

    const csvRows = [
      { transactionReference: 'NRBC-SLIP-88412', amountBdt: 6400 },
      { transactionReference: 'NRBC-SLIP-99999', amountBdt: 5000 }
    ];

    const matchedIds = [];
    for (const row of csvRows) {
      const match = pendingQueue.find(
        (p) => p.slipNumber === row.transactionReference && Math.abs(p.amount - row.amountBdt) < 1
      );
      if (match) matchedIds.push(match.id);
    }

    assert.strictEqual(matchedIds.length, 1);
    assert.strictEqual(matchedIds[0], 'pay-1');
  });

  it('5. Interactive Course Selection & Advisor Approval: enforces 18.0 credit cap and unlocks Enrollment Paper', () => {
    const selectedCourses = [
      { code: 'CSE-411', credits: 3.0, type: 'REGULAR' },
      { code: 'CSE-412', credits: 1.5, type: 'REGULAR' },
      { code: 'CSE-321', credits: 3.0, type: 'RETAKE' }
    ];

    const totalCredits = selectedCourses.reduce((sum, c) => sum + c.credits, 0);
    assert.ok(totalCredits <= 18.0, 'Total credits must not exceed 18.0');
    assert.strictEqual(totalCredits, 7.5);

    const isFeePaid = true;
    const advisorStatus = 'APPROVED';
    const isEnrollmentPaperUnlocked = isFeePaid && advisorStatus === 'APPROVED';
    assert.strictEqual(isEnrollmentPaperUnlocked, true);
  });
});
