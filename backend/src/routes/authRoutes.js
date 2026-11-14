const express = require('express');
const router = express.Router();
const { register, login, studentLogin, adminLogin, getMe } = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/student-login', studentLogin);
router.post('/admin-login', adminLogin);
router.get('/me', verifyToken, getMe);

module.exports = router;
