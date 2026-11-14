import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { notificationApi } from '../services/api';
import {
  GraduationCap,
  LogOut,
  User,
  FileText,
  CheckCircle2,
  Building2,
  History,
  ShieldCheck,
  CreditCard,
  Bell,
  CheckCheck
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = async () => {
    try {
      const res = await notificationApi.list();
      if (res.data.success) {
        setNotifications(res.data.notifications);
        setUnreadCount(res.data.unreadCount);
      }
    } catch (err) {
      // ignore in offline/unauthorized state
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationApi.markAllRead();
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return <span className="bg-purple-100 text-purple-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">Super Admin</span>;
      case 'ACCOUNTS_OFFICER':
        return <span className="bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">Accounts Officer</span>;
      case 'LIBRARY_OFFICER':
        return <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">Library Officer</span>;
      case 'DEPT_HEAD':
        return <span className="bg-indigo-100 text-indigo-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">Head of Department</span>;
      default:
        return <span className="bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-md text-[11px]">MU Student</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Brand Logo & University Title */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="bg-[#0f2b5c] text-white p-2.5 rounded-xl shadow-md">
                <GraduationCap className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <span className="font-extrabold text-base tracking-tight text-[#0f2b5c] block leading-tight">
                  METROPOLITAN UNIVERSITY
                </span>
                <span className="text-[10px] text-slate-500 font-medium uppercase tracking-wider block">
                  Sylhet • Integrated Financial & Clearance Portal
                </span>
              </div>
            </Link>

            {user && (
              <nav className="hidden md:flex items-center gap-1 ml-6 pl-6 border-l border-slate-200">
                {user.role === 'STUDENT' && (
                  <>
                    <Link
                      to="/student"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      4-Installment Fees
                    </Link>
                    <Link
                      to="/student"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      Digital Clearance
                    </Link>
                  </>
                )}

                {user.role === 'ACCOUNTS_OFFICER' && (
                  <Link
                    to="/accounts/queue"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                  >
                    <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                    Bank Slip Queue
                  </Link>
                )}

                {user.role !== 'STUDENT' && user.role !== 'SUPER_ADMIN' && (
                  <Link
                    to="/officer"
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    Department Review Queue
                  </Link>
                )}

                {user.role === 'SUPER_ADMIN' && (
                  <>
                    <Link
                      to="/admin"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Clearance Pipeline
                    </Link>
                    <Link
                      to="/admin/audit"
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                    >
                      <History className="w-3.5 h-3.5" />
                      Audit Logs
                    </Link>
                  </>
                )}

                <Link
                  to="/verify"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-lg transition"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  Verify Certificate
                </Link>
              </nav>
            )}
          </div>

          {/* User Profile / Notifications / Logout */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative">
                  <button
                    onClick={() => {
                      setNotifOpen(!notifOpen);
                      if (!notifOpen) loadNotifications();
                    }}
                    className="p-2 text-slate-500 hover:text-[#0f2b5c] hover:bg-slate-100 rounded-xl relative transition"
                    title="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 bg-rose-500 text-white font-bold text-[9px] w-4 h-4 rounded-full flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Dropdown Drawer */}
                  {notifOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-fade-in">
                      <div className="p-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center text-xs">
                        <span className="font-bold text-slate-800">Notifications ({unreadCount} unread)</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllRead}
                            className="text-[11px] text-blue-600 font-semibold hover:underline flex items-center gap-1"
                          >
                            <CheckCheck className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 text-xs">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-center text-slate-400 text-xs">No notifications yet.</div>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              className={`p-3 transition hover:bg-slate-50 ${!n.isRead ? 'bg-blue-50/50' : ''}`}
                            >
                              <div className="font-bold text-slate-800">{n.title}</div>
                              <div className="text-[11px] text-slate-600 mt-0.5">{n.message}</div>
                              <div className="text-[9px] text-slate-400 mt-1 font-mono">
                                {new Date(n.createdAt).toLocaleString()}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900 leading-tight">
                    {user.fullName}
                  </div>
                  <div className="flex items-center gap-1.5 justify-end mt-0.5">
                    {getRoleBadge(user.role)}
                    <span className="text-[11px] text-slate-500 font-mono font-medium">
                      {user.matricOrStaffId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/verify"
                  className="hidden sm:inline-block text-xs font-semibold text-slate-600 hover:text-[#0f2b5c] px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  Verify Documents
                </Link>
                <Link
                  to="/student/login"
                  className="text-xs font-bold text-[#0f2b5c] bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-xl transition shadow-2xs"
                >
                  Student Portal
                </Link>
                <Link
                  to="/admin/login"
                  className="text-xs font-bold text-white bg-[#0f2b5c] hover:bg-[#1a3d7c] px-3.5 py-1.5 rounded-xl transition shadow-xs"
                >
                  Staff / Admin
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
