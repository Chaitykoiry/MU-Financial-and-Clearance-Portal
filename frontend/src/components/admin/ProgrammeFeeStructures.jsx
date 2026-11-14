import React, { useState, useEffect } from 'react';
import { feeStructureApi } from '../../services/api';
import {
  DollarSign,
  GraduationCap,
  ExternalLink,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers
} from 'lucide-react';

export default function ProgrammeFeeStructures() {
  const [feeStructures, setFeeStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState('ALL'); // 'ALL' | 'UNDERGRADUATE' | 'GRADUATE'

  // Edit Modal State
  const [editModal, setEditModal] = useState(false);
  const [selectedFee, setSelectedFee] = useState(null);
  const [editForm, setEditForm] = useState({
    admissionFee: 25000,
    registrationFee: 15000,
    bnccAndOther: 500,
    activitiesFee: 2000,
    monthlyCreditFee: 8000,
    changeReason: 'Updated per official University Syndicate circular'
  });

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      setLoading(true);
      const res = await feeStructureApi.list();
      if (res.data.success) {
        setFeeStructures(res.data.feeStructures);
      }
    } catch (err) {
      console.error('Failed to load fee structures:', err);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (fee) => {
    setSelectedFee(fee);
    setEditForm({
      admissionFee: Number(fee.admissionFee),
      registrationFee: Number(fee.registrationFee),
      bnccAndOther: Number(fee.bnccAndOther),
      activitiesFee: Number(fee.activitiesFee),
      monthlyCreditFee: Number(fee.monthlyCreditFee),
      changeReason: 'Updated per official University Syndicate circular'
    });
    setEditModal(true);
  };

  const handleSaveFee = async (e) => {
    e.preventDefault();
    if (!selectedFee) return;

    try {
      const res = await feeStructureApi.update(selectedFee.id, editForm);
      if (res.data.success) {
        setEditModal(false);
        fetchFeeStructures();
        alert('Programme fee structure updated successfully.');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update fee structure.');
    }
  };

  const filtered = feeStructures.filter((f) => {
    if (filterLevel === 'ALL') return true;
    return f.degreeLevel === filterLevel;
  });

  const undergradList = filtered.filter((f) => f.degreeLevel === 'UNDERGRADUATE');
  const gradList = filtered.filter((f) => f.degreeLevel === 'GRADUATE');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-amber-600" />
            Metropolitan University Published Programme Fee Structures
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verified against <span className="font-semibold text-blue-600">metrouni.edu.bd/sites/admission/programme-fee-structure</span>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-500">Filter Level:</span>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-700"
          >
            <option value="ALL">All Programmes ({feeStructures.length})</option>
            <option value="UNDERGRADUATE">Undergraduate (8)</option>
            <option value="GRADUATE">Graduate (12)</option>
          </select>
        </div>
      </div>

      {/* Undergraduate Table */}
      {(filterLevel === 'ALL' || filterLevel === 'UNDERGRADUATE') && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Undergraduate Programmes (8 Programmes)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">All amounts in Bangladeshi Taka (BDT)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Programme</th>
                  <th className="py-3 px-4">Admission Fee</th>
                  <th className="py-3 px-4">Semester Reg Fee</th>
                  <th className="py-3 px-4">BNCC & Other</th>
                  <th className="py-3 px-4">Monthly Activities</th>
                  <th className="py-3 px-4">Monthly Credit / Tuition</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {undergradList.map((f) => (
                  <tr key={f.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{f.programmeName}</div>
                      <div className="font-mono text-[10px] text-blue-600 font-semibold">{f.programmeCode}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.admissionFee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.registrationFee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.bnccAndOther).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.activitiesFee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      Tk. {Number(f.monthlyCreditFee).toLocaleString()}/mo
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(f)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Graduate Table */}
      {(filterLevel === 'ALL' || filterLevel === 'GRADUATE') && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
                Graduate & Masters Programmes (12 Programmes)
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-medium">All amounts in Bangladeshi Taka (BDT)</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-white border-b border-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">Programme</th>
                  <th className="py-3 px-4">Admission Fee</th>
                  <th className="py-3 px-4">Semester Reg Fee</th>
                  <th className="py-3 px-4">BNCC & Other</th>
                  <th className="py-3 px-4">Monthly Activities</th>
                  <th className="py-3 px-4">Monthly Credit / Tuition</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {gradList.map((f) => (
                  <tr key={f.id} className="hover:bg-purple-50/40 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{f.programmeName}</div>
                      <div className="font-mono text-[10px] text-purple-600 font-semibold">{f.programmeCode}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.admissionFee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.registrationFee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.bnccAndOther).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      Tk. {Number(f.activitiesFee).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-700 bg-emerald-50/50">
                      Tk. {Number(f.monthlyCreditFee).toLocaleString()}/mo
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => openEditModal(f)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition inline-flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3 text-slate-500" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EDIT MODAL */}
      {editModal && selectedFee && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl">
            <h3 className="font-bold text-base text-slate-900 mb-1 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-blue-600" />
              Edit Fee Structure: {selectedFee.programmeName}
            </h3>
            <p className="text-xs text-slate-500 mb-4 font-mono font-semibold">
              Code: {selectedFee.programmeCode} • Level: {selectedFee.degreeLevel}
            </p>

            <form onSubmit={handleSaveFee} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Admission Fee (BDT)</label>
                  <input
                    type="number"
                    required
                    value={editForm.admissionFee}
                    onChange={(e) => setEditForm({ ...editForm, admissionFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Semester Registration (BDT)</label>
                  <input
                    type="number"
                    required
                    value={editForm.registrationFee}
                    onChange={(e) => setEditForm({ ...editForm, registrationFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">BNCC & Other Charges (BDT)</label>
                  <input
                    type="number"
                    required
                    value={editForm.bnccAndOther}
                    onChange={(e) => setEditForm({ ...editForm, bnccAndOther: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Monthly Activities Fee (BDT)</label>
                  <input
                    type="number"
                    required
                    value={editForm.activitiesFee}
                    onChange={(e) => setEditForm({ ...editForm, activitiesFee: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Monthly Credit / Tuition Fee (BDT)</label>
                <input
                  type="number"
                  required
                  value={editForm.monthlyCreditFee}
                  onChange={(e) => setEditForm({ ...editForm, monthlyCreditFee: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl font-mono font-bold text-emerald-800 text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Syndicate Approval / Change Reason *</label>
                <input
                  type="text"
                  required
                  value={editForm.changeReason}
                  onChange={(e) => setEditForm({ ...editForm, changeReason: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditModal(false)}
                  className="w-1/2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-[#0f2b5c] hover:bg-[#1a3d7c] text-white font-bold rounded-xl shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

