const express = require('express');
const router = express.Router();
const { processPayment, getPaymentHistory } = require('../controllers/paymentController');
const { verifyToken } = require('../middleware/auth');

router.post('/process', verifyToken, processPayment);
router.get('/history', verifyToken, getPaymentHistory);

module.exports = router;

