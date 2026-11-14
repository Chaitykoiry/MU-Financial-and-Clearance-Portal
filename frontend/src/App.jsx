import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import LandingPage from './pages/LandingPage';
import StudentLoginPage from './pages/StudentLoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import StudentDashboard from './pages/StudentDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import AccountsQueuePage from './pages/AccountsQueuePage';
import AdminDashboard from './pages/AdminDashboard';
import VerifyCertificatePage from './pages/VerifyCertificatePage';
import VerifyAdmitCardPage from './pages/VerifyAdmitCardPage';

const ALL_OFFICER_ROLES = [
  'SUPER_ADMIN',
  'ACCOUNTS_OFFICER',
  'LIBRARY_OFFICER',
  'LAB_OFFICER',
  'HALL_OFFICER',
  'DEPT_HEAD',
  'EXAM_CONTROLLER'
];

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500 font-medium text-sm">
        Authenticating session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
          <Navbar />
          <main className="flex-1">
            <Routes>
              {/* Landing Page */}
              <Route path="/" element={<LandingPage />} />

              {/* Dedicated Gateways */}
              <Route path="/student/login" element={<StudentLoginPage />} />
              <Route path="/admin/login" element={<AdminLoginPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />

              {/* Student Portal Route */}
              <Route
                path="/student"
                element={
                  <ProtectedRoute allowedRoles={['STUDENT', 'SUPER_ADMIN']}>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Accounts Section Verification Queue */}
              <Route
                path="/accounts/queue"
                element={
                  <ProtectedRoute allowedRoles={['ACCOUNTS_OFFICER', 'SUPER_ADMIN']}>
                    <AccountsQueuePage />
                  </ProtectedRoute>
                }
              />

              {/* Department Officer Review Queues */}
              <Route
                path="/officer"
                element={
                  <ProtectedRoute allowedRoles={ALL_OFFICER_ROLES}>
                    <OfficerDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Super Admin Routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin/audit"
                element={
                  <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Public Verifiers */}
              <Route path="/verify" element={<VerifyCertificatePage />} />
              <Route path="/verify-certificate/:code" element={<VerifyCertificatePage />} />
              <Route path="/verify-admit-card/:token" element={<VerifyAdmitCardPage />} />
              <Route path="/admit-card/verify/:token" element={<VerifyAdmitCardPage />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}
