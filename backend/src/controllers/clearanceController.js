const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const crypto = require('crypto');

/**
 * Initiates a new clearance request for the logged-in student.
 * Creates approval placeholders for each department in the system.
 */
const initiateClearance = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { academicSession, clearanceType } = req.body;

    if (!academicSession) {
      return res.status(400).json({ success: false, message: 'Academic session is required (e.g. 2025/2026).' });
    }

    // Check if user already has a pending or in-progress clearance
    const existing = await prisma.clearanceRequest.findFirst({
      where: {
        studentId,
        status: { in: ['PENDING', 'IN_PROGRESS'] }
      }
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active clearance request in progress.',
        clearanceId: existing.id
      });
    }

    // Retrieve all departments
    const departments = await prisma.department.findMany({
      orderBy: { name: 'asc' }
    });

    if (departments.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No institutional departments configured in the system.'
      });
    }

    // Create clearance request and department approval rows in a transaction
    const clearance = await prisma.$transaction(async (tx) => {
      const newRequest = await tx.clearanceRequest.create({
        data: {
          studentId,
          academicSession,
          clearanceType: clearanceType || 'GRADUATION',
          status: 'IN_PROGRESS'
        }
      });

      // Prepare department approvals
      const approvalData = departments.map((dept) => ({
        clearanceRequestId: newRequest.id,
        departmentId: dept.id,
        status: 'PENDING',
        duesAmount: dept.requiresPayment ? 100.0 : 0.0, // demo dues for payment-required depts
        duesPaid: dept.requiresPayment ? false : true
      }));

      await tx.departmentApproval.createMany({
        data: approvalData
      });

      return newRequest;
    });

    const fullClearance = await prisma.clearanceRequest.findUnique({
      where: { id: clearance.id },
      include: {
        departmentApprovals: {
          include: { department: true }
        }
      }
    });

    await recordAuditLog({
      userId: studentId,
      action: 'CLEARANCE_INITIATED',
      entityType: 'CLEARANCE_REQUEST',
      entityId: clearance.id,
      details: { academicSession, clearanceType: clearance.clearanceType },
      req
    });

    res.status(201).json({
      success: true,
      message: 'Clearance request initiated successfully across all departments.',
      clearance: fullClearance
    });
  } catch (error) {
    console.error('Error initiating clearance:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate clearance request.' });
  }
};

/**
 * Returns all clearance requests for the authenticated student.
 */
