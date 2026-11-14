/**
 * Metropolitan University — Examination Admit Card Controller
 * 
 * Rules:
 * - Financial verification before admit card issuance
 * - Clear itemized reasons when blocked
 * - PDF generation with QR verification
 * - Admin examination session management & administrative override
 */

const prisma = require('../config/prisma');
const AdmitCardEligibilityService = require('../services/admitCardEligibilityService');
const DocumentGenerationService = require('../services/documentGenerationService');
const { recordAuditLog } = require('../middleware/audit');
const crypto = require('crypto');

const getStudentAdmitCardStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findFirst({ where: { userId } });
    if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });

    // Find active exam session
    const session = await prisma.examinationSession.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) {
      return res.json({
        success: true,
        isEligible: false,
        blockingReasons: ['No active examination session published at this time.']
      });
    }

    const eligibility = await AdmitCardEligibilityService.checkEligibility(student.id, session.id);

    res.json({
      success: true,
      session,
      ...eligibility
    });
  } catch (error) {
    console.error('Admit card status error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to check admit card eligibility.' });
  }
};

const downloadAdmitCard = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findFirst({
      where: { userId },
      include: {
        user: true,
        programme: { include: { department: true } }
      }
    });

    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const session = await prisma.examinationSession.findFirst({
      where: { isPublished: true },
      orderBy: { createdAt: 'desc' }
    });

    if (!session) {
      return res.status(400).json({ success: false, message: 'No active examination session available.' });
    }

    const eligibility = await AdmitCardEligibilityService.checkEligibility(student.id, session.id);

    if (!eligibility.isEligible && !eligibility.hasAdministrativeOverride) {
      return res.status(403).json({
        success: false,
        message: 'Examination Admit Card is blocked due to outstanding financial obligations.',
        blockingReasons: eligibility.blockingReasons
      });
    }

    // Resolve or create AdmitCard record
    let admitCard = await prisma.admitCard.findFirst({
      where: { studentId: student.id, examinationSessionId: session.id }
    });

    if (!admitCard) {
      const admitCardNumber = `MU-ADM-${new Date().getFullYear()}-${student.studentIdNumber.replace(/-/g, '')}`;
      const qrToken = crypto.randomBytes(24).toString('hex');

      admitCard = await prisma.admitCard.create({
        data: {
          admitCardNumber,
          studentId: student.id,
          examinationSessionId: session.id,
          examRollNumber: student.studentIdNumber,
          financialClearanceVerified: true,
          isPublished: true,
          qrToken
        }
      });
    }

    await recordAuditLog({
      userId,
      action: 'ADMIT_CARD_DOWNLOADED',
      entityType: 'ADMIT_CARD',
      entityId: admitCard.id,
      details: { admitCardNumber: admitCard.admitCardNumber, studentIdNumber: student.studentIdNumber },
      req
    });

    const pdfBuffer = await DocumentGenerationService.generateAdmitCard({
      student,
      session,
      admitCardNumber: admitCard.admitCardNumber,
      qrToken: admitCard.qrToken
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MU_Admit_Card_${student.studentIdNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating admit card PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate admit card PDF.' });
  }
};

const verifyAdmitCardByQr = async (req, res) => {
  try {
    const { qrToken } = req.params;

    const admitCard = await prisma.admitCard.findUnique({
      where: { qrToken },
      include: {
        student: {
          include: {
            user: { select: { fullName: true } },
            programme: { include: { department: true } }
          }
        },
        examinationSession: true
      }
    });

    if (!admitCard) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Invalid or unrecognized examination admit card QR code.'
      });
    }

    if (admitCard.isRevoked) {
      return res.json({
        success: true,
        valid: false,
        status: 'REVOKED',
        reason: admitCard.revocationReason || 'Admit card revoked by Controller of Examinations.',
        admitCardNumber: admitCard.admitCardNumber,
        candidateName: admitCard.student?.user?.fullName,
        studentId: admitCard.student?.studentIdNumber
      });
    }

    res.json({
      success: true,
      valid: true,
      status: 'VERIFIED_VALID',
      admitCardNumber: admitCard.admitCardNumber,
      candidateName: admitCard.student?.user?.fullName,
      studentId: admitCard.student?.studentIdNumber,
      examRoll: admitCard.examRollNumber,
      programme: admitCard.student?.programme?.title,
      session: admitCard.examinationSession?.name,
      financialAudited: admitCard.financialClearanceVerified,
      hasAdminOverride: Boolean(admitCard.overrideReason),
      issuedAt: admitCard.issuedAt
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Verification error.' });
  }
};

