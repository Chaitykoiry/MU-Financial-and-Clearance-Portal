import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { clearanceApi, departmentApi } from '../services/api';
import {
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  Search,
  Filter,
  UserCheck,
  Check,
  X,
  FileText
} from 'lucide-react';

export default function OfficerDashboard() {
  const { user } = useAuth();
  const [clearances, setClearances] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Sign-off Modal
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    clearanceRequestId: '',
    departmentId: '',
    departmentName: '',
    studentName: '',
    matricId: '',
    status: 'APPROVED',
    duesAmount: 0,
    duesPaid: true,
    remarks: ''
  });
  const [savingAction, setSavingAction] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [clearancesRes, deptsRes] = await Promise.all([
        clearanceApi.getAll(),
        departmentApi.list()
      ]);

      if (clearancesRes.data.success) {
        setClearances(clearancesRes.data.clearances);
      }
      if (deptsRes.data.success) {
        setDepartments(deptsRes.data.departments);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAction = (clearance, deptApproval) => {
    setActionModal({
      isOpen: true,
      clearanceRequestId: clearance.id,
      departmentId: deptApproval.departmentId,
      departmentName: deptApproval.department?.name,
      studentName: clearance.student?.fullName,
      matricId: clearance.student?.matricOrStaffId,
      status: deptApproval.status === 'PENDING' ? 'APPROVED' : deptApproval.status,
      duesAmount: deptApproval.duesAmount,
      duesPaid: deptApproval.duesPaid,
      remarks: deptApproval.remarks || ''
    });
  };

  const submitApproval = async (e) => {
    e.preventDefault();
    try {
      setSavingAction(true);
      const res = await clearanceApi.updateApproval(
        actionModal.clearanceRequestId,
        actionModal.departmentId,
        {
          status: actionModal.status,
          duesAmount: parseFloat(actionModal.duesAmount),
          duesPaid: actionModal.duesPaid,
          remarks: actionModal.remarks
        }
      );

      if (res.data.success) {
        setActionModal({ ...actionModal, isOpen: false });
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error updating clearance approval.');
    } finally {
      setSavingAction(false);
    }
  };

  // Find department of officer
  const officerDept = departments.find((d) => d.id === user?.departmentId);

  // Filter clearances
  const filteredClearances = clearances.filter((c) => {
    const matchesSearch =
      c.student?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.student?.matricOrStaffId?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter !== 'ALL') {
      return c.status === statusFilter;
    }

    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase">
              {officerDept ? officerDept.name : 'Institutional Officer Portal'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mt-1">Department Clearance Sign-Off</h1>
          <p className="text-slate-500 text-sm">
            Officer: <span className="font-semibold text-slate-800">{user?.fullName}</span> | Department:{' '}
            <span className="font-semibold text-blue-600">{officerDept ? officerDept.name : 'All Departments (Admin)'}</span>
          </p>
        </div>

        {/* Search & Filter */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by student name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="APPROVED">Fully Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Clearance Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
          <h3 className="font-bold text-slate-800 text-sm">
            Clearance Applications ({filteredClearances.length})
          </h3>
          <span className="text-xs text-slate-500">Live Clearance Validation Pipeline</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-500 text-sm">Loading applications...</div>
        ) : filteredClearances.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-sm">No clearance applications found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Student</th>
                  <th className="py-3 px-4">Session & Type</th>
                  <th className="py-3 px-4">Overall Status</th>
                  <th className="py-3 px-4">Your Department Sign-Off</th>
                  <th className="py-3 px-4">Dues Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredClearances.map((c) => {
                  // Find the approval for the officer's department, or first pending if admin
                  const deptApproval =
                    c.departmentApprovals?.find((a) => a.departmentId === user?.departmentId) ||
                    c.departmentApprovals?.[0];

                  const isDeptApproved = deptApproval?.status === 'APPROVED';

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900 text-sm">{c.student?.fullName}</div>
                        <div className="font-mono text-slate-500 text-[11px]">{c.student?.matricOrStaffId}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-medium text-slate-800">{c.clearanceType}</span>
                        <div className="text-slate-400 text-[11px]">{c.academicSession}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-full text-[11px] ${
                            c.status === 'APPROVED'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.status === 'REJECTED'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        {deptApproval ? (
                          <div>
                            <span
                              className={`inline-flex items-center gap-1 font-semibold px-2 py-0.5 rounded-md text-[11px] ${
                                isDeptApproved
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : deptApproval.status === 'REJECTED'
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {deptApproval.department?.name}: {deptApproval.status}
                            </span>
                            {deptApproval.remarks && (
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate max-w-xs italic">
                                "{deptApproval.remarks}"
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">N/A</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        {deptApproval?.duesAmount > 0 ? (
                          deptApproval.duesPaid ? (
                            <span className="text-emerald-600 font-semibold">Settled ($0.00)</span>
                          ) : (
                            <span className="text-amber-600 font-semibold font-mono">
                              Due: ${deptApproval.duesAmount}
                            </span>
                          )
                        ) : (
                          <span className="text-slate-400">No Dues</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {deptApproval && (
                          <button
                            onClick={() => handleOpenAction(c, deptApproval)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-3 py-1.5 rounded-lg text-xs shadow-xs transition inline-flex items-center gap-1"
                          >
                            <UserCheck className="w-3.5 h-3.5" />
                            Review & Sign
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Sign-Off Modal */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-lg text-slate-900">Sign-Off Department Clearance</h3>
                <p className="text-xs text-slate-500">{actionModal.departmentName}</p>
              </div>
              <button
                onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <form onSubmit={submitApproval} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs">
                <span className="text-slate-500">Student:</span>{' '}
                <span className="font-bold text-slate-800">{actionModal.studentName}</span> ({actionModal.matricId})
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Clearance Decision Flag
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setActionModal({ ...actionModal, status: 'APPROVED' })}
                    className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition ${
                      actionModal.status === 'APPROVED'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    <Check className="w-4 h-4" /> Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ ...actionModal, status: 'HOLD' })}
                    className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition ${
                      actionModal.status === 'HOLD'
                        ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-amber-50'
                    }`}
                  >
                    <Clock className="w-4 h-4" /> On Hold
                  </button>
                  <button
                    type="button"
                    onClick={() => setActionModal({ ...actionModal, status: 'REJECTED' })}
                    className={`py-2 text-xs font-bold rounded-xl border flex items-center justify-center gap-1 transition ${
                      actionModal.status === 'REJECTED'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-rose-50'
                    }`}
                  >
                    <X className="w-4 h-4" /> Reject
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Department Dues / Penalty Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={actionModal.duesAmount}
                  onChange={(e) => setActionModal({ ...actionModal, duesAmount: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Official Verification Remarks
                </label>
                <textarea
                  rows="3"
                  value={actionModal.remarks}
                  onChange={(e) => setActionModal({ ...actionModal, remarks: e.target.value })}
                  placeholder="e.g. All laboratory instruments accounted for; clearance granted."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                ></textarea>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActionModal({ ...actionModal, isOpen: false })}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingAction}
                  className="w-1/2 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl text-xs shadow-md transition"
                >
                  {savingAction ? 'Saving...' : 'Confirm Sign-Off'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