const getMyClearances = async (req, res) => {
  try {
    const studentId = req.user.id;
    const clearances = await prisma.clearanceRequest.findMany({
      where: { studentId },
      include: {
        departmentApprovals: {
          include: {
            department: true,
            officer: { select: { fullName: true, email: true } }
          }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, clearances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch clearance requests.' });
  }
};

/**
 * Get details of a single clearance request.
 */
const getClearanceById = async (req, res) => {
  try {
    const { id } = req.params;
    const clearance = await prisma.clearanceRequest.findUnique({
      where: { id },
      include: {
        student: {
          select: { id: true, fullName: true, matricOrStaffId: true, email: true }
        },
        departmentApprovals: {
          include: {
            department: true,
            officer: { select: { fullName: true, email: true } }
          }
        },
        payments: true
      }
    });

    if (!clearance) {
      return res.status(404).json({ success: false, message: 'Clearance request not found.' });
    }

    // Role check: Only the student themselves, an officer, or an admin can view
    if (
      req.user.role === 'STUDENT' &&
      clearance.studentId !== req.user.id
    ) {
      return res.status(403).json({ success: false, message: 'Unauthorized access to this clearance record.' });
    }

    res.json({ success: true, clearance });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch clearance details.' });
  }
};

/**
 * Action by Department Officer to Approve, Reject, or Hold clearance for their department.
 */
const updateDepartmentApproval = async (req, res) => {
  try {
    const { clearanceRequestId, departmentId } = req.params;
    const { status, duesAmount, duesPaid, remarks } = req.body;
    const officerId = req.user.id;

    // Validate that officer is authorized for this department if role is DEPARTMENT_OFFICER
    if (req.user.role === 'DEPARTMENT_OFFICER' && req.user.departmentId !== departmentId) {
      return res.status(403).json({
        success: false,
        message: 'You are only authorized to sign off for your designated department.'
      });
    }

    const approval = await prisma.departmentApproval.findUnique({
      where: {
        clearanceRequestId_departmentId: {
          clearanceRequestId,
          departmentId
        }
      },
      include: { department: true }
    });

    if (!approval) {
      return res.status(404).json({ success: false, message: 'Department approval record not found.' });
    }

    // Update approval status
    const updatedApproval = await prisma.departmentApproval.update({
      where: {
        clearanceRequestId_departmentId: {
          clearanceRequestId,
          departmentId
        }
      },
      data: {
        status: status || approval.status,
        duesAmount: duesAmount !== undefined ? parseFloat(duesAmount) : approval.duesAmount,
        duesPaid: duesPaid !== undefined ? Boolean(duesPaid) : approval.duesPaid,
        remarks: remarks !== undefined ? remarks : approval.remarks,
        officerId,
        actionDate: new Date()
      },
      include: { department: true, officer: { select: { fullName: true } } }
    });

    await recordAuditLog({
      userId: officerId,
      action: `DEPT_${status || 'UPDATED'}`,
      entityType: 'DEPARTMENT_APPROVAL',
      entityId: updatedApproval.id,
      details: {
        clearanceRequestId,
        departmentCode: updatedApproval.department.code,
        status,
        remarks
      },
      req
    });

    // Check clearance pipeline: are ALL departments now APPROVED and no unpaid dues?
    const allApprovals = await prisma.departmentApproval.findMany({
      where: { clearanceRequestId }
    });

    const allApproved = allApprovals.every((a) => a.status === 'APPROVED' && a.duesPaid === true);
    const anyRejected = allApprovals.some((a) => a.status === 'REJECTED');

    let updatedRequestStatus = 'IN_PROGRESS';
    let certificateCode = null;
    let issuedAt = null;

    if (anyRejected) {
      updatedRequestStatus = 'REJECTED';
    } else if (allApproved) {
      updatedRequestStatus = 'APPROVED';
      certificateCode = `CPCS-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
      issuedAt = new Date();
    }

    const updatedClearance = await prisma.clearanceRequest.update({
      where: { id: clearanceRequestId },
      data: {
        status: updatedRequestStatus,
        ...(certificateCode && { certificateCode, issuedAt })
      },
      include: {
        student: { select: { id: true, fullName: true, matricOrStaffId: true, email: true } },
        departmentApprovals: {
          include: { department: true, officer: { select: { fullName: true } } }
        }
      }
    });

    if (updatedRequestStatus === 'APPROVED') {
      await recordAuditLog({
        userId: officerId,
        action: 'CLEARANCE_FULLY_APPROVED',
        entityType: 'CLEARANCE_REQUEST',
        entityId: clearanceRequestId,
        details: { certificateCode, totalDepartments: allApprovals.length },
        req
      });
    }

    res.json({
      success: true,
      message: `Department sign-off recorded as ${status}.`,
      approval: updatedApproval,
      clearance: updatedClearance
    });
  } catch (error) {
    console.error('Error updating department clearance:', error);
    res.status(500).json({ success: false, message: 'Failed to update department clearance.' });
  }
};

/**
 * List all clearance requests (Officer & Admin view).
 */
const getAllClearances = async (req, res) => {
  try {
    const { status, session } = req.query;

    const where = {};
    if (status) where.status = status;
    if (session) where.academicSession = session;

    const clearances = await prisma.clearanceRequest.findMany({
      where,
      include: {
        student: {
          select: { id: true, fullName: true, matricOrStaffId: true, email: true }
        },
        departmentApprovals: {
          include: { department: true, officer: { select: { fullName: true } } }
        },
        payments: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, count: clearances.length, clearances });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch clearances list.' });
  }
};

module.exports = {
  initiateClearance,
  getMyClearances,
  getClearanceById,
  updateDepartmentApproval,
  getAllClearances
};
