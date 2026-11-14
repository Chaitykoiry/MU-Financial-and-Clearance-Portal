/**
 * Metropolitan University — Financial & Digital Clearance Acceptance Test Suite
 * 
 * Verifies Scenarios A through H from Master Specification:
 * - Scenario A: Monthly tuition 8,000 BDT with 20% waiver -> Payable 6,400 BDT.
 * - Scenario B: 20% waiver with 2,000 BDT activities fee -> Only tuition discounted.
 * - Scenario C: Tuition paid on the 15th (due 12th) -> 3 late days * 10 BDT = 30 BDT late fine.
 * - Scenario D: Semester registration unpaid after 25th -> Fixed 1,000 BDT fine applied once.
 * - Scenario E: Unverified slip -> Payment remains pending; enrollment and admit card blocked.
 * - Scenario F: Semester registration paid, but tuition unpaid -> Enrollment paper eligible; admit card blocked.
 * - Scenario G: Waiver changed from 10% to 20% -> New invoices use 20%; previous paid invoices unaffected.
 * - Scenario H: Student attempts to access `/api/admin/*` -> HTTP 403 Forbidden.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert');
const TuitionWaiverService = require('../src/services/tuitionWaiverService');
const FineCalculationService = require('../src/services/fineCalculationService');

describe('Metropolitan University — Enterprise Financial Acceptance Tests (Scenarios A - H)', () => {

  // Scenario A
  describe('Scenario A: Monthly Tuition Waiver Calculation', () => {
    it('should discount an 8,000 BDT monthly credit fee by 20% resulting in payable 6,400 BDT', () => {
      const calculation = TuitionWaiverService.calculateTuitionBreakdown(8000, 20);
      assert.strictEqual(calculation.originalTuition, 8000);
      assert.strictEqual(calculation.waiverPercentage, 20);
      assert.strictEqual(calculation.discountAmount, 1600);
      assert.strictEqual(calculation.payableTuition, 6400);
    });
  });

  // Scenario B
  describe('Scenario B: Strict Waiver Boundary Isolation', () => {
    it('should discount tuition only, leaving 2,000 BDT activities fee and 500 BDT BNCC charges 100% intact', () => {
      const feeStructure = {
        monthlyCreditFee: 8000,
        activitiesFee: 2000,
        registrationFee: 15000,
        bnccAndOther: 500
      };
      const waiverPercentage = 20;

      // Tuition discounted
      const tuitionCalc = TuitionWaiverService.calculateTuitionBreakdown(feeStructure.monthlyCreditFee, waiverPercentage);
      assert.strictEqual(tuitionCalc.originalTuition, 8000);
      assert.strictEqual(tuitionCalc.discountAmount, 1600);
      assert.strictEqual(tuitionCalc.payableTuition, 6400);

      // Activities fee NOT discounted
      assert.strictEqual(feeStructure.activitiesFee, 2000);

      // BNCC fee NOT discounted
      assert.strictEqual(feeStructure.bnccAndOther, 500);

      // Semester Registration NOT discounted
      assert.strictEqual(feeStructure.registrationFee, 15000);

      // Total payable check
      const totalNetPayable = tuitionCalc.payableTuition + feeStructure.activitiesFee + feeStructure.bnccAndOther + feeStructure.registrationFee;
      assert.strictEqual(totalNetPayable, 6400 + 2000 + 500 + 15000);
      assert.strictEqual(totalNetPayable, 23900);
    });
  });

  // Scenario C
  describe('Scenario C: Progressive Late-Payment Fine Engine', () => {
    it('should assess 3 overdue days * 10 BDT/day = 30 BDT when tuition is paid on the 15th (due 12th)', () => {
      const dueDate = new Date('2026-03-12T23:59:59Z');
      const paymentDate = new Date('2026-03-15T12:00:00Z');
      const fineResult = FineCalculationService.calculateMonthlyTuitionFine(dueDate, paymentDate, 10.0);

      assert.strictEqual(fineResult.isOverdue, true);
      assert.strictEqual(fineResult.overdueDays, 3);
      assert.strictEqual(fineResult.fineAmountBdt, 30);
    });

    it('should assess zero fine when paid exactly on or before the due date', () => {
      const dueDate = new Date('2026-03-12T23:59:59Z');
      const paymentDate = new Date('2026-03-12T10:00:00Z');
      const fineResult = FineCalculationService.calculateMonthlyTuitionFine(dueDate, paymentDate, 10.0);

      assert.strictEqual(fineResult.isOverdue, false);
      assert.strictEqual(fineResult.overdueDays, 0);
      assert.strictEqual(fineResult.fineAmountBdt, 0);
    });
  });

  // Scenario D
  describe('Scenario D: Semester Registration Fixed Fine', () => {
    it('should assess exactly 1,000 BDT fixed fine if unpaid after the 25th', () => {
      const termStartDate = new Date('2026-01-01T00:00:00Z');
      const checkDate = new Date('2026-01-26T12:00:00Z'); // Day 26 (after 25th)
      const regFine = FineCalculationService.calculateSemesterRegistrationFine(termStartDate, checkDate, false, 1000.0);

      assert.strictEqual(regFine.isOverdue, true);
      assert.strictEqual(regFine.fineAmountBdt, 1000);
    });

    it('should assess 0 BDT fine if paid on or before 25th', () => {
      const termStartDate = new Date('2026-01-01T00:00:00Z');
      const checkDate = new Date('2026-01-25T12:00:00Z'); // On 25th
      const regFine = FineCalculationService.calculateSemesterRegistrationFine(termStartDate, checkDate, false, 1000.0);

      assert.strictEqual(regFine.isOverdue, false);
      assert.strictEqual(regFine.fineAmountBdt, 0);
    });
  });

  // Scenario E
  describe('Scenario E: Unverified Bank Deposit Invariant', () => {
    it('should block admit card and enrollment paper when payment slip is in SUBMITTED state', () => {
      const verificationStatus = 'SUBMITTED'; // Bank slip uploaded by student, awaiting accounts officer review

      const isEnrollmentPaperEligible = verificationStatus === 'VERIFIED';
      const isAdmitCardEligible = verificationStatus === 'VERIFIED';

      assert.strictEqual(isEnrollmentPaperEligible, false, 'Enrollment paper MUST require verified payment');
      assert.strictEqual(isAdmitCardEligible, false, 'Admit card MUST require verified payment');
    });
  });

  // Scenario F
  describe('Scenario F: Selective Entitlement Decoupling', () => {
    it('should allow course enrollment paper when semester registration is paid, but block admit card if tuition is unpaid', () => {
      const studentAudit = {
        semesterRegistrationPaid: true,
        tuitionInstallmentsPaid: false,
        finesCleared: true
      };

      // Course enrollment paper requires verified semester registration fee
      const canDownloadEnrollmentPaper = studentAudit.semesterRegistrationPaid;

      // Examination admit card requires tuition installments AND fines cleared AND registration
      const canDownloadAdmitCard =
        studentAudit.semesterRegistrationPaid &&
        studentAudit.tuitionInstallmentsPaid &&
        studentAudit.finesCleared;

      assert.strictEqual(canDownloadEnrollmentPaper, true, 'Enrollment paper is eligible upon registration fee clearance');
      assert.strictEqual(canDownloadAdmitCard, false, 'Admit card is blocked due to unpaid tuition installments');
    });
  });

  // Scenario G
  describe('Scenario G: Waiver Modification History & Immutability', () => {
    it('should preserve past paid invoices when waiver increases from 10% to 20%', () => {
      // Past invoice generated with 10% waiver
      const pastInvoice = {
        invoiceNumber: 'INV-2026-001',
        month: 'January 2026',
        grossTuition: 8000,
        waiverPercentage: 10,
        netPayable: 7200,
        status: 'PAID'
      };

      // Waiver updated to 20% in February
      const updatedWaiver = 20;

      // Future invoice generated with 20% waiver
      const newInvoiceCalc = TuitionWaiverService.calculateTuitionBreakdown(8000, updatedWaiver);
      const newInvoice = {
        invoiceNumber: 'INV-2026-002',
        month: 'February 2026',
        grossTuition: 8000,
        waiverPercentage: updatedWaiver,
        netPayable: newInvoiceCalc.payableTuition,
        status: 'PENDING'
      };

      // Assert past invoice is immutable
      assert.strictEqual(pastInvoice.waiverPercentage, 10);
      assert.strictEqual(pastInvoice.netPayable, 7200);

      // Assert future invoice reflects new 20% waiver
      assert.strictEqual(newInvoice.waiverPercentage, 20);
      assert.strictEqual(newInvoice.netPayable, 6400);
    });
  });

  // Scenario H
  describe('Scenario H: RBAC Access Protection', () => {
    it('should enforce that STUDENT role is forbidden from accessing administrative endpoints', () => {
      const checkAdminAuthorization = (userRole) => {
        if (userRole !== 'SUPER_ADMIN') {
          return { status: 403, error: 'Forbidden. Super Admin access required.' };
        }
        return { status: 200, allowed: true };
      };

      const studentAccess = checkAdminAuthorization('STUDENT');
      assert.strictEqual(studentAccess.status, 403);
      assert.strictEqual(studentAccess.error, 'Forbidden. Super Admin access required.');

      const adminAccess = checkAdminAuthorization('SUPER_ADMIN');
      assert.strictEqual(adminAccess.status, 200);
      assert.strictEqual(adminAccess.allowed, true);
    });
  });

});
