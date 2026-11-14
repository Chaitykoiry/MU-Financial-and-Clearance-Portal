import React, { useState, useEffect } from 'react';
import { studentAdminApi, feeStructureApi, departmentApi } from '../../services/api';
import {
  Users,
  UserPlus,
  Search,
  Percent,
  KeyRound,
  ShieldAlert,
  CheckCircle2,
  X,
  AlertCircle,
  Building,
  DollarSign,
  GraduationCap,
  Sparkles
} from 'lucide-react';

export default function StudentManagement() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterWaiver, setFilterWaiver] = useState('ALL'); // 'ALL' | 'WITH_WAIVER' | 'NO_WAIVER'
  const [departments, setDepartments] = useState([]);
  const [feeStructures, setFeeStructures] = useState([]);

  // Create Student Modal
  const [createModal, setCreateModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [previewFee, setPreviewFee] = useState(null);

  const [form, setForm] = useState({
    studentIdNumber: '',
    fullName: '',
    email: '',
    phoneNumber: '',
    password: 'student123',
    departmentId: '',
    programmeCode: 'BSC_CSE',
    degreeType: 'UNDERGRADUATE',
    batchNumber: 56,
    intake: 56,
    currentSemester: 7,
    academicStatus: 'REGULAR',
    guardianName: '',
    guardianPhone: '',
    address: 'Sylhet, Bangladesh',
    tuitionWaiverPercentage: 0,
    waiverStartDate: '2026-01-01',
    waiverExpiryDate: '2026-12-31',
    scholarshipCategory: 'NONE',
    fineException: false,
    specialAdjustmentBdt: 0
  });

  // Waiver Edit Modal
  const [waiverModal, setWaiverModal] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [waiverForm, setWaiverForm] = useState({
    waiverPercentage: 0,
    scholarshipCategory: 'MERIT',
    reason: 'Updated based on Academic Council approval',
    startDate: '2026-01-01',
    expiryDate: '2026-12-31'
  });

  // Password Reset Modal
  const [pwdModal, setPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('student123');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [sRes, dRes, fRes] = await Promise.all([
        studentAdminApi.list(),
        departmentApi.list(),
        feeStructureApi.list()
      ]);

      if (sRes.data.success) setStudents(sRes.data.students);
      if (dRes.data.success) {
        setDepartments(dRes.data.departments);
        if (dRes.data.departments.length > 0 && !form.departmentId) {
          const cseDept = dRes.data.departments.find((d) => d.code === 'CSE') || dRes.data.departments[0];
          setForm((prev) => ({ ...prev, departmentId: cseDept.id }));
        }
      }
      if (fRes.data.success) {
        setFeeStructures(fRes.data.feeStructures);
        // Pre-load default BSC_CSE
        const defStructure = fRes.data.feeStructures.find((f) => f.programmeCode === 'BSC_CSE');
        if (defStructure) setPreviewFee(defStructure);
      }
    } catch (err) {
      console.error('Error fetching student admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProgrammeChange = (code) => {
    const selected = feeStructures.find((f) => f.programmeCode === code);
    setPreviewFee(selected || null);
    const isGrad = selected?.degreeLevel === 'GRADUATE';
    setForm((prev) => ({
      ...prev,
      programmeCode: code,
      degreeType: isGrad ? 'GRADUATE' : 'UNDERGRADUATE'
    }));
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);

    try {
      const res = await studentAdminApi.create(form);
      if (res.data.success) {
        setCreateModal(false);
        fetchInitialData();
        alert(`Student ${res.data.student.studentIdNumber} registered successfully!`);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create student.');
    } finally {
      setSubmitting(false);
    }
  };

  const openWaiverModal = (student) => {
    setSelectedStudent(student);
    setWaiverForm({
      waiverPercentage: Number(student.tuitionWaiverPercentage) || 0,
      scholarshipCategory: student.scholarshipCategory || 'MERIT',
      reason: 'Academic Excellence & Merit Award',
      startDate: student.waiverStartDate ? student.waiverStartDate.split('T')[0] : '2026-01-01',
      expiryDate: student.waiverExpiryDate ? student.waiverExpiryDate.split('T')[0] : '2026-12-31'
    });
    setWaiverModal(true);
  };

  const handleSaveWaiver = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await studentAdminApi.assignWaiver(selectedStudent.id, waiverForm);
      if (res.data.success) {
        setWaiverModal(false);
        fetchInitialData();
        alert(res.data.message || 'Waiver updated successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update waiver.');
    }
  };

  const openPwdModal = (student) => {
    setSelectedStudent(student);
    setNewPassword('student123');
    setPwdModal(true);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedStudent) return;
    try {
      const res = await studentAdminApi.resetPassword(selectedStudent.id, { newPassword });
      if (res.data.success) {
        setPwdModal(false);
        alert(`Password for ${selectedStudent.studentIdNumber} successfully reset.`);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reset password.');
    }
  };

  // Filter students
  const filteredStudents = students.filter((s) => {
    const q = search.toLowerCase();
    const matchQuery =
      s.studentIdNumber.toLowerCase().includes(q) ||
      (s.user?.fullName && s.user.fullName.toLowerCase().includes(q)) ||
      (s.user?.email && s.user.email.toLowerCase().includes(q)) ||
      (s.programme?.name && s.programme.name.toLowerCase().includes(q));

    if (!matchQuery) return false;

    if (filterWaiver === 'WITH_WAIVER') return Number(s.tuitionWaiverPercentage) > 0;
    if (filterWaiver === 'NO_WAIVER') return Number(s.tuitionWaiverPercentage) === 0;
    return true;
  });

  // Calculate live preview financial numbers
  const baseTuition = previewFee ? Number(previewFee.monthlyCreditFee) : 8000;
  const waiverPct = Number(form.tuitionWaiverPercentage) || 0;
  const discountAmt = Math.round((baseTuition * waiverPct) / 100);
  const netMonthlyTuition = baseTuition - discountAmt;

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Student Management & Financial Accounts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manual Registration, Programme Fee Assignment, Tuition Waiver Discounter & Credential Controls
          </p>
        </div>

        <button
          onClick={() => setCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold rounded-2xl text-xs transition shadow-md"
        >
          <UserPlus className="w-4 h-4 text-amber-400" />
          Register New Student
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by ID, Name or Email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 text-slate-800"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-500 font-semibold">Waiver Filter:</span>
          <select
            value={filterWaiver}
            onChange={(e) => setFilterWaiver(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
          >
            <option value="ALL">All Students</option>
            <option value="WITH_WAIVER">Has Tuition Waiver (&gt; 0%)</option>
            <option value="NO_WAIVER">Standard Tuition (0% Waiver)</option>
          </select>
        </div>
      </div>

      {/* Students Directory Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Student ID & Name</th>
                <th className="py-3 px-4">Programme & Dept</th>
                <th className="py-3 px-4">Batch / Sem</th>
                <th className="py-3 px-4">Tuition Waiver %</th>
                <th className="py-3 px-4">Fine Exception</th>
                <th className="py-3 px-4">Academic Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    Loading student directory...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="text-center py-10 text-slate-400">
                    No students matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-mono font-bold text-slate-900 text-[13px]">{s.studentIdNumber}</div>
                      <div className="font-semibold text-slate-700">{s.user?.fullName}</div>
                      <div className="text-[10px] text-slate-400">{s.user?.email}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{s.programme?.name || s.programme?.code}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{s.programme?.department?.name}</div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-600">
                      <div>Batch {s.batchNumber || '—'}</div>
                      <div className="text-[10px] text-slate-400">Sem {s.currentSemester || '—'}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {Number(s.tuitionWaiverPercentage) > 0 ? (
                        <div className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-lg font-bold">
                          <Percent className="w-3 h-3 text-emerald-600" />
                          {Number(s.tuitionWaiverPercentage)}% Waiver
                        </div>
                      ) : (
                        <span className="text-slate-400 font-medium">0% (Standard)</span>
                      )}
                      {s.scholarshipCategory && s.scholarshipCategory !== 'NONE' && (
                        <div className="text-[9px] text-emerald-600 font-semibold mt-0.5 uppercase tracking-wide">
                          {s.scholarshipCategory.replace('_', ' ')}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {s.fineException ? (
                        <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-bold">
                          EXEMPTED
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard Rules</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                          s.academicStatus === 'REGULAR'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {s.academicStatus}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openWaiverModal(s)}
                          className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl font-bold flex items-center gap-1 transition"
                          title="Assign or modify tuition waiver"
                        >
                          <Percent className="w-3 h-3" />
                          Waiver
                        </button>

                        <button
                          onClick={() => openPwdModal(s)}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                          title="Reset student password"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE STUDENT MODAL */}
      {createModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <UserPlus className="w-5 h-5 text-blue-600" />
                  Metropolitan University Student Registration
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pre-loads official Bateshwar fee structure and calculates net monthly tuition
                </p>
              </div>
              <button
                onClick={() => setCreateModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateStudent} className="space-y-5 mt-4 text-xs">
              {/* Section 1: Identity & Credentials */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  1. Student Identity & Login Credentials
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Student ID Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 231-115-099"
                      value={form.studentIdNumber}
                      onChange={(e) => setForm({ ...form, studentIdNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jane Doe"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="student@metrouni.edu.bd"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Initial Password *</label>
                    <input
                      type="password"
                      required
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="017XXXXXXXX"
                      value={form.phoneNumber}
                      onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Academic Status</label>
                    <select
                      value={form.academicStatus}
                      onChange={(e) => setForm({ ...form, academicStatus: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-semibold"
                    >
                      <option value="REGULAR">REGULAR</option>
                      <option value="PROBATION">PROBATION</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                      <option value="ALUMNI">ALUMNI</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 2: Department & Academic Programme */}
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                  2. Programme Selection (Auto-Loads Official Fees)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Department *</label>
                    <select
                      required
                      value={form.departmentId}
                      onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Academic Programme *</label>
                    <select
                      required
                      value={form.programmeCode}
                      onChange={(e) => handleProgrammeChange(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-blue-400 rounded-xl font-bold text-slate-900"
                    >
                      <optgroup label="Undergraduate Programmes">
                        <option value="BSC_CSE">B.Sc. in CSE (Tk. 8,000/mo)</option>
                        <option value="BSC_SWE">B.Sc. in SWE (Tk. 8,000/mo)</option>
                        <option value="BSC_DATA_SCI">B.Sc. in Data Science (Tk. 8,000/mo)</option>
                        <option value="BSC_EEE">B.Sc. in EEE (Tk. 7,000/mo)</option>
                        <option value="BBA">BBA (Tk. 7,000/mo)</option>
                        <option value="BSS_ECONOMICS">BSS Economics (Tk. 5,000/mo)</option>
                        <option value="BA_ENGLISH">BA English (Tk. 6,000/mo)</option>
                        <option value="LLB_HONS">LLB Honours (Tk. 8,000/mo)</option>
                      </optgroup>
                      <optgroup label="Graduate Programmes">
                        <option value="MBA_GENERAL">MBA General (Tk. 4,000/mo)</option>
                        <option value="MBA_REGULAR">MBA Regular (Tk. 4,000/mo)</option>
                        <option value="MA_ENG_PRELIM">MA English Preliminary (Tk. 4,000/mo)</option>
                        <option value="MA_ENG_FINAL">MA English Final (Tk. 4,000/mo)</option>
                        <option value="LLB_PRELIM">LLB Preliminary (Tk. 4,000/mo)</option>
                        <option value="LLB_FINAL">LLB Final (Tk. 4,000/mo)</option>
                        <option value="LLM_1_YR">LLM 1 Year (Tk. 4,000/mo)</option>
                        <option value="LLM_2_YR">LLM 2 Year (Tk. 4,000/mo)</option>
                        <option value="MSS_ECONOMICS">MSS Economics (Tk. 4,000/mo)</option>
                        <option value="MSC_MIS">MSc MIS (Tk. 4,000/mo)</option>
                        <option value="CSE_DIPLOMA">CSE Diploma Holder (Tk. 5,000/mo)</option>
                        <option value="EEE_DIPLOMA">EEE Diploma Holder (Tk. 5,000/mo)</option>
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Batch Number / Intake</label>
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        placeholder="Batch"
                        value={form.batchNumber}
                        onChange={(e) => setForm({ ...form, batchNumber: parseInt(e.target.value, 10) || 1 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                      <input
                        type="number"
                        placeholder="Intake"
                        value={form.intake}
                        onChange={(e) => setForm({ ...form, intake: parseInt(e.target.value, 10) || 1 })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Financial Configuration & Tuition Waiver */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700 flex items-center justify-between">
                  <span>3. Financial Configuration & Tuition Waiver</span>
                  <span className="text-[10px] text-blue-600 font-semibold lowercase">
                    *waiver applies strictly to tuition
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Tuition Waiver % (0 - 100)</label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="1"
                        value={form.tuitionWaiverPercentage}
                        onChange={(e) =>
                          setForm({ ...form, tuitionWaiverPercentage: parseFloat(e.target.value) || 0 })
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold text-emerald-700"
                      />
                      <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Scholarship Category</label>
                    <select
                      value={form.scholarshipCategory}
                      onChange={(e) => setForm({ ...form, scholarshipCategory: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-semibold text-slate-800"
                    >
                      <option value="NONE">None (Standard Tuition)</option>
                      <option value="MERIT">Academic Merit Award</option>
                      <option value="FREEDOM_FIGHTER">Freedom Fighter Ward</option>
                      <option value="NEED_BASED">Need-Based Financial Aid</option>
                      <option value="SIBLING_DISCOUNT">Sibling / Family Discount</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="fineException"
                      checked={form.fineException}
                      onChange={(e) => setForm({ ...form, fineException: e.target.checked })}
                      className="w-4 h-4 text-amber-600 rounded"
                    />
                    <label htmlFor="fineException" className="font-bold text-slate-700 text-xs cursor-pointer">
                      Grant Late-Fine Exemption
                    </label>
                  </div>
                </div>

                {/* Financial Calculation Live Preview Banner */}
                <div className="bg-blue-900 text-white p-3.5 rounded-xl flex flex-col sm:flex-row justify-between items-center gap-3 text-xs">
                  <div>
                    <div className="font-bold text-amber-300">
                      Live Financial Calculation ({form.programmeCode})
                    </div>
                    <div className="text-[11px] text-blue-200">
                      Base: Tk. {baseTuition.toLocaleString()} • Waiver {waiverPct}% (-Tk. {discountAmt.toLocaleString()})
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-blue-200 uppercase tracking-wider block font-semibold">
                      Net Monthly Tuition
                    </span>
                    <span className="text-lg font-black font-mono text-emerald-300">
                      Tk. {netMonthlyTuition.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold rounded-xl shadow-md disabled:opacity-50"
                >
                  {submitting ? 'Registering Student...' : 'Create Student Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* WAIVER MODAL */}
      {waiverModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <Percent className="w-5 h-5 text-emerald-600" />
              Configure Tuition Waiver
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student: <span className="font-bold font-mono text-slate-800">{selectedStudent.studentIdNumber}</span> (
              {selectedStudent.user?.fullName})
            </p>

            <form onSubmit={handleSaveWaiver} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tuition Waiver Percentage (0 - 100%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="1"
                  required
                  value={waiverForm.waiverPercentage}
                  onChange={(e) => setWaiverForm({ ...waiverForm, waiverPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-emerald-700 text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Scholarship Category</label>
                <select
                  value={waiverForm.scholarshipCategory}
                  onChange={(e) => setWaiverForm({ ...waiverForm, scholarshipCategory: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                >
                  <option value="MERIT">Academic Merit Award</option>
                  <option value="FREEDOM_FIGHTER">Freedom Fighter Ward</option>
                  <option value="NEED_BASED">Need-Based Financial Aid</option>
                  <option value="SIBLING_DISCOUNT">Sibling / Family Discount</option>
                  <option value="NONE">None (Revoke Waiver)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Administrative Reason for Modification</label>
                <textarea
                  rows="2"
                  required
                  placeholder="e.g. Approved by Vice Chancellor per Semester Result"
                  value={waiverForm.reason}
                  onChange={(e) => setWaiverForm({ ...waiverForm, reason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setWaiverModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md"
                >
                  Save Waiver
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PASSWORD RESET MODAL */}
      {pwdModal && selectedStudent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-600" />
              Reset Portal Password
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Student ID: <span className="font-mono font-bold text-slate-800">{selectedStudent.studentIdNumber}</span>
            </p>

            <form onSubmit={handleResetPassword} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">New Password</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-900"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPwdModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md"
                >
                  Confirm Reset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

