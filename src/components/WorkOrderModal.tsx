import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
  X,
  ClipboardList,
  Plus,
  Trash2,
  Package,
  CheckCircle2,
} from 'lucide-react';
import type {
  MaintenanceRecord,
  MaintenanceType,
  MaintenanceStatus,
  PriorityLevel,
  SparePart,
} from '../types';
import { TECHNICIANS } from '../data/mockData';

export const WorkOrderModal: React.FC = () => {
  const {
    activeWorkOrderModal,
    editingWorkOrder,
    closeWorkOrderModal,
    saveWorkOrder,
    equipmentList,
  } = useDashboard();

  const [equipmentId, setEquipmentId] = useState<string>(equipmentList[0].id);
  const [title, setTitle] = useState<string>('');
  const [type, setType] = useState<MaintenanceType>('Corrective');
  const [status, setStatus] = useState<MaintenanceStatus>('Scheduled');
  const [priority, setPriority] = useState<PriorityLevel>('Medium');
  const [technician, setTechnician] = useState<string>(TECHNICIANS[0]);
  const [scheduledDate, setScheduledDate] = useState<string>('');
  const [downtimeHours, setDowntimeHours] = useState<number>(2.0);
  const [laborCost, setLaborCost] = useState<number>(250);
  const [parts, setParts] = useState<SparePart[]>([]);
  const [rootCause, setRootCause] = useState<string>('');
  const [actionTaken, setActionTaken] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [signOffBy, setSignOffBy] = useState<string>('');

  useEffect(() => {
    if (editingWorkOrder) {
      setEquipmentId(editingWorkOrder.equipmentId || equipmentList[0].id);
      setTitle(editingWorkOrder.title || '');
      setType(editingWorkOrder.type || 'Corrective');
      setStatus(editingWorkOrder.status || 'Scheduled');
      setPriority(editingWorkOrder.priority || 'Medium');
      setTechnician(editingWorkOrder.technician || TECHNICIANS[0]);
      setScheduledDate(editingWorkOrder.scheduledDate || new Date().toISOString().slice(0, 16));
      setDowntimeHours(editingWorkOrder.downtimeHours ?? 2.0);
      setLaborCost(editingWorkOrder.cost?.laborCost ?? 250);
      setParts(editingWorkOrder.partsReplaced || []);
      setRootCause(editingWorkOrder.rootCause || '');
      setActionTaken(editingWorkOrder.actionTaken || '');
      setNotes(editingWorkOrder.notes || '');
      setSignOffBy(editingWorkOrder.signOffBy || '');
    } else {
      setEquipmentId(equipmentList[0].id);
      setTitle('');
      setType('Corrective');
      setStatus('Scheduled');
      setPriority('Medium');
      setTechnician(TECHNICIANS[0]);
      setScheduledDate(new Date().toISOString().slice(0, 16));
      setDowntimeHours(2.0);
      setLaborCost(250);
      setParts([]);
      setRootCause('');
      setActionTaken('');
      setNotes('');
      setSignOffBy('');
    }
  }, [editingWorkOrder, equipmentList, activeWorkOrderModal]);

  if (!activeWorkOrderModal) return null;

  const handleAddPart = () => {
    setParts((prev) => [
      ...prev,
      {
        partName: 'Replacement Sensor / Seal',
        partNumber: `OEM-PART-${Math.floor(100 + Math.random() * 900)}`,
        quantity: 1,
        unitCost: 75,
      },
    ]);
  };

  const handleRemovePart = (index: number) => {
    setParts((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePartChange = (index: number, field: keyof SparePart, value: any) => {
    setParts((prev) =>
      prev.map((part, i) => (i === index ? { ...part, [field]: value } : part))
    );
  };

  const partsTotalCost = parts.reduce((acc, p) => acc + (p.quantity || 0) * (p.unitCost || 0), 0);
  const grandTotal = partsTotalCost + (laborCost || 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a work order title.');
      return;
    }

    const selectedEq = equipmentList.find((e) => e.id === equipmentId) || equipmentList[0];

    saveWorkOrder({
      equipmentId: selectedEq.id,
      equipmentName: selectedEq.name,
      title: title.trim(),
      type,
      status,
      priority,
      technician,
      scheduledDate,
      downtimeHours: Number(downtimeHours) || 0,
      cost: {
        partsCost: partsTotalCost,
        laborCost: Number(laborCost) || 0,
        totalCost: grandTotal,
      },
      partsReplaced: parts,
      rootCause,
      actionTaken,
      notes,
      signOffBy: signOffBy || technician,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-3xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <ClipboardList className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {editingWorkOrder && editingWorkOrder.id
                  ? `Edit Maintenance Work Order [${editingWorkOrder.id}]`
                  : 'Create New Maintenance Work Order'}
              </h3>
              <p className="text-xs text-slate-400">
                Log service interventions, downtime estimates, technicians, and spare parts.
              </p>
            </div>
          </div>
          <button
            onClick={closeWorkOrderModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Row 1: Target Equipment & Title */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Equipment Asset *
              </label>
              <select
                value={equipmentId}
                onChange={(e) => setEquipmentId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {equipmentList.map((eq) => (
                  <option key={eq.id} value={eq.id}>
                    [{eq.tag}] {eq.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Work Order Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Replace Inboard Impeller Bearing & Re-grease"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Row 2: Type, Priority, Status, Technician */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Maintenance Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MaintenanceType)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Preventive">Preventive</option>
                <option value="Corrective">Corrective</option>
                <option value="Predictive">Predictive</option>
                <option value="Emergency Breakdown">Emergency Breakdown</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PriorityLevel)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
                <option value="Emergency">Emergency</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as MaintenanceStatus)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Scheduled">Scheduled</option>
                <option value="In Progress">In Progress</option>
                <option value="Pending Parts">Pending Parts</option>
                <option value="Completed">Completed</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Assigned Tech
              </label>
              <select
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                {TECHNICIANS.map((tech) => (
                  <option key={tech} value={tech}>
                    {tech}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 3: Scheduled Date, Downtime Hours, Labor Cost */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Scheduled Date & Time
              </label>
              <input
                type="text"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                placeholder="YYYY-MM-DD HH:MM"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Est. Downtime (Hours)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={downtimeHours}
                onChange={(e) => setDowntimeHours(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Labor Cost ($)
              </label>
              <input
                type="number"
                min="0"
                value={laborCost}
                onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Spare Parts Replaced / Consumed Table */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-cyan-400" />
                <span>Spare Parts Consumed / Line Items</span>
              </span>
              <button
                type="button"
                onClick={handleAddPart}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-cyan-950 border border-cyan-800/60 text-cyan-300 hover:bg-cyan-900 transition font-semibold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Part</span>
              </button>
            </div>

            {parts.length === 0 ? (
              <p className="text-slate-400 text-xs italic text-center py-2">
                No spare parts line items added yet. Click "+ Add Part" if parts were installed.
              </p>
            ) : (
              <div className="space-y-2">
                {parts.map((part, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Part Name"
                      value={part.partName}
                      onChange={(e) => handlePartChange(index, 'partName', e.target.value)}
                      className="col-span-5 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200"
                    />
                    <input
                      type="text"
                      placeholder="Part #"
                      value={part.partNumber}
                      onChange={(e) => handlePartChange(index, 'partNumber', e.target.value)}
                      className="col-span-3 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                    />
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={part.quantity}
                      onChange={(e) => handlePartChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      className="col-span-1 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                    />
                    <input
                      type="number"
                      min="0"
                      placeholder="Unit $"
                      value={part.unitCost}
                      onChange={(e) => handlePartChange(index, 'unitCost', parseFloat(e.target.value) || 0)}
                      className="col-span-2 px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemovePart(index)}
                      className="col-span-1 p-1.5 text-rose-400 hover:text-rose-300 text-center"
                    >
                      <Trash2 className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-slate-800 flex items-center justify-between font-mono">
              <span className="text-slate-400">Parts Subtotal: ${partsTotalCost.toLocaleString()}</span>
              <span className="text-emerald-400 font-bold">
                Grand Total (Parts + Labor): ${grandTotal.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Root Cause & Diagnostic Finding */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Diagnostic Finding & Root Cause Analysis
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="e.g. Spectral vibration showed outer-race bearing failure. Lube contamination found."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Action Taken & Procedure */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Corrective Action Taken & Procedure
            </label>
            <textarea
              rows={2}
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              placeholder="e.g. Dismounted drive casing, pressed in new 6314/C3 bearing, laser aligned to 0.02mm."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Sign-off Lead */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Maintenance Sign-Off By
              </label>
              <input
                type="text"
                value={signOffBy}
                onChange={(e) => setSignOffBy(e.target.value)}
                placeholder="e.g. Lead Reliability Engineer / Shift Supervisor"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Additional Notes
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Recheck vibration baseline after 24 hours runtime."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={closeWorkOrderModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/30 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Save Work Order</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
