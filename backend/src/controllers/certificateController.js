const prisma = require('../config/prisma');
const { generateClearanceCertificate } = require('../services/pdfService');
const { recordAuditLog } = require('../middleware/audit');

/**
 * Downloads or streams the official PDF clearance certificate with QR code stamp.
 */
const downloadCertificate = async (req, res) => {
  try {
    const { clearanceRequestId } = req.params;

    const clearance = await prisma.clearanceRequest.findUnique({
      where: { id: clearanceRequestId },
      include: {
        student: { select: { id: true, fullName: true, matricOrStaffId: true, email: true } },
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
      return res.status(404).json({ success: false, message: 'Clearance record not found.' });
    }

    if (clearance.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot issue certificate. Clearance has not been fully approved by all departments.'
      });
    }

    // Role check: Only the student or staff can download
    if (req.user.role === 'STUDENT' && clearance.studentId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized to download this certificate.' });
    }

    const verificationBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const pdfBuffer = await generateClearanceCertificate(clearance, verificationBaseUrl);

    await recordAuditLog({
      userId: req.user.id,
      action: 'CERTIFICATE_DOWNLOADED',
      entityType: 'CERTIFICATE',
      entityId: clearance.certificateCode,
      details: { clearanceId: clearance.id, certificateCode: clearance.certificateCode },
      req
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="Clearance_Certificate_${clearance.certificateCode || 'CPCS'}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificate PDF.' });
  }
};

/**
 * Public route to verify certificate authenticity via QR code scan.
 */
const verifyCertificatePublic = async (req, res) => {
  try {
    const { code } = req.params;

    const clearance = await prisma.clearanceRequest.findUnique({
      where: { certificateCode: code },
      include: {
        student: { select: { fullName: true, matricOrStaffId: true } },
        departmentApprovals: {
          include: {
            department: { select: { name: true, code: true } },
            officer: { select: { fullName: true } }
          }
        }
      }
    });

    if (!clearance) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found. This QR code or code does not correspond to a valid issued clearance record.'
      });
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateCode: clearance.certificateCode,
        status: clearance.status,
        issuedAt: clearance.issuedAt,
        academicSession: clearance.academicSession,
        clearanceType: clearance.clearanceType,
        student: {
          fullName: clearance.student.fullName,
          matricOrStaffId: clearance.student.matricOrStaffId
        },
        departmentSignOffs: clearance.departmentApprovals.map((app) => ({
          department: app.department.name,
          departmentCode: app.department.code,
          status: app.status,
          officerName: app.officer?.fullName || 'Institutional Verifier',
          actionDate: app.actionDate
        }))
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error verifying certificate.' });
  }
};

module.exports = {
  downloadCertificate,
  verifyCertificatePublic
};
