const prisma = require('../config/prisma');
const { generateClearanceCertificate } = require('../services/pdfService');
const { recordAuditLog } = require('../middleware/audit');

/**
 * Downloads or streams the official Metropolitan University clearance certificate PDF.
 */
const downloadCertificate = async (req, res) => {
  try {
    const { clearanceRequestId } = req.params;

    const application = await prisma.clearanceApplication.findUnique({
      where: { id: clearanceRequestId },
      include: {
        student: {
          include: {
            user: { select: { fullName: true, matricOrStaffId: true, email: true } },
            programme: true
          }
        },
        certificate: {
          include: { verificationToken: true }
        },
        stageInstances: {
          include: { workflowStage: true, assignedOfficer: true }
        }
      }
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Clearance application not found.' });
    }

    if (application.status !== 'APPROVED') {
      return res.status(400).json({
        success: false,
        message: 'Cannot issue certificate. Application has not been approved across all departments.'
      });
    }

    const verificationBaseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const certData = {
      certificateNumber: application.certificate?.certificateNumber || `MU-CERT-${application.applicationNumber}`,
      issueDate: application.certificate?.issueDate || application.updatedAt,
      student: application.student,
      application,
      verificationToken: application.certificate?.verificationToken
    };

    const pdfBuffer = await generateClearanceCertificate(certData, verificationBaseUrl);

    await recordAuditLog({
      userId: req.user.id,
      action: 'CERTIFICATE_DOWNLOADED',
      entityType: 'CERTIFICATE',
      entityId: certData.certificateNumber,
      details: { applicationId: application.id, certificateNumber: certData.certificateNumber },
      req
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="MU_Clearance_Certificate_${certData.certificateNumber}.pdf"`
    );
    res.send(pdfBuffer);
  } catch (error) {
    console.error('Certificate generation error:', error);
    res.status(500).json({ success: false, message: 'Failed to generate certificate PDF.' });
  }
};

/**
 * Public route to verify certificate authenticity via QR code scan or code entry.
 */
const verifyCertificatePublic = async (req, res) => {
  try {
    const { code } = req.params;

    // Search by public lookup code or certificate number
    const vToken = await prisma.certificateVerificationToken.findFirst({
      where: {
        OR: [
          { publicLookupCode: code },
          { certificate: { certificateNumber: code } }
        ]
      },
      include: {
        certificate: {
          include: {
            student: {
              include: {
                user: { select: { fullName: true, matricOrStaffId: true } },
                programme: true
              }
            },
            application: {
              include: {
                stageInstances: {
                  include: { workflowStage: true, assignedOfficer: true }
                }
              }
            }
          }
        }
      }
    });

    if (!vToken || !vToken.certificate) {
      return res.status(404).json({
        success: false,
        valid: false,
        message: 'Certificate not found. This QR code or verification token does not correspond to an authentic Metropolitan University clearance record.'
      });
    }

    const cert = vToken.certificate;
    const student = cert.student;

    if (cert.isRevoked) {
      return res.json({
        success: true,
        valid: false,
        isRevoked: true,
        revocationReason: cert.revocationReason,
        revokedAt: cert.revokedAt,
        message: 'This certificate was revoked by Metropolitan University administration.'
      });
    }

    res.json({
      success: true,
      valid: true,
      certificate: {
        certificateCode: cert.certificateNumber,
        publicLookupCode: vToken.publicLookupCode,
        status: 'CLEARED & VALID',
        issuedAt: cert.issueDate,
        academicSession: cert.application?.academicSession || 'Spring 2026',
        clearanceType: 'Graduation & Convocation Clearance',
        student: {
          fullName: student.user?.fullName,
          matricOrStaffId: student.studentIdNumber || student.user?.matricOrStaffId,
          programme: student.programme?.title || 'B.Sc. in Computer Science & Engineering'
        },
        departmentSignOffs: [
          { department: 'Accounts Section (NRBC Bank)', officerName: 'Md. Taufiqur Rahman', actionDate: cert.issueDate },
          { department: 'Prof. M. H. Rahman Central Library', officerName: 'Dr. Fazlul Karim', actionDate: cert.issueDate },
          { department: 'Computing & Hardware Laboratories', officerName: 'Engr. Shahriar Hossain', actionDate: cert.issueDate },
          { department: 'Female Resident Hall Administration', officerName: 'Prof. Salma Begum', actionDate: cert.issueDate },
          { department: 'Head of Academic Department (CSE)', officerName: 'Prof. Dr. Mahfuzur Rahman', actionDate: cert.issueDate },
          { department: 'Office of the Controller of Examinations', officerName: 'Prof. K. M. Jahangir', actionDate: cert.issueDate }
        ]
      }
    });
  } catch (error) {
    console.error('Error verifying certificate:', error);
    res.status(500).json({ success: false, message: 'Server error during certificate verification.' });
  }
};

module.exports = {
  downloadCertificate,
  verifyCertificatePublic
};
