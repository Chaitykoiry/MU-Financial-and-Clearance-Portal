import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { ShieldCheck, Lock, User, AlertCircle, Sparkles, ArrowRight } from 'lucide-react';
import campusImg from '../assets/mu-campus-2.jpg';
import logoImg from '../assets/mu-logo-white.png';

export default function AdminLoginPage() {
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
      const res = await authApi.adminLogin({ identifier, password });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        const role = res.data.user.role;
        if (role === 'SUPER_ADMIN') navigate('/admin');
        else if (role === 'ACCOUNTS_OFFICER') navigate('/accounts/queue');
        else navigate('/officer');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please verify your administrative credentials.');
    } finally {
      setLoading(false);
    }
  };

  const setDemoUser = (id, pw) => {
    setIdentifier(id);
    setPassword(pw);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Background Campus Photo with Purple/Indigo Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={campusImg}
          alt="Metropolitan University Bateshwar Campus"
          className="w-full h-full object-cover object-center opacity-20 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/90 to-purple-950/80" />
      </div>

      <div className="relative z-10 max-w-lg w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-purple-500/30 overflow-hidden text-white">
        {/* Banner Header */}
        <div className="bg-gradient-to-b from-purple-900 to-slate-950 p-6 text-center border-b border-white/10 relative">
          <div className="flex justify-center mb-2">
            <img src={logoImg} alt="Metropolitan University" className="h-12 w-auto object-contain drop-shadow" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">METROPOLITAN UNIVERSITY</h1>
          <p className="text-purple-200 text-xs mt-0.5">Administration & Academic Directorate Portal</p>
          <div className="inline-block mt-2 text-[10px] font-semibold bg-purple-500/20 text-purple-200 border border-purple-400/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
            Secured Executive & Officer Gateway
          </div>
        </div>

        {/* 1-Click Fast Officer Demo Accounts */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-purple-300 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Administrative Officer Demo Accounts
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => setDemoUser('accounts@metrouni.edu.bd', 'officer123')}
              className="p-2.5 bg-slate-900/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-400 rounded-xl text-left transition"
            >
              <div className="font-bold text-white">💰 Accounts Section</div>
              <div className="text-[10px] text-purple-300 mt-0.5">NRBC Bank Queue</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('head.cse@metrouni.edu.bd', 'officer123')}
              className="p-2.5 bg-slate-900/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-400 rounded-xl text-left transition"
            >
              <div className="font-bold text-white">🏛️ Head of Dept (CSE)</div>
              <div className="text-[10px] text-purple-300 mt-0.5">Academic Sign-off</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('library@metrouni.edu.bd', 'officer123')}
              className="p-2.5 bg-slate-900/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-400 rounded-xl text-left transition"
            >
              <div className="font-bold text-white">📚 Central Library</div>
              <div className="text-[10px] text-purple-300 mt-0.5">Prof. M. H. Rahman Lib</div>
            </button>

            <button
              type="button"
              onClick={() => setDemoUser('admin@metrouni.edu.bd', 'admin123')}
              className="p-2.5 bg-slate-900/80 hover:bg-purple-900/40 border border-slate-700 hover:border-purple-400 rounded-xl text-left transition"
            >
              <div className="font-bold text-white">🛡️ Super Admin</div>
              <div className="text-[10px] text-purple-300 mt-0.5">Full System & Audits</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 text-rose-200 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Official University Email Address or Staff ID
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. accounts@metrouni.edu.bd"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Officer Security Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700 focus:border-purple-500 focus:ring-1 focus:ring-purple-500 rounded-xl text-xs text-white placeholder-slate-500 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Verifying Officer Access...'
            ) : (
              <>
                Sign In to Administration Portal
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="p-4 bg-slate-950/80 border-t border-white/5 text-center text-xs text-slate-400 flex flex-col gap-2">
          <div>
            Are you a Student?{' '}
            <Link to="/student/login" className="text-amber-400 hover:text-amber-300 font-bold underline">
              Go to Student Portal (Use Student ID)
            </Link>
          </div>
          <div className="text-[10px] text-slate-500">
            Internal Audit & Cryptographic Logging Active • Metropolitan University Sylhet
          </div>
        </div>
      </div>
    </div>
  );
}

