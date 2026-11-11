import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { clearanceApi, paymentApi, certificateApi } from '../services/api';
import {
  CheckCircle,
  Clock,
  AlertTriangle,
  Download,
  CreditCard,
  Building2,
  FileCheck,
  QrCode,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
  Sparkles
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [clearances, setClearances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [initiating, setInitiating] = useState(false);
  const [academicSession, setAcademicSession] = useState('2025/2026');
  const [clearanceType, setClearanceType] = useState('GRADUATION');

  // Payment modal state
  const [paymentModal, setPaymentModal] = useState({
    isOpen: false,
    clearanceRequestId: '',
    departmentId: '',
    departmentName: '',
    amount: 0,
    purpose: ''
  });
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchMyClearance();
  }, []);

  const fetchMyClearance = async () => {
    try {
      setLoading(true);
      const res = await clearanceApi.getMyClearances();
      if (res.data.success) {
        setClearances(res.data.clearances);
      }
    } catch (err) {
      console.error('Failed to load clearances:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async (e) => {
    e.preventDefault();
    try {
      setInitiating(true);
      const res = await clearanceApi.initiate({ academicSession, clearanceType });
      if (res.data.success) {
        fetchMyClearance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not initiate clearance.');
    } finally {
      setInitiating(false);
    }
  };

  const handleOpenPayment = (clearanceId, deptApproval) => {
    setPaymentModal({
      isOpen: true,
      clearanceRequestId: clearanceId,
      departmentId: deptApproval.departmentId,
      departmentName: deptApproval.department.name,
      amount: deptApproval.duesAmount || 100,
      purpose: `${deptApproval.department.name} Clearance Fee Settlement`
    });
  };

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      setProcessingPayment(true);
      const res = await paymentApi.process({
        clearanceRequestId: paymentModal.clearanceRequestId,
        departmentId: paymentModal.departmentId,
        amount: paymentModal.amount,
        purpose: paymentModal.purpose,
        paymentMethod: 'ONLINE_CARD'
      });

      if (res.data.success) {
        alert('Payment successful! Department clearance dues marked as settled.');
        setPaymentModal({ isOpen: false, clearanceRequestId: '', departmentId: '', departmentName: '', amount: 0, purpose: '' });
        fetchMyClearance();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment failed.');
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleDownloadCertificate = async (clearanceId, code) => {
    try {
      const token = localStorage.getItem('cpcs_token');
      const response = await fetch(certificateApi.downloadUrl(clearanceId), {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Clearance_Certificate_${code || 'CPCS'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Error downloading certificate PDF.');
    }
  };

  const activeClearance = clearances.length > 0 ? clearances[0] : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Welcome Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Student Clearance Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Student: <span className="font-semibold text-slate-800">{user?.fullName}</span> | Matric No:{' '}
            <span className="font-mono font-semibold text-blue-600">{user?.matricOrStaffId}</span>
          </p>
        </div>

        {activeClearance?.status === 'APPROVED' && (
          <button
            onClick={() => handleDownloadCertificate(activeClearance.id, activeClearance.certificateCode)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md transition"
          >
            <Download className="w-5 h-5" />
            Download Stamped Certificate
          </button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-500 font-medium">Loading clearance pipeline records...</div>
      ) : !activeClearance ? (
        /* Empty State: Initiate Clearance */
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileCheck className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">No Active Clearance Found</h2>
          <p className="text-slate-500 text-sm mt-2 mb-6">
            You do not currently have an active clearance workflow. Initiate a new institutional clearance pipeline to begin
            departmental verifications.
          </p>

          <form onSubmit={handleInitiate} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Academic Session
              </label>
              <input
                type="text"
                value={academicSession}
                onChange={(e) => setAcademicSession(e.target.value)}
                required
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Clearance Type
              </label>
              <select
                value={clearanceType}
                onChange={(e) => setClearanceType(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="GRADUATION">Final Graduation Clearance</option>
                <option value="SEMESTER">Semester Clearance</option>
                <option value="WITHDRAWAL">Institutional Withdrawal</option>
                <option value="GENERAL">General Administrative Clearance</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={initiating}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition"
            >
              {initiating ? 'Starting Pipeline...' : 'Initiate Departmental Clearance'}
            </button>
          </form>
        </div>
      ) : (
        /* Active Clearance View */
        <div className="space-y-6">
          {/* Status Ribbon */}
          <div
            className={`p-6 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              activeClearance.status === 'APPROVED'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : activeClearance.status === 'REJECTED'
                ? 'bg-rose-50 border-rose-200 text-rose-900'
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              {activeClearance.status === 'APPROVED' ? (
                <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl">
                  <CheckCircle className="w-8 h-8" />
                </div>
              ) : activeClearance.status === 'REJECTED' ? (
                <div className="p-3 bg-rose-100 text-rose-600 rounded-xl">
                  <ShieldAlert className="w-8 h-8" />
                </div>
              ) : (
                <div className="p-3 bg-amber-100 text-amber-600 rounded-xl">
                  <Clock className="w-8 h-8" />
                </div>
              )}
              <div>
                <span className="text-xs uppercase font-bold tracking-wider">
                  Clearance Status: {activeClearance.status}
                </span>
                <h2 className="text-xl font-bold mt-0.5">
                  {activeClearance.clearanceType} Clearance ({activeClearance.academicSession})
                </h2>
                {activeClearance.certificateCode && (
                  <p className="text-xs font-mono font-semibold mt-1 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    Verified Certificate ID: {activeClearance.certificateCode}
                  </p>
                )}
              </div>
            </div>

            {activeClearance.status === 'APPROVED' ? (
              <div className="flex gap-2">
                <a
                  href={`/verify-certificate/${activeClearance.certificateCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-100/50 text-xs font-semibold px-4 py-2 rounded-xl transition"
                >
                  <QrCode className="w-4 h-4" />
                  QR Verification View
                </a>
                <button
                  onClick={() => handleDownloadCertificate(activeClearance.id, activeClearance.certificateCode)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            ) : (
              <div className="text-xs font-medium text-amber-700 bg-amber-100/60 px-3 py-1.5 rounded-lg border border-amber-200">
                Awaiting approvals or dues settlements
              </div>
            )}
          </div>

          {/* Department Breakdown Checklist */}
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-blue-600" />
                Departmental Clearance Flags & Sign-Offs
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {activeClearance.departmentApprovals?.filter((a) => a.status === 'APPROVED').length || 0} of{' '}
                {activeClearance.departmentApprovals?.length || 0} Departments Approved
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeClearance.departmentApprovals?.map((item) => {
                const isApproved = item.status === 'APPROVED';
                const hasDues = !item.duesPaid && item.duesAmount > 0;

                return (
                  <div
                    key={item.id}
                    className={`bg-white rounded-xl border p-5 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                      isApproved
                        ? 'border-emerald-200'
                        : hasDues
                        ? 'border-amber-200'
                        : 'border-slate-200'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                          {item.department?.code}
                        </span>
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Approved
                          </span>
                        ) : item.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Rejected
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            <Clock className="w-3.5 h-3.5" />
                            Pending Sign-off
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-base mt-2.5">
                        {item.department?.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {item.department?.description}
                      </p>

                      {/* Dues Alert */}
                      {item.duesAmount > 0 && (
                        <div
                          className={`mt-3 p-2.5 rounded-lg text-xs flex justify-between items-center ${
                            item.duesPaid
                              ? 'bg-slate-50 text-slate-600 border border-slate-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 font-medium'
                          }`}
                        >
                          <span>Outstanding Dues:</span>
                          <span className="font-bold font-mono">
                            ${item.duesAmount.toFixed(2)} {item.duesPaid ? '(Paid ✓)' : '(Unpaid)'}
                          </span>
                        </div>
                      )}

                      {/* Officer Remarks */}
                      {item.remarks && (
                        <div className="mt-3 text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-slate-600 italic">
                          "{item.remarks}"
                        </div>
                      )}
                    </div>

                    {/* Settle Dues Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">
                        {item.officer ? `By: ${item.officer.fullName}` : 'Awaiting officer sign-off'}
                      </span>

                      {hasDues && (
                        <button
                          onClick={() => handleOpenPayment(activeClearance.id, item)}
                          className="flex items-center gap-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg shadow-xs transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          Pay ${item.duesAmount}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment Settlement Modal */}
      {paymentModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-slate-900">Settle Department Clearance Fee</h3>
              <button
                onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitPayment} className="space-y-4">
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-800">{paymentModal.departmentName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Purpose:</span>
                  <span className="font-semibold text-slate-800">{paymentModal.purpose}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Total Payable:</span>
                  <span className="font-bold text-blue-600 font-mono">${paymentModal.amount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Card Number (Simulated Gateway)
                </label>
                <input
                  type="text"
                  defaultValue="4532 •••• •••• 9812"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                  readOnly
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">Expiry</label>
                  <input type="text" defaultValue="12/28" className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" readOnly />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">CVC</label>
                  <input type="text" defaultValue="392" className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono" readOnly />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModal({ ...paymentModal, isOpen: false })}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={processingPayment}
                  className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm shadow-md transition"
                >
                  {processingPayment ? 'Processing...' : `Pay $${paymentModal.amount}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

