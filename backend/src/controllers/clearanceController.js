const prisma = require('../config/prisma');
const { recordAuditLog } = require('../middleware/audit');
const crypto = require('crypto');

/**
 * Initiates a new clearance application for Metropolitan University student.
 * Creates stage instances for all stages configured in the active workflow template.
 */
const initiateClearance = async (req, res) => {
  try {
    const userId = req.user.id;
    const { academicSession = 'Spring 2026', clearanceTypeCode = 'CONVOCATION' } = req.body;

    // 1. Resolve or auto-create StudentProfile if not yet created
    let studentProfile = await prisma.studentProfile.findFirst({
      where: { userId }
    });

    if (!studentProfile) {
      // Find default programme (CSE)
      const defaultProg = await prisma.programme.findFirst();
      studentProfile = await prisma.studentProfile.create({
        data: {
          userId,
          studentIdNumber: req.user.matricOrStaffId || `231-115-${Math.floor(100 + Math.random() * 900)}`,
          programmeId: defaultProg.id,
          batchNumber: 56,
          currentSemester: 8,
          cgpa: 3.75
        }
      });
    }

    // 2. Check for active clearance in progress
    const activeApp = await prisma.clearanceApplication.findFirst({
      where: {
        studentId: studentProfile.id,
        status: { in: ['SUBMITTED', 'IN_PROGRESS', 'FLAGGED'] }
      }
    });

    if (activeApp) {
      return res.status(400).json({
        success: false,
        message: 'You already have an active clearance application in progress.',
        applicationId: activeApp.id
      });
    }

    // 3. Resolve ClearanceType and Active Workflow
    let clearanceType = await prisma.clearanceType.findFirst({
      where: { code: clearanceTypeCode }
    });

    if (!clearanceType) {
      clearanceType = await prisma.clearanceType.findFirst();
    }

    const workflowTemplate = await prisma.workflowTemplate.findFirst({
      where: { clearanceTypeId: clearanceType.id, isActive: true },
      include: {
        versions: {
          where: { isPublished: true },
          include: { stages: { orderBy: { sequenceOrder: 'asc' } } },
          orderBy: { versionNumber: 'desc' },
          take: 1
        }
      }
    });

    const activeVersion = workflowTemplate?.versions?.[0];
    if (!activeVersion || !activeVersion.stages.length) {
      return res.status(400).json({
        success: false,
        message: 'No published workflow template available for this clearance event.'
      });
    }

    const appNumber = `MU-CLR-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 4. Create ClearanceApplication and Stage Instances in transaction
    const application = await prisma.$transaction(async (tx) => {
      const app = await tx.clearanceApplication.create({
        data: {
          applicationNumber: appNumber,
          studentId: studentProfile.id,
          clearanceTypeId: clearanceType.id,
          workflowVersionId: activeVersion.id,
          academicSession,
          status: 'IN_PROGRESS'
        }
      });

      // Instantiate each stage (Strictly Accounts, Library, and Department Head)
      const allowedStages = activeVersion.stages.filter((stage) => {
        const code = (stage.departmentCode || '').toUpperCase();
        const name = (stage.stageName || '').toLowerCase();
        return (
          code === 'ACCOUNTS' ||
          code === 'LIBRARY' ||
          code === 'CSE' ||
          code === 'SWE' ||
          code === 'EEE' ||
          code === 'BBA' ||
          code === 'LAW' ||
          code === 'ENG' ||
          code === 'ECO' ||
          code === 'DEPT_HEAD' ||
          name.includes('accounts') ||
          name.includes('library') ||
          name.includes('head')
        );
      });

      for (let i = 0; i < allowedStages.length; i++) {
        const stage = allowedStages[i];
        await tx.clearanceStageInstance.create({
          data: {
            applicationId: app.id,
            workflowStageId: stage.id,
            status: i === 0 ? 'PENDING' : 'LOCKED'
          }
        });
      }

      return app;
    });

    await recordAuditLog({
      userId,
      action: 'CLEARANCE_APPLICATION_SUBMITTED',
      entityType: 'CLEARANCE_APPLICATION',
      entityId: application.id,
      details: { applicationNumber: appNumber, academicSession, clearanceType: clearanceType.code },
      req
    });

    const fullApp = await prisma.clearanceApplication.findUnique({
      where: { id: application.id },
      include: {
        clearanceType: true,
        stageInstances: {
          include: { workflowStage: true, assignedOfficer: { select: { fullName: true } } }
        }
      }
    });

    res.status(201).json({
      success: true,
      message: 'Metropolitan University clearance application submitted successfully.',
      clearance: formatApplicationForClient(fullApp)
    });
  } catch (error) {
    console.error('Clearance initiation error:', error);
    res.status(500).json({ success: false, message: 'Failed to initiate clearance application.' });
  }
};

/**
 * Returns student's clearance applications with stage breakdown.
 */
const getMyClearances = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentProfile = await prisma.studentProfile.findFirst({
      where: { userId }
    });

    if (!studentProfile) {
      return res.json({ success: true, clearances: [] });
    }

    const applications = await prisma.clearanceApplication.findMany({
      where: { studentId: studentProfile.id },
      include: {
        clearanceType: true,
        certificate: { include: { verificationToken: true } },
        stageInstances: {
          include: {
            workflowStage: true,
            assignedOfficer: { select: { fullName: true } },
            issues: true
          },
          orderBy: { workflowStage: { sequenceOrder: 'asc' } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = applications.map(formatApplicationForClient);
    res.json({ success: true, clearances: formatted });
  } catch (error) {
    console.error('Error fetching student clearances:', error);
    res.status(500).json({ success: false, message: 'Failed to load clearance records.' });
  }
};

/**
 * Review queue for department officers and admin.
 */
const getAllClearances = async (req, res) => {
  try {
    const applications = await prisma.clearanceApplication.findMany({
      include: {
        student: {
          include: {
            user: { select: { fullName: true, email: true, matricOrStaffId: true } },
            programme: true
          }
        },
        clearanceType: true,
        certificate: { include: { verificationToken: true } },
        stageInstances: {
          include: {
            workflowStage: true,
            assignedOfficer: { select: { fullName: true } },
            issues: true
          },
          orderBy: { workflowStage: { sequenceOrder: 'asc' } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const formatted = applications.map(formatApplicationForClient);
    res.json({ success: true, count: formatted.length, clearances: formatted });
  } catch (error) {
    console.error('Error fetching applications list:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch applications.' });
  }
};

/**
 * Officer sign-off or flagging action for a clearance stage.
 */
const updateDepartmentApproval = async (req, res) => {
  try {
    const { clearanceRequestId, departmentId } = req.params;
    const { status, remarks, duesAmount } = req.body;
    const officerId = req.user.id;

    // Find the stage instance for this application
    const application = await prisma.clearanceApplication.findUnique({
      where: { id: clearanceRequestId },
      include: {
        stageInstances: {
          include: { workflowStage: true }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Clearance application not found.' });
    }

    // Match stage instance by department code or stage ID
    let stageInstance = application.stageInstances.find(
      (si) => si.id === departmentId || si.workflowStage?.departmentCode === departmentId
    );

    if (!stageInstance && application.stageInstances.length > 0) {
      stageInstance = application.stageInstances[0];
    }

    if (!stageInstance) {
      return res.status(404).json({ success: false, message: 'Clearance stage instance not found.' });
    }

    // Update Stage Instance
    const updatedStage = await prisma.clearanceStageInstance.update({
      where: { id: stageInstance.id },
      data: {
        status: status || 'APPROVED',
        assignedOfficerId: officerId,
        decidedAt: new Date(),
        officerRemarks: remarks || null
      },
      include: { workflowStage: true }
    });

    // If flagged with dues, create an issue record
    if (status === 'FLAGGED' && duesAmount > 0) {
      await prisma.clearanceIssue.create({
        data: {
          stageInstanceId: stageInstance.id,
          flagReason: remarks || 'Outstanding departmental liabilities require settlement.',
          duesAmountBdt: parseFloat(duesAmount)
        }
      });
    }

    await recordAuditLog({
      userId: officerId,
      action: `CLEARANCE_STAGE_${status}`,
      entityType: 'CLEARANCE_STAGE',
      entityId: stageInstance.id,
      details: { applicationId: application.id, stageName: updatedStage.workflowStage.stageName, status },
      req
    });

    // Check pipeline progression across required clearance units (Accounts, Library, Dept Head)
    const allStages = await prisma.clearanceStageInstance.findMany({
      where: { applicationId: application.id },
      include: { workflowStage: true },
      orderBy: { workflowStage: { sequenceOrder: 'asc' } }
    });

    const requiredStages = allStages.filter((si) => {
      const code = (si.workflowStage?.departmentCode || '').toUpperCase();
      const name = (si.workflowStage?.stageName || '').toLowerCase();
      return (
        code === 'ACCOUNTS' ||
        code === 'LIBRARY' ||
        code === 'CSE' ||
        code === 'SWE' ||
        code === 'EEE' ||
        code === 'BBA' ||
        code === 'LAW' ||
        code === 'ENG' ||
        code === 'ECO' ||
        code === 'DEPT_HEAD' ||
        name.includes('accounts') ||
        name.includes('library') ||
        name.includes('head')
      );
    });

    const activeStagesToEvaluate = requiredStages.length > 0 ? requiredStages : allStages;
    const allApproved = activeStagesToEvaluate.every((s) => s.status === 'APPROVED');
    const anyFlagged = activeStagesToEvaluate.some((s) => s.status === 'FLAGGED');
    const anyRejected = activeStagesToEvaluate.some((s) => s.status === 'REJECTED');

    let overallStatus = 'IN_PROGRESS';
    let certificateRecord = null;

    if (anyRejected) {
      overallStatus = 'REJECTED';
    } else if (anyFlagged) {
      overallStatus = 'FLAGGED';
    } else if (allApproved) {
      overallStatus = 'APPROVED';

      // Auto-issue Certificate
      const certNumber = `MU-CERT-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;
      const vLookupCode = `MU-VTOK-${Math.floor(100000 + Math.random() * 900000)}`;
      const cryptoToken = crypto.randomBytes(32).toString('hex');

      certificateRecord = await prisma.certificate.upsert({
        where: { applicationId: application.id },
        update: { isRevoked: false },
        create: {
          certificateNumber: certNumber,
          applicationId: application.id,
          studentId: application.studentId,
          certificateType: 'OFFICIAL_CLEARANCE_CERTIFICATE'
        }
      });

      await prisma.certificateVerificationToken.upsert({
        where: { certificateId: certificateRecord.id },
        update: {},
        create: {
          certificateId: certificateRecord.id,
          cryptographicToken: cryptoToken,
          publicLookupCode: vLookupCode
        }
      });

      await recordAuditLog({
        userId: officerId,
        action: 'CLEARANCE_CERTIFICATE_ISSUED',
        entityType: 'CERTIFICATE',
        entityId: certificateRecord.id,
        details: { certificateNumber: certNumber, publicLookupCode: vLookupCode },
        req
      });
    }

    // Unlock next stage if sequential
    if (status === 'APPROVED') {
      const currentIndex = allStages.findIndex((s) => s.id === stageInstance.id);
      if (currentIndex >= 0 && currentIndex + 1 < allStages.length) {
        const nextStage = allStages[currentIndex + 1];
        if (nextStage.status === 'LOCKED') {
          await prisma.clearanceStageInstance.update({
            where: { id: nextStage.id },
            data: { status: 'PENDING' }
          });
        }
      }
    }

    await prisma.clearanceApplication.update({
      where: { id: application.id },
      data: {
        status: overallStatus,
        certificateIssued: allApproved
      }
    });

    res.json({
      success: true,
      message: `Stage sign-off recorded as ${status}.`,
      stage: updatedStage
    });
  } catch (error) {
    console.error('Error updating clearance stage:', error);
    res.status(500).json({ success: false, message: 'Failed to update clearance stage.' });
  }
};

