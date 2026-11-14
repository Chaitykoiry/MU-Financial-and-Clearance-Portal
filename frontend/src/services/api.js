import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization header if token exists
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cpcs_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth endpoints
export const authApi = {
  login: (credentials) => api.post('/auth/login', credentials),
  studentLogin: (credentials) => api.post('/auth/student-login', credentials),
  adminLogin: (credentials) => api.post('/auth/admin-login', credentials),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me')
};

// Clearance endpoints
export const clearanceApi = {
  initiate: (data) => api.post('/clearance/initiate', data),
  getMyClearances: () => api.get('/clearance/my-clearances'),
  getById: (id) => api.get(`/clearance/${id}`),
  getAll: (params) => api.get('/clearance', { params }),
  updateApproval: (clearanceRequestId, departmentId, data) =>
    api.patch(`/clearance/${clearanceRequestId}/department/${departmentId}`, data)
};

// Financial Management endpoints
export const financeApi = {
  getOverview: () => api.get('/finance/overview'),
  getMyInvoices: () => api.get('/finance/my-invoices'),
  getMyLedger: () => api.get('/finance/my-ledger'),
  getFeeCategories: () => api.get('/finance/fee-categories'),
  createFeeCategory: (data) => api.post('/finance/fee-categories', data)
};

// Admin Student Management endpoints
export const studentAdminApi = {
  list: (params) => api.get('/admin/students', { params }),
  get: (id) => api.get(`/admin/students/${id}`),
  create: (data) => api.post('/admin/students', data),
  update: (id, data) => api.put(`/admin/students/${id}`, data),
  assignWaiver: (id, data) => api.post(`/admin/students/${id}/waiver`, data),
  resetPassword: (id, data) => api.post(`/admin/students/${id}/reset-password`, data)
};

// Programme Fee Structure endpoints
export const feeStructureApi = {
  list: () => api.get('/fee-structures'),
  getByProgramme: (code) => api.get(`/fee-structures/programme/${code}`),
  update: (id, data) => api.put(`/fee-structures/${id}`, data)
};

// Late-Payment Fine endpoints
export const fineApi = {
  getRules: () => api.get('/fines/rules'),
  updateRule: (id, data) => api.put(`/fines/rules/${id}`, data),
  getStudentAssessment: (studentId) => api.get(`/fines/student/${studentId}`),
  waive: (studentId, data) => api.post(`/fines/student/${studentId}/waive`, data)
};

// Course Enrollment Paper endpoints
export const enrollmentPaperApi = {
  getStatus: () => api.get('/enrollment-paper/status'),
  downloadUrl: `${API_BASE}/enrollment-paper/download`
};

// Examination Admit Card endpoints
export const admitCardApi = {
  getStatus: () => api.get('/admit-card/status'),
  downloadUrl: `${API_BASE}/admit-card/download`,
  verify: (qrToken) => api.get(`/admit-card/verify/${qrToken}`),
  listSessions: () => api.get('/admit-card/sessions'),
  createSession: (data) => api.post('/admit-card/sessions', data),
  getEligibilityReport: (params) => api.get('/admit-card/eligibility-report', { params }),
  grantOverride: (data) => api.post('/admit-card/override', data)
};

// Accounts Office Verification Queue endpoints
export const accountsApi = {
  getVerificationQueue: () => api.get('/accounts/verification-queue'),
  verifyBankDeposit: (paymentId, data) => api.patch(`/accounts/verify/${paymentId}`, data),
  rejectBankDeposit: (paymentId, data) => api.patch(`/accounts/reject/${paymentId}`, data),
  receiptUrl: (paymentId) => `${API_BASE}/accounts/receipt/${paymentId}`
};

// Department endpoints
export const departmentApi = {
  list: () => api.get('/departments'),
  create: (data) => api.post('/departments', data)
};

// Payment endpoints
export const paymentApi = {
  process: (data) => api.post('/payments/process', data),
  getHistory: () => api.get('/payments/history')
};

// Certificate endpoints
export const certificateApi = {
  verify: (code) => api.get(`/certificates/verify/${code}`),
  downloadUrl: (clearanceId) => `${API_BASE}/certificates/download/${clearanceId}`
};

// Audit logs
export const auditApi = {
  list: (params) => api.get('/audit-logs', { params })
};

// In-App Notifications
export const notificationApi = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all')
};

// Administrative Analytics
export const analyticsApi = {
  getSystemAnalytics: () => api.get('/analytics')
};

// Visual Workflow Builder
export const workflowApi = {
  getTemplates: () => api.get('/workflows/templates'),
  saveVersion: (data) => api.post('/workflows/publish-version', data)
};

export default api;
