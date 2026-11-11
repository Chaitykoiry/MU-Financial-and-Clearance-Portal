import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateApi } from '../services/api';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Search,
  Building,
  Calendar,
  User,
  Hash,
  Download,
  AlertTriangle
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
      } else {
        setError('Certificate could not be validated.');
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          'Certificate verification failed. This certificate code does not exist or has been revoked.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      {/* Search Header */}
      <div className="text-center mb-8">
        <div className="inline-flex p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Certificate Authentication Portal</h1>
        <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
          Scan the QR code on an official CPCS Clearance Certificate or input the Certificate ID below for cryptographic validation.
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
              placeholder="e.g. CPCS-CERT-773921"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </form>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-6 text-center shadow-xs">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <XCircle className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-rose-900 text-base">Invalid or Unverified Certificate</h3>
          <p className="text-rose-700 text-xs mt-1 max-w-md mx-auto">{error}</p>
        </div>
      )}

      {/* Verified Certificate Card */}
      {result && (
        <div className="bg-white border-2 border-emerald-500 rounded-2xl shadow-xl overflow-hidden animate-fade-in">
          {/* Certificate Header Banner */}
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-6 text-white text-center relative">
            <div className="inline-flex p-2 bg-white/20 backdrop-blur-md rounded-xl mb-2">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-emerald-100 block">
              Cryptographically Validated
            </span>
            <h2 className="text-xl font-bold mt-1">Authentic Clearance Certificate</h2>
            <div className="font-mono text-xs bg-black/20 text-emerald-50 px-3 py-1 rounded-full inline-block mt-2">
              ID: {result.certificateCode}
            </div>
          </div>

          {/* Details */}
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 uppercase font-semibold">Student Name:</span>
                <p className="font-bold text-slate-800 text-sm mt-0.5">{result.student?.fullName}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Matriculation ID:</span>
                <p className="font-mono font-bold text-slate-800 text-sm mt-0.5">{result.student?.matricOrStaffId}</p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Clearance Type & Session:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {result.clearanceType} ({result.academicSession})
                </p>
              </div>
              <div>
                <span className="text-slate-400 uppercase font-semibold">Date of Official Clearance:</span>
                <p className="font-semibold text-slate-800 mt-0.5">
                  {new Date(result.issuedAt).toLocaleString()}
                </p>
              </div>
            </div>

            {/* Department Sign-Offs */}
            <div>
              <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-3">
                Departmental Clearances & Validating Sign-Offs
              </h4>
              <div className="space-y-2">
                {result.departmentSignOffs?.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center bg-slate-50/80 border border-slate-200 p-3 rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                      <div>
                        <span className="font-bold text-slate-800">{item.department}</span>
                        <div className="text-[11px] text-slate-500">
                          Sign-off Officer: {item.officerName}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        APPROVED
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        {item.actionDate ? new Date(item.actionDate).toLocaleDateString() : 'Verified'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Institutional Seal Footnote */}
            <div className="text-center text-[11px] text-slate-400 pt-3 border-t border-slate-100">
              Validated via Centralised Payment and Clearance System (CPCS) Blockchain & Relational Audit Engine.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

