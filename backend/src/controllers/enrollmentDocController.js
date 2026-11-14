/**
 * Metropolitan University — Course Enrollment Paper Controller
 * Generates and downloads official Course Enrollment Paper upon verified semester fee payment.
 */

const prisma = require('../config/prisma');
const DocumentGenerationService = require('../services/documentGenerationService');
const { recordAuditLog } = require('../middleware/audit');

const getEnrollmentPaperStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    let student = await prisma.studentProfile.findFirst({
      where: { userId },
      include: {
        programme: { include: { department: true } },
        semesterRegistrations: {
          include: { academicTerm: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        courseEnrollmentDocs: {
          take: 1,
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const reg = student.semesterRegistrations?.[0];
    const isFeePaid = reg ? reg.isFeePaid : false;

    const blockingReasons = [];
    if (!isFeePaid) {
      blockingReasons.push(
        `Semester registration fee (Tk. ${reg?.registrationFeeBdt?.toLocaleString() || '15,000'}) is unpaid or pending verification.`
      );
    }

    const isEligible = isFeePaid;

    res.json({
      success: true,
      isEligible,
      blockingReasons,
      registrationStatus: reg ? reg.status : 'PENDING_FEE',
      isFeePaid,
      registrationFeeBdt: reg ? reg.registrationFeeBdt : 15000.0,
      existingDocument: student.courseEnrollmentDocs?.[0] || null
    });
  } catch (error) {
    console.error('Error checking enrollment paper status:', error);
    res.status(500).json({ success: false, message: 'Failed to verify enrollment eligibility.' });
  }
};

const downloadEnrollmentPaper = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findFirst({
      where: { userId },
      include: {
        user: true,
        programme: { include: { department: true } },
        semesterRegistrations: {
          include: { academicTerm: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        courseEnrollments: {
          include: { course: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const reg = student.semesterRegistrations?.[0];
    if (!reg || !reg.isFeePaid) {
      return res.status(403).json({
        success: false,
        message: 'Course Enrollment Paper is locked. You must settle your Semester Registration Fee to download this document.'
      });
    }

    const docNumber = `MU-CEP-${new Date().getFullYear()}-${student.studentIdNumber.replace(/-/g, '')}`;

    // Record document generation in DB
    await prisma.courseEnrollmentDocument.upsert({
      where: { documentNumber: docNumber },
      update: { generatedAt: new Date() },
      create: {
        documentNumber: docNumber,
        studentId: student.id,
        academicTermId: reg.academicTermId,
        verificationStatus: 'VERIFIED',
        registrationFeePaid: true
      }
    });

    await recordAuditLog({
      userId,
      action: 'COURSE_ENROLLMENT_PAPER_DOWNLOADED',
      entityType: 'DOCUMENT',
      entityId: docNumber,
      details: { studentId: student.id, studentIdNumber: student.studentIdNumber },
      req
    });

    const enrolledCourses = student.courseEnrollments?.map((ce) => ({
      code: ce.course.code,
      title: ce.course.title,
      credits: ce.course.credits,
      type: 'Core Mandatory'
    }));

    const pdfBuffer = await DocumentGenerationService.generateCourseEnrollmentPaper({
      student,
      academicTerm: reg.academicTerm,
      documentNumber: docNumber,
      enrolledCourses
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="MU_Course_Enrollment_${student.studentIdNumber}.pdf"`);
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Error generating enrollment paper PDF:', error);
    res.status(500).json({ success: false, message: 'Failed to generate document PDF.' });
  }
};

module.exports = {
  getEnrollmentPaperStatus,
  downloadEnrollmentPaper
};

