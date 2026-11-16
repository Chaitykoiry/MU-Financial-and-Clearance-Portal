const express = require('express');
const router = express.Router();
const {
  getEnrollmentPaperStatus,
  submitCourseSelection,
  getAdvisorCourseQueue,
  reviewStudentCourseSelection,
  downloadEnrollmentPaper
} = require('../controllers/enrollmentDocController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.use(verifyToken);

// Student endpoints
router.get('/status', getEnrollmentPaperStatus);
router.post('/select-courses', submitCourseSelection);
router.get('/download', downloadEnrollmentPaper);

// Department Head / Academic Advisor endpoints
router.get('/advisor-queue', requireRole('DEPT_HEAD', 'EXAM_CONTROLLER', 'SUPER_ADMIN'), getAdvisorCourseQueue);
router.post('/advisor-review', requireRole('DEPT_HEAD', 'EXAM_CONTROLLER', 'SUPER_ADMIN'), reviewStudentCourseSelection);

module.exports = router;
