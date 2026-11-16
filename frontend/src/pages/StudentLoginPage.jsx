import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import { GraduationCap, User, AlertCircle, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import campusImg from '../assets/mu-campus-1.jpg';
import logoImg from '../assets/mu-logo-white.png';

export default function StudentLoginPage() {
  const [studentId, setStudentId] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const loginWithId = async (targetId) => {
    const idToUse = (targetId || studentId || '').trim();
    if (!idToUse) {
      setError('Please enter your Metropolitan University Student ID Number.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authApi.studentLogin({ studentId: idToUse });
      if (res.data.success) {
        login(res.data.token, res.data.user);
        navigate('/student');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Student ID not found. Please verify your Student ID number.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    await loginWithId(studentId);
  };

  const handleQuickDemoLogin = (id) => {
    setStudentId(id);
    loginWithId(id);
  };

  return (
    <div className="relative min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-950 overflow-hidden">
      {/* Background Campus Photo with Deep Blue Gradient */}
      <div className="absolute inset-0 z-0">
        <img
          src={campusImg}
          alt="Metropolitan University Bateshwar Campus"
          className="w-full h-full object-cover object-center opacity-25 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-[#0f2b5c]/80" />
      </div>

      <div className="relative z-10 max-w-md w-full bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-blue-500/30 overflow-hidden text-white">
        {/* Banner Header */}
        <div className="bg-gradient-to-b from-[#0f2b5c] to-blue-950 p-6 text-center border-b border-white/10 relative">
          <div className="flex justify-center mb-2">
            <img src={logoImg} alt="Metropolitan University" className="h-12 w-auto object-contain drop-shadow" />
          </div>
          <h1 className="text-xl font-extrabold tracking-tight">METROPOLITAN UNIVERSITY</h1>
          <p className="text-blue-200 text-xs mt-0.5">Student Academic & Financial Portal</p>
          <div className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-0.5 rounded-full uppercase tracking-wider">
            <CheckCircle2 className="w-3 h-3" />
            Direct Student ID Access • No Password Required
          </div>
        </div>

        {/* 1-Click Fast Student Demo Accounts */}
        <div className="p-4 bg-slate-950/60 border-b border-white/10">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            1-Click Instant Student Login (Demo Roster)
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleQuickDemoLogin('231-115-094')}
              className="p-2.5 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-400 rounded-xl text-left transition"
            >
              <div className="font-bold text-white">Choyon Dhor</div>
              <div className="text-[10px] text-emerald-400 font-mono mt-0.5">ID: 231-115-094</div>
              <div className="text-[9px] text-slate-400">All Fees Paid • Cleared</div>
            </button>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin('231-115-042')}
              className="p-2.5 bg-slate-900/80 hover:bg-blue-900/40 border border-slate-700 hover:border-blue-400 rounded-xl text-left transition"
            >
              <div className="font-bold text-white">Clara Oswald</div>
              <div className="text-[10px] text-amber-400 font-mono mt-0.5">ID: 231-115-042</div>
              <div className="text-[9px] text-amber-300 font-semibold">20% Waiver • Pending Due</div>
            </button>
          </div>
        </div>

        {/* Login Form (Student ID Only) */}
        <form onSubmit={handleLogin} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/50 text-rose-200 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Enter Your Student ID Number
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-amber-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. 231-115-094"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-950/80 border border-slate-700 focus:border-amber-400 focus:ring-1 focus:ring-amber-400 rounded-xl text-sm font-mono font-bold text-white placeholder-slate-500 outline-none"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              Simply enter your official Student ID (Batch-Intake-Roll, e.g. <span className="font-mono text-amber-300">231-115-094</span>) to access your portal immediately.
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-[#0f2b5c] hover:from-blue-500 hover:to-blue-700 text-white font-bold rounded-xl shadow-lg transition text-xs flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              'Opening Student Portal...'
            ) : (
              <>
                Enter Student Portal with Student ID
                <ArrowRight className="w-4 h-4 text-amber-400" />
              </>
            )}
          </button>
        </form>

        {/* Footer Links */}
        <div className="p-4 bg-slate-950/80 border-t border-white/5 text-center text-xs text-slate-400 flex flex-col gap-2">
          <div>
            Are you a Faculty Member or University Officer?{' '}
            <Link to="/admin/login" className="text-amber-400 hover:text-amber-300 font-bold underline">
              Go to Administration Portal
            </Link>
          </div>
          <div className="text-[10px] text-slate-500">
            Accounts Section Helpline: 01757535844 • NRBC Bank Campus Branch, Bateshwar
          </div>
        </div>
      </div>
    </div>
  );
}
