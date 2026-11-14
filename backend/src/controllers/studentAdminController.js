/**
 * Metropolitan University — Admin Student Management Controller
 * 
 * Features:
 * - Create Student with automatic programme-fee structure pre-load
 * - Configure individual tuition waiver percentage & scholarship category
 * - Fine exception flags & special financial adjustments
 * - List, filter, view profile, update, reset credentials, bulk import
 */

const prisma = require('../config/prisma');
const bcrypt = require('bcryptjs');
const TuitionWaiverService = require('../services/tuitionWaiverService');
const { recordAuditLog } = require('../middleware/audit');

const listStudents = async (req, res) => {
  try {
    const { departmentCode, programmeCode, batch, status, hasWaiver, search, page = 1, limit = 50 } = req.query;

    const where = {};

    if (departmentCode) {
      where.programme = { department: { code: departmentCode } };
    }
    if (programmeCode) {
      where.programme = { ...where.programme, code: programmeCode };
    }
    if (batch) {
      where.batchNumber = parseInt(batch, 10);
    }
    if (status) {
      where.academicStatus = status;
    }
    if (hasWaiver === 'true') {
      where.tuitionWaiverPercentage = { gt: 0 };
    }

    if (search) {
      where.OR = [
        { studentIdNumber: { contains: search, mode: 'insensitive' } },
        { user: { fullName: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }

    const students = await prisma.studentProfile.findMany({
      where,
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true, isActive: true } },
        programme: { include: { department: true } },
        waivers: { where: { status: 'ACTIVE' }, take: 1 },
        semesterRegistrations: { take: 1, orderBy: { createdAt: 'desc' } },
        invoices: {
          take: 1,
          orderBy: { createdAt: 'desc' },
          select: { totalAmountBdt: true, paidAmountBdt: true, outstandingBalanceBdt: true, status: true }
        }
      },
      orderBy: { studentIdNumber: 'asc' },
      skip: (page - 1) * limit,
      take: parseInt(limit, 10)
    });

    const totalCount = await prisma.studentProfile.count({ where });

    res.json({
      success: true,
      students,
      totalCount,
      page: parseInt(page, 10),
      totalPages: Math.ceil(totalCount / limit)
    });
  } catch (error) {
    console.error('Error listing students:', error);
    res.status(500).json({ success: false, message: 'Failed to retrieve students list.' });
  }
};

