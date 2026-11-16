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
  TrendingDown,
  Upload,
  Smartphone,
  Zap,
  RefreshCw,
  Image as ImageIcon
} from 'lucide-react';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [financialData, setFinancialData] = useState(null);
  const [clearances, setClearances] = useState([]);
  const [enrollmentStatus, setEnrollmentStatus] = useState(null);
  const [admitCardStatus, setAdmitCardStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('finance'); // 'finance' | 'enrollment' | 'admitCard' | 'clearance'

  // Bank Deposit Modal State (with Real Slip Upload)
  const [bankModal, setBankModal] = useState({
    isOpen: false,
    slipNumber: '',
    bankBranch: 'NRBC Bank, Metropolitan University Campus Branch, Bateshwar',
    amount: 6400,
    purpose: 'Spring Term 2026 — 2nd Tuition Installment',
    depositDate: '2026-02-12',
    slipFileBase64: '',
    slipFileName: ''
  });
  const [submittingSlip, setSubmittingSlip] = useState(false);

  // SSLCommerz / bKash / Nagad Online Payment Gateway Modal State
  const [gatewayModal, setGatewayModal] = useState({
    isOpen: false,
    step: 'config', // 'config' | 'checkout' | 'success'
    gateway: 'BKASH_MFS', // 'BKASH_MFS' | 'NAGAD_MFS' | 'ONLINE_GATEWAY'
    amount: 6400,
    purpose: 'Spring Term 2026 — 2nd Tuition Installment',
    accountNumber: '01711-223344',
    otpCode: '123456',
    sessionData: null,
    receiptData: null
  });
  const [processingGateway, setProcessingGateway] = useState(false);

  // Interactive Course Selection State
  const [selectedCourseMap, setSelectedCourseMap] = useState({}); // { [courseId]: 'REGULAR' | 'RETAKE' }
  const [submittingCourses, setSubmittingCourses] = useState(false);

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
        const enrData = enrRes.value.data;
        setEnrollmentStatus(enrData);

        // Initialize course selection map from existing enrolled/selected courses
        if (enrData.availableCourses) {
          const initialMap = {};
          enrData.availableCourses.forEach((c) => {
            if (c.isSelected) {
              initialMap[c.id] = c.courseType || 'REGULAR';
            }
          });
          setSelectedCourseMap(initialMap);
        }
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

  const handleSlipFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be under 10 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setBankModal((prev) => ({
        ...prev,
        slipFileBase64: reader.result,
        slipFileName: file.name
      }));
    };
    reader.readAsDataURL(file);
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
        slipNumber: bankModal.slipNumber,
        slipFileBase64: bankModal.slipFileBase64 || undefined,
        slipFileName: bankModal.slipFileName || undefined
      });

      if (res.data.success) {
        alert('Deposit slip submitted with digital attachment! Sent to Accounts Section for side-by-side audit & verification.');
        setBankModal({
          ...bankModal,
          isOpen: false,
          slipNumber: '',
          slipFileBase64: '',
          slipFileName: ''
        });
        loadAllStudentData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Payment submission failed.');
    } finally {
      setSubmittingSlip(false);
    }
  };

  const handleStartGatewaySession = async (e) => {
    e.preventDefault();
    try {
      setProcessingGateway(true);
      const res = await paymentApi.initiateGateway({
        amount: parseFloat(gatewayModal.amount),
        purpose: gatewayModal.purpose,
        gateway: gatewayModal.gateway
      });

      if (res.data.success) {
        setGatewayModal((prev) => ({
          ...prev,
          step: 'checkout',
          sessionData: res.data.gatewaySession
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to initialize online payment gateway.');
    } finally {
      setProcessingGateway(false);
    }
  };

  const handleConfirmGatewayWebhook = async (e) => {
    e.preventDefault();
    if (!gatewayModal.sessionData) return;
    try {
      setProcessingGateway(true);
      const res = await paymentApi.verifyGatewayWebhook({
        paymentId: gatewayModal.sessionData.paymentId,
        gatewayTxId: gatewayModal.sessionData.gatewayTxId,
        otpCode: gatewayModal.otpCode
      });

      if (res.data.success) {
        setGatewayModal((prev) => ({
          ...prev,
          step: 'success',
          receiptData: res.data.payment
        }));
        loadAllStudentData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Gateway verification failed.');
    } finally {
      setProcessingGateway(false);
    }
  };

  const toggleCourseSelection = (courseId) => {
    setSelectedCourseMap((prev) => {
      const next = { ...prev };
      if (next[courseId]) {
        delete next[courseId];
      } else {
        next[courseId] = 'REGULAR';
      }
      return next;
    });
  };

  const setCourseTypeForSelected = (courseId, type) => {
    setSelectedCourseMap((prev) => ({
      ...prev,
      [courseId]: type
    }));
  };

  const totalSelectedCredits = (enrollmentStatus?.availableCourses || []).reduce((sum, c) => {
    return selectedCourseMap[c.id] ? sum + Number(c.credits || 0) : sum;
  }, 0);

  const handleSubmitCourseSelection = async () => {
    const selectedIds = Object.keys(selectedCourseMap);
    if (selectedIds.length === 0) {
      alert('Please select at least one course for the semester.');
      return;
    }
    if (totalSelectedCredits > 18.0) {
      alert(`Total selected credits (${totalSelectedCredits.toFixed(1)}) exceed the maximum 18.0 credit limit.`);
      return;
    }

    try {
      setSubmittingCourses(true);
      const coursesPayload = selectedIds.map((courseId) => ({
        courseId,
        courseType: selectedCourseMap[courseId]
      }));

      const res = await enrollmentPaperApi.selectCourses({
        courses: coursesPayload
      });

      if (res.data.success) {
        alert(res.data.message);
        loadAllStudentData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit course selection.');
    } finally {
      setSubmittingCourses(false);
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

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() =>
              setGatewayModal({
                ...gatewayModal,
                isOpen: true,
                step: 'config',
                amount: financialData?.summary?.monthlyTuition || 6400,
                purpose: 'Spring Term 2026 — Tuition Installment Payment'
              })
            }
            className="flex items-center gap-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md transition text-xs"
          >
            <Zap className="w-4 h-4 text-amber-200" />
            Pay Online (bKash / Nagad / SSLCommerz)
          </button>

          <button
            onClick={() => setBankModal({ ...bankModal, isOpen: true })}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-bold px-4 py-2.5 rounded-2xl shadow-md transition text-xs"
          >
            <Upload className="w-4 h-4 text-amber-300" />
            Upload NRBC Bank Slip
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
          Course Selection & Enrollment Paper
          {enrollmentStatus?.isEligible ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-amber-500" />
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
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                    inst.status === 'PAID'
                      ? 'bg-emerald-50/50 border-emerald-200'
                      : new Date() > new Date(inst.dueDate)
                      ? 'bg-rose-50/50 border-rose-200'
                      : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div>
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
                  </div>

                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                    {inst.status === 'PAID' ? (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Paid & Verified
                      </span>
                    ) : (
                      <>
                        {new Date() > new Date(inst.dueDate) ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Overdue
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-md inline-block">
                            Upcoming
                          </span>
                        )}
                        <button
                          onClick={() =>
                            setGatewayModal({
                              ...gatewayModal,
                              isOpen: true,
                              step: 'config',
                              amount: inst.amountBdt,
                              purpose: `Spring Term 2026 — Tuition Installment #${inst.installmentNumber}`
                            })
                          }
                          className="text-[10px] font-bold text-pink-600 hover:text-pink-700 underline"
                        >
                          Pay Now →
                        </button>
                      </>
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

      {/* TAB 2: INTERACTIVE COURSE SELECTION & COURSE ENROLLMENT PAPER */}
      {activeTab === 'enrollment' && (
        <div className="space-y-6 max-w-5xl mx-auto">
          {/* Top Status & Download Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-blue-50 text-[#0f2b5c] rounded-2xl flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-extrabold text-slate-900">
                    Spring 2026 Course Selection & Enrollment Paper
                  </h2>
                  {enrollmentStatus?.advisorApprovalStatus === 'APPROVED' ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" /> Advisor Approved
                    </span>
                  ) : enrollmentStatus?.advisorApprovalStatus === 'PENDING_APPROVAL' ? (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Awaiting Advisor Sign-Off
                    </span>
                  ) : enrollmentStatus?.advisorApprovalStatus === 'REJECTED' ? (
                    <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2.5 py-0.5 rounded-full inline-flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Revision Requested by Advisor
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Select your regular and retake/improvement courses up to 18.0 credits. Both Semester Registration Fee verification and Department Advisor approval are required to unlock the official Course Enrollment Paper.
                </p>
              </div>
            </div>

            <div className="shrink-0 w-full md:w-auto">
              {enrollmentStatus?.isEligible ? (
                <button
                  onClick={() => downloadFileWithToken(enrollmentPaperApi.downloadUrl, `MU_Course_Enrollment_${user?.matricOrStaffId}.pdf`)}
                  className="w-full md:w-auto inline-flex items-center justify-center gap-2 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold px-5 py-3 rounded-2xl shadow-lg transition text-xs"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  Download Official Enrollment Paper (PDF)
                </button>
              ) : (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 text-amber-950">
                    <ShieldAlert className="w-4 h-4 text-amber-600" />
                    Enrollment Paper Locked
                  </div>
                  <div className="text-[11px] text-amber-800 mt-0.5">
                    {!enrollmentStatus?.isFeePaid
                      ? '• Semester Registration Fee (Tk. 15,000) is unpaid.'
                      : '• Waiting for Department Advisor course approval.'}
                  </div>
                  {!enrollmentStatus?.isFeePaid && (
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() =>
                          setGatewayModal({
                            ...gatewayModal,
                            isOpen: true,
                            step: 'config',
                            amount: 15000,
                            purpose: 'Spring 2026 — Semester Registration Fee'
                          })
                        }
                        className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition"
                      >
                        Pay Tk. 15,000 Online (Instant)
                      </button>
                      <button
                        onClick={() =>
                          setBankModal({
                            ...bankModal,
                            isOpen: true,
                            amount: 15000,
                            purpose: 'Spring 2026 — Semester Registration Fee'
                          })
                        }
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-3 py-1.5 rounded-xl text-[11px] transition"
                      >
                        Upload Bank Slip
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 2-Step Verification Checklist Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Prerequisite 1</span>
                <span className="font-bold text-slate-800">Semester Registration Fee (Tk. 15,000)</span>
              </div>
              {enrollmentStatus?.isFeePaid ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Paid & Verified
                </span>
              ) : (
                <span className="font-bold text-rose-700 bg-rose-50 border border-rose-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <X className="w-3.5 h-3.5" /> Unpaid
                </span>
              )}
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Prerequisite 2</span>
                <span className="font-bold text-slate-800">Department Head / Advisor Course Approval</span>
              </div>
              {enrollmentStatus?.isCourseApproved ? (
                <span className="font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Approved ({enrollmentStatus?.totalCredits} Cr.)
                </span>
              ) : (
                <span className="font-bold text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full inline-flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {enrollmentStatus?.advisorApprovalStatus || 'Pending'}
                </span>
              )}
            </div>
          </div>

          {/* Interactive Course Catalog Selection Table */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600" />
                  Interactive Semester Course Selection (Regular & Retake/Improvement)
                </h3>
                <p className="text-[11px] text-slate-500">
                  Check the courses you wish to take this semester and designate whether each course is Regular or Retake/Improvement.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold border ${
                  totalSelectedCredits > 18
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  Selected Credits: {totalSelectedCredits.toFixed(1)} / 18.0 Max
                </div>

                <button
                  onClick={handleSubmitCourseSelection}
                  disabled={submittingCourses || totalSelectedCredits === 0 || totalSelectedCredits > 18}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold px-4 py-2 rounded-xl text-xs shadow-sm transition"
                >
                  {submittingCourses ? 'Submitting...' : 'Submit to Advisor for Approval'}
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                    <th className="py-3 px-4 w-10">Select</th>
                    <th className="py-3 px-4">Course Code</th>
                    <th className="py-3 px-4">Course Title</th>
                    <th className="py-3 px-4 text-center">Credits</th>
                    <th className="py-3 px-4 text-center">Enrollment Type</th>
                    <th className="py-3 px-4 text-right">Current Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enrollmentStatus?.availableCourses?.map((course) => {
                    const isChecked = Boolean(selectedCourseMap[course.id]);
                    const currentType = selectedCourseMap[course.id] || 'REGULAR';

                    return (
                      <tr
                        key={course.id}
                        className={`transition ${isChecked ? 'bg-blue-50/40' : 'hover:bg-slate-50'}`}
                      >
                        <td className="py-3 px-4 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleCourseSelection(course.id)}
                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">
                          {course.code}
                        </td>
                        <td className="py-3 px-4 font-medium text-slate-800">
                          {course.title}
                          <span className="block text-[10px] text-slate-400">Semester {course.semester}</span>
                        </td>
                        <td className="py-3 px-4 text-center font-mono font-bold text-slate-700">
                          {Number(course.credits).toFixed(1)}
                        </td>
                        <td className="py-3 px-4 text-center">
                          {isChecked ? (
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                              <button
                                type="button"
                                onClick={() => setCourseTypeForSelected(course.id, 'REGULAR')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                                  currentType === 'REGULAR'
                                    ? 'bg-[#0f2b5c] text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                Regular
                              </button>
                              <button
                                type="button"
                                onClick={() => setCourseTypeForSelected(course.id, 'RETAKE')}
                                className={`px-2.5 py-1 rounded-md text-[10px] font-bold transition ${
                                  currentType === 'RETAKE'
                                    ? 'bg-amber-600 text-white'
                                    : 'text-slate-600 hover:bg-slate-100'
                                }`}
                              >
                                Retake / Imp.
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          {course.enrollmentStatus === 'ENROLLED' || course.enrollmentStatus === 'RETAKE_APPROVED' ? (
                            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                              Approved ({course.courseType})
                            </span>
                          ) : course.enrollmentStatus === 'PENDING_APPROVAL' || course.enrollmentStatus === 'RETAKE_PENDING' ? (
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                              Pending Advisor
                            </span>
                          ) : course.enrollmentStatus === 'REJECTED' ? (
                            <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                              Revision Needed
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">Not Enrolled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
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
              <div className="pt-1 flex flex-wrap gap-2">
                <button
                  onClick={() =>
                    setGatewayModal({
                      ...gatewayModal,
                      isOpen: true,
                      step: 'config',
                      amount: financialData?.summary?.totalOutstanding || 6400,
                      purpose: 'Spring 2026 — Full Examination Financial Clearance Settlement'
                    })
                  }
                  className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  Pay Online Instantly (bKash / Nagad / Card)
                </button>
                <button
                  onClick={() => setBankModal({ ...bankModal, isOpen: true })}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition"
                >
                  Upload NRBC Bank Deposit Slip
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

      {/* MODAL 1: NRBC Bank Deposit Slip Submission (with File Upload & Preview) */}
      {bankModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-base text-slate-900">Submit NRBC Bank Deposit Slip</h3>
                <p className="text-[11px] text-slate-500">Upload your physical bank deposit slip for Accounts Office side-by-side verification</p>
              </div>
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                <select
                  value={bankModal.purpose}
                  onChange={(e) => {
                    const val = e.target.value;
                    let defaultAmt = bankModal.amount;
                    if (val.includes('Semester Registration Fee')) defaultAmt = 15000;
                    else if (val.includes('Tuition Installment')) defaultAmt = financialData?.summary?.monthlyTuition || 6400;
                    setBankModal({ ...bankModal, purpose: val, amount: defaultAmt });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Spring Term 2026 — 2nd Tuition Installment">Spring Term 2026 — 2nd Tuition Installment</option>
                  <option value="Spring Term 2026 — 3rd Tuition Installment">Spring Term 2026 — 3rd Tuition Installment</option>
                  <option value="Spring Term 2026 — 4th Tuition Installment">Spring Term 2026 — 4th Tuition Installment</option>
                  <option value="Spring 2026 — Semester Registration Fee">Spring 2026 — Semester Registration Fee (Tk. 15,000)</option>
                  <option value="Spring 2026 — Full Outstanding Clearance">Spring 2026 — Full Outstanding Clearance</option>
                </select>
              </div>

              {/* Real Slip Image / PDF Upload Dropzone */}
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Attach Scanned Deposit Slip (PNG / JPG / PDF)
                </label>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl p-4 cursor-pointer transition text-center">
                  <Upload className="w-6 h-6 text-emerald-600 mb-1" />
                  <span className="font-bold text-emerald-900">
                    {bankModal.slipFileName ? bankModal.slipFileName : 'Click to upload photo or scan of NRBC Bank Deposit Slip'}
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    Supports high-resolution image or PDF up to 10MB (Auto-generates digital voucher if omitted)
                  </span>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleSlipFileChange}
                    className="hidden"
                  />
                </label>

                {bankModal.slipFileBase64 && bankModal.slipFileBase64.startsWith('data:image/') && (
                  <div className="mt-2 p-2 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img
                        src={bankModal.slipFileBase64}
                        alt="Slip preview"
                        className="w-14 h-10 object-cover rounded border border-slate-300"
                      />
                      <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[200px]">
                        {bankModal.slipFileName}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setBankModal({ ...bankModal, slipFileBase64: '', slipFileName: '' })}
                      className="text-rose-600 font-bold text-[11px] px-2"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={submittingSlip}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition"
              >
                {submittingSlip ? 'Uploading & Submitting to Accounts Queue...' : 'Confirm & Upload Bank Deposit Slip'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SSLCommerz / bKash / Nagad Sandbox Payment Gateway */}
      {gatewayModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-100">
            {/* Gateway Header */}
            <div className="bg-gradient-to-r from-[#0f2b5c] via-indigo-900 to-pink-700 p-5 text-white flex justify-between items-center">
              <div className="flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-amber-300" />
                <div>
                  <h3 className="font-extrabold text-sm tracking-wide">SSLCommerz • MFS Instant Checkout</h3>
                  <p className="text-[10px] text-blue-200">Metropolitan University Automated IPN Webhook Gateway</p>
                </div>
              </div>
              <button
                onClick={() => setGatewayModal({ ...gatewayModal, isOpen: false, step: 'config' })}
                className="text-white/70 hover:text-white text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="p-6 text-xs">
              {gatewayModal.step === 'config' && (
                <form onSubmit={handleStartGatewaySession} className="space-y-4">
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Select Payment Channel
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'BKASH_MFS', label: 'bKash MFS', color: 'border-pink-500 bg-pink-50 text-pink-900' },
                        { id: 'NAGAD_MFS', label: 'Nagad MFS', color: 'border-orange-500 bg-orange-50 text-orange-900' },
                        { id: 'ONLINE_GATEWAY', label: 'SSLCommerz Card', color: 'border-blue-600 bg-blue-50 text-blue-900' }
                      ].map((ch) => (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setGatewayModal({ ...gatewayModal, gateway: ch.id })}
                          className={`p-3 rounded-2xl border-2 font-bold text-center transition ${
                            gatewayModal.gateway === ch.id
                              ? ch.color
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {ch.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Payment Purpose
                    </label>
                    <select
                      value={gatewayModal.purpose}
                      onChange={(e) => {
                        const val = e.target.value;
                        let amt = gatewayModal.amount;
                        if (val.includes('Semester Registration')) amt = 15000;
                        else if (val.includes('Tuition Installment')) amt = financialData?.summary?.monthlyTuition || 6400;
                        else if (val.includes('Full Examination')) amt = financialData?.summary?.totalOutstanding || 6400;
                        setGatewayModal({ ...gatewayModal, purpose: val, amount: amt });
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="Spring Term 2026 — Tuition Installment Payment">Spring Term 2026 — Tuition Installment Payment</option>
                      <option value="Spring 2026 — Semester Registration Fee">Spring 2026 — Semester Registration Fee (Tk. 15,000)</option>
                      <option value="Spring 2026 — Full Examination Financial Clearance Settlement">Spring 2026 — Full Examination Clearance Settlement</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Payable Amount (BDT)
                    </label>
                    <input
                      type="number"
                      required
                      min="100"
                      value={gatewayModal.amount}
                      onChange={(e) => setGatewayModal({ ...gatewayModal, amount: e.target.value })}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base font-extrabold text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={processingGateway}
                    className="w-full py-3 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 text-white font-bold rounded-xl shadow-lg transition"
                  >
                    {processingGateway ? 'Creating Gateway Session...' : `Proceed to ${gatewayModal.gateway.replace('_', ' ')} Checkout →`}
                  </button>
                </form>
              )}

              {gatewayModal.step === 'checkout' && gatewayModal.sessionData && (
                <form onSubmit={handleConfirmGatewayWebhook} className="space-y-4">
                  <div className="p-3.5 bg-slate-900 text-white rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block">Merchant: {gatewayModal.sessionData.merchantName}</span>
                      <span className="font-mono text-xs text-amber-300">{gatewayModal.sessionData.gatewayTxId}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Total BDT</span>
                      <span className="font-mono text-base font-extrabold text-emerald-400">
                        Tk. {Number(gatewayModal.sessionData.amount).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {gatewayModal.gateway === 'ONLINE_GATEWAY' ? 'Sandbox Card Number' : 'Mobile Wallet Account Number'}
                    </label>
                    <input
                      type="text"
                      required
                      value={gatewayModal.accountNumber}
                      onChange={(e) => setGatewayModal({ ...gatewayModal, accountNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Sandbox OTP Verification Code (Use <span className="font-mono text-pink-600">123456</span>)
                    </label>
                    <input
                      type="text"
                      required
                      value={gatewayModal.otpCode}
                      onChange={(e) => setGatewayModal({ ...gatewayModal, otpCode: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold tracking-widest text-center text-base"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setGatewayModal({ ...gatewayModal, step: 'config' })}
                      className="w-1/3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={processingGateway}
                      className="w-2/3 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition"
                    >
                      {processingGateway ? 'Verifying IPN Webhook...' : 'Confirm & Auto-Verify Payment'}
                    </button>
                  </div>
                </form>
              )}

              {gatewayModal.step === 'success' && (
                <div className="text-center space-y-4 py-2">
                  <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-base font-extrabold text-slate-900">Instant IPN Reconciliation Complete!</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Your payment has been automatically verified and posted to the double-entry student ledger.
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-left font-mono text-[11px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transaction Ref:</span>
                      <span className="font-bold text-slate-900">{gatewayModal.receiptData?.transactionReference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Amount Verified:</span>
                      <span className="font-bold text-emerald-700">Tk. {Number(gatewayModal.receiptData?.amount).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="font-bold text-emerald-700">COMPLETED (AUTO-RECONCILED)</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setGatewayModal({ ...gatewayModal, isOpen: false, step: 'config' })}
                    className="w-full py-2.5 bg-[#0f2b5c] hover:bg-blue-950 text-white font-bold rounded-xl transition"
                  >
                    Return to Student Portal
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
