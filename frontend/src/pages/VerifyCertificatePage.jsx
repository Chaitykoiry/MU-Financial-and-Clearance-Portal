import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateApi } from '../services/api';
import {
  GraduationCap,
  CheckCircle,
  XCircle,
  Search,
  Building2,
  Calendar,
  User,
  Hash,
  Download,
  AlertTriangle,
  ShieldCheck,
  Building
} from 'lucide-react';

export default function VerifyCertificatePage() {
  const { code: urlCode } = useParams();
  const [code, setCode] = useState(urlCode || '');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (urlCode) {
      handleVerify(urlCode);
    }
  }, [urlCode]);

  const handleVerify = async (codeToVerify) => {
    const target = codeToVerify || code;
    if (!target) return;

    try {
      setLoading(true);
      setError('');
      setResult(null);

      const res = await certificateApi.verify(target.trim());
      if (res.data.success && res.data.valid) {
        setResult(res.data.certificate);
      } else if (res.data.isRevoked) {
        setError(`REVOKED: This certificate was officially revoked on ${new Date(res.data.revokedAt).toLocaleDateString()}. Reason: ${res.data.revocationReason || 'Administrative cancellation'}`);
      } else {
        setError('Certificate could not be validated.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Certificate verification failed. This certificate code does not exist in the Metropolitan University registry or has been revoked.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      {/* Search Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-50 text-[#0f2b5c] rounded-2xl mb-3 shadow-xs">
          <GraduationCap className="w-9 h-9 text-[#0f2b5c]" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Metropolitan University Certificate Authenticator
        </h1>
        <p className="text-slate-500 text-xs mt-1.5 max-w-lg mx-auto">
          Scan the QR code printed on an official Metropolitan University Clearance Certificate or enter the verification token below for live cryptographic validation.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleVerify();
          }}
          className="mt-6 flex max-w-md mx-auto gap-2"
        >
          <div className="relative flex-1">
            <Hash className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="e.g. MU-VTOK-98124-77A or MU-CERT-CONV-2026-98124"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#0f2b5c] shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-[#0f2b5c] hover:bg-[#1a3d7c] disabled:opacity-50 text-white font-bold rounded-xl text-xs shadow-md transition"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-6 text-center shadow-xs">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-rose-900 text-base">Invalid or Revoked Certificate</h3>
          <p className="text-rose-700 text-xs mt-1 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Verified Certificate Card */}
      {result && (
        <div className="bg-white border-2 border-emerald-500 rounded-3xl shadow-xl overflow-hidden animate-fade-in">
          {/* Certificate Header Banner */}
          <div className="bg-[#0f2b5c] p-6 text-white text-center relative">
            <div className="inline-flex p-2 bg-white/15 backdrop-blur-md rounded-xl mb-2">
              <ShieldCheck className="w-7 h-7 text-emerald-400" />
            </div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-emerald-300 block">
              Cryptographically Authenticated Record
            </span>
            <h2 className="text-lg font-extrabold mt-1">METROPOLITAN UNIVERSITY, SYLHET</h2>
            <p className="text-blue-200 text-xs">Official Administrative Clearance Certificate</p>
            <div className="font-mono text-xs bg-black/25 text-emerald-300 px-3 py-1 rounded-full inline-block mt-2 font-bold">
              ID: {result.certificateCode}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Student Full Name:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{result.student?.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Student ID Number:</span>
                <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{result.student?.matricOrStaffId}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Academic Programme:</span>
                <p className="font-semibold text-slate-800 mt-0.5">{result.student?.programme}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-bold text-[10px]">Clearance Date & Session:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(result.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })} ({result.academicSession})
                </p>
              </div>
            </div>

            {/* Department Sign-Offs */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-600" />
                Departmental Clearances & Validating Sign-Offs
              </h4>
              <div className="space-y-2">
                {result.departmentSignOffs?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-slate-50/80 border border-slate-200 p-3 rounded-2xl text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{item.department}</span>
                        <div className="text-[11px] text-slate-500">Signatory: {item.officerName}</div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                        APPROVED ✓
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Seal Footnote */}
            <div className="text-center text-[10px] text-slate-400 pt-3 border-t border-slate-100">
              Validated via Metropolitan University One Stop Service Center (OSSC) & PostgreSQL Double-Entry Audit Engine.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
