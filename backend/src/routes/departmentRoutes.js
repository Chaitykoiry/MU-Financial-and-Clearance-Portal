const express = require('express');
const router = express.Router();
const { getDepartments, createDepartment } = require('../controllers/departmentController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/', getDepartments);
router.post('/', verifyToken, requireRole('ADMIN'), createDepartment);

module.exports = router;

