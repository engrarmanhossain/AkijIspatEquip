import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Wrench,
  Upload,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  Camera,
  Activity,
  Layers,
} from 'lucide-react';
import type { WorkProgressUpdate } from '../types';

export const WorkUpdateModal: React.FC = () => {
  const {
    workUpdateModalOpen,
    equipmentForWorkUpdate,
    closeWorkUpdateModal,
    addWorkProgressUpdate,
  } = useDashboard();

  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [progressPercent, setProgressPercent] = useState<number>(50);
  const [status, setStatus] = useState<WorkProgressUpdate['status']>('In Progress');
  const [photoUrl, setPhotoUrl] = useState('');
  const [success, setSuccess] = useState(false);

  if (!workUpdateModalOpen || !equipmentForWorkUpdate) return null;

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Work progress photo must be smaller than 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      alert('Please fill in title and work description.');
      return;
    }

    addWorkProgressUpdate(equipmentForWorkUpdate.id, {
      equipmentId: equipmentForWorkUpdate.id,
      equipmentName: equipmentForWorkUpdate.name,
      technicianName: currentUser?.name || 'Authorized Technician',
      technicianRole: currentUser?.designation || 'Maintenance Staff',
      technicianAvatar: currentUser?.avatarUrl,
      title: title.trim(),
      description: description.trim(),
      progressPercent,
      status,
      photoUrl: photoUrl.trim() || undefined,
    });

    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      closeWorkUpdateModal();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Log Work Progress Update</h3>
              <p className="text-xs text-slate-400">
                Asset: <span className="font-semibold text-slate-200">{equipmentForWorkUpdate.name}</span> ({equipmentForWorkUpdate.tag})
              </p>
            </div>
          </div>
          <button
            onClick={closeWorkUpdateModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {success && (
          <div className="mx-5 mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Work update logged and added to machinery timeline!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs max-h-[72vh] overflow-y-auto">
          {/* Work Title */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Work Update Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Drive-End Bearing Replacement & Lube Top-Up"
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          {/* Status & Progress Slider */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Progress Status Milestone
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none font-semibold text-cyan-400"
              >
                <option value="In Progress">In Progress</option>
                <option value="Inspection Completed">Inspection Completed</option>
                <option value="Parts Replaced">Parts Replaced</option>
                <option value="Calibrated & Tested">Calibrated & Tested</option>
                <option value="Returned to Service">Returned to Service</option>
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold uppercase tracking-wider text-slate-400">
                  Task Completion %
                </label>
                <span className="font-mono font-bold text-cyan-400">{progressPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progressPercent}
                onChange={(e) => setProgressPercent(parseInt(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500 mt-2"
              />
            </div>
          </div>

          {/* Detailed Description */}
          <div>
            <label className="font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Work Notes & Technical Details *
            </label>
            <textarea
              rows={3}
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe actions taken, components disassembled, torque specs applied, or measurements taken..."
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none leading-relaxed"
            />
          </div>

          {/* Photo / Field Proof Upload */}
          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <span className="font-bold uppercase tracking-wider text-slate-400 block flex items-center space-x-1.5">
              <Camera className="w-4 h-4 text-cyan-400" />
              <span>Attach Work / Repair Proof Photo</span>
            </span>

            <div className="flex items-center space-x-3">
              <div className="w-16 h-16 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
                {photoUrl ? (
                  <img src={photoUrl} alt="Proof" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-slate-600" />
                )}
              </div>

              <div className="flex-1 space-y-1.5">
                <label className="flex items-center justify-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 hover:border-cyan-500 text-slate-200 cursor-pointer transition font-medium">
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Upload Field Photo (JPG / PNG)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
                <input
                  type="url"
                  placeholder="Or paste direct image URL (https://...)"
                  value={photoUrl}
                  onChange={(e) => setPhotoUrl(e.target.value)}
                  className="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-slate-200 placeholder:text-slate-600 font-mono text-[10px]"
                />
              </div>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Author: <strong className="text-white">{currentUser?.name}</strong></span>

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={closeWorkUpdateModal}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold transition shadow-lg shadow-cyan-600/30 flex items-center space-x-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Save Work Update</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
