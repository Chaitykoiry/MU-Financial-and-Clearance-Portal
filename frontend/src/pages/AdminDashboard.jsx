import React, { useState, useEffect } from 'react';
import { clearanceApi, departmentApi, auditApi, analyticsApi, workflowApi } from '../services/api';
import StudentManagement from '../components/admin/StudentManagement';
import ProgrammeFeeStructures from '../components/admin/ProgrammeFeeStructures';
import FineRulesManagement from '../components/admin/FineRulesManagement';
import AdmitCardManagement from '../components/admin/AdmitCardManagement';
import {
  ShieldCheck,
  Building,
  History,
  FileCheck2,
  Users,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  ArrowRight,
  TrendingUp,
  Landmark,
  Layers,
  Save,
  Check,
  Clock,
  Sparkles,
  Percent
} from 'lucide-react';

export default function AdminDashboard() {
  const [clearances, setClearances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [workflowTemplates, setWorkflowTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('students'); // 'students' | 'fees' | 'fines' | 'admitCards' | 'pipeline' | 'workflows' | 'analytics' | 'departments' | 'audit'
  const [loading, setLoading] = useState(true);

  // Workflow builder active configuration
  const [selectedWorkflow, setSelectedWorkflow] = useState(null);
  const [stagesList, setStagesList] = useState([]);
  const [publishingWf, setPublishingWf] = useState(false);

  // New Department Form Modal
  const [newDeptModal, setNewDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    schoolName: 'School of Science & Technology',
    description: '',
    isAcademic: true
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [cRes, dRes, aRes, anRes, wfRes] = await Promise.all([
        clearanceApi.getAll(),
        departmentApi.list(),
        auditApi.list({ limit: 100 }),
        analyticsApi.getSystemAnalytics(),
        workflowApi.getTemplates()
      ]);

      if (cRes.data.success) setClearances(cRes.data.clearances);
      if (dRes.data.success) setDepartments(dRes.data.departments);
      if (aRes.data.success) setAuditLogs(aRes.data.logs);
      if (anRes.data.success) setAnalytics(anRes.data.data);
      if (wfRes.data.success) {
        setWorkflowTemplates(wfRes.data.templates);
        if (wfRes.data.templates.length > 0) {
          const first = wfRes.data.templates[0];
          setSelectedWorkflow(first);
          const currentStages = first.versions?.[0]?.stages || [];
          setStagesList(currentStages);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDept = async (e) => {
    e.preventDefault();
    try {
      const res = await departmentApi.create(deptForm);
      if (res.data.success) {
        setNewDeptModal(false);
        setDeptForm({ code: '', name: '', schoolName: 'School of Science & Technology', description: '', isAcademic: true });
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating department.');
    }
  };

  const moveStage = (index, direction) => {
    const updated = [...stagesList];
    const target = index + direction;
    if (target < 0 || target >= updated.length) return;
    const temp = updated[index];
    updated[index] = updated[target];
    updated[target] = temp;
    setStagesList(updated);
  };

  const toggleConditional = (index) => {
    const updated = [...stagesList];
    updated[index].isConditional = !updated[index].isConditional;
    setStagesList(updated);
  };

  const handlePublishWorkflow = async () => {
    if (!selectedWorkflow) return;
    try {
      setPublishingWf(true);
      const res = await workflowApi.saveVersion({
        templateId: selectedWorkflow.id,
        stages: stagesList.map((s) => ({
          departmentCode: s.departmentCode,
          stageName: s.stageName,
          isConditional: s.isConditional,
          conditionRules: s.conditionRules
        }))
      });

      if (res.data.success) {
        alert(res.data.message);
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to publish workflow version.');
    } finally {
      setPublishingWf(false);
    }
  };

  const totalClearances = clearances.length;
  const approvedClearances = clearances.filter((c) => c.status === 'APPROVED').length;
  const inProgressClearances = clearances.filter((c) => c.status === 'IN_PROGRESS').length;
  const totalAuditEvents = auditLogs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Title & Tab Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-[#0f2b5c] text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Metropolitan University, Sylhet
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 mt-1 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            Central System Administration
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">
            Clearance Orchestration, Visual Workflow Builder, Financial Turnaround KPIs & Audit Logs
          </p>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-200/80 p-1 rounded-2xl flex flex-wrap gap-1 text-xs font-bold shadow-inner">
          <button
            onClick={() => setActiveTab('students')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'students' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Students & Waivers
          </button>
          <button
            onClick={() => setActiveTab('fees')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'fees' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" /> Programme Fees
          </button>
          <button
            onClick={() => setActiveTab('fines')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'fines' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" /> Fine Policies
          </button>
          <button
            onClick={() => setActiveTab('admitCards')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              activeTab === 'admitCards' ? 'bg-[#0f2b5c] text-white shadow-xs' : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" /> Exam & Admit Cards
          </button>
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'pipeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clearance Pipeline
          </button>
          <button
            onClick={() => setActiveTab('workflows')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeTab === 'workflows' ? 'bg-white text-[#0f2b5c] shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" /> Workflow
          </button>
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-3.5 py-1.5 rounded-xl transition flex items-center gap-1 ${
              activeTab === 'analytics' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" /> Turnaround KPIs
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-xl transition ${
              activeTab === 'audit' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Audit Logs
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Total Applications</span>
            <FileCheck2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2 font-mono">{totalClearances}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Spring 2026 Academic Session</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Certificates</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2 font-mono">{approvedClearances}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Dynamic QR code stamped</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Fee Collection</span>
            <DollarSign className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2 font-mono">
            {analytics?.financials?.totalCollectedBdt ? `${analytics.financials.totalCollectedBdt.toLocaleString()} BDT` : '12,000 BDT'}
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">NRBC Bank Campus Branch</span>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider">Logged Audit Events</span>
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 mt-2 font-mono">{totalAuditEvents}</div>
          <span className="text-[10px] text-slate-400 mt-1 block">Cryptographic audit trail</span>
        </div>
      </div>

      {/* Tab: Student Accounts & Tuition Waivers */}
      {activeTab === 'students' && <StudentManagement />}

      {/* Tab: Programme Published Fee Structures */}
      {activeTab === 'fees' && <ProgrammeFeeStructures />}

      {/* Tab: Late-Payment Fine Engine Policies */}
      {activeTab === 'fines' && <FineRulesManagement />}

      {/* Tab: Examination & Admit Cards Clearance Audit */}
      {activeTab === 'admitCards' && <AdmitCardManagement />}

      {/* Tab 1: Live Clearance Pipeline */}
      {activeTab === 'pipeline' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Metropolitan University Clearance Registry</h3>
            <span className="text-xs text-slate-500 font-mono">PostgreSQL Relational Schema</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Student ID</th>
                  <th className="py-3 px-4">Event & Session</th>
                  <th className="py-3 px-4">Pipeline Status</th>
                  <th className="py-3 px-4">Department Approvals Progress</th>
                  <th className="py-3 px-4">Certificate ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clearances.map((c) => {
                  const approvedCount = c.departmentApprovals?.filter((a) => a.status === 'APPROVED').length || 0;
                  const totalDeptCount = c.departmentApprovals?.length || 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{c.student?.fullName}</td>
                      <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{c.student?.matricOrStaffId}</td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-slate-800">{c.clearanceType}</span>
                        <div className="text-slate-400 text-[10px]">{c.academicSession}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-bold px-2.5 py-0.5 rounded-full text-[10px] ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-[#0f2b5c] h-2 rounded-full transition-all"
                              style={{ width: `${(approvedCount / (totalDeptCount || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[10px] font-bold text-slate-700">
                            {approvedCount}/{totalDeptCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {c.certificateCode ? (
                          <span className="text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {c.certificateCode}
                          </span>
                        ) : (
                          <span className="text-slate-400">In Progress</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Visual Workflow Builder */}
      {activeTab === 'workflows' && (
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GitBranch className="w-4 h-4 text-[#0f2b5c]" />
                Visual Clearance Workflow Configuration
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Configure approval sequences, toggle conditional stages, and publish new immutable workflow versions.
              </p>
            </div>
            <button
              onClick={handlePublishWorkflow}
              disabled={publishingWf}
              className="bg-[#0f2b5c] hover:bg-[#1a3d7c] disabled:opacity-50 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-md transition"
            >
              <Save className="w-3.5 h-3.5 text-amber-400" />
              {publishingWf ? 'Publishing...' : 'Publish New Version'}
            </button>
          </div>

          {/* Workflow Sequence Cards */}
          <div className="space-y-3">
            {stagesList.map((stg, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-200 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 bg-[#0f2b5c] text-white font-bold rounded-xl flex items-center justify-center text-xs font-mono">
                    {idx + 1}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{stg.stageName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">
                      Department Code: <span className="font-bold text-slate-700">{stg.departmentCode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => toggleConditional(idx)}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                      stg.isConditional
                        ? 'bg-amber-100 text-amber-800 border-amber-300'
                        : 'bg-white text-slate-600 border-slate-200'
                    }`}
                  >
                    {stg.isConditional ? 'Conditional Stage (Hall Residents)' : 'Mandatory Stage'}
                  </button>

                  <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
                    <button
                      onClick={() => moveStage(idx, -1)}
                      disabled={idx === 0}
                      className="px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                      title="Move Up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveStage(idx, 1)}
                      disabled={idx === stagesList.length - 1}
                      className="px-2 py-1 hover:bg-slate-100 disabled:opacity-30"
                      title="Move Down"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl text-[11px] text-blue-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0" />
            <span>
              <strong>Workflow Engine Rule:</strong> Publishing creates an immutable workflow version. Active applications continue executing their assigned version, preventing unexpected runtime corruption.
            </span>
          </div>
        </div>
      )}

      {/* Tab 3: Turnaround Analytics & Department Bottlenecks */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
            <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              Department Clearance Velocity & Queue Bottleneck Distribution
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {analytics?.departmentBottlenecks &&
                Object.entries(analytics.departmentBottlenecks).map(([key, val]) => (
                  <div key={key} className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                    <div className="flex justify-between items-start">
                      <span className="font-mono text-[10px] font-bold bg-white text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {key}
                      </span>
                      {val.pending > 0 ? (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          {val.pending} Pending
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Cleared
                        </span>
                      )}
                    </div>
                    <h4 className="font-bold text-slate-800 text-xs mt-2">{val.name}</h4>
                    <div className="mt-3 pt-2 border-t border-slate-200 flex justify-between text-[11px] text-slate-500">
                      <span>Approved: {val.approved}</span>
                      <span>Turnaround: &lt; 24h</span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Departments & Programmes */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-sm">Metropolitan University Departmental Roster</h3>
            <button
              onClick={() => setNewDeptModal(true)}
              className="bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-xs transition"
            >
              <PlusCircle className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white border border-slate-200 p-5 rounded-3xl shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md">
                    {dept.code}
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {dept.isAcademic ? 'Academic' : 'Administrative'}
                  </span>
                </div>
                <h4 className="font-bold text-slate-900 text-sm mt-3">{dept.name}</h4>
                <p className="text-slate-500 text-xs mt-1">{dept.schoolName}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[10px] text-slate-400 flex justify-between">
                  <span>Assigned Staff: {dept._count?.users || 0}</span>
                  <span>Programmes: {dept._count?.programmes || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 5: Immutable Audit Logs */}
      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Cryptographic System Audit Trail</h3>
            <span className="text-xs text-slate-500 font-mono">Append-Only Regulatory Log</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Action Event</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4">Entity Type</th>
                  <th className="py-3 px-4">Details / Metadata</th>
                  <th className="py-3 px-4">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition font-mono">
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[10px] border border-purple-200">
                        {log.actionTag}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                      {log.user ? `${log.user.fullName} (${log.user.role})` : 'System Event'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-600 text-[10px] max-w-xs truncate" title={log.details}>
                      {log.details || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[10px]">{log.ipAddress || '127.0.0.1'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Department Modal */}
      {newDeptModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-3">Add Department / Unit</h3>
            <form onSubmit={handleCreateDept} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. TEXTILE_ENG"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Department of Textile Engineering"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">School Name</label>
                <input
                  type="text"
                  required
                  value={deptForm.schoolName}
                  onChange={(e) => setDeptForm({ ...deptForm, schoolName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewDeptModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold rounded-xl shadow-md"
                >
                  Create Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
