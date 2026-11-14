import React, { useState, useEffect } from 'react';
import { accountsApi } from '../services/api';
import {
  Landmark,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  FileText,
  AlertCircle,
  Download,
  ShieldCheck,
  Check,
  X,
  CreditCard,
  Building
} from 'lucide-react';

export default function AccountsQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Verification Modal State
  const [verifyModal, setVerifyModal] = useState({
    isOpen: false,
    payment: null,
    remarks: 'Verified against NRBC Bank Campus Branch daily collection statement.'
  });
  const [rejectModal, setRejectModal] = useState({
    isOpen: false,
    payment: null,
    remarks: ''
  });
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      setLoading(true);
      const res = await accountsApi.getVerificationQueue();
      if (res.data.success) {
        setQueue(res.data.queue);
      }
    } catch (err) {
      console.error('Failed to load accounts queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!verifyModal.payment) return;

    try {
      setActionLoading(true);
      const res = await accountsApi.verifyBankDeposit(verifyModal.payment.id, {
        remarks: verifyModal.remarks
      });
      if (res.data.success) {
        alert('Deposit slip verified successfully. Student ledger credited and installment marked as PAID.');
        setVerifyModal({ isOpen: false, payment: null, remarks: '' });
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    e.preventDefault();
    if (!rejectModal.payment || !rejectModal.remarks) {
      alert('Please provide a rejection reason.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await accountsApi.rejectBankDeposit(rejectModal.payment.id, {
        remarks: rejectModal.remarks
      });
      if (res.data.success) {
        alert('Deposit slip marked as rejected. Student notified to resubmit.');
        setRejectModal({ isOpen: false, payment: null, remarks: '' });
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = queue.filter((p) => {
    const studentUser = p.student?.user;
    const nameMatch = studentUser?.fullName?.toLowerCase().includes(searchTerm.toLowerCase());
    const idMatch = p.student?.studentIdNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    const slipMatch = p.slipNumber?.toLowerCase().includes(searchTerm.toLowerCase());
    return nameMatch || idMatch || slipMatch;
  });

  const totalPendingAmount = queue.reduce((acc, p) => acc + p.amountBdt, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0f2b5c] text-white font-bold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider">
              Accounts & Finance Section
            </span>
            <span className="text-xs text-slate-500 font-semibold">NRBC Bank Campus Branch (015954000000001)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Bank Deposit Verification Queue
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Audit submitted bank deposit slips, cross-reference daily statements, and reconcile student ledgers.
          </p>
        </div>

        {/* Quick KPI summary */}
        <div className="flex items-center gap-3">
          <div className="bg-blue-50 border border-blue-200 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-blue-700 uppercase">Pending Submissions</span>
            <div className="text-xl font-extrabold text-blue-900 font-mono">{queue.length}</div>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-emerald-700 uppercase">Pending Amount</span>
            <div className="text-xl font-extrabold text-emerald-900 font-mono">{totalPendingAmount.toLocaleString()} BDT</div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, ID or slip number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">
          Showing {filtered.length} of {queue.length} pending slips
        </span>
      </div>

      {/* Verification Queue Table */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-xs font-semibold">Loading verification queue...</div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-semibold">
            🎉 All bank deposit slips have been verified! No pending items in queue.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Slip Receipt No</th>
                  <th className="py-3.5 px-4">Amount</th>
                  <th className="py-3.5 px-4">Purpose / Term</th>
                  <th className="py-3.5 px-4">Bank & Branch</th>
                  <th className="py-3.5 px-4">Deposit Date</th>
                  <th className="py-3.5 px-4 text-right">Verification Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((item) => {
                  const studentUser = item.student?.user;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{studentUser?.fullName}</div>
                        <div className="font-mono text-blue-600 font-bold text-[11px] mt-0.5">
                          {item.student?.studentIdNumber || studentUser?.matricOrStaffId}
                        </div>
                        <div className="text-[10px] text-slate-400">{item.student?.programme?.title}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-800">
                        <span className="bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {item.slipNumber || 'SLIP-77382'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                        {item.amountBdt.toLocaleString()} BDT
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">
                        {item.purpose}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {item.bankBranch || 'NRBC Bank Campus Branch, Bateshwar'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(item.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setVerifyModal({ isOpen: true, payment: item, remarks: 'Verified against NRBC Bank daily statement.' })}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition flex items-center gap-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Verify & Credit
                          </button>
                          <button
                            onClick={() => setRejectModal({ isOpen: true, payment: item, remarks: '' })}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2.5 py-1.5 rounded-lg text-xs transition flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Verify Slip Confirmation Modal */}
      {verifyModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">Verify Bank Deposit & Credit Ledger</h3>
              <button onClick={() => setVerifyModal({ ...verifyModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleVerify} className="space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Name:</span>
                  <span className="font-bold text-slate-800">{verifyModal.payment?.student?.user?.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Student ID:</span>
                  <span className="font-mono font-bold text-blue-600">{verifyModal.payment?.student?.studentIdNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Slip Number:</span>
                  <span className="font-mono font-bold text-slate-800">{verifyModal.payment?.slipNumber}</span>
                </div>
                <div className="flex justify-between text-sm pt-1 border-t border-slate-200">
                  <span className="font-bold text-slate-700">Credit Amount:</span>
                  <span className="font-bold text-emerald-700 font-mono">{verifyModal.payment?.amountBdt.toLocaleString()} BDT</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Verification Audit Remarks
                </label>
                <textarea
                  rows="2"
                  value={verifyModal.remarks}
                  onChange={(e) => setVerifyModal({ ...verifyModal, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVerifyModal({ ...verifyModal, isOpen: false })}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  {actionLoading ? 'Verifying...' : 'Confirm Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reject Slip Modal */}
      {rejectModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-rose-900">Reject Bank Deposit Slip</h3>
              <button onClick={() => setRejectModal({ ...rejectModal, isOpen: false })} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleReject} className="space-y-3.5 text-xs">
              <div className="bg-rose-50 p-3.5 rounded-2xl border border-rose-200 space-y-1 text-rose-900">
                <div>Student: <span className="font-bold">{rejectModal.payment?.student?.user?.fullName}</span> ({rejectModal.payment?.student?.studentIdNumber})</div>
                <div>Slip: <span className="font-mono font-bold">{rejectModal.payment?.slipNumber}</span></div>
                <div>Amount: <span className="font-bold">{rejectModal.payment?.amountBdt} BDT</span></div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Rejection (Mandatory)
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="e.g. Deposit slip amount does not match NRBC Bank statement / illegible slip image."
                  value={rejectModal.remarks}
                  onChange={(e) => setRejectModal({ ...rejectModal, remarks: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectModal({ ...rejectModal, isOpen: false })}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="w-1/2 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  {actionLoading ? 'Rejecting...' : 'Reject Submission'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