/**
 * Formats a clearance application to match frontend client models.
 */
function formatApplicationForClient(app) {
  const student = app.student;
  const user = student?.user;

  // Keep strictly Accounts & Finance, Library, and Department Head (rest are not required)
  const allowedStageInstances = (app.stageInstances || []).filter((si) => {
    const code = (si.workflowStage?.departmentCode || '').toUpperCase();
    const name = (si.workflowStage?.stageName || '').toLowerCase();
    return (
      code === 'ACCOUNTS' ||
      code === 'LIBRARY' ||
      code === 'CSE' ||
      code === 'SWE' ||
      code === 'EEE' ||
      code === 'BBA' ||
      code === 'LAW' ||
      code === 'ENG' ||
      code === 'ECO' ||
      code === 'DEPT_HEAD' ||
      name.includes('accounts') ||
      name.includes('library') ||
      name.includes('head')
    );
  });

  return {
    id: app.id,
    applicationNumber: app.applicationNumber,
    clearanceType: app.clearanceType?.title || 'Graduation & Convocation Clearance',
    academicSession: app.academicSession,
    status: app.status,
    certificateCode: app.certificate?.verificationToken?.publicLookupCode || app.certificate?.certificateNumber,
    certificateIssued: app.certificateIssued,
    issuedAt: app.certificate?.issueDate,
    createdAt: app.createdAt,
    student: {
      id: student?.id,
      fullName: user?.fullName || student?.fullName || 'Student',
      matricOrStaffId: student?.studentIdNumber || user?.matricOrStaffId || '231-115-094',
      email: user?.email,
      programme: student?.programme?.title || 'B.Sc. in Computer Science & Engineering'
    },
    departmentApprovals: allowedStageInstances.map((si, idx) => ({
      id: si.id,
      departmentId: si.workflowStage?.departmentCode || si.id,
      department: {
        code: si.workflowStage?.departmentCode || 'DEPT',
        name: si.workflowStage?.stageName || 'Department Stage',
        description: `Metropolitan University clearance stage ${idx + 1}`
      },
      status: si.status,
      duesAmount: si.issues?.reduce((acc, iss) => acc + (iss.isResolved ? 0 : iss.duesAmountBdt), 0) || 0,
      duesPaid: !si.issues?.some((iss) => !iss.isResolved && iss.duesAmountBdt > 0),
      remarks: si.officerRemarks,
      officer: si.assignedOfficer,
      actionDate: si.decidedAt
    }))
  };
}

module.exports = {
  initiateClearance,
  getMyClearances,
  getAllClearances,
  updateDepartmentApproval
};
