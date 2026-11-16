const express = require('express');
const router = express.Router();
const {
  processPayment,
  initiateGatewaySession,
  verifyGatewayWebhook,
  getPaymentHistory
} = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.post('/process', verifyToken, processPayment);
router.post('/gateway/initiate', verifyToken, initiateGatewaySession);
router.post('/gateway/webhook', verifyToken, verifyGatewayWebhook);
router.get('/history', verifyToken, getPaymentHistory);

module.exports = router;
