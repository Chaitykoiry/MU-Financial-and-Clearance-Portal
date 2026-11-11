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

export default api;