// --- Admin Controls ---

const listExaminationSessions = async (req, res) => {
  try {
    const sessions = await prisma.examinationSession.findMany({
      include: {
        academicTerm: true,
        _count: { select: { admitCards: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, count: sessions.length, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch examination sessions.' });
  }
};

const createExaminationSession = async (req, res) => {
  try {
    const { code, name, academicTermId, startDate, endDate, isPublished = true } = req.body;

    if (!code || !name) {
      return res.status(400).json({ success: false, message: 'Session code and name are required.' });
    }

    let termId = academicTermId;
    if (!termId) {
      const activeTerm = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
      termId = activeTerm?.id;
    }

    const session = await prisma.examinationSession.create({
      data: {
        code,
        name,
        academicTermId: termId,
        startDate: new Date(startDate || '2026-05-15'),
        endDate: new Date(endDate || '2026-05-30'),
        isPublished
      }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'EXAM_SESSION_CREATED',
      entityType: 'EXAMINATION_SESSION',
      entityId: session.id,
      details: { code, name },
      req
    });

    res.status(201).json({ success: true, message: 'Examination session created.', session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to create session.' });
  }
};

const getEligibilityReport = async (req, res) => {
  try {
    const { sessionId } = req.query;

    const session = sessionId
      ? await prisma.examinationSession.findUnique({ where: { id: sessionId } })
      : await prisma.examinationSession.findFirst({ where: { isPublished: true }, orderBy: { createdAt: 'desc' } });

    if (!session) {
      return res.json({ success: true, session: null, report: [] });
    }

    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { fullName: true, email: true } },
        programme: true
      },
      orderBy: { studentIdNumber: 'asc' }
    });

    const report = [];
    for (const st of students) {
      const eligibility = await AdmitCardEligibilityService.checkEligibility(st.id, session.id);
      report.push({
        studentId: st.id,
        studentIdNumber: st.studentIdNumber,
        fullName: st.user?.fullName,
        programme: st.programme?.title,
        isEligible: eligibility.isEligible,
        hasOverride: Boolean(eligibility.hasAdministrativeOverride),
        blockingReasons: eligibility.blockingReasons,
        financialSummary: eligibility.financialSummary
      });
    }

    res.json({ success: true, session, totalStudents: report.length, report });
  } catch (error) {
    console.error('Error compiling eligibility report:', error);
    res.status(500).json({ success: false, message: 'Failed to compile report.' });
  }
};

const grantOverride = async (req, res) => {
  try {
    const { studentId, sessionId, overrideReason } = req.body;

    if (!studentId || !overrideReason) {
      return res.status(400).json({ success: false, message: 'Student ID and justification reason are required.' });
    }

    let examSessionId = sessionId;
    if (!examSessionId) {
      const activeSession = await prisma.examinationSession.findFirst({ where: { isPublished: true } });
      examSessionId = activeSession?.id;
    }

    const admitCard = await AdmitCardEligibilityService.grantAdministrativeOverride(
      studentId,
      examSessionId,
      {
        overrideReason,
        authorizedByUserId: req.user.id
      }
    );

    await recordAuditLog({
      userId: req.user.id,
      action: 'ADMIT_CARD_OVERRIDE_GRANTED',
      entityType: 'ADMIT_CARD',
      entityId: admitCard.id,
      details: { studentId, overrideReason },
      req
    });

    res.json({
      success: true,
      message: 'Administrative financial override granted successfully. Admit card is now unlocked.',
      admitCard
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || 'Failed to grant override.' });
  }
};

module.exports = {
  getStudentAdmitCardStatus,
  downloadAdmitCard,
  verifyAdmitCardByQr,
  listExaminationSessions,
  createExaminationSession,
  getEligibilityReport,
  grantOverride
};

