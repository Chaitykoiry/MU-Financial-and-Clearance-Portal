const express = require('express');
const router = express.Router();
const { downloadCertificate, verifyCertificatePublic } = require('../controllers/certificateController');
const { verifyToken } = require('../middleware/auth');

// Public verification (used by QR scanner)
router.get('/verify/:code', verifyCertificatePublic);

// Authenticated download
router.get('/download/:clearanceRequestId', verifyToken, downloadCertificate);

module.exports = router;
