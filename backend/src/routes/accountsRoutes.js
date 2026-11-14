const express = require('express');
const router = express.Router();
const {
  getVerificationQueue,
  verifyBankDeposit,
  rejectBankDeposit,
  downloadReceipt
} = require('../controllers/accountsController');
const { verifyToken, requireRole } = require('../middleware/auth');

// Accounts Officer & Admin verification routes
router.get('/verification-queue', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), getVerificationQueue);
router.patch('/verify/:paymentId', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), verifyBankDeposit);
router.patch('/reject/:paymentId', verifyToken, requireRole('ACCOUNTS_OFFICER', 'SUPER_ADMIN'), rejectBankDeposit);

// Payment receipt download (accessible to student or accounts staff)
router.get('/receipt/:paymentId', verifyToken, downloadReceipt);

module.exports = router;

