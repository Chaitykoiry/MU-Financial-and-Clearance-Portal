import React, { useState, useEffect } from 'react';
import { fineApi, studentAdminApi } from '../../services/api';
import {
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  DollarSign,
  ShieldCheck,
  Search,
  Percent,
  XCircle
} from 'lucide-react';

export default function FineRulesManagement() {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);

  // Student fine assessment lookup
  const [lookupId, setLookupId] = useState('231-115-042');
  const [assessment, setAssessment] = useState(null);
  const [assessing, setAssessing] = useState(false);
  const [waiveReason, setWaiveReason] = useState('Approved by Dean of SST due to medical emergency');
  const [waiving, setWaiving] = useState(false);

  useEffect(() => {
    fetchFineRules();
    handleAssessStudent('231-115-042');
  }, []);

  const fetchFineRules = async () => {
    try {
      setLoading(true);
      const res = await fineApi.getRules();
      if (res.data.success) {
        setRules(res.data.rules);
      }
    } catch (err) {
      console.error('Failed to load fine rules:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssessStudent = async (sid) => {
    const target = sid || lookupId;
    if (!target) return;
    try {
      setAssessing(true);
      const res = await fineApi.getStudentAssessment(target.trim());
      if (res.data.success) {
        setAssessment(res.data);
      }
    } catch (err) {
      setAssessment(null);
      alert(err.response?.data?.message || 'Could not assess student.');
    } finally {
      setAssessing(false);
    }
  };

  const handleWaiveFine = async () => {
    if (!assessment?.student?.id) return;
    try {
      setWaiving(true);
      const res = await fineApi.waive(assessment.student.id, {
        fineCode: 'MONTHLY_TUITION_FINE',
        reason: waiveReason
      });
      if (res.data.success) {
        alert(res.data.message || 'Fine successfully waived.');
        handleAssessStudent();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to waive fine.');
    } finally {
      setWaiving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
          <Clock className="w-5 h-5 text-rose-600" />
          Automated Late-Payment Fine Engine
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Deterministic calculation rules enforced daily across monthly tuition installments and semester registration deadlines
        </p>
      </div>

      {/* 2 Fine Rule Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Monthly Tuition Fine Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="bg-rose-50 text-rose-700 border border-rose-200 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Monthly Tuition Installments
              </span>
              <span className="text-[10px] text-slate-400 font-mono">CODE: MONTHLY_TUITION_FINE</span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Monthly Tuition Late Penalty (Per-Day Rate)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Tuition installments must be paid on or before the <span className="font-bold text-slate-800">12th</span> of each calendar month. Starting from the <span className="font-bold text-slate-800">13th</span>, a progressive fine accrues daily.
            </p>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Monthly Due Date:</span>
                <span className="font-bold text-slate-900">12th of every month</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Fine Start Day:</span>
                <span className="font-bold text-rose-600">13th of month</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Daily Overdue Fine Rate:</span>
                <span className="font-bold font-mono text-emerald-700">Tk. 10.00 / day</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Calculation Engine Formula:</span>
                <span className="font-mono text-[11px] text-slate-800 bg-white px-2 py-0.5 rounded border border-slate-200">
                  fine = (day - 12) × 10 BDT
                </span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Policy Active
            </span>
            <span>Applies to 4 Term Installments</span>
          </div>
        </div>

        {/* Semester Registration Fine Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-3">
              <span className="bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[10px] px-2.5 py-1 rounded-full uppercase tracking-wider">
                Semester Registration
              </span>
              <span className="text-[10px] text-slate-400 font-mono">CODE: SEMESTER_REG_FINE</span>
            </div>

            <h3 className="text-base font-extrabold text-slate-900">
              Semester Registration Late Penalty (Fixed Fee)
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Semester registration fee (Tk. 15,000) must be paid on or before the <span className="font-bold text-slate-800">25th</span> of the term's opening month. After the 25th, a one-off fixed fine is assessed.
            </p>

            <div className="mt-4 p-4 bg-slate-50 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Semester Reg Due Date:</span>
                <span className="font-bold text-slate-900">25th of opening month</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Penalty Effective Date:</span>
                <span className="font-bold text-rose-600">From 26th onward</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Fixed Penalty Amount:</span>
                <span className="font-bold font-mono text-emerald-700">Tk. 1,000.00 (One-off)</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Course Enrollment Impact:</span>
                <span className="text-amber-700 font-semibold">Blocks Enrollment Paper</span>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Policy Active
            </span>
            <span>Strict One-Time Assessment</span>
          </div>
        </div>
      </div>

      {/* Student Fine Audit & Discretionary Waiver Tool */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-600" />
            Live Student Fine Auditor & Administrative Waiver
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit real-time calculated fines for any student and record discretionary administrative waivers
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Enter Student ID (e.g. 231-115-042 or 231-115-094)"
            value={lookupId}
            onChange={(e) => setLookupId(e.target.value)}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800"
          />
          <button
            onClick={() => handleAssessStudent()}
            disabled={assessing}
            className="px-5 py-2.5 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold rounded-xl text-xs transition shadow-md disabled:opacity-50"
          >
            {assessing ? 'Auditing...' : 'Audit Live Fine Assessment'}
          </button>
        </div>

        {assessment && (
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-200">
              <div>
                <span className="font-bold text-slate-900 text-sm">
                  {assessment.student?.user?.fullName}
                </span>
                <span className="font-mono text-blue-600 font-bold ml-2">
                  ({assessment.student?.studentIdNumber})
                </span>
              </div>
              <div className="flex items-center gap-2">
                {assessment.student?.fineException ? (
                  <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                    FINE EXEMPTED IN PROFILE
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold text-[10px]">
                    SUBJECT TO FINE RULES
                  </span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Assessed Fines
                </span>
                <span className="text-xl font-mono font-black text-rose-600 mt-1 block">
                  Tk. {assessment.assessment?.totalFineBdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-500">
                  {assessment.assessment?.daysLate || 0} Days Overdue
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Waived Fine Amount
                </span>
                <span className="text-xl font-mono font-black text-emerald-600 mt-1 block">
                  Tk. {assessment.assessment?.waivedAmountBdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-500">
                  {assessment.assessment?.isWaived ? 'Waived by Authority' : 'No waiver applied'}
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Net Outstanding Fine
                </span>
                <span className="text-xl font-mono font-black text-slate-900 mt-1 block">
                  Tk. {assessment.assessment?.netFineBdt?.toLocaleString() || 0}
                </span>
                <span className="text-[10px] text-slate-500">Must be cleared for admit card</span>
              </div>
            </div>

            {/* Waive tool */}
            {assessment.assessment?.netFineBdt > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <div className="font-bold text-slate-800">Administrative Fine Waiver Authority</div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={waiveReason}
                    onChange={(e) => setWaiveReason(e.target.value)}
                    placeholder="Enter official waiver rationale..."
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl"
                  />
                  <button
                    onClick={handleWaiveFine}
                    disabled={waiving}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs disabled:opacity-50"
                  >
                    {waiving ? 'Waiving...' : 'Grant 100% Fine Waiver'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

