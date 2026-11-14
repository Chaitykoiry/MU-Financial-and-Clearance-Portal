/**
 * Metropolitan University — Tuition Waiver Service
 * 
 * CRITICAL CALCULATION RULE:
 * The tuition waiver applies STRICTLY to tuition / monthly credit fees.
 * It does NOT reduce:
 * - Admission Fee
 * - Semester Registration Fee
 * - Campus Activities Fee
 * - BNCC Fee
 * - Examination Fee
 * - Library Fine
 * - Late Payment Fines
 */

const prisma = require('../config/prisma');

class TuitionWaiverService {
  /**
   * Calculates net tuition for a student given base tuition and applicable waiver.
   * Transparent calculation:
   * Original Tuition: Tk. 8,000
   * Your Tuition Waiver: 20%
   * Waiver Amount: Tk. 1,600
   * Payable Tuition: Tk. 6,400
   */
  static calculateTuitionBreakdown(baseTuitionBdt, waiverPercentage = 0, fixedWaiverBdt = 0) {
    const originalTuition = Math.max(0, Number(baseTuitionBdt) || 0);
    const percentage = Math.max(0, Math.min(100, Number(waiverPercentage) || 0));
    
    let discountAmount = (originalTuition * percentage) / 100;
    if (fixedWaiverBdt > 0) {
      discountAmount = Math.min(originalTuition, discountAmount + Number(fixedWaiverBdt));
    }
    
    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100;
    const payableTuition = Math.max(0, Math.round((originalTuition - discountAmount) * 100) / 100);

    return {
      originalTuition,
      waiverPercentage: percentage,
      fixedWaiverBdt,
      discountAmount,
      payableTuition,
      appliedRule: percentage > 0 
        ? `${percentage}% Institutional Tuition Waiver applied to tuition fee only`
        : 'Standard tuition fee (No active waiver)'
    };
  }

  /**
   * Retrieves active waiver for a student profile.
   */
  static async getActiveWaiver(studentId) {
    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        waivers: {
          where: { status: 'ACTIVE' },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!student) return null;

    if (student.waivers && student.waivers.length > 0) {
      return student.waivers[0];
    }

    // Fallback to student profile waiver percentage
    if (student.tuitionWaiverPercentage > 0) {
      return {
        waiverType: 'PERCENTAGE',
        waiverPercentage: student.tuitionWaiverPercentage,
        fixedAmountBdt: 0,
        scholarshipCategory: student.scholarshipCategory || 'MERIT',
        applicableFeeCategory: 'TUITION',
        reason: 'Institutional scholarship allotment'
      };
    }

    return null;
  }

  /**
   * Assigns or updates a student's tuition waiver with immutable audit history.
   */
  static async assignWaiver(studentId, { waiverPercentage, waiverType = 'PERCENTAGE', fixedAmountBdt = 0, scholarshipCategory, reason, approvalAuthority, changedByUserId }) {
    const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!student) throw new Error('Student profile not found');

    const previousPercentage = student.tuitionWaiverPercentage || 0;
    const newPercentage = Number(waiverPercentage) || 0;

    return await prisma.$transaction(async (tx) => {
      // 1. Deactivate old waivers
      await tx.studentWaiver.updateMany({
        where: { studentId, status: 'ACTIVE' },
        data: { status: 'REVOKED' }
      });

      // 2. Create new active waiver
      const newWaiver = await tx.studentWaiver.create({
        data: {
          studentId,
          waiverType,
          waiverPercentage: newPercentage,
          fixedAmountBdt: Number(fixedAmountBdt) || 0,
          applicableFeeCategory: 'TUITION',
          scholarshipCategory: scholarshipCategory || 'MERIT',
          reason: reason || 'Approved scholarship concession',
          approvalAuthority: approvalAuthority || 'Academic Council / Vice Chancellor',
          status: 'ACTIVE'
        }
      });

      // 3. Update student profile
      await tx.studentProfile.update({
        where: { id: studentId },
        data: {
          tuitionWaiverPercentage: newPercentage,
          scholarshipCategory: scholarshipCategory || student.scholarshipCategory
        }
      });

      // 4. Log immutable waiver history
      await tx.waiverHistory.create({
        data: {
          studentId,
          previousPercentage,
          newPercentage,
          changedByUserId,
          reason: reason || `Updated waiver from ${previousPercentage}% to ${newPercentage}%`
        }
      });

      return newWaiver;
    });
  }
}

module.exports = TuitionWaiverService;

