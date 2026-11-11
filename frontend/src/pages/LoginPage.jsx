import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { ShieldCheck, Lock, User, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        const role = res.data.user.role;
        if (role === 'STUDENT') navigate('/student');
        else if (role === 'DEPARTMENT_OFFICER') navigate('/officer');
        else if (role === 'ADMIN') navigate('/admin');
        else navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (id, pw) => {
    setIdentifier(id);
    setPassword(pw);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Banner */}
        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-8 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <ShieldCheck className="w-10 h-10 text-blue-200" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Centralised Clearance Portal</h1>
          <p className="text-blue-100 text-sm mt-1">
            Single-sign-on verification & fee clearance pipeline
          </p>
        </div>

        {/* Demo Fast Login Pills */}
        <div className="p-6 pb-2 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Quick Demo Logins (Click to autofill)
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser('student@cpcs.edu', 'student123')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 text-left font-medium transition shadow-xs"
            >
              🎓 Cleared Student
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('clara@cpcs.edu', 'student123')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 text-left font-medium transition shadow-xs"
            >
              ⏳ Pending Student
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('library@cpcs.edu', 'officer123')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 text-left font-medium transition shadow-xs"
            >
              📚 Library Officer
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('bursar@cpcs.edu', 'officer123')}
              className="px-2.5 py-1.5 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-lg text-slate-700 text-left font-medium transition shadow-xs"
            >
              💰 Bursary Officer
            </button>
            <button
              type="button"
              onClick={() => setDemoUser('admin@cpcs.edu', 'admin123')}
              className="col-span-2 px-2.5 py-1.5 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-lg text-purple-700 text-center font-medium transition shadow-xs"
            >
              🛡️ System Administrator
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Matric / Staff ID
            </label>
            <div className="relative">
              <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. student@cpcs.edu or STU-2026-9041"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Clearance Portal'}
          </button>

          <div className="text-center text-xs text-slate-500 pt-2">
            Don't have an account?{' '}
            <Link to="/register" className="text-blue-600 font-semibold hover:underline">
              Register as Student
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
