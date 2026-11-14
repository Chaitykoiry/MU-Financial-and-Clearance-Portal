/**
 * Metropolitan University — Late-Payment Fine Controller
 */

const prisma = require('../config/prisma');
const FineCalculationService = require('../services/fineCalculationService');
const { recordAuditLog } = require('../middleware/audit');

const getFineRules = async (req, res) => {
  try {
    const rules = await prisma.fineRule.findMany({
      orderBy: { code: 'asc' }
    });
    res.json({ success: true, count: rules.length, rules });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to retrieve fine rules.' });
  }
};

const updateFineRule = async (req, res) => {
  try {
    const { id } = req.params;
    const { dueDay, fineStartDay, fineAmount, calculationMethod, gracePeriodDays, maxFineAmount, isActive } = req.body;

    const rule = await prisma.fineRule.update({
      where: { id },
      data: {
        ...(dueDay !== undefined && { dueDay: parseInt(dueDay, 10) }),
        ...(fineStartDay !== undefined && { fineStartDay: parseInt(fineStartDay, 10) }),
        ...(fineAmount !== undefined && { fineAmount: parseFloat(fineAmount) }),
        ...(calculationMethod && { calculationMethod }),
        ...(gracePeriodDays !== undefined && { gracePeriodDays: parseInt(gracePeriodDays, 10) }),
        ...(maxFineAmount !== undefined && { maxFineAmount: maxFineAmount ? parseFloat(maxFineAmount) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) })
      }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'FINE_RULE_UPDATED',
      entityType: 'FINE_RULE',
      entityId: id,
      details: req.body,
      req
    });

    res.json({ success: true, message: 'Fine policy rule updated successfully.', rule });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update fine rule.' });
  }
};

const getStudentFineAssessment = async (req, res) => {
  try {
    let studentId = req.params.studentId;

    // If student is requesting for themselves
    if (req.user.role === 'STUDENT') {
      const profile = await prisma.studentProfile.findFirst({ where: { userId: req.user.id } });
      if (!profile) return res.status(404).json({ success: false, message: 'Profile not found.' });
      studentId = profile.id;
    }

    const assessment = await FineCalculationService.assessStudentFines(studentId);
    res.json({ success: true, assessment });
  } catch (error) {
    console.error('Fine assessment error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to calculate fine assessment.' });
  }
};

const waiveStudentFine = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { waiverReason, waiveSemesterFine = false, waiveTuitionFines = true } = req.body;

    if (!waiverReason || waiverReason.trim().length < 5) {
      return res.status(400).json({ success: false, message: 'A mandatory waiver justification is required.' });
    }

    const student = await prisma.studentProfile.findUnique({ where: { id: studentId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    // Enable fineException on student profile
    await prisma.studentProfile.update({
      where: { id: studentId },
      data: { fineException: true }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'STUDENT_FINE_WAIVED',
      entityType: 'FINE',
      entityId: studentId,
      details: { studentId, waiverReason, waiveSemesterFine, waiveTuitionFines },
      req
    });

    res.json({
      success: true,
      message: `Fine waiver approved for student ${student.studentIdNumber}. Reason: ${waiverReason}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to waive fine.' });
  }
};

module.exports = {
  getFineRules,
  updateFineRule,
  getStudentFineAssessment,
  waiveStudentFine
};

