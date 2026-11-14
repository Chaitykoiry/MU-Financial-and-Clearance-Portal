const express = require('express');
const router = express.Router();
const {
  getFineRules,
  updateFineRule,
  getStudentFineAssessment,
  waiveStudentFine
} = require('../controllers/fineController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/rules', getFineRules);
router.put('/rules/:id', requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER'), updateFineRule);
router.get('/student/:studentId', getStudentFineAssessment);
router.post('/student/:studentId/waive', requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER'), waiveStudentFine);

module.exports = router;

