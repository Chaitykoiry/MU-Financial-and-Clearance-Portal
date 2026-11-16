const express = require('express');
const router = express.Router();
const {
  getVerificationQueue,
  verifyBankDeposit,
  rejectBankDeposit,
  downloadSampleStatementCsv,
  reconcileBankStatementCsv,
  exportDefaultersCsv,
  exportDefaultersPdf,
  exportCollectionsPdf,
  downloadReceipt
} = require('../controllers/accountsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Accounts Officer & Admin verification routes
router.get('/verification-queue', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), getVerificationQueue);
router.patch('/verify/:paymentId', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), verifyBankDeposit);
router.patch('/reject/:paymentId', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), rejectBankDeposit);

// Automated NRBC Bank Statement CSV Reconciliation
router.get('/sample-statement-csv', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), downloadSampleStatementCsv);
router.post('/reconcile-csv', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), reconcileBankStatementCsv);

// Batch Financial & Defaulter Reports (PDF & CSV)
router.get('/reports/defaulters-csv', verifyToken, requireRole('ACCOUNTS_OFFICER', 'DEPT_HEAD', 'SUPER_ADMIN'), exportDefaultersCsv);
router.get('/reports/defaulters-pdf', verifyToken, requireRole('ACCOUNTS_OFFICER', 'DEPT_HEAD', 'SUPER_ADMIN'), exportDefaultersPdf);
router.get('/reports/collections-pdf', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), exportCollectionsPdf);

// Payment receipt download (accessible to student or accounts staff)
router.get('/receipt/:paymentId', verifyToken, downloadReceipt);

module.exports = router;
