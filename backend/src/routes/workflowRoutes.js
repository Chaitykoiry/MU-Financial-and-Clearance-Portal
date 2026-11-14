const express = require('express');
const router = express.Router();
const {
  getWorkflowTemplates,
  saveWorkflowVersion
} = require('../controllers/workflowController');
const { verifyToken, requireRole } = require('../middleware/auth');

router.get('/templates', verifyToken, getWorkflowTemplates);
router.post('/publish-version', verifyToken, requireRole('SUPER_ADMIN'), saveWorkflowVersion);

module.exports = router;

