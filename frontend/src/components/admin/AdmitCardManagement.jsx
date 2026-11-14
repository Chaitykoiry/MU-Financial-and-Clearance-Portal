import React, { useState, useEffect } from 'react';
import { admitCardApi } from '../../services/api';
import {
  FileCheck2,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  Calendar,
  Lock,
  Unlock,
  Building,
  UserCheck
} from 'lucide-react';

export default function AdmitCardManagement() {
  const [sessions, setSessions] = useState([]);
  const [selectedSessionCode, setSelectedSessionCode] = useState('SPRING_2026_FINAL');
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(true);

  // Override Modal
  const [overrideModal, setOverrideModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [overrideForm, setOverrideForm] = useState({
    reason: 'Approved by Controller of Examinations on Special Appeal',
    authorizedBy: 'Office of the Controller of Examinations'
  });
  const [submittingOverride, setSubmittingOverride] = useState(false);

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    if (selectedSessionCode) {
      fetchEligibilityReport(selectedSessionCode);
    }
  }, [selectedSessionCode]);

  const fetchSessions = async () => {
    try {
      const res = await admitCardApi.listSessions();
      if (res.data.success) {
        setSessions(res.data.sessions);
      }
    } catch (err) {
      console.error('Failed to load examination sessions:', err);
    }
  };

  const fetchEligibilityReport = async (code) => {
    try {
      setLoading(true);
      const res = await admitCardApi.getEligibilityReport({ sessionCode: code });
      if (res.data.success) {
        setReport(res.data.students);
      }
    } catch (err) {
      console.error('Failed to load eligibility report:', err);
    } finally {
      setLoading(false);
    }
  };

  const openOverrideModal = (student) => {
    setSelectedStudent(student);
    setOverrideForm({
      reason: 'Approved by Controller of Examinations on Special Appeal',
      authorizedBy: 'Controller of Examinations'
    });
    setOverrideModal(true);
  };

  const handleGrantOverride = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      setSubmittingOverride(true);
      const res = await admitCardApi.grantOverride({
        studentId: selectedStudent.studentId,
        sessionCode: selectedSessionCode,
        reason: overrideForm.reason,
        authorizedBy: overrideForm.authorizedBy
      });

      if (res.data.success) {
        setOverrideModal(false);
        fetchEligibilityReport(selectedSessionCode);
        alert(res.data.message || 'Administrative override granted successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to grant override.');
    } finally {
      setSubmittingOverride(false);
    }
  };

  const eligibleCount = report.filter((r) => r.isEligible).length;
  const blockedCount = report.filter((r) => !r.isEligible).length;

  return (
    <div className="space-y-6">
      {/* Header and Session Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <FileCheck2 className="w-5 h-5 text-indigo-600" />
            Office of the Controller of Examinations — Admit Card Eligibility Audit
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time multi-dimensional financial audit for examination admit card unlocking
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Exam Session:</span>
          <select
            value={selectedSessionCode}
            onChange={(e) => setSelectedSessionCode(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-blue-400 rounded-xl font-bold text-slate-900"
          >
            {sessions.map((s) => (
              <option key={s.id} value={s.code}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Candidates</span>
          <div className="text-2xl font-black font-mono text-slate-900 mt-1">{report.length}</div>
          <span className="text-[10px] text-slate-500">Registered for Spring 2026</span>
        </div>

        <div className="bg-emerald-50 p-5 rounded-3xl border border-emerald-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Eligible (Cleared)</span>
          <div className="text-2xl font-black font-mono text-emerald-800 mt-1">{eligibleCount}</div>
          <span className="text-[10px] text-emerald-600">All financial criteria satisfied</span>
        </div>

        <div className="bg-rose-50 p-5 rounded-3xl border border-rose-200 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">Blocked (Dues / Fines)</span>
          <div className="text-2xl font-black font-mono text-rose-800 mt-1">{blockedCount}</div>
          <span className="text-[10px] text-rose-600">Admit card generation prevented</span>
        </div>
      </div>

      {/* Candidates Audit Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Programme</th>
                <th className="py-3 px-4">Eligibility Status</th>
                <th className="py-3 px-4">Itemized Audit Blocker Reasons</th>
                <th className="py-3 px-4 text-right">Controller Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    Auditing live financial records...
                  </td>
                </tr>
              ) : report.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-10 text-slate-400">
                    No registered candidates for this session.
                  </td>
                </tr>
              ) : (
                report.map((c) => (
                  <tr key={c.studentId} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-[13px]">{c.studentIdNumber}</div>
                      <div className="font-semibold text-slate-700">{c.fullName}</div>
                    </td>

                    <td className="py-3.5 px-4 font-bold text-slate-800">{c.programmeCode}</td>

                    <td className="py-3.5 px-4">
                      {c.isEligible ? (
                        <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          ELIGIBLE (UNLOCKED)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-300 font-bold px-2.5 py-1 rounded-full text-[10px]">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          BLOCKED (DUES PENDING)
                        </span>
                      )}
                      {c.override && (
                        <div className="text-[9px] text-purple-700 font-bold mt-1">
                          ⚡ SPECIAL OVERRIDE ACTIVE
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {c.isEligible ? (
                        <span className="text-emerald-700 font-medium">
                          ✓ Tuition cleared • Registration paid • Zero fines
                        </span>
                      ) : (
                        <div className="space-y-1">
                          {c.blockers && c.blockers.length > 0 ? (
                            c.blockers.map((b, idx) => (
                              <div
                                key={idx}
                                className="text-rose-700 font-semibold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[10px] inline-block mr-1 mb-0.5"
                              >
                                ✕ {b}
                              </div>
                            ))
                          ) : (
                            <span className="text-rose-600 font-medium">Outstanding clearance requirement</span>
                          )}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      {!c.isEligible && (
                        <button
                          onClick={() => openOverrideModal(c)}
                          className="px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl font-bold transition inline-flex items-center gap-1"
                        >
                          <Unlock className="w-3 h-3" />
                          Grant Override
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* OVERRIDE MODAL */}
      {overrideModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-purple-600" />
              Administrative Admit Card Override
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Candidate: <span className="font-mono font-bold text-slate-800">{selectedStudent.studentIdNumber}</span> (
              {selectedStudent.fullName})
            </p>

            <form onSubmit={handleGrantOverride} className="space-y-3.5 text-xs">
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-800 text-[11px] leading-relaxed">
                <span className="font-bold">Institutional Audit Notice:</span> Granting an administrative override unlocks the examination admit card despite outstanding financial blockers. This transaction is permanently logged with your identity.
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Authorizing Official / Office *</label>
                <input
                  type="text"
                  required
                  value={overrideForm.authorizedBy}
                  onChange={(e) => setOverrideForm({ ...overrideForm, authorizedBy: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Official Justification / Rationale *</label>
                <textarea
                  rows="2"
                  required
                  value={overrideForm.reason}
                  onChange={(e) => setOverrideForm({ ...overrideForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOverrideModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOverride}
                  className="w-1/2 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submittingOverride ? 'Unlocking...' : 'Unlock Admit Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

