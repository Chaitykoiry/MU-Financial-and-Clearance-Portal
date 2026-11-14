const express = require('express');
const router = express.Router();
const {
  listFeeStructures,
  getFeeStructureByProgramme,
  updateFeeStructure
} = require('../controllers/feeStructureController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Public / Authenticated read
router.get('/', listFeeStructures);
router.get('/programme/:programmeCode', getFeeStructureByProgramme);

// Super Admin / Accounts write
router.put('/:id', verifyToken, requireRole('SUPER_ADMIN', 'ACCOUNTS_OFFICER'), updateFeeStructure);

module.exports = router;

