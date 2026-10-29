import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  User,
  ShieldCheck,
  Check,
  Info,
  Calendar,
  Layers,
} from 'lucide-react';
import type { HealthParameterItem } from '../types';

export const ManualParameterInputModal: React.FC = () => {
  const {
    manualInputModalOpen,
    closeManualInputModal,
    targetParamForInput,
    recordParameterValue,
    batchRecordParameters,
  } = useDashboard();

  const { currentUser } = useAuth();

  const equipment = targetParamForInput?.equipment;
  const initialParameter = targetParamForInput?.parameter;

  const [mode, setMode] = useState<'single' | 'batch'>('single');
  const [selectedParamId, setSelectedParamId] = useState<string>('');
  const [measuredValue, setMeasuredValue] = useState<string>('');
  const [status, setStatus] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [shift, setShift] = useState<'Shift A (Morning)' | 'Shift B (Evening)' | 'Shift C (Night)' | 'General Shift'>('Shift A (Morning)');
  const [notes, setNotes] = useState<string>('');
  const [batchData, setBatchData] = useState<{ [paramId: string]: { value: string; status: 'healthy' | 'warning' | 'critical'; notes: string } }>({});
  const [successToast, setSuccessToast] = useState<string | null>(null);

  useEffect(() => {
    if (!equipment) return;

    if (initialParameter) {
      setMode('single');
      setSelectedParamId(initialParameter.id);
      setMeasuredValue(initialParameter.currentValue || '');
      setStatus(initialParameter.status || 'healthy');
      setNotes(initialParameter.notes || '');
    } else if (equipment.parameters && equipment.parameters.length > 0) {
      setSelectedParamId(equipment.parameters[0].id);
      setMeasuredValue(equipment.parameters[0].currentValue || '');
      setStatus(equipment.parameters[0].status || 'healthy');
      setNotes(equipment.parameters[0].notes || '');
    }

    // Initialize batch data
    const initialBatch: { [paramId: string]: { value: string; status: 'healthy' | 'warning' | 'critical'; notes: string } } = {};
    (equipment.parameters || []).forEach((p) => {
      initialBatch[p.id] = {
        value: p.currentValue || '',
        status: p.status || 'healthy',
        notes: p.notes || '',
      };
    });
    setBatchData(initialBatch);
    setSuccessToast(null);
  }, [equipment, initialParameter, manualInputModalOpen]);

  if (!manualInputModalOpen || !equipment) return null;

  const currentParamObj = (equipment.parameters || []).find((p) => p.id === selectedParamId);

  const handleSelectParam = (paramId: string) => {
    setSelectedParamId(paramId);
    const p = (equipment.parameters || []).find((item) => item.id === paramId);
    if (p) {
      setMeasuredValue(p.currentValue || '');
      setStatus(p.status || 'healthy');
      setNotes(p.notes || '');
    }
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParamId || !measuredValue.trim()) return;

    recordParameterValue({
      equipmentId: equipment.id,
      parameterId: selectedParamId,
      value: measuredValue.trim(),
      status,
      notes: notes.trim(),
      shift,
    });

    setSuccessToast(`Parameter observation logged by ${currentUser?.name || 'Technician'}!`);
    setTimeout(() => {
      closeManualInputModal();
    }, 900);
  };

  const handleBatchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = Object.entries(batchData)
      .filter(([_, data]) => data.value.trim().length > 0)
      .map(([paramId, data]) => ({
        parameterId: paramId,
        value: data.value.trim(),
        status: data.status,
        notes: data.notes.trim(),
      }));

    if (updates.length === 0) return;

    batchRecordParameters(equipment.id, updates, shift);
    setSuccessToast(`Batch checklist of ${updates.length} parameters logged by ${currentUser?.name || 'Technician'}!`);
    setTimeout(() => {
      closeManualInputModal();
    }, 900);
  };

  const updateBatchRow = (paramId: string, field: 'value' | 'status' | 'notes', val: string) => {
    setBatchData((prev) => ({
      ...prev,
      [paramId]: {
        ...prev[paramId],
        [field]: val,
      },
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Manual Parameter Measurement Input</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                  Open to All Staff
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {equipment.name} <span className="font-mono text-cyan-300">({equipment.tag})</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeManualInputModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Operator Identification Banner */}
        <div className="px-6 py-2.5 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <User className="w-4 h-4 text-cyan-400" />
            <span>
              Logging as: <strong className="text-white">{currentUser?.name}</strong>{' '}
              <span className="text-slate-400">({currentUser?.designation})</span>
            </span>
          </div>
          <span className="font-mono text-[11px] text-cyan-300 bg-cyan-950/60 border border-cyan-800/40 px-2 py-0.5 rounded">
            ID: {currentUser?.employeeId}
          </span>
        </div>

        {/* Mode switcher tabs */}
        <div className="px-6 pt-4 pb-1 flex items-center justify-between border-b border-slate-800/80">
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={() => setMode('single')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                mode === 'single'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>Single Parameter Reading</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('batch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition ${
                mode === 'batch'
                  ? 'bg-cyan-500 text-white shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Full Shift Checklist ({equipment.parameters?.length || 0})</span>
            </button>
          </div>

          <div className="flex items-center space-x-1 text-xs text-slate-400">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value as any)}
              className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="Shift A (Morning)">Shift A (Morning)</option>
              <option value="Shift B (Evening)">Shift B (Evening)</option>
              <option value="Shift C (Night)">Shift C (Night)</option>
              <option value="General Shift">General Shift</option>
            </select>
          </div>
        </div>

        {successToast && (
          <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successToast}</span>
          </div>
        )}

        {/* Mode 1: Single Parameter Input */}
        {mode === 'single' && (
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-4">
            {/* Parameter Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Select Equipment Health Parameter
              </label>
              <select
                value={selectedParamId}
                onChange={(e) => handleSelectParam(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {(equipment.parameters || []).map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.priority}] {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Standard Target / Benchmark Reference Box */}
            {currentParamObj && (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/50 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Standard Benchmark Specification
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      currentParamObj.priority === 'High Priority'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {currentParamObj.priority}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  {currentParamObj.benchmark}
                </p>
                {currentParamObj.lastUpdatedBy && (
                  <p className="text-[10px] text-slate-400 pt-1 border-t border-cyan-900/40">
                    Last recorded by:{' '}
                    <strong className="text-slate-300">{currentParamObj.lastUpdatedBy.name}</strong>{' '}
                    ({currentParamObj.lastUpdatedBy.designation}) on {currentParamObj.lastUpdated}
                  </p>
                )}
              </div>
            )}

            {/* Measured Value Input */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Measured / Observed Value <span className="text-cyan-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g., 615V DC, Ripple 2.1V / 58.2°C / Class 1 Sparking"
                value={measuredValue}
                onChange={(e) => setMeasuredValue(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            {/* Condition / Status Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Observed Equipment Condition
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={() => setStatus('healthy')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition ${
                    status === 'healthy'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 ring-2 ring-emerald-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4 mb-1 text-emerald-400" />
                  <span>Normal / Healthy</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('warning')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition ${
                    status === 'warning'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 mb-1 text-amber-400" />
                  <span>Warning / Alert</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStatus('critical')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center transition ${
                    status === 'critical'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-300 ring-2 ring-rose-500/30'
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <AlertOctagon className="w-4 h-4 mb-1 text-rose-400" />
                  <span>Critical Fault</span>
                </button>
              </div>
            </div>

            {/* Technician Remarks */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Inspection Remarks & Sensory Findings (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Mention thermography readings, audible noise, vibration feel, or maintenance actions taken..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 leading-relaxed"
              ></textarea>
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={closeManualInputModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Parameter Reading</span>
              </button>
            </div>
          </form>
        )}

        {/* Mode 2: Full Shift Checklist (Batch Input) */}
        {mode === 'batch' && (
          <form onSubmit={handleBatchSubmit} className="p-6 space-y-4">
            <p className="text-xs text-slate-400">
              Inspect and record readings for all parameters of this equipment during your shift walk-down.
            </p>

            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {(equipment.parameters || []).map((p) => {
                const currentData = batchData[p.id] || { value: '', status: 'healthy', notes: '' };
                return (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5 transition hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-1.5">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            p.priority === 'High Priority'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          {p.priority === 'High Priority' ? 'High' : 'PM'}
                        </span>
                        <span className="font-bold text-xs text-white">{p.name}</span>
                      </div>

                      <div className="flex items-center space-x-1">
                        <button
                          type="button"
                          onClick={() => updateBatchRow(p.id, 'status', 'healthy')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentData.status === 'healthy'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBatchRow(p.id, 'status', 'warning')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentData.status === 'warning'
                              ? 'bg-amber-500 text-slate-950'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Warn
                        </button>
                        <button
                          type="button"
                          onClick={() => updateBatchRow(p.id, 'status', 'critical')}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            currentData.status === 'critical'
                              ? 'bg-rose-500 text-white'
                              : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          Crit
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-cyan-300/80 bg-cyan-950/30 px-2.5 py-1 rounded border border-cyan-900/40">
                      Standard: <span className="text-slate-200">{p.benchmark}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Measured value (e.g. 58°C)..."
                        value={currentData.value}
                        onChange={(e) => updateBatchRow(p.id, 'value', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 font-mono"
                      />
                      <input
                        type="text"
                        placeholder="Remarks / observations..."
                        value={currentData.notes}
                        onChange={(e) => updateBatchRow(p.id, 'notes', e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="pt-2 flex items-center justify-end space-x-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={closeManualInputModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow-lg shadow-cyan-600/20 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save All Shift Readings</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
