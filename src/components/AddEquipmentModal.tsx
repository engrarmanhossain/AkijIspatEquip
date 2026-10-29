import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Factory,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import type { EquipmentCategory, Equipment } from '../types';

export const AddEquipmentModal: React.FC = () => {
  const {
    addEquipmentModalOpen,
    closeAddEquipmentModal,
    addEquipmentDirect,
    submitEquipmentRequest,
  } = useDashboard();

  const { currentUser, isManager, isAdmin } = useAuth();

  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('Pump');
  const [location, setLocation] = useState('Plant Floor — Bay 2');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [criticality, setCriticality] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [imageUrl, setImageUrl] = useState('');
  const [requestReason, setRequestReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!addEquipmentModalOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        setStatusMessage({ type: 'error', text: 'Equipment photo must be smaller than 3MB.' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatusMessage({ type: 'error', text: 'Please enter a valid machinery name.' });
      return;
    }

    const equipmentData: Partial<Equipment> = {
      name: name.trim(),
      tag: tag.trim() || `EQ-${Math.floor(100 + Math.random() * 900)}`,
      category,
      location: location.trim(),
      manufacturer: manufacturer.trim() || 'OEM Manufacturer',
      model: model.trim() || 'Industrial Model',
      serialNumber: serialNumber.trim() || `SN-${Date.now().toString().slice(-6)}`,
      criticality,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    };

    if (isManager || isAdmin) {
      // Direct Add without approval!
      addEquipmentDirect(equipmentData);
      setStatusMessage({ type: 'success', text: 'Machinery added directly to plant fleet!' });
      setTimeout(() => {
        closeAddEquipmentModal();
      }, 1000);
    } else {
      // Lower Level Management: Submit Request for Manager Approval!
      if (!requestReason.trim()) {
        setStatusMessage({ type: 'error', text: 'Please provide justification/reason for Manager approval.' });
        return;
      }

      submitEquipmentRequest({
        type: 'add',
        equipmentName: name.trim(),
        equipmentData,
        requestedBy: currentUser?.name || 'Junior Maintenance Supervisor',
        requestedByEmail: currentUser?.email || 'user@plant04.com',
        requestedByRole: currentUser?.designation || 'Junior Maintenance Supervisor',
        reason: requestReason.trim(),
      });

      setStatusMessage({
        type: 'success',
        text: 'Equipment addition request submitted! Pending Plant Manager / Assistant Manager approval.',
      });
      setTimeout(() => {
        closeAddEquipmentModal();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                {isManager || isAdmin ? 'Add New Machinery Asset (Direct Authorization)' : 'Request Machinery Asset Addition'}
              </h3>
              <p className="text-xs text-slate-400">
                {isManager || isAdmin
                  ? 'Plant Manager / Admin privilege: Direct enrollment without secondary approval.'
                  : 'Lower-Level Management: Submits ticket for Manager or Assistant Manager approval.'}
              </p>
            </div>
          </div>
          <button
            onClick={closeAddEquipmentModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Authorization Banner */}
        <div className="mx-5 mt-4 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs flex items-center space-x-2.5">
          <Shield className={`w-4 h-4 shrink-0 ${isManager || isAdmin ? 'text-emerald-400' : 'text-amber-400'}`} />
          {isManager || isAdmin ? (
            <p className="text-emerald-300/90 leading-relaxed">
              <strong>Executive Privilege Active:</strong> As a <strong>Plant Manager</strong> or <strong>Administrator</strong>, you can add or decommission machinery directly into the plant fleet without waiting for approval.
            </p>
          ) : (
            <p className="text-amber-300/90 leading-relaxed">
              <strong>Hierarchy Policy:</strong> As a <strong>Junior Supervisor / Lower-Level Manager</strong>, your equipment addition will be submitted to the <strong>Plant Manager</strong> or <strong>Assistant Manager</strong> for sign-off.
            </p>
          )}
        </div>

        {statusMessage && (
          <div
            className={`mx-5 mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-950/60 border border-rose-500/40 text-rose-300'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[72vh] overflow-y-auto">
          {/* Equipment Photo Uploader */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
            <span className="font-bold uppercase tracking-wider text-slate-400 block">
              Equipment Photo / Graphic Upload
            </span>

            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {imageUrl ? (
                  <img src={imageUrl} alt="Equipment" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-8 h-8 text-slate-600" />
                )}
              </div>

              <div className="flex-1 space-y-2">
                <label className="flex items-center justify-center space-x-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 cursor-pointer transition font-medium">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Choose Equipment Photo (JPG / PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-600 font-mono text-[11px]"
                />
              </div>
            </div>
          </div>

          {/* Row 1: Name & Tag */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Equipment Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Slurry Booster Pump #2"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Equipment Tag / Identifier
              </label>
              <input
                type="text"
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. P-101B"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 2: Category & Criticality */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Equipment Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-semibold text-cyan-400"
              >
                <option value="Pump">Centrifugal / Slurry Pump</option>
                <option value="CNC">CNC Machining Center</option>
                <option value="Compressor">Rotary Screw Compressor</option>
                <option value="Motor">Electric Induction Motor</option>
                <option value="Conveyor">Belt Conveyor Line</option>
                <option value="Hydraulic">Hydraulic Forming Press</option>
              </select>
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Criticality Level
              </label>
              <select
                value={criticality}
                onChange={(e) => setCriticality(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              >
                <option value="Critical">Critical (Plant Line Halting)</option>
                <option value="High">High Importance</option>
                <option value="Medium">Medium Importance</option>
                <option value="Low">Low / Auxiliary</option>
              </select>
            </div>
          </div>

          {/* Row 3: Location, Manufacturer, Model */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Plant Location / Cell
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bay 2 — Slurry Feed"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Manufacturer (OEM)
              </label>
              <input
                type="text"
                value={manufacturer}
                onChange={(e) => setManufacturer(e.target.value)}
                placeholder="e.g. Sulzer Process"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Model Number
              </label>
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="AHR-150 Heavy"
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Row 4: Serial Number */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Factory Serial Number (S/N)
            </label>
            <input
              type="text"
              value={serialNumber}
              onChange={(e) => setSerialNumber(e.target.value)}
              placeholder="e.g. SZ-2026-9022"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* If Lower Management: Reason for addition */}
          {!isManager && !isAdmin && (
            <div>
              <label className="font-bold uppercase tracking-wider text-amber-400 block mb-1">
                Justification / Reason for Manager Approval *
              </label>
              <textarea
                rows={2}
                required
                value={requestReason}
                onChange={(e) => setRequestReason(e.target.value)}
                placeholder="Explain why this equipment is needed in the plant and operational urgency..."
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
              />
            </div>
          )}

          {/* Submit Action */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={closeAddEquipmentModal}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/30 flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isManager || isAdmin ? 'Add Equipment Directly to Fleet' : 'Submit for Manager Approval'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
