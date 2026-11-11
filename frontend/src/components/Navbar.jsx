import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, LogOut, User, FileText, CheckCircle2, Building, History } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ADMIN':
        return <span className="bg-purple-100 text-purple-700 font-semibold px-2.5 py-0.5 rounded-full text-xs">Admin</span>;
      case 'DEPARTMENT_OFFICER':
        return <span className="bg-amber-100 text-amber-700 font-semibold px-2.5 py-0.5 rounded-full text-xs">Department Officer</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 font-semibold px-2.5 py-0.5 rounded-full text-xs">Student</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg tracking-tight text-slate-900 block leading-tight">
                  CPCS
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                  Payment & Clearance System
                </span>
              </div>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1 ml-8">
                {user.role === 'STUDENT' && (
                  <Link
                    to="/student"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                  >
                    <FileText className="w-4 h-4" />
                    My Clearance
                  </Link>
                )}
                {user.role === 'DEPARTMENT_OFFICER' && (
                  <Link
                    to="/officer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                  >
                    <Building className="w-4 h-4" />
                    Department Approvals
                  </Link>
                )}
                {user.role === 'ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Clearance Pipeline
                    </Link>
                    <Link
                      to="/admin/audit"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                    >
                      <History className="w-4 h-4" />
                      Audit Logs
                    </Link>
                  </>
                )}
                <Link
                  to="/verify"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition"
                >
                  Verify Certificate
                </Link>
              </nav>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <div className="text-sm font-semibold text-slate-800 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    {getRoleBadge(user.role)}
                    <span className="text-xs text-slate-500 font-mono">
                      {user.matricOrStaffId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/verify"
                  className="text-sm font-medium text-slate-600 hover:text-blue-600 px-3 py-2"
                >
                  Verify Certificate
                </Link>
                <Link
                  to="/login"
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition shadow-sm"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
