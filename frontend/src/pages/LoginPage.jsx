import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { GraduationCap, Lock, User, AlertCircle, Sparkles, Building, ShieldCheck } from 'lucide-react';

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
        else if (role === 'SUPER_ADMIN') navigate('/admin');
        else navigate('/officer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (id, pw) => {
    setIdentifier(id);
    setPassword(pw);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-100/70">
      <div className="max-w-xl w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        {/* University Header Banner */}
        <div className="bg-[#0f2b5c] p-7 text-white text-center relative">
          <div className="inline-flex p-3 bg-white/10 backdrop-blur-md rounded-2xl mb-2.5 shadow-inner">
            <GraduationCap className="w-9 h-9 text-amber-400" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">METROPOLITAN UNIVERSITY</h1>
          <p className="text-blue-200 text-xs mt-1">
            Integrated Financial Management & Digital Clearance Portal (OSSC)
          </p>
          <div className="inline-block mt-2 text-[10px] font-semibold bg-white/15 text-amber-300 px-3 py-0.5 rounded-full uppercase tracking-wider">
            Bateshwar, Sylhet-3103, Bangladesh
          </div>
        </div>

        {/* Demo Fast Logins Section */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            1-Click Demo Accounts (Metropolitan University Roster)
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser('231-115-094', '')}
              className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left font-medium text-slate-800 transition"
            >
              🎓 <span className="font-bold">Choyon Dhor</span>
              <div className="text-[10px] text-emerald-600 font-mono mt-0.5">ID: 231-115-094 (No PW)</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('231-115-042', '')}
              className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left font-medium text-slate-800 transition"
            >
              🎓 <span className="font-bold">Clara Oswald</span>
              <div className="text-[10px] text-amber-600 font-mono mt-0.5">ID: 231-115-042 (No PW)</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('accounts@metrouni.edu.bd', 'officer123')}
              className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left font-medium text-slate-800 transition"
            >
              💰 <span className="font-bold">Accounts Section</span>
              <div className="text-[10px] text-slate-500 mt-0.5">NRBC Bank Queue</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('library@metrouni.edu.bd', 'officer123')}
              className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left font-medium text-slate-800 transition"
            >
              📚 <span className="font-bold">Central Library</span>
              <div className="text-[10px] text-slate-500 mt-0.5">Prof. M. H. Rahman Lib</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('head.cse@metrouni.edu.bd', 'officer123')}
              className="p-2 bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 rounded-xl text-left font-medium text-slate-800 transition"
            >
              🏛️ <span className="font-bold">Head of Dept</span>
              <div className="text-[10px] text-slate-500 mt-0.5">Head of CSE Sign-off</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('admin@metrouni.edu.bd', 'admin123')}
              className="p-2 bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 rounded-xl text-left font-medium text-purple-800 transition"
            >
              🛡️ <span className="font-bold">Super Admin</span>
              <div className="text-[10px] text-purple-600 mt-0.5">Workflow & Audits</div>
            </button>
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email or Student / Staff ID Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="e.g. 231-115-094 or choyon@metrouni.edu.bd"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Portal Password <span className="text-[10px] font-normal text-emerald-600">(Staff/Admin only — Not required for Students)</span>
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank if logging in with Student ID"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#0f2b5c] hover:bg-[#1a3d7c] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In to Metropolitan University Portal'}
          </button>

          <div className="text-center text-[11px] text-slate-500 pt-1">
            Accounts Helpline: <span className="font-semibold text-slate-700">01757535844</span> • Campus Branch: NRBC Bank Bateshwar
          </div>
        </form>
      </div>
    </div>
  );
}