const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;

    const student = await prisma.studentProfile.findUnique({
      where: { id },
      include: {
        user: { select: { fullName: true, email: true, phoneNumber: true, isActive: true, role: true } },
        programme: { include: { department: true } },
        waivers: { orderBy: { createdAt: 'desc' } },
        invoices: {
          include: {
            academicTerm: true,
            installmentSchedules: { orderBy: { installmentNumber: 'asc' } },
            items: true
          },
          orderBy: { createdAt: 'desc' }
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          include: { verifiedBy: { select: { fullName: true } } }
        },
        ledgerEntries: { orderBy: { createdAt: 'desc' } },
        semesterRegistrations: { include: { academicTerm: true } },
        admitCards: { include: { examinationSession: true } },
        clearances: {
          include: {
            clearanceType: true,
            stageInstances: { include: { workflowStage: true } },
            certificate: true
          }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    res.json({ success: true, student });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch student record.' });
  }
};

const createStudent = async (req, res) => {
  try {
    const {
      studentIdNumber,
      fullName,
      email,
      password = 'student123',
      phoneNumber,
      programmeCode = 'BSC_CSE',
      batchNumber = 58,
      intake = 'Spring 2026',
      currentSemester = 1,
      cgpa = 0.0,
      guardianName,
      guardianPhone,
      address,
      tuitionWaiverPercentage = 0,
      scholarshipCategory = 'MERIT',
      waiverReason,
      approvalAuthority,
      fineException = false,
      specialAdjustmentBdt = 0
    } = req.body;

    if (!studentIdNumber || !fullName || !email) {
      return res.status(400).json({
        success: false,
        message: 'Student ID Number, Full Name, and Email are mandatory.'
      });
    }

    // Check existing
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ matricOrStaffId: studentIdNumber }, { email }]
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `A student with ID ${studentIdNumber} or email ${email} already exists.`
      });
    }

    // Resolve Programme and ProgrammeFeeStructure
    const programme = await prisma.programme.findFirst({
      where: { code: programmeCode },
      include: {
        department: true,
        programmeFeeStructures: { where: { isActive: true }, take: 1 }
      }
    });

    if (!programme) {
      return res.status(400).json({ success: false, message: `Programme ${programmeCode} not found.` });
    }

    const feeStructure = programme.programmeFeeStructures?.[0];
    const baseMonthlyCreditFee = feeStructure ? feeStructure.monthlyCreditFeeBdt : 8000.0;
    const registrationFee = feeStructure ? feeStructure.registrationFeeBdt : 15000.0;

    // Resolve active academic term
    const currentTerm = await prisma.academicTerm.findFirst({
      where: { isCurrent: true }
    });

    const passwordHash = await bcrypt.hash(password, 10);
    const waiverPct = Math.max(0, Math.min(100, Number(tuitionWaiverPercentage) || 0));

    // Calculate tuition discount (Tuition ONLY!)
    const totalTermTuition = baseMonthlyCreditFee * 4; // 4 monthly installments
    const waiverBreakdown = TuitionWaiverService.calculateTuitionBreakdown(totalTermTuition, waiverPct);

    const totalTermAmount = totalTermTuition;
    const netPayableTerm = waiverBreakdown.payableTuition;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          fullName,
          matricOrStaffId: studentIdNumber,
          role: 'STUDENT',
          departmentId: programme.departmentId,
          phoneNumber,
          isActive: true
        }
      });

      // 2. Create StudentProfile
      const profile = await tx.studentProfile.create({
        data: {
          userId: user.id,
          studentIdNumber,
          programmeId: programme.id,
          batchNumber: parseInt(batchNumber, 10),
          intake,
          admissionDate: new Date(),
          currentSemester: parseInt(currentSemester, 10),
          cgpa: parseFloat(cgpa) || 0.0,
          guardianName,
          guardianPhone,
          address,
          tuitionWaiverPercentage: waiverPct,
          scholarshipCategory: waiverPct > 0 ? scholarshipCategory : null,
          fineException: Boolean(fineException),
          specialAdjustmentBdt: parseFloat(specialAdjustmentBdt) || 0.0
        }
      });

      // 3. Create StudentWaiver record if waiver > 0
      if (waiverPct > 0) {
        await tx.studentWaiver.create({
          data: {
            studentId: profile.id,
            waiverType: 'PERCENTAGE',
            waiverPercentage: waiverPct,
            applicableFeeCategory: 'TUITION',
            scholarshipCategory,
            reason: waiverReason || `${waiverPct}% Scholarship Allotment`,
            approvalAuthority: approvalAuthority || 'Vice Chancellor Approval',
            status: 'ACTIVE'
          }
        });
      }

      // 4. Create Semester Registration Record
      if (currentTerm) {
        await tx.semesterRegistration.create({
          data: {
            studentId: profile.id,
            academicTermId: currentTerm.id,
            registrationFeeBdt: registrationFee,
            isFeePaid: false,
            status: 'PENDING_FEE'
          }
        });

        // 5. Create 4-Installment Term Invoice
        const invNumber = `MU-INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
        const invoice = await tx.studentInvoice.create({
          data: {
            invoiceNumber: invNumber,
            studentId: profile.id,
            academicTermId: currentTerm.id,
            totalAmountBdt: totalTermAmount,
            waiverAmountBdt: waiverBreakdown.discountAmount,
            paidAmountBdt: 0.0,
            outstandingBalanceBdt: netPayableTerm,
            status: 'UNPAID'
          }
        });

        // Split net payable into 4 equal installments
        const installmentAmount = Math.round((netPayableTerm / 4) * 100) / 100;
        const termStart = new Date(currentTerm.startDate);

        for (let i = 1; i <= 4; i++) {
          const dueDate = new Date(termStart.getFullYear(), termStart.getMonth() + (i - 1), 12);
          await tx.installmentSchedule.create({
            data: {
              invoiceId: invoice.id,
              installmentNumber: i,
              dueDate,
              amountBdt: installmentAmount,
              status: 'PENDING'
            }
          });
        }

        // Ledger Entry
        await tx.studentLedgerEntry.create({
          data: {
            studentId: profile.id,
            entryType: 'DEBIT_INVOICE',
            amountBdt: netPayableTerm,
            runningBalanceBdt: netPayableTerm,
            referenceEntityType: 'INVOICE',
            referenceEntityId: invoice.id,
            narration: `Spring Term 2026 Tuition Billing (4 installments of Tk. ${installmentAmount})`
          }
        });
      }

      return { user, profile };
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'STUDENT_CREATED',
      entityType: 'STUDENT',
      entityId: result.profile.id,
      details: { studentIdNumber, fullName, programmeCode, waiverPct },
      req
    });

    res.status(201).json({
      success: true,
      message: `Student ${fullName} (${studentIdNumber}) created successfully.`,
      student: result.profile
    });
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create student.' });
  }
};

const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      phoneNumber,
      batchNumber,
      intake,
      currentSemester,
      academicStatus,
      cgpa,
      guardianName,
      guardianPhone,
      address,
      fineException,
      specialAdjustmentBdt
    } = req.body;

    const student = await prisma.studentProfile.findUnique({ where: { id }, include: { user: true } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const updated = await prisma.$transaction(async (tx) => {
      if (fullName || phoneNumber) {
        await tx.user.update({
          where: { id: student.userId },
          data: {
            ...(fullName && { fullName }),
            ...(phoneNumber && { phoneNumber })
          }
        });
      }

      return await tx.studentProfile.update({
        where: { id },
        data: {
          ...(batchNumber && { batchNumber: parseInt(batchNumber, 10) }),
          ...(intake && { intake }),
          ...(currentSemester && { currentSemester: parseInt(currentSemester, 10) }),
          ...(academicStatus && { academicStatus }),
          ...(cgpa !== undefined && { cgpa: parseFloat(cgpa) }),
          ...(guardianName && { guardianName }),
          ...(guardianPhone && { guardianPhone }),
          ...(address && { address }),
          ...(fineException !== undefined && { fineException: Boolean(fineException) }),
          ...(specialAdjustmentBdt !== undefined && { specialAdjustmentBdt: parseFloat(specialAdjustmentBdt) })
        }
      });
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'STUDENT_UPDATED',
      entityType: 'STUDENT',
      entityId: id,
      details: req.body,
      req
    });

    res.json({ success: true, message: 'Student profile updated successfully.', student: updated });
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ success: false, message: 'Failed to update student profile.' });
  }
};

const assignTuitionWaiver = async (req, res) => {
  try {
    const { id } = req.params;
    const { waiverPercentage, scholarshipCategory, reason, approvalAuthority } = req.body;

    if (waiverPercentage === undefined || waiverPercentage === null) {
      return res.status(400).json({ success: false, message: 'Waiver percentage is required.' });
    }

    const waiver = await TuitionWaiverService.assignWaiver(id, {
      waiverPercentage,
      scholarshipCategory,
      reason,
      approvalAuthority,
      changedByUserId: req.user.id
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'TUITION_WAIVER_ASSIGNED',
      entityType: 'WAIVER',
      entityId: waiver.id,
      details: { studentId: id, waiverPercentage, scholarshipCategory, reason },
      req
    });

    res.json({
      success: true,
      message: `Tuition waiver of ${waiverPercentage}% assigned successfully.`,
      waiver
    });
  } catch (error) {
    console.error('Error assigning waiver:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to assign waiver.' });
  }
};

const resetStudentPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword = 'student123' } = req.body;

    const student = await prisma.studentProfile.findUnique({ where: { id } });
    if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: student.userId },
      data: { passwordHash }
    });

    await recordAuditLog({
      userId: req.user.id,
      action: 'STUDENT_PASSWORD_RESET',
      entityType: 'USER',
      entityId: student.userId,
      details: { studentId: id },
      req
    });

    res.json({ success: true, message: `Password for student reset to default (${newPassword}).` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reset password.' });
  }
};

module.exports = {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  assignTuitionWaiver,
  resetStudentPassword
};

