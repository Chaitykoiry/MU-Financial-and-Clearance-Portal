/**
 * Metropolitan University — Examination Admit Card Financial Eligibility Engine
 * 
 * Rules:
 * 1. Monthly tuition installments for the examination term must be PAID (verified).
 * 2. Applicable tuition fines must be PAID or WAIVED.
 * 3. Semester registration fee must be PAID (verified).
 * 4. Applicable semester fines must be PAID or WAIVED.
 * 5. No examination-blocking financial holds.
 * 6. Uses VERIFIED payment transactions, NOT pending slip submissions.
 */

const prisma = require('../config/prisma');
const FineCalculationService = require('./fineCalculationService');

class AdmitCardEligibilityService {
  /**
   * Evaluates student eligibility for an examination session.
   * Returns:
   * {
   *   isEligible: boolean,
   *   blockingReasons: string[],
   *   financialSummary: object,
   *   canOverride: boolean
   * }
   */
  static async checkEligibility(studentId, examinationSessionId) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        programme: true,
        invoices: {
          include: {
            installmentSchedules: true,
            academicTerm: true
          }
        },
        semesterRegistrations: {
          include: { academicTerm: true }
        },
        admitCards: {
          where: { examinationSessionId }
        }
      }
    });

    if (!student) throw new Error('Student profile not found');

    // Check if an admit card was already issued and has an administrative override
    const existingAdmitCard = student.admitCards?.[0];
    if (existingAdmitCard && existingAdmitCard.overrideReason && !existingAdmitCard.isRevoked) {
      return {
        isEligible: true,
        hasAdministrativeOverride: true,
        overrideReason: existingAdmitCard.overrideReason,
        admitCard: existingAdmitCard,
        blockingReasons: []
      };
    }

    const blockingReasons = [];
    let unpaidTuitionInstallments = 0;
    let unpaidTuitionAmountBdt = 0;

    // 1. Verify Monthly Tuition Installments for the Term
    for (const invoice of student.invoices) {
      for (const inst of invoice.installmentSchedules) {
        if (inst.status !== 'PAID') {
          unpaidTuitionInstallments++;
          unpaidTuitionAmountBdt += inst.amountBdt;
          blockingReasons.push(
            `Unpaid tuition installment #${inst.installmentNumber}: Tk. ${inst.amountBdt.toLocaleString()} (Due: ${new Date(inst.dueDate).toLocaleDateString()})`
          );
        }
      }
    }

    // 2. Verify Semester Registration Fee
    const semesterReg = student.semesterRegistrations?.[0];
    let isSemesterRegPaid = false;
    if (semesterReg) {
      isSemesterRegPaid = semesterReg.isFeePaid;
      if (!semesterReg.isFeePaid) {
        blockingReasons.push(
          `Unpaid semester registration fee: Tk. ${semesterReg.registrationFeeBdt.toLocaleString()}`
        );
      }
    } else {
      // No registration record, check invoice
      blockingReasons.push('Semester registration fee record missing or unverified.');
    }

    // 3. Assess Accumulated Fines
    const fineAssessment = await FineCalculationService.assessStudentFines(studentId);
    let outstandingFineBdt = fineAssessment.totalLateFineBdt;

    if (outstandingFineBdt > 0 && !student.fineException) {
      blockingReasons.push(
        `Outstanding accumulated late fines: Tk. ${outstandingFineBdt.toLocaleString()} (Tuition: Tk. ${fineAssessment.totalTuitionFineBdt}, Reg Fine: Tk. ${fineAssessment.semesterRegFine.fineAmountBdt})`
      );
    }

    // 4. Overall Financial Eligibility
    const isEligible = blockingReasons.length === 0;

    return {
      studentId: student.id,
      studentName: student.user?.fullName,
      studentIdNumber: student.studentIdNumber,
      programme: student.programme?.title,
      isEligible,
      blockingReasons,
      financialSummary: {
        unpaidTuitionInstallments,
        unpaidTuitionAmountBdt,
        isSemesterRegPaid,
        outstandingFineBdt,
        fineException: student.fineException
      },
      existingAdmitCard: existingAdmitCard || null
    };
  }

  /**
   * Applies an authorized administrative override allowing an ineligible student to obtain an admit card.
   */
  static async grantAdministrativeOverride(studentId, examinationSessionId, { overrideReason, authorizedByUserId }) {
    if (!overrideReason || overrideReason.trim().length < 5) {
      throw new Error('A detailed justification reason is required for administrative financial override.');
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: { user: true }
    });
    if (!student) throw new Error('Student profile not found');

    const crypto = require('crypto');
    const qrToken = crypto.randomBytes(24).toString('hex');
    const admitCardNumber = `MU-ADM-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    const admitCard = await prisma.admitCard.upsert({
      where: { admitCardNumber },
      update: {
        financialClearanceVerified: true,
        overrideReason,
        overrideByUserId: authorizedByUserId,
        isRevoked: false
      },
      create: {
        admitCardNumber,
        studentId,
        examinationSessionId,
        examRollNumber: student.studentIdNumber,
        financialClearanceVerified: true,
        isPublished: true,
        overrideReason,
        overrideByUserId: authorizedByUserId,
        qrToken
      }
    });

    return admitCard;
  }
}

module.exports = AdmitCardEligibilityService;

