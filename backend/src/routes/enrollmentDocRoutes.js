const express = require('express');
const router = express.Router();
const {
  getEnrollmentPaperStatus,
  downloadEnrollmentPaper
} = require('../controllers/enrollmentDocController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/status', getEnrollmentPaperStatus);
router.get('/download', downloadEnrollmentPaper);

module.exports = router;

