const express = require('express');
const router = express.Router();
const {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  assignTuitionWaiver,
  resetStudentPassword
} = require('../controllers/studentAdminController');
const { verifyToken, requireRole } = require('../middleware/auth');

// All student administrative routes require SUPER_ADMIN or ACCOUNTS_OFFICER
router.use(verifyToken);
router.use(requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER'));

router.get('/', listStudents);
router.post('/', createStudent);
router.get('/:id', getStudentById);
router.put('/:id', updateStudent);
router.post('/:id/waiver', assignTuitionWaiver);
router.post('/:id/reset-password', resetStudentPassword);

module.exports = router;

