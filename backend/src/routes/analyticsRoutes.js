const express = require('express');
const router = express.Router();
const { getSystemAnalytics } = require('../controllers/analyticsController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', verifyToken, requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER', 'DEPT_HEAD'), getSystemAnalytics);

module.exports = router;

