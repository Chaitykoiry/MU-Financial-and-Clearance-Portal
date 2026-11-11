import React, { useState, useEffect } from 'react';
import { clearanceApi, departmentApi, auditApi } from '../services/api';
import {
  ShieldCheck,
  Building,
  History,
  FileCheck2,
  Users,
  DollarSign,
  PlusCircle,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AdminDashboard() {
  const [clearances, setClearances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('pipeline'); // 'pipeline' | 'departments' | 'audit'
  const [loading, setLoading] = useState(true);

  // New Department Form Modal
  const [newDeptModal, setNewDeptModal] = useState(false);
  const [deptForm, setDeptForm] = useState({
    code: '',
    name: '',
    description: '',
    requiresPayment: false
  });

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const [cRes, dRes, aRes] = await Promise.all([
        clearanceApi.getAll(),
        departmentApi.list(),
        auditApi.list({ limit: 100 })
      ]);

      if (cRes.data.success) setClearances(cRes.data.clearances);
      if (dRes.data.success) setDepartments(dRes.data.departments);
      if (aRes.data.success) setAuditLogs(aRes.data.logs);
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
        setDeptForm({ code: '', name: '', description: '', requiresPayment: false });
        fetchAdminData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error creating department.');
    }
  };

  // KPI Calculations
  const totalClearances = clearances.length;
  const approvedClearances = clearances.filter((c) => c.status === 'APPROVED').length;
  const inProgressClearances = clearances.filter((c) => c.status === 'IN_PROGRESS').length;
  const totalAuditEvents = auditLogs.length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Admin Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2.5">
            <ShieldCheck className="w-7 h-7 text-purple-600" />
            Central System Administration
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Institutional Clearance Orchestration, Department Configuration & Audit Logs
          </p>
        </div>

        {/* Tab switch */}
        <div className="bg-slate-200/80 p-1 rounded-xl flex text-xs font-semibold">
          <button
            onClick={() => setActiveTab('pipeline')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'pipeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Clearance Pipeline
          </button>
          <button
            onClick={() => setActiveTab('departments')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'departments' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Departments ({departments.length})
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 rounded-lg transition ${
              activeTab === 'audit' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Immutable Audit Logs
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold uppercase">Total Applications</span>
            <FileCheck2 className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">{totalClearances}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Across all academic sessions</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold uppercase">Approved Certificates</span>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 mt-2">{approvedClearances}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Dynamic QR stamped</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold uppercase">Pipeline In-Progress</span>
            <AlertCircle className="w-5 h-5 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 mt-2">{inProgressClearances}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting sign-offs or dues</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex justify-between items-start text-slate-500">
            <span className="text-xs font-semibold uppercase">Logged Audit Events</span>
            <History className="w-5 h-5 text-purple-600" />
          </div>
          <div className="text-2xl font-extrabold text-purple-600 mt-2">{totalAuditEvents}</div>
          <span className="text-[11px] text-slate-400 mt-1 block">Cryptographic audit trail</span>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'pipeline' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Active Clearance Registry</h3>
            <span className="text-xs text-slate-500 font-mono">Relational PostgreSQL Schema</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4">Matric No</th>
                  <th className="py-3 px-4">Session & Type</th>
                  <th className="py-3 px-4">Status</th>
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
                      <td className="py-3.5 px-4 font-mono text-slate-600">{c.student?.matricOrStaffId}</td>
                      <td className="py-3.5 px-4">
                        {c.clearanceType} ({c.academicSession})
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded-full text-[11px] ${
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
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(approvedCount / (totalDeptCount || 1)) * 100}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-semibold text-slate-600">
                            {approvedCount}/{totalDeptCount}
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        {c.certificateCode ? (
                          <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {c.certificateCode}
                          </span>
                        ) : (
                          <span className="text-slate-400">Pending</span>
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

      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-900 text-base">Institutional Clearance Departments</h3>
            <button
              onClick={() => setNewDeptModal(true)}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm transition"
            >
              <PlusCircle className="w-4 h-4" /> Add Department
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map((dept) => (
              <div key={dept.id} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs">
                <div className="flex justify-between items-start">
                  <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md">
                    {dept.code}
                  </span>
                  {dept.requiresPayment ? (
                    <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                      Payment Required
                    </span>
                  ) : (
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Sign-Off Only
                    </span>
                  )}
                </div>
                <h4 className="font-bold text-slate-900 text-base mt-3">{dept.name}</h4>
                <p className="text-slate-500 text-xs mt-1">{dept.description || 'No description provided.'}</p>
                <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex justify-between">
                  <span>Assigned Officers: {dept._count?.officers || 0}</span>
                  <span>Approvals: {dept._count?.approvals || 0}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/50 flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm">Cryptographic Audit Logs</h3>
            <span className="text-xs text-slate-500">Immutable Compliance & Security Record</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
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
                      <span className="font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded text-[11px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-800 font-medium">
                      {log.user ? `${log.user.fullName} (${log.user.role})` : 'System Automatic'}
                    </td>
                    <td className="py-3 px-4 text-slate-600">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-600 text-[11px] max-w-xs truncate" title={log.details}>
                      {log.details || 'N/A'}
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-[11px]">{log.ipAddress || '127.0.0.1'}</td>
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
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-lg text-slate-900 mb-3">Add Institutional Department</h3>
            <form onSubmit={handleCreateDept} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Department Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HEALTH_CENTER"
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Department Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University Health & Medical Centre"
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows="2"
                  placeholder="Clearance criteria, medical record audit, etc."
                  value={deptForm.description}
                  onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                ></textarea>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="requiresPayment"
                  checked={deptForm.requiresPayment}
                  onChange={(e) => setDeptForm({ ...deptForm, requiresPayment: e.target.checked })}
                  className="w-4 h-4 text-purple-600 rounded"
                />
                <label htmlFor="requiresPayment" className="font-medium text-slate-700">
                  Requires Statutory Fee / Dues Clearance
                </label>
              </div>

              <div className="flex gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setNewDeptModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl shadow-md"
                >
                  Create Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
