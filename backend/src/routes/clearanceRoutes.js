const express = require('express');
const router = express.Router();
const {
  initiateClearance,
  getMyClearances,
  getClearanceById,
  updateDepartmentApproval,
  getAllClearances
} = require('../controllers/clearanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Student routes
router.post('/initiate', verifyToken, requireRole('STUDENT', 'ADMIN'), initiateClearance);
router.get('/my-clearances', verifyToken, requireRole('STUDENT'), getMyClearances);

// Shared / single clearance details
router.get('/:id', verifyToken, getClearanceById);

// Staff / Admin routes
router.get('/', verifyToken, requireRole('ADMIN', 'DEPARTMENT_OFFICER'), getAllClearances);
router.patch(
  '/:clearanceRequestId/department/:departmentId',
  verifyToken,
  requireRole('DEPARTMENT_OFFICER', 'ADMIN'),
  updateDepartmentApproval
);

module.exports = router;
