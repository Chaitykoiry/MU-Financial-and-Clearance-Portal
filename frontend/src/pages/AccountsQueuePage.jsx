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
  Building,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Upload,
  FileSpreadsheet,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function AccountsQueuePage() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Side-by-Side Slip Inspector & Verification Modal State
  const [inspectorModal, setInspectorModal] = useState({
    isOpen: false,
    payment: null,
    zoom: 100,
    rotation: 0,
    remarks: 'Verified against NRBC Bank Campus Branch daily collection statement.',
    rejectMode: false,
    rejectReason: ''
  });

  // Automated CSV Bank Statement Reconciliation Modal State
  const [csvModal, setCsvModal] = useState(false);
  const [csvContent, setCsvContent] = useState('');
  const [csvFileName, setCsvFileName] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState(null);

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

  const openSlipInspector = (payment, startInRejectMode = false) => {
    setInspectorModal({
      isOpen: true,
      payment,
      zoom: 100,
      rotation: 0,
      remarks: 'Verified against NRBC Bank Campus Branch daily collection statement.',
      rejectMode: startInRejectMode,
      rejectReason: ''
    });
  };

  const handleVerify = async (e) => {
    if (e) e.preventDefault();
    if (!inspectorModal.payment) return;

    try {
      setActionLoading(true);
      const res = await accountsApi.verifyBankDeposit(inspectorModal.payment.id, {
        remarks: inspectorModal.remarks
      });
      if (res.data.success) {
        alert('Deposit slip verified! Student ledger credited and installment/registration updated.');
        setInspectorModal({ ...inspectorModal, isOpen: false, payment: null });
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to verify deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (e) => {
    if (e) e.preventDefault();
    if (!inspectorModal.payment || !inspectorModal.rejectReason.trim()) {
      alert('Please provide a rejection reason.');
      return;
    }

    try {
      setActionLoading(true);
      const res = await accountsApi.rejectBankDeposit(inspectorModal.payment.id, {
        remarks: inspectorModal.rejectReason
      });
      if (res.data.success) {
        alert('Deposit slip marked as rejected. Student notified to resubmit.');
        setInspectorModal({ ...inspectorModal, isOpen: false, payment: null });
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject deposit.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCsvFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setCsvContent(String(evt.target?.result || ''));
      setReconcileResult(null);
    };
    reader.readAsText(file);
  };

  const handleDownloadWithAuth = async (url, filename) => {
    try {
      const token = localStorage.getItem('cpcs_token');
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const dlUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = dlUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert('Failed to download report file.');
    }
  };

  const handleLoadSampleCsvIntoEditor = async () => {
    try {
      const token = localStorage.getItem('cpcs_token');
      const response = await fetch(accountsApi.sampleStatementCsvUrl, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const text = await response.text();
      setCsvContent(text);
      setCsvFileName('NRBC_Bank_Daily_Statement_Spring2026.csv');
      setReconcileResult(null);
    } catch (err) {
      alert('Could not load sample NRBC CSV statement.');
    }
  };

  const handleRunCsvReconciliation = async (e) => {
    e.preventDefault();
    if (!csvContent.trim()) {
      alert('Please upload a CSV file or load the sample NRBC Bank statement first.');
      return;
    }

    try {
      setReconciling(true);
      const res = await accountsApi.reconcileCsv({ csvContent });
      if (res.data.success) {
        setReconcileResult(res.data);
        fetchQueue();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'CSV reconciliation failed.');
    } finally {
      setReconciling(false);
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
      {/* Header & Action Toolbar */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0f2b5c] text-white font-bold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider">
              Accounts & Finance Section
            </span>
            <span className="text-xs text-slate-500 font-semibold">NRBC Bank Campus Branch (015954000000001)</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">
            Bank Deposit Verification & Reconciliation Center
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Side-by-side physical slip inspection, automated NRBC Bank CSV statement matching, and financial PDF/Excel exports.
          </p>
        </div>

        {/* KPIs & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="bg-blue-50 border border-blue-200 px-3.5 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-blue-700 uppercase block">Pending Slips</span>
            <span className="text-lg font-extrabold text-blue-900 font-mono">{queue.length}</span>
          </div>
          <div className="bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-right">
            <span className="text-[10px] font-bold text-emerald-700 uppercase block">Pending Value</span>
            <span className="text-lg font-extrabold text-emerald-900 font-mono">
              Tk. {totalPendingAmount.toLocaleString()}
            </span>
          </div>

          <button
            onClick={() => {
              setCsvModal(true);
              setReconcileResult(null);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-[#0f2b5c] to-blue-800 hover:from-blue-800 hover:to-[#0f2b5c] text-white font-bold px-4 py-2.5 rounded-2xl text-xs shadow-md transition"
          >
            <FileSpreadsheet className="w-4 h-4 text-amber-400" />
            Auto-Reconcile Bank CSV
          </button>
        </div>
      </div>

      {/* Search & Financial Report Exports Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-center gap-3">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by student name, ID or slip number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#0f2b5c]"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end text-xs">
          <button
            onClick={() => handleDownloadWithAuth(accountsApi.defaultersPdfUrl, 'MU_Department_Defaulter_Report_Spring2026.pdf')}
            className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold inline-flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Defaulter List (PDF)
          </button>
          <button
            onClick={() => handleDownloadWithAuth(accountsApi.defaultersCsvUrl, 'MU_Defaulter_Report_Spring2026.csv')}
            className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl font-bold inline-flex items-center gap-1.5 transition"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            Defaulters (Excel CSV)
          </button>
          <button
            onClick={() => handleDownloadWithAuth(accountsApi.collectionsPdfUrl, 'MU_Monthly_Collection_Report_Spring2026.pdf')}
            className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold inline-flex items-center gap-1.5 transition"
          >
            <Download className="w-3.5 h-3.5" />
            Monthly Collection Report (PDF)
          </button>
        </div>
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
                  <th className="py-3.5 px-4">Slip Receipt & Preview</th>
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
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          {item.slipDocumentUrl && !item.slipDocumentUrl.endsWith('.pdf') && (
                            <button
                              type="button"
                              onClick={() => openSlipInspector(item, false)}
                              className="w-14 h-9 rounded-lg border border-slate-300 overflow-hidden bg-slate-100 shrink-0 hover:ring-2 hover:ring-blue-500 transition relative group"
                              title="Click to open Side-by-Side Slip Viewer"
                            >
                              <img
                                src={item.slipDocumentUrl}
                                alt="Deposit Slip"
                                className="w-full h-full object-cover"
                              />
                              <span className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition">
                                <Eye className="w-3.5 h-3.5" />
                              </span>
                            </button>
                          )}
                          <div>
                            <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 block">
                              {item.slipNumber || 'SLIP-77382'}
                            </span>
                            <button
                              type="button"
                              onClick={() => openSlipInspector(item, false)}
                              className="text-[10px] text-blue-600 hover:underline font-semibold mt-0.5 inline-flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> Inspect Physical Slip
                            </button>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-extrabold text-emerald-700 text-sm">
                        Tk. {item.amountBdt.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-700">{item.purpose}</td>
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {item.bankBranch || 'NRBC Bank Campus Branch, Bateshwar'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {new Date(item.depositDate || item.createdAt).toLocaleDateString('en-GB')}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openSlipInspector(item, false)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1 shadow-xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            Inspect & Verify
                          </button>
                          <button
                            onClick={() => openSlipInspector(item, true)}
                            className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold px-2.5 py-1.5 rounded-xl text-xs transition flex items-center gap-1"
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

      {/* SIDE-BY-SIDE SLIP INSPECTOR & VERIFICATION MODAL */}
      {inspectorModal.isOpen && inspectorModal.payment && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-6xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
            {/* Top Bar */}
            <div className="bg-[#0f2b5c] text-white px-6 py-4 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <Landmark className="w-5 h-5 text-amber-400" />
                <div>
                  <h3 className="font-extrabold text-sm">
                    Side-by-Side NRBC Bank Deposit Slip Inspector & Ledger Auditor
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Transaction Ref: <span className="font-mono text-amber-300">{inspectorModal.payment.transactionReference}</span> • Slip Scroll: <span className="font-mono text-white font-bold">{inspectorModal.payment.slipNumber}</span>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectorModal({ ...inspectorModal, isOpen: false })}
                className="text-white/70 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split-Pane Content */}
            <div className="grid grid-cols-1 lg:grid-cols-12">
              {/* LEFT PANE (7 cols): Interactive Physical Slip Image/PDF Previewer */}
              <div className="lg:col-span-7 bg-slate-900 p-5 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-200 min-h-[420px]">
                {/* Viewer Toolbar */}
                <div className="flex justify-between items-center bg-slate-800/90 px-3.5 py-2 rounded-xl text-xs text-slate-200 mb-3">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <FileText className="w-4 h-4" />
                    Scanned Deposit Slip Preview
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setInspectorModal((m) => ({ ...m, zoom: Math.max(50, m.zoom - 25) }))}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                      title="Zoom Out"
                    >
                      <ZoomOut className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-[11px] px-2">{inspectorModal.zoom}%</span>
                    <button
                      type="button"
                      onClick={() => setInspectorModal((m) => ({ ...m, zoom: Math.min(225, m.zoom + 25) }))}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                      title="Zoom In"
                    >
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorModal((m) => ({ ...m, rotation: (m.rotation + 90) % 360 }))}
                      className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg ml-1"
                      title="Rotate 90°"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Image / PDF Canvas */}
                <div className="flex-1 bg-slate-950/80 rounded-2xl border border-slate-800 overflow-auto flex items-center justify-center p-4 max-h-[440px]">
                  {inspectorModal.payment.slipDocumentUrl?.startsWith('data:application/pdf') ||
                  inspectorModal.payment.slipDocumentUrl?.endsWith('.pdf') ? (
                    <iframe
                      src={inspectorModal.payment.slipDocumentUrl}
                      title="Deposit Slip PDF"
                      className="w-full h-96 rounded-xl bg-white"
                    />
                  ) : (
                    <img
                      src={inspectorModal.payment.slipDocumentUrl}
                      alt="NRBC Bank Deposit Slip"
                      style={{
                        transform: `scale(${inspectorModal.zoom / 100}) rotate(${inspectorModal.rotation}deg)`,
                        transformOrigin: 'center center'
                      }}
                      className="max-w-full h-auto rounded-lg shadow-lg transition-transform duration-200"
                    />
                  )}
                </div>

                <div className="mt-3 flex justify-between items-center text-[11px] text-slate-400">
                  <span>Collection A/C: 015954000000001 (NRBC Bank PLC, Bateshwar)</span>
                  <a
                    href={inspectorModal.payment.slipDocumentUrl}
                    download={`Slip_${inspectorModal.payment.slipNumber}.png`}
                    className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Slip Copy
                  </a>
                </div>
              </div>

              {/* RIGHT PANE (5 cols): Audit Metadata & Decision Form */}
              <div className="lg:col-span-5 p-6 flex flex-col justify-between text-xs space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <span className="font-extrabold text-slate-900 text-sm">
                      Financial Ledger Cross-Check
                    </span>
                    <span className="bg-amber-100 text-amber-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      PENDING AUDIT
                    </span>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student Name:</span>
                      <span className="font-bold text-slate-900">
                        {inspectorModal.payment.student?.user?.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Student ID Number:</span>
                      <span className="font-mono font-bold text-blue-600">
                        {inspectorModal.payment.student?.studentIdNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Programme:</span>
                      <span className="font-semibold text-slate-800">
                        {inspectorModal.payment.student?.programme?.title || 'B.Sc. in CSE'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Slip Scroll Number:</span>
                      <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                        {inspectorModal.payment.slipNumber}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Purpose:</span>
                      <span className="font-semibold text-slate-800 text-right">
                        {inspectorModal.payment.purpose}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200">
                      <span className="text-slate-700 font-bold">Deposited Amount:</span>
                      <span className="font-mono font-black text-emerald-700 text-base">
                        Tk. {inspectorModal.payment.amountBdt?.toLocaleString()} BDT
                      </span>
                    </div>
                  </div>

                  {/* Mode Switcher: Approve vs Reject */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl font-bold">
                    <button
                      type="button"
                      onClick={() => setInspectorModal({ ...inspectorModal, rejectMode: false })}
                      className={`py-2 rounded-lg transition ${
                        !inspectorModal.rejectMode
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ✓ Verify & Credit
                    </button>
                    <button
                      type="button"
                      onClick={() => setInspectorModal({ ...inspectorModal, rejectMode: true })}
                      className={`py-2 rounded-lg transition ${
                        inspectorModal.rejectMode
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      ✕ Reject Slip
                    </button>
                  </div>

                  {!inspectorModal.rejectMode ? (
                    <div className="space-y-2">
                      <label className="block font-bold text-slate-700 uppercase">
                        Verification Audit Note
                      </label>
                      <textarea
                        rows={3}
                        value={inspectorModal.remarks}
                        onChange={(e) => setInspectorModal({ ...inspectorModal, remarks: e.target.value })}
                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                      />
                      <p className="text-[11px] text-slate-500">
                        Approving posts a double-entry <span className="font-mono font-bold">CREDIT_PAYMENT</span> to the student ledger and unlocks eligible academic documents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block font-bold text-rose-700 uppercase">
                        Reason for Rejection *
                      </label>
                      <textarea
                        rows={3}
                        placeholder="e.g. Unclear scroll number, amount mismatch with bank statement..."
                        value={inspectorModal.rejectReason}
                        onChange={(e) => setInspectorModal({ ...inspectorModal, rejectReason: e.target.value })}
                        className="w-full p-3 bg-rose-50/40 border border-rose-200 rounded-xl text-xs"
                      />
                    </div>
                  )}
                </div>

                {/* Action Footer */}
                <div className="flex gap-2.5 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setInspectorModal({ ...inspectorModal, isOpen: false })}
                    className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                  >
                    Close
                  </button>
                  {!inspectorModal.rejectMode ? (
                    <button
                      type="button"
                      onClick={handleVerify}
                      disabled={actionLoading}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Crediting Ledger...' : 'Confirm & Credit Student Ledger'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleReject}
                      disabled={actionLoading}
                      className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50"
                    >
                      {actionLoading ? 'Rejecting...' : 'Confirm Slip Rejection'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AUTOMATED NRBC BANK STATEMENT CSV RECONCILIATION MODAL */}
      {csvModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-200 my-8 space-y-5 text-xs">
            <div className="flex justify-between items-start pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-blue-600" />
                  Automated NRBC Bank Statement CSV Reconciliation
                </h3>
                <p className="text-slate-500 mt-0.5">
                  Upload daily NRBC Bank Bateshwar Branch CSV exports to automatically match and clear pending student payments by Slip Number, Transaction Reference, or Student ID + Amount.
                </p>
              </div>
              <button
                onClick={() => setCsvModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Step 1: Load Sample or Upload CSV */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-blue-50/70 border border-blue-200 p-4 rounded-2xl">
              <div>
                <div className="font-bold text-blue-950">Need a test statement matching the current queue?</div>
                <div className="text-[11px] text-blue-700">
                  Click to load or download a live NRBC Bank CSV statement generated from your current pending queue.
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleLoadSampleCsvIntoEditor}
                  className="px-3 py-2 bg-[#0f2b5c] hover:bg-blue-900 text-white font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  Load Live Queue into CSV
                </button>
                <button
                  type="button"
                  onClick={() => handleDownloadWithAuth(accountsApi.sampleStatementCsvUrl, 'NRBC_Bank_Daily_Statement_Spring2026.csv')}
                  className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold rounded-xl transition flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download .CSV
                </button>
              </div>
            </div>

            <form onSubmit={handleRunCsvReconciliation} className="space-y-4">
              {/* Drag and Drop File Input */}
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-4 text-center bg-slate-50 transition">
                <input
                  type="file"
                  id="nrbc-csv-upload"
                  accept=".csv,text/csv"
                  onChange={handleCsvFileUpload}
                  className="hidden"
                />
                <label htmlFor="nrbc-csv-upload" className="cursor-pointer flex flex-col items-center gap-1.5">
                  <Upload className="w-6 h-6 text-blue-600" />
                  <span className="font-bold text-slate-800">
                    {csvFileName ? `Loaded: ${csvFileName}` : 'Click to upload NRBC Bank Statement (.CSV)'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Format: SlipNumber,StudentID,StudentName,AmountBDT,DepositDate,Branch,TransactionReference
                  </span>
                </label>
              </div>

              {/* Editable CSV Content Preview */}
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">
                  Statement CSV Content (Editable Preview)
                </label>
                <textarea
                  rows={5}
                  value={csvContent}
                  onChange={(e) => setCsvContent(e.target.value)}
                  placeholder="SlipNumber,StudentID,StudentName,AmountBDT,DepositDate,Branch,TransactionReference&#10;NRBC-SLIP-77382,231-115-042,Clara Oswald,6400,2026-02-12,NRBC Bank Bateshwar,MU-PAY-2026-001"
                  className="w-full p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-2xl border border-slate-700"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setCsvModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={reconciling}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {reconciling ? 'Matching & Reconciling Ledgers...' : 'Run Automated CSV Reconciliation'}
                </button>
              </div>
            </form>

            {/* Reconciliation Results Summary */}
            {reconcileResult && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-emerald-950 text-sm flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {reconcileResult.message}
                  </span>
                  <span className="font-mono font-bold text-emerald-800 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                    Reconciled: Tk. {reconcileResult.summary?.totalAmountReconciledBdt?.toLocaleString()} BDT
                  </span>
                </div>

                {reconcileResult.reconciledItems?.length > 0 && (
                  <div className="bg-white rounded-xl border border-emerald-200 overflow-hidden">
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-emerald-100/60 text-emerald-900 font-bold">
                          <th className="py-2 px-3">Slip #</th>
                          <th className="py-2 px-3">Student</th>
                          <th className="py-2 px-3">Purpose</th>
                          <th className="py-2 px-3 text-right">Amount Credited</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {reconcileResult.reconciledItems.map((item, idx) => (
                          <tr key={idx}>
                            <td className="py-2 px-3 font-mono font-bold">{item.slipNumber}</td>
                            <td className="py-2 px-3">
                              {item.studentName} <span className="font-mono text-blue-600">({item.studentIdNumber})</span>
                            </td>
                            <td className="py-2 px-3">{item.purpose}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              Tk. {item.amountBdt?.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
