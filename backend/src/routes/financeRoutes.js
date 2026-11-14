const express = require('express');
const router = express.Router();
const {
  getMyFinancialOverview,
  getMyInvoices,
  getMyLedger,
  getFeeCategories,
  createFeeCategory
} = require('../controllers/financeController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/overview', verifyToken, requireRole('STUDENT', 'SUPER_ADMIN'), getMyFinancialOverview);
router.get('/my-invoices', verifyToken, requireRole('STUDENT', 'SUPER_ADMIN'), getMyInvoices);
router.get('/my-ledger', verifyToken, requireRole('STUDENT', 'SUPER_ADMIN', 'ACCOUNTS_OFFICER'), getMyLedger);
router.get('/fee-categories', verifyToken, getFeeCategories);
router.post('/fee-categories', verifyToken, requireRole('SUPER_ADMIN'), createFeeCategory);

module.exports = router;

