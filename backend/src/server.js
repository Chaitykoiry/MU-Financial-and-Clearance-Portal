require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const clearanceRoutes = require('./routes/clearanceRoutes');
const departmentRoutes = require('./routes/departmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const certificateRoutes = require('./routes/certificateRoutes');
const auditRoutes = require('./routes/auditRoutes');
const financeRoutes = require('./routes/financeRoutes');
const accountsRoutes = require('./routes/accountsRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const workflowRoutes = require('./routes/workflowRoutes');
const studentAdminRoutes = require('./routes/studentAdminRoutes');
const feeStructureRoutes = require('./routes/feeStructureRoutes');
const fineRoutes = require('./routes/fineRoutes');
const enrollmentDocRoutes = require('./routes/enrollmentDocRoutes');
const admitCardRoutes = require('./routes/admitCardRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Centralised Payment and Clearance System (CPCS) API'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/clearance', clearanceRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/accounts', accountsRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/admin/students', studentAdminRoutes);
app.use('/api/fee-structures', feeStructureRoutes);
app.use('/api/fines', fineRoutes);
app.use('/api/enrollment-paper', enrollmentDocRoutes);
app.use('/api/admit-card', admitCardRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚀 CPCS Backend REST API running on port ${PORT}`);
  console.log(`🌐 Health check available at http://localhost:${PORT}/health`);
  console.log(`📜 Dynamic Certificate & QR Verification Engine Active`);
  console.log(`=======================================================`);
});

module.exports = app;

