/**
 * Metropolitan University — Course Selection, Advisor Approval & Course Enrollment Paper Controller
 * 
 * Features:
 * 1. Interactive Student Course Selection (Regular & Retake/Improvement courses up to 18.0 credit limit)
 * 2. Department Head / Academic Advisor Approval Queue
 * 3. Official Course Enrollment Paper PDF generation upon verified registration fee + approved courses
 */

const prisma = require('../config/prisma');
const DocumentGenerationService = require('../services/documentGenerationService');
const { recordAuditLog } = require('../middleware/audit');

const MAX_SEMESTER_CREDITS = 18.0;

/**
 * Ensures a rich catalog of courses exists for interactive selection
 */
async function ensureCourseCatalog(departmentId) {
  const count = await prisma.course.count();
  if (count < 8 && departmentId) {
    const extraCourses = [
      { code: 'CSE-411', title: 'Artificial Intelligence & Expert Systems', credits: 3.0, semester: 7 },
      { code: 'CSE-412', title: 'Artificial Intelligence Lab', credits: 1.5, semester: 7 },
      { code: 'CSE-421', title: 'Machine Learning & Data Mining', credits: 3.0, semester: 8 },
      { code: 'CSE-422', title: 'Machine Learning Sessional', credits: 1.5, semester: 8 },
      { code: 'CSE-431', title: 'Cryptography & Network Security', credits: 3.0, semester: 8 },
      { code: 'CSE-449', title: 'Cloud Computing & Distributed Systems', credits: 3.0, semester: 8 },
      { code: 'CSE-499', title: 'Final Year Thesis / Capstone Project II', credits: 3.0, semester: 8 },
      { code: 'GED-205', title: 'Bangladesh Studies & Professional Ethics', credits: 3.0, semester: 4 }
    ];
    for (const c of extraCourses) {
      await prisma.course.upsert({
        where: { code: c.code },
        update: {},
        create: {
          ...c,
          departmentId
        }
      });
    }
  }
  return prisma.course.findMany({
    orderBy: [{ semester: 'asc' }, { code: 'asc' }]
  });
}

const getEnrollmentPaperStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const student = await prisma.studentProfile.findFirst({
      where: { userId },
      include: {
        programme: { include: { department: true } },
        semesterRegistrations: {
          include: { academicTerm: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        courseEnrollments: {
          include: { course: true },
          orderBy: { createdAt: 'asc' }
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

    const availableCourses = await ensureCourseCatalog(student.programme?.departmentId);

    const reg = student.semesterRegistrations?.[0];
    const isFeePaid = reg ? reg.isFeePaid : false;

    const enrollments = student.courseEnrollments || [];
    const totalSelectedCredits = enrollments.reduce((sum, ce) => sum + (ce.course?.credits || 0), 0);

    let advisorApprovalStatus = 'NOT_SUBMITTED';
    if (enrollments.length > 0) {
      const hasPending = enrollments.some((e) => e.status === 'PENDING_APPROVAL' || e.status === 'RETAKE_PENDING');
      const hasRejected = enrollments.some((e) => e.status === 'REJECTED');
      if (hasRejected) {
        advisorApprovalStatus = 'REJECTED';
      } else if (hasPending) {
        advisorApprovalStatus = 'PENDING_APPROVAL';
      } else {
        advisorApprovalStatus = 'APPROVED';
      }
    }

    const blockingReasons = [];
    if (!isFeePaid) {
      blockingReasons.push(
        `Semester registration fee (Tk. ${reg?.registrationFeeBdt?.toLocaleString() || '15,000'}) is unpaid or pending verification.`
      );
    }
    if (enrollments.length === 0) {
      blockingReasons.push('No semester courses selected yet. Please select your courses below.');
    } else if (advisorApprovalStatus === 'PENDING_APPROVAL') {
      blockingReasons.push('Your course selection is awaiting Department Head / Academic Advisor approval.');
    } else if (advisorApprovalStatus === 'REJECTED') {
      blockingReasons.push('Your course selection was returned by your Academic Advisor for revision.');
    }

    const isEligible = isFeePaid && advisorApprovalStatus === 'APPROVED';

    const selectedCourses = enrollments.map((ce) => ({
      enrollmentId: ce.id,
      courseId: ce.courseId,
      code: ce.course?.code,
      title: ce.course?.title,
      credits: ce.course?.credits,
      semester: ce.course?.semester,
      status: ce.status,
      enrollmentType: ce.status.startsWith('RETAKE') ? 'RETAKE' : 'REGULAR'
    }));

    res.json({
      success: true,
      isEligible,
      blockingReasons,
      registrationStatus: reg ? reg.status : 'PENDING_FEE',
      isFeePaid,
      registrationFeeBdt: reg ? reg.registrationFeeBdt : 15000.0,
      advisorApprovalStatus,
      totalSelectedCredits,
      maxCreditLimit: MAX_SEMESTER_CREDITS,
      selectedCourses,
      availableCourses,
      existingDocument: student.courseEnrollmentDocs?.[0] || null
    });
  } catch (error) {
    console.error('Error checking enrollment paper status:', error);
    res.status(500).json({ success: false, message: 'Failed to verify enrollment eligibility.' });
  }
};

/**
 * Student submits or updates semester course selection (Regular + Retake/Improvement)
 */
const submitCourseSelection = async (req, res) => {
  try {
    const userId = req.user.id;
    const { selections } = req.body; // Array of { courseId, enrollmentType: 'REGULAR' | 'RETAKE' }

    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please select at least one course for the semester.'
      });
    }

    const student = await prisma.studentProfile.findFirst({
      where: { userId },
      include: {
        user: true,
        semesterRegistrations: { orderBy: { createdAt: 'desc' }, take: 1 }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const courseIds = [...new Set(selections.map((s) => s.courseId))];
    const courses = await prisma.course.findMany({
      where: { id: { in: courseIds } }
    });

    if (courses.length === 0) {
      return res.status(400).json({ success: false, message: 'Selected courses not found in catalog.' });
    }

    const totalCredits = courses.reduce((sum, c) => sum + (c.credits || 0), 0);
    if (totalCredits > MAX_SEMESTER_CREDITS) {
      return res.status(400).json({
        success: false,
        message: `Credit limit exceeded: You selected ${totalCredits} credits, which exceeds the Metropolitan University maximum of ${MAX_SEMESTER_CREDITS} credits per semester.`
      });
    }

    let termId = student.semesterRegistrations?.[0]?.academicTermId;
    if (!termId) {
      const activeTerm = await prisma.academicTerm.findFirst({ where: { isCurrent: true } });
      termId = activeTerm?.id;
    }

    await prisma.$transaction(async (tx) => {
      // Remove existing enrollments for this student and term
      await tx.studentCourseEnrollment.deleteMany({
        where: { studentId: student.id }
      });

      // Insert new course enrollments in PENDING_APPROVAL state for Advisor review
      for (const item of selections) {
        const isRetake = item.enrollmentType === 'RETAKE';
        await tx.studentCourseEnrollment.create({
          data: {
            studentId: student.id,
            courseId: item.courseId,
            academicTermId: termId,
            status: isRetake ? 'RETAKE_PENDING' : 'PENDING_APPROVAL'
          }
        });
      }
    });

    await recordAuditLog({
      userId,
      action: 'STUDENT_COURSE_SELECTION_SUBMITTED',
      entityType: 'COURSE_ENROLLMENT',
      entityId: student.id,
      details: {
        studentIdNumber: student.studentIdNumber,
        courseCount: courses.length,
        totalCredits,
        selections
      },
      req
    });

    res.json({
      success: true,
      message: `Course selection (${courses.length} courses, ${totalCredits.toFixed(1)} credits) submitted to your Department Head / Academic Advisor for approval!`,
      totalCredits,
      courseCount: courses.length
    });
  } catch (error) {
    console.error('Error submitting course selection:', error);
    res.status(500).json({ success: false, message: 'Failed to submit course selection.' });
  }
};

/**
 * Department Head / Academic Advisor queue of student course registrations
 */
const getAdvisorCourseQueue = async (req, res) => {
  try {
    const students = await prisma.studentProfile.findMany({
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true } },
        programme: { include: { department: true } },
        semesterRegistrations: { orderBy: { createdAt: 'desc' }, take: 1 },
        courseEnrollments: {
          include: { course: true },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { studentIdNumber: 'asc' }
    });

    const queue = students
      .filter((s) => s.courseEnrollments && s.courseEnrollments.length > 0)
      .map((s) => {
        const enrollments = s.courseEnrollments;
        const totalCredits = enrollments.reduce((sum, ce) => sum + (ce.course?.credits || 0), 0);
        const hasPending = enrollments.some(
          (e) => e.status === 'PENDING_APPROVAL' || e.status === 'RETAKE_PENDING'
        );
        const hasRejected = enrollments.some((e) => e.status === 'REJECTED');
        const advisorStatus = hasRejected
          ? 'REJECTED'
          : hasPending
          ? 'PENDING_APPROVAL'
          : 'APPROVED';

        const reg = s.semesterRegistrations?.[0];

        return {
          studentId: s.id,
          studentIdNumber: s.studentIdNumber,
          fullName: s.user?.fullName,
          email: s.user?.email,
          programmeName: s.programme?.title || s.programme?.code,
          departmentCode: s.programme?.department?.code || 'CSE',
          batchNumber: s.batchNumber,
          currentSemester: s.currentSemester,
          cgpa: s.cgpa,
          isRegistrationFeePaid: reg ? reg.isFeePaid : false,
          totalCredits,
          advisorStatus,
          courses: enrollments.map((ce) => ({
            enrollmentId: ce.id,
            courseId: ce.courseId,
            code: ce.course?.code,
            title: ce.course?.title,
            credits: ce.course?.credits,
            status: ce.status,
            enrollmentType: ce.status.startsWith('RETAKE') ? 'RETAKE' : 'REGULAR'
          }))
        };
      });

    res.json({
      success: true,
      count: queue.length,
      queue
    });
  } catch (error) {
    console.error('Error loading advisor course queue:', error);
    res.status(500).json({ success: false, message: 'Failed to load advisor course approval queue.' });
  }
};

/**
 * Department Head / Academic Advisor approves or rejects a student's course selection
 */
const reviewStudentCourseSelection = async (req, res) => {
  try {
    const { studentId, decision, remarks } = req.body; // decision: 'APPROVED' | 'REJECTED'
    const advisorUserId = req.user.id;

    if (!studentId || !['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({
        success: false,
        message: 'Student ID and valid decision (APPROVED or REJECTED) are required.'
      });
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: studentId },
      include: {
        user: true,
        courseEnrollments: { include: { course: true } }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    await prisma.$transaction(async (tx) => {
      for (const ce of student.courseEnrollments) {
        const isRetake = ce.status.startsWith('RETAKE');
        const nextStatus =
          decision === 'APPROVED'
            ? isRetake
              ? 'RETAKE_ENROLLED'
              : 'ENROLLED'
            : 'REJECTED';

        await tx.studentCourseEnrollment.update({
          where: { id: ce.id },
          data: { status: nextStatus }
        });
      }

      await tx.notification.create({
        data: {
          userId: student.userId,
          title:
            decision === 'APPROVED'
              ? 'Course Registration Approved by Advisor ✓'
              : 'Course Selection Returned by Advisor',
          message:
            decision === 'APPROVED'
              ? `Your Spring 2026 course selection (${student.courseEnrollments.length} courses) has been approved by the Department Head / Academic Advisor. ${remarks ? `Remarks: "${remarks}"` : ''}`
              : `Your course selection requires revision: "${remarks || 'Please consult your academic advisor.'}"`,
          type: 'GENERAL'
        }
      });
    });

    await recordAuditLog({
      userId: advisorUserId,
      action: decision === 'APPROVED' ? 'ADVISOR_COURSE_SELECTION_APPROVED' : 'ADVISOR_COURSE_SELECTION_REJECTED',
      entityType: 'COURSE_ENROLLMENT',
      entityId: student.id,
      details: {
        studentIdNumber: student.studentIdNumber,
        decision,
        remarks,
        courseCount: student.courseEnrollments.length
      },
      req
    });

    res.json({
      success: true,
      message:
        decision === 'APPROVED'
          ? `Course registration for ${student.user?.fullName} (${student.studentIdNumber}) approved! Course Enrollment Paper is now unlocked.`
          : `Course selection for ${student.user?.fullName} marked as returned for revision.`
    });
  } catch (error) {
    console.error('Error reviewing student course selection:', error);
    res.status(500).json({ success: false, message: 'Failed to process advisor review.' });
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

    const hasUnapproved = (student.courseEnrollments || []).some(
      (ce) => ce.status === 'PENDING_APPROVAL' || ce.status === 'RETAKE_PENDING' || ce.status === 'REJECTED'
    );
    if (hasUnapproved) {
      return res.status(403).json({
        success: false,
        message: 'Course Enrollment Paper is locked until your Department Head / Academic Advisor approves your selected courses.'
      });
    }

    const docNumber = `MU-CEP-${new Date().getFullYear()}-${student.studentIdNumber.replace(/-/g, '')}`;

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
      type: ce.status === 'RETAKE_ENROLLED' ? 'Retake / Improvement' : 'Regular Mandatory'
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
  submitCourseSelection,
  getAdvisorCourseQueue,
  reviewStudentCourseSelection,
  downloadEnrollmentPaper
};
