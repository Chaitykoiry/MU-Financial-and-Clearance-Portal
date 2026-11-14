import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { clearanceApi, paymentApi, certificateApi, financeApi, enrollmentPaperApi, admitCardApi } from '../services/api';
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
  Sparkles,
  GraduationCap,
  Landmark,
  Calendar,
  BookOpen,
  DollarSign,
  FileText,
  AlertCircle,
  Check,
  X,
  ShieldCheck,
  Percent,
  TrendingDown
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [admitCardStatus, setAdmitCardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('finance'); // 'finance' | 'enrollment' | 'admitCard' | 'clearance' | 'history'

  // Bank Deposit Modal State
  const [bankModal, setBankModal] = useState({
    isOpen: false,
    slipNumber: '',
    bankBranch: 'NRBC Bank, Metropolitan University Campus Branch, Bateshwar',
    amount: 6400,
    purpose: 'Spring Term 2026 — 2nd Tuition Installment',
    depositDate: '2026-02-12'
  });
  const [submittingSlip, setSubmittingSlip] = useState(false);

  useEffect(() => {
    loadAllStudentData();
  }, []);

  const loadAllStudentData = async () => {
    try {
      setLoading(true);
      const [finRes, clrRes, enrRes, admRes] = await Promise.allSettled([
        financeApi.getOverview(),
        clearanceApi.getMyClearances(),
        enrollmentPaperApi.getStatus(),
        admitCardApi.getStatus()
      ]);

      if (finRes.status === 'fulfilled' && finRes.value.data.success) {
        setFinancialData(finRes.value.data);
      }
      if (clrRes.status === 'fulfilled' && clrRes.value.data.success) {
        setClearances(clrRes.value.data.clearances);
      }
      if (enrRes.status === 'fulfilled' && enrRes.value.data.success) {
        setEnrollmentStatus(enrRes.value.data);
      }
      if (admRes.status === 'fulfilled' && admRes.value.data.success) {
        setAdmitCardStatus(admRes.value.data);
      }
    } catch (err) {
      console.error('Failed to load student dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  const submitBankSlip = async (e) => {
    e.preventDefault();
    try {
      setSubmittingSlip(true);
      const res = await paymentApi.process({
        amount: parseFloat(bankModal.amount),
        purpose: bankModal.purpose,
        paymentMethod: 'NRBC_BANK_DEPOSIT',
        bankBranch: bankModal.bankBranch,
        slipNumber: bankModal.slipNumber
      });

      if (res.data.success) {
        alert('Deposit slip submitted successfully! Sent to Accounts Section for audit & verification.');
        setBankModal({ ...bankModal, isOpen: false, slipNumber: '' });
        loadAllStudentData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment submission failed.');
    } finally {
      setSubmittingSlip(false);
    }
  };

  const downloadFileWithToken = async (url, filename) => {
    try {
      const token = localStorage.getItem('cpcs_token');
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Download failed');
      }
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      alert(err.message || 'Error downloading PDF document.');
    }
  };

  const activeClearance = clearances.length > 0 ? clearances[0] : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Student Academic & Profile Header */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0f2b5c] text-white font-bold px-2.5 py-0.5 rounded-md text-[11px] uppercase tracking-wider">
              Metropolitan University • Bateshwar Campus
            </span>
            <span className="text-xs text-slate-500 font-semibold">Active Session: Spring 2026</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1">{user?.fullName}</h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Student ID: <span className="font-mono font-bold text-blue-600">{user?.matricOrStaffId}</span> • 
            Department of Computer Science & Engineering (Batch 56)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setBankModal({ ...bankModal, isOpen: true })}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md transition text-xs"
          >
            <CreditCard className="w-4 h-4 text-amber-300" />
            Submit NRBC Bank Slip
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 gap-2 overflow-x-auto text-xs font-bold">
        <button
          onClick={() => setActiveTab('finance')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'finance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Landmark className="w-4 h-4" />
          Financial & Tuition Overview
        </button>

        <button
          onClick={() => setActiveTab('enrollment')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'enrollment'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          Course Enrollment Paper
          {enrollmentStatus?.isEligible && (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('admitCard')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'admitCard'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <GraduationCap className="w-4 h-4" />
          Examination Admit Card
          {admitCardStatus?.isEligible ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('clearance')}
          className={`pb-3 px-4 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'clearance'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Administrative Clearance (3 Stages)
        </button>
      </div>

      {/* TAB 1: FINANCIAL OVERVIEW */}
      {activeTab === 'finance' && (
        <div className="space-y-6">
          {/* Top KPI Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
              <div className="text-2xl font-extrabold text-slate-900 mt-1 font-mono">
                Tk. {financialData?.summary?.totalOutstanding?.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Spring Term 2026 Balance</div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">Total Paid</span>
              <div className="text-2xl font-extrabold text-emerald-700 mt-1 font-mono">
                Tk. {financialData?.summary?.totalPaid?.toLocaleString() || '0'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Verified Accounts Ledger</div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Monthly Net Tuition</span>
              <div className="text-2xl font-extrabold text-blue-700 mt-1 font-mono">
                Tk. {financialData?.summary?.monthlyTuition?.toLocaleString() || '8,000'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">Per Installment (After Waiver)</div>
            </div>

            <div className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Tuition Waiver</span>
              <div className="text-2xl font-extrabold text-amber-600 mt-1 font-mono flex items-center gap-1">
                <Percent className="w-5 h-5" />
                {financialData?.summary?.tuitionWaiverPercentage || 0}%
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                {financialData?.summary?.scholarshipCategory || 'Merit Scholarship'}
              </div>
            </div>
          </div>

          {/* Transparent Tuition Waiver Benefit Banner */}
          {financialData?.tuitionBreakdown && financialData.tuitionBreakdown.waiverPercentage > 0 && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 shadow-xs">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 bg-amber-200/60 px-2.5 py-0.5 rounded-md">
                      Institutional Tuition Waiver Benefit
                    </span>
                    <h3 className="text-base font-extrabold text-amber-950 mt-1">
                      {financialData.tuitionBreakdown.waiverPercentage}% Individual Tuition Waiver Active
                    </h3>
                    <p className="text-xs text-amber-900 mt-0.5">
                      {financialData.tuitionBreakdown.appliedRule}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center w-full md:w-auto">
                  <div className="bg-white/80 border border-amber-200 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-slate-500 font-bold block">Original Tuition</span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      Tk. {financialData.tuitionBreakdown.originalTuition?.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white/80 border border-amber-200 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-amber-700 font-bold block">Your Waiver</span>
                    <span className="font-mono font-bold text-amber-700 text-sm">
                      {financialData.tuitionBreakdown.waiverPercentage}%
                    </span>
                  </div>

                  <div className="bg-white/80 border border-emerald-200 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-emerald-700 font-bold block">Waiver Discount</span>
                    <span className="font-mono font-bold text-emerald-700 text-sm">
                      -Tk. {financialData.tuitionBreakdown.discountAmount?.toLocaleString()}
                    </span>
                  </div>

                  <div className="bg-white/80 border border-blue-200 p-2.5 rounded-2xl">
                    <span className="text-[10px] text-blue-700 font-bold block">Payable Tuition</span>
                    <span className="font-mono font-bold text-blue-700 text-sm">
                      Tk. {financialData.tuitionBreakdown.payableTuition?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Late-Payment Automated Fine Alert */}
          {financialData?.fineAssessment && financialData.fineAssessment.totalLateFineBdt > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-3xl p-5 text-xs text-rose-900 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold text-rose-950 uppercase tracking-wider text-[11px]">
                  Automated Late-Payment Penalty Assessment
                </span>
                <p>
                  Metropolitan University policy assesses a late fine of <span className="font-bold font-mono">Tk. 10 per day</span> for tuition unpaid past the 12th of the month, and a <span className="font-bold font-mono">fixed Tk. 1,000 fine</span> for semester registration unpaid past the 25th.
                </p>
                <div className="font-mono font-bold text-rose-700 pt-1">
                  Total Accumulated Late Fine: Tk. {financialData.fineAssessment.totalLateFineBdt?.toLocaleString()} 
                  {financialData.fineAssessment.semesterRegFine?.fineAmountBdt > 0 && ` (Includes Tk. ${financialData.fineAssessment.semesterRegFine.fineAmountBdt} Semester Late Fee)`}
                </div>
              </div>
            </div>
          )}

          {/* 4-Installment Term Schedule Cards */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-blue-600" />
                  Spring Term 2026 — 4-Installment Due Schedule
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tuition deadline is the 12th of each month. From the 13th onward, Tk. 10 per overdue day is assessed.
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                4 Equal Installments
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {financialData?.installments?.map((inst) => (
                <div
                  key={inst.id}
                  className={`p-4 rounded-2xl border transition ${
                    inst.status === 'PAID'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : new Date() > new Date(inst.dueDate)
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Installment #{inst.installmentNumber}
                    </span>
                    <Calendar className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-800 mt-2 font-mono">
                    Tk. {inst.amountBdt?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-1">
                    Due: {new Date(inst.dueDate).toLocaleDateString()}
                  </div>

                  <div className="mt-3">
                    {inst.status === 'PAID' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Paid & Verified
                      </span>
                    ) : new Date() > new Date(inst.dueDate) ? (
                      <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Overdue (Fine Applied)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                        Upcoming Due
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Itemized Fee Breakdown Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-blue-600" />
              Official Semester Fee Breakdown & Obligations
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4">Fee Category / Description</th>
                    <th className="py-3 px-4 font-mono text-right">Original Amount</th>
                    <th className="py-3 px-4 font-mono text-right">Waiver Discount</th>
                    <th className="py-3 px-4 font-mono text-right">Late Fine</th>
                    <th className="py-3 px-4 font-mono text-right">Payable Net</th>
                    <th className="py-3 px-4 text-center">Payment Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {financialData?.itemizedFeeTable?.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        {row.description}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-slate-600">
                        Tk. {row.originalAmount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-emerald-600">
                        {row.waiverDiscount > 0 ? `-Tk. ${row.waiverDiscount.toLocaleString()} (${row.waiverPercentage}%)` : '—'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right text-rose-600">
                        {row.fineAmount > 0 ? `+Tk. ${row.fineAmount.toLocaleString()}` : 'Tk. 0'}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-right font-bold text-slate-900">
                        Tk. {row.payableAmount?.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {row.status === 'PAID' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            Paid & Confirmed
                          </span>
                        ) : row.status === 'ELIGIBLE' ? (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                            Eligible
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                            Pending Dues
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COURSE ENROLLMENT PAPER */}
      {activeTab === 'enrollment' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-blue-50 text-[#0f2b5c] rounded-2xl flex items-center justify-center mx-auto mb-2">
              <FileText className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Course Enrollment Paper</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              The official Course Enrollment Paper confirms your registered semester courses for Spring 2026 upon verified Semester Registration Fee payment.
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/80 space-y-3 text-xs">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-700">Semester Registration Fee Status:</span>
              {enrollmentStatus?.isFeePaid ? (
                <span className="font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Verified & Confirmed (Paid)
                </span>
              ) : (
                <span className="font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Unpaid / Pending Verification
                </span>
              )}
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Required Registration Fee:</span>
              <span className="font-mono font-bold text-slate-900">
                Tk. {enrollmentStatus?.registrationFeeBdt?.toLocaleString() || '15,000'}
              </span>
            </div>

            <div className="flex justify-between items-center text-slate-600">
              <span>Registered Term:</span>
              <span className="font-semibold text-slate-900">Spring Term 2026 (Semester 8)</span>
            </div>
          </div>

          {enrollmentStatus?.isEligible ? (
            <div className="text-center pt-2">
              <button
                onClick={() => downloadFileWithToken(enrollmentPaperApi.downloadUrl, `MU_Course_Enrollment_${user?.matricOrStaffId}.pdf`)}
                className="inline-flex items-center gap-2 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition text-xs"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Download Official Course Enrollment Paper (PDF)
              </button>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-900 space-y-2">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Course Enrollment Paper is Locked
              </div>
              <p>
                To generate and download your Course Enrollment Paper, your Semester Registration Fee (Tk. 15,000) must be paid and verified by Accounts.
              </p>
              <button
                onClick={() => setBankModal({ ...bankModal, isOpen: true, amount: 15000, purpose: 'Spring 2026 — Semester Registration Fee' })}
                className="mt-1 bg-amber-600 hover:bg-amber-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
              >
                Submit Semester Registration Payment
              </button>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: EXAMINATION ADMIT CARD */}
      {activeTab === 'admitCard' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xs max-w-3xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-purple-50 text-purple-900 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <GraduationCap className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900">Examination Admit Card</h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Semester Final Examination — Spring 2026. Financial clearance across tuition installments, registration fees, and late fines is mandatory for admit card issuance.
            </p>
          </div>

          {/* Financial Audit Eligibility Checklist */}
          <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/80 space-y-3 text-xs">
            <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
              Financial Clearance Audit Criteria:
            </h4>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span>1. Monthly Tuition Installments for Exam Period:</span>
                {admitCardStatus?.financialSummary?.unpaidTuitionInstallments === 0 ? (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> All Paid
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> {admitCardStatus?.financialSummary?.unpaidTuitionInstallments} Pending
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span>2. Semester Registration Fee:</span>
                {admitCardStatus?.financialSummary?.isSemesterRegPaid ? (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Paid & Confirmed
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Unpaid
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span>3. Overdue Late Fines:</span>
                {admitCardStatus?.financialSummary?.outstandingFineBdt === 0 || admitCardStatus?.financialSummary?.fineException ? (
                  <span className="text-emerald-700 font-bold inline-flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Cleared / Exempt
                  </span>
                ) : (
                  <span className="text-rose-700 font-bold inline-flex items-center gap-1">
                    <X className="w-3.5 h-3.5" /> Tk. {admitCardStatus?.financialSummary?.outstandingFineBdt} Due
                  </span>
                )}
              </div>
            </div>
          </div>

          {admitCardStatus?.isEligible || admitCardStatus?.hasAdministrativeOverride ? (
            <div className="text-center pt-2 space-y-3">
              {admitCardStatus?.hasAdministrativeOverride && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs">
                  <span className="font-bold">Administrative Override Granted:</span> "{admitCardStatus.overrideReason}"
                </div>
              )}

              <button
                onClick={() => downloadFileWithToken(admitCardApi.downloadUrl, `MU_Admit_Card_${user?.matricOrStaffId}.pdf`)}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-purple-600 hover:to-indigo-700 text-white font-bold px-6 py-3 rounded-2xl shadow-lg transition text-xs"
              >
                <Download className="w-4 h-4 text-amber-400" />
                Download Official Examination Admit Card (PDF with QR)
              </button>
            </div>
          ) : (
            <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 text-xs text-rose-900 space-y-3">
              <div className="font-bold flex items-center gap-1.5 text-rose-950 text-sm">
                <AlertCircle className="w-4 h-4 text-rose-600" />
                Admit Card Blocked — Financial Clearance Required
              </div>
              <p className="text-rose-800">
                You are currently financially ineligible to sit for the Semester Final Examination due to the following outstanding liabilities:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-rose-950 font-medium">
                {admitCardStatus?.blockingReasons?.map((reason, idx) => (
                  <li key={idx}>{reason}</li>
                ))}
              </ul>
              <div className="pt-1">
                <button
                  onClick={() => setBankModal({ ...bankModal, isOpen: true })}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  Settle Outstanding Dues via Bank Deposit
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: ADMINISTRATIVE CLEARANCE (3 STAGES) */}
      {activeTab === 'clearance' && (
        <div className="space-y-6">
          {/* Active Status Ribbon */}
          <div
            className={`p-6 rounded-3xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
              activeClearance?.status === 'APPROVED'
                ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                : 'bg-amber-50/80 border-amber-200 text-amber-900'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-2xl ${activeClearance?.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                {activeClearance?.status === 'APPROVED' ? <CheckCircle className="w-8 h-8" /> : <Clock className="w-8 h-8" />}
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider">
                  Clearance Pipeline Status: {activeClearance?.status || 'IN_PROGRESS'}
                </span>
                <h2 className="text-xl font-extrabold mt-0.5">
                  Final Graduation & Convocation Clearance (Spring 2026)
                </h2>
                {activeClearance?.certificateCode && (
                  <p className="text-xs font-mono font-bold mt-1 flex items-center gap-1.5 text-emerald-700">
                    <Sparkles className="w-3.5 h-3.5" />
                    Verified Certificate ID: {activeClearance.certificateCode}
                  </p>
                )}
              </div>
            </div>

            {activeClearance?.status === 'APPROVED' ? (
              <div className="flex gap-2">
                <a
                  href={`/verify-certificate/${activeClearance.certificateCode}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-white border border-emerald-300 text-emerald-800 text-xs font-bold px-4 py-2 rounded-xl transition"
                >
                  <QrCode className="w-4 h-4" />
                  Public QR Authenticator
                </a>
                <button
                  onClick={() => downloadFileWithToken(certificateApi.downloadUrl(activeClearance.id), `MU_Clearance_Certificate.pdf`)}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  Download PDF
                </button>
              </div>
            ) : (
              <div className="text-xs font-semibold text-amber-800 bg-white px-3.5 py-1.5 rounded-xl border border-amber-200">
                Awaiting department review & dues verification
              </div>
            )}
          </div>

          {/* Department Breakdown Cards (Strictly 3: Accounts, Library, Head of Dept) */}
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-4">
              <Building2 className="w-4 h-4 text-blue-600" />
              Department Sign-Off Checklist & Liability Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {activeClearance?.departmentApprovals
                ?.filter((item) => {
                  const code = (item.department?.code || '').toUpperCase();
                  const name = (item.department?.name || '').toLowerCase();
                  return (
                    code === 'ACCOUNTS' ||
                    code === 'LIBRARY' ||
                    code === 'CSE' ||
                    code === 'DEPT_HEAD' ||
                    name.includes('accounts') ||
                    name.includes('library') ||
                    name.includes('head')
                  );
                })
                .map((item, idx) => (
                  <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                          {item.department?.code}
                        </span>
                        {item.status === 'APPROVED' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" /> Approved
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Sign-off
                          </span>
                        )}
                      </div>

                      <h4 className="font-bold text-slate-800 text-sm mt-2.5">{item.department?.name}</h4>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Metropolitan University clearance stage {idx + 1}
                      </p>

                      {item.remarks && (
                        <div className="mt-3 text-[11px] bg-slate-50 p-2 rounded-lg text-slate-600 italic">
                          "{item.remarks}"
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400">
                      Signatory: {item.officer?.fullName || 'Institutional Verifier'}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Bank Deposit Slip Submission Modal */}
      {bankModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-base text-slate-900">Submit NRBC Bank Deposit Slip</h3>
              <button onClick={() => setBankModal({ ...bankModal, isOpen: false })} className="text-slate-400 hover:text-slate-600 text-sm font-bold">
                ✕
              </button>
            </div>

            <form onSubmit={submitBankSlip} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Banking Partner</label>
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium">
                  NRBC Bank PLC (Account: <span className="font-mono font-bold text-blue-600">015954000000001</span>)
                  <div className="text-[10px] text-slate-500 mt-0.5">Campus Branch, Bateshwar, Sylhet</div>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Bank Branch Name</label>
                <input
                  type="text"
                  required
                  value={bankModal.bankBranch}
                  onChange={(e) => setBankModal({ ...bankModal, bankBranch: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Deposit Slip / Scroll #</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. NRBC-SLIP-77382"
                  value={bankModal.slipNumber}
                  onChange={(e) => setBankModal({ ...bankModal, slipNumber: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Amount (BDT)</label>
                  <input
                    type="number"
                    required
                    value={bankModal.amount}
                    onChange={(e) => setBankModal({ ...bankModal, amount: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Deposit Date</label>
                  <input
                    type="date"
                    required
                    value={bankModal.depositDate}
                    onChange={(e) => setBankModal({ ...bankModal, depositDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">Payment Purpose</label>
                <input
                  type="text"
                  required
                  value={bankModal.purpose}
                  onChange={(e) => setBankModal({ ...bankModal, purpose: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <button
                type="submit"
                disabled={submittingSlip}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
              >
                {submittingSlip ? 'Submitting to Accounts Queue...' : 'Confirm Bank Slip Submission'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
