import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { admitCardApi } from '../services/api';
import {
  GraduationCap,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Calendar,
  Building,
  User,
  Hash,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import logoImg from '../assets/mu-logo-white.png';

export default function VerifyAdmitCardPage() {
  const { token } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
      setError('No QR token provided.');
    }
  }, [token]);

  const verifyToken = async (t) => {
    try {
      setLoading(true);
      setError('');
      const res = await admitCardApi.verify(t);
      if (res.data.success && res.data.valid) {
        setResult(res.data.admitCard);
      } else {
        setError(res.data.message || 'Admit card could not be validated.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
        'Admit card verification failed. This digital token does not exist in the Metropolitan University registry or has expired.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-xl w-full bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2b5c] p-6 text-center border-b border-white/10">
          <div className="flex justify-center mb-2">
            <img src={logoImg} alt="Metropolitan University" className="h-12 w-auto object-contain" />
          </div>
          <h1 className="text-xl font-black tracking-tight">METROPOLITAN UNIVERSITY</h1>
          <p className="text-xs text-blue-200 mt-0.5">Office of the Controller of Examinations</p>
          <div className="inline-block mt-2 bg-amber-400/20 text-amber-300 text-[10px] font-bold px-3 py-0.5 rounded-full border border-amber-400/30 uppercase tracking-wider">
            Official Admit Card Authenticator
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          {loading && (
            <div className="py-12 text-center text-slate-400 text-sm">
              <div className="inline-block w-8 h-8 border-3 border-amber-400 border-t-transparent rounded-full animate-spin mb-3" />
              <p>Auditing digital signature & financial clearance...</p>
            </div>
          )}

          {!loading && error && (
            <div className="bg-rose-950/40 border border-rose-500/40 rounded-2xl p-6 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                <XCircle className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-rose-300">Invalid or Expired Admit Card</h3>
              <p className="text-xs text-rose-200">{error}</p>
            </div>
          )}

          {!loading && result && (
            <div className="space-y-6">
              {/* Authenticated Verification Banner */}
              <div className="bg-emerald-950/40 border border-emerald-500/50 rounded-2xl p-4 text-center">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                  Digitally Verified & Cleared
                </div>
                <div className="text-[11px] text-emerald-400/80 mt-0.5">
                  Financial clearance audit passed • Metropolitan University Central Records
                </div>
              </div>

              {/* Identity & Session Grid */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3 text-xs">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Admit Card Number:</span>
                  <span className="font-mono font-bold text-amber-300">{result.admitCardNumber}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Student ID:</span>
                  <span className="font-mono font-bold text-white">{result.student?.studentIdNumber}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Candidate Name:</span>
                  <span className="font-bold text-white">{result.student?.user?.fullName}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Programme:</span>
                  <span className="font-semibold text-blue-200">{result.student?.programme?.name}</span>
                </div>

                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <span className="text-slate-400">Examination Session:</span>
                  <span className="font-bold text-white">{result.session?.name}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Issued Date:</span>
                  <span className="text-slate-300">{new Date(result.generatedAt || result.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              <div className="text-center">
                <Link
                  to="/"
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline underline-offset-4"
                >
                  Return to Metropolitan University Portal
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

