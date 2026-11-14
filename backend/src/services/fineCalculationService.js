/**
 * Metropolitan University — Automated Late-Payment Fine Engine
 * 
 * Rules:
 * 1. Monthly Tuition Fine:
 *    - Deadline: 12th of each month.
 *    - From the 13th onward: Tk. 10 fine per overdue day.
 *    - Formula: Fine = Number of Overdue Days * Tk. 10.
 *    - Applies only to UNPAID installments.
 * 
 * 2. Semester Registration Fine:
 *    - Deadline: 25th of the first month of the semester.
 *    - If unpaid after the 25th: Fixed Tk. 1,000 fine applied ONCE.
 */

const prisma = require('../config/prisma');

class FineCalculationService {
  /**
   * Calculates monthly tuition fine for a given due date and reference date.
   */
  static calculateMonthlyTuitionFine(dueDate, paymentDate = new Date(), dailyRate = 10.0) {
    const due = new Date(dueDate);
    const pay = new Date(paymentDate);

    // If payment date is before or on the due date, no fine
    if (pay <= due) {
      return {
        overdueDays: 0,
        dailyRate,
        fineAmountBdt: 0,
        isOverdue: false
      };
    }

    // Difference in calendar days
    const diffTime = pay.getTime() - due.getTime();
    const overdueDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (overdueDays <= 0) {
      return {
        overdueDays: 0,
        dailyRate,
        fineAmountBdt: 0,
        isOverdue: false
      };
    }

    const fineAmountBdt = overdueDays * dailyRate;

    return {
      overdueDays,
      dailyRate,
      fineAmountBdt,
      isOverdue: true,
      calculationFormula: `${overdueDays} overdue day(s) × Tk. ${dailyRate} = Tk. ${fineAmountBdt}`
    };
  }

  /**
   * Calculates semester registration fine:
   * Fixed 1,000 BDT if unpaid after the 25th of the semester start month.
   */
  static calculateSemesterRegistrationFine(termStartDate, checkDate = new Date(), isPaid = false, fixedFine = 1000.0) {
    if (isPaid) {
      return {
        isOverdue: false,
        fineAmountBdt: 0,
        reason: 'Semester registration fee is fully settled.'
      };
    }

    const start = new Date(termStartDate);
    const deadline = new Date(start.getFullYear(), start.getMonth(), 25, 23, 59, 59);
    const now = new Date(checkDate);

    if (now > deadline) {
      return {
        isOverdue: true,
        fineAmountBdt: fixedFine,
        deadlineDate: deadline,
        reason: `Semester registration deadline (${deadline.toLocaleDateString()}) passed. Fixed late fine applied.`
      };
    }

    return {
      isOverdue: false,
      fineAmountBdt: 0,
      deadlineDate: deadline,
      reason: `Within semester registration window (Due: ${deadline.toLocaleDateString()}).`
    };
  }

  /**
   * Evaluates student's current active fines across all unpaid installments & semester registration.
   */
  static async assessStudentFines(studentId, referenceDate = new Date()) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        invoices: {
          include: {
            installmentSchedules: true,
            academicTerm: true
          }
        },
        semesterRegistrations: {
          include: { academicTerm: true }
        }
      }
    });

    if (!student) throw new Error('Student profile not found');

    if (student.fineException) {
      return {
        tuitionFines: [],
        semesterRegFine: { fineAmountBdt: 0, isOverdue: false, reason: 'Student fine exception granted' },
        totalLateFineBdt: 0,
        fineException: true
      };
    }

    let totalTuitionFineBdt = 0;
    const tuitionFines = [];

    // 1. Evaluate monthly installment fines
    for (const invoice of student.invoices) {
      for (const inst of invoice.installmentSchedules) {
        if (inst.status !== 'PAID') {
          const fineResult = this.calculateMonthlyTuitionFine(inst.dueDate, referenceDate, 10.0);
          if (fineResult.isOverdue) {
            totalTuitionFineBdt += fineResult.fineAmountBdt;
            tuitionFines.push({
              installmentId: inst.id,
              installmentNumber: inst.installmentNumber,
              dueDate: inst.dueDate,
              amountBdt: inst.amountBdt,
              ...fineResult
            });
          }
        }
      }
    }

    // 2. Evaluate semester registration fine
    let semesterRegFine = { fineAmountBdt: 0, isOverdue: false };
    const currentReg = student.semesterRegistrations?.[0];
    if (currentReg && !currentReg.isFeePaid) {
      const termStart = currentReg.academicTerm?.startDate || new Date('2026-01-10');
      semesterRegFine = this.calculateSemesterRegistrationFine(termStart, referenceDate, false, 1000.0);
    }

    const totalLateFineBdt = totalTuitionFineBdt + semesterRegFine.fineAmountBdt;

    return {
      studentId,
      referenceDate,
      tuitionFines,
      totalTuitionFineBdt,
      semesterRegFine,
      totalLateFineBdt,
      fineException: false
    };
  }
}

module.exports = FineCalculationService;

