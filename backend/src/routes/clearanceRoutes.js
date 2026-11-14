const express = require('express');
const router = express.Router();
const {
  initiateClearance,
  getMyClearances,
  updateDepartmentApproval,
  getAllClearances
} = require('../controllers/clearanceController');
const { verifyToken, requireRole } = require('../middleware/auth');

const ALL_OFFICER_ROLES = [
  'SUPER_ADMIN',
  'ACCOUNTS_OFFICER',
  'LIBRARY_OFFICER',
  'DEPT_HEAD'
];

// Student routes
router.post('/initiate', verifyToken, requireRole('STUDENT', 'SUPER_ADMIN'), initiateClearance);
router.get('/my-clearances', verifyToken, requireRole('STUDENT', 'SUPER_ADMIN'), getMyClearances);

// Staff / Officer / Admin review queues
router.get('/', verifyToken, requireRole(...ALL_OFFICER_ROLES), getAllClearances);
router.patch(
  '/:clearanceRequestId/department/:departmentId',
  verifyToken,
  requireRole(...ALL_OFFICER_ROLES),
  updateDepartmentApproval
);

module.exports = router;
