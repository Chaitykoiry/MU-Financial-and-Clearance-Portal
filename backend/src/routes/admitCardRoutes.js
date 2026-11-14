const express = require('express');
const router = express.Router();
const {
  getStudentAdmitCardStatus,
  downloadAdmitCard,
  verifyAdmitCardByQr,
  listExaminationSessions,
  createExaminationSession,
  getEligibilityReport,
  grantOverride
} = require('../controllers/admitCardController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public QR Authenticator for Admit Cards
router.get('/verify/:qrToken', verifyAdmitCardByQr);

// Student Endpoints
router.get('/status', verifyToken, getStudentAdmitCardStatus);
router.get('/download', verifyToken, downloadAdmitCard);

// Admin Controls
router.get('/sessions', verifyToken, requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER'), listExaminationSessions);
router.post('/sessions', verifyToken, requireRole('SUPER_ADMIN'), createExaminationSession);
router.get('/eligibility-report', verifyToken, requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER'), getEligibilityReport);
router.post('/override', verifyToken, requireRole('SUPER_ADMIN'), grantOverride);

module.exports = router;

