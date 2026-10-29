import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import {
  Activity,
  Gauge,
  Thermometer,
  Wrench,
  RotateCcw,
  CheckCircle2,
  Clock,
  MapPin,
  Factory,
  Zap,
  Flame,
  TrendingUp,
  Camera,
  PlusCircle,
  Trash2,
  FileCheck2,
  Image as ImageIcon,
  FolderGit2,
  ExternalLink,
} from 'lucide-react';
import type { SensorParameter } from '../types';

export const EquipmentHealthTab: React.FC<{ onOpenFaultModal: () => void }> = ({ onOpenFaultModal }) => {
  const {
    equipmentList,
    equipmentRequests,
    setSelectedEquipmentId,
    selectedEquipment,
    startTroubleshootForEquipment,
    openCreateWorkOrder,
    resetEquipmentToNominal,
    deleteEquipmentDirect,
    submitEquipmentRequest,
    uploadEquipmentPicture,
    openAddEquipmentModal,
    openWorkUpdateModal,
    openEquipmentRequestModal,
  } = useDashboard();

  const { currentUser, isManager, isLowerManagement, isAdmin, companySettings } = useAuth();

  const [activeSensorKey, setActiveSensorKey] = useState<'vibration' | 'temperature' | 'pressure' | 'motorLoad'>('vibration');
  const [filterCategory, setFilterCategory] = useState<string>('All');

  if (!selectedEquipment) return null;

  const categories = ['All', 'Pump', 'CNC', 'Compressor', 'Motor', 'Conveyor', 'Hydraulic'];
  const filteredEquipment = filterCategory === 'All' 
    ? equipmentList 
    : equipmentList.filter((e) => e.category === filterCategory);

  const currentSensor: SensorParameter | undefined =
    activeSensorKey === 'vibration'
      ? selectedEquipment.telemetry.vibration
      : activeSensorKey === 'temperature'
      ? selectedEquipment.telemetry.temperature
      : activeSensorKey === 'pressure'
      ? selectedEquipment.telemetry.pressure
      : selectedEquipment.telemetry.motorLoad;

  const vibParam = selectedEquipment.telemetry.vibration;
  const tempParam = selectedEquipment.telemetry.temperature;

  const mechanicalScore = Math.max(
    10,
    Math.min(100, Math.round(100 - (vibParam.value / vibParam.criticalThreshold) * 50))
  );

  const thermalScore = Math.max(
    10,
    Math.min(100, Math.round(100 - (tempParam.value / tempParam.criticalThreshold) * 50))
  );

  const electricalScore = selectedEquipment.telemetry.motorLoad
    ? Math.max(
        15,
        Math.min(100, Math.round(100 - (selectedEquipment.telemetry.motorLoad.value / selectedEquipment.telemetry.motorLoad.criticalThreshold) * 45))
      )
    : 92;

  const lubricationScore = selectedEquipment.telemetry.oilLevel
    ? Math.round(selectedEquipment.telemetry.oilLevel.value)
    : 88;

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (score >= 60) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/30 animate-pulse';
  };

  const handlePictureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert('Equipment photo must be smaller than 3MB.');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        uploadEquipmentPicture(selectedEquipment.id, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDeleteEquipment = () => {
    if (isManager || isAdmin) {
      if (window.confirm(`Are you sure you want to decommission and delete ${selectedEquipment.name} (${selectedEquipment.tag}) from plant fleet?`)) {
        deleteEquipmentDirect(selectedEquipment.id);
      }
    } else if (isLowerManagement) {
      const reason = window.prompt(`Request decommission for ${selectedEquipment.name} (${selectedEquipment.tag}): Please enter reason for Manager / Assistant Manager approval:`);
      if (reason && reason.trim()) {
        submitEquipmentRequest({
          type: 'delete',
          equipmentId: selectedEquipment.id,
          equipmentName: selectedEquipment.name,
          requestedBy: currentUser?.name || 'Junior Maintenance Supervisor',
          requestedByEmail: currentUser?.email || 'user@plant04.com',
          requestedByRole: currentUser?.designation || 'Junior Maintenance Supervisor',
          reason: reason.trim(),
        });
        alert('Decommission request submitted for Manager approval!');
      }
    } else {
      alert('You do not have permission to delete or request equipment decommission.');
    }
  };

  const pendingRequestsCount = equipmentRequests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="space-y-6">
      {/* Top Header & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Factory className="w-5 h-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Machinery Telemetry & Health Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time condition monitoring, work updates, and asset lifecycle controls.
          </p>
        </div>

        {/* Manager / Admin / Lower-level Management Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Link: Google Drive Photos Folder */}
          {companySettings.googleDriveFolderUrl && (
            <a
              href={companySettings.googleDriveFolderUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
              title="Open Google Drive Cloud Storage for machinery photos"
            >
              <FolderGit2 className="w-4 h-4 text-cyan-400" />
              <span>Drive Photos</span>
              <ExternalLink className="w-2.5 h-2.5 text-slate-500" />
            </a>
          )}

          {/* Authorization Queue for Managers */}
          {(isManager || isAdmin) && (
            <button
              onClick={openEquipmentRequestModal}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center space-x-1.5 transition"
              title="Review equipment addition & deletion requests submitted by junior management"
            >
              <FileCheck2 className="w-4 h-4 text-cyan-400" />
              <span>Approval Queue</span>
              {pendingRequestsCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse">
                  {pendingRequestsCount}
                </span>
              )}
            </button>
          )}

          {/* Add Equipment Action */}
          <button
            onClick={openAddEquipmentModal}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 flex items-center space-x-1.5 transition transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            <span>
              {isManager || isAdmin
                ? '+ Add Equipment (Direct)'
                : '+ Request Equipment Addition'}
            </span>
          </button>
        </div>
      </div>

      {/* Category Filter & Equipment Carousel */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Machinery Fleet Units ({filteredEquipment.length})
          </span>
          <div className="flex space-x-1.5 overflow-x-auto">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                  filterCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Equipment Selector Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {filteredEquipment.map((eq) => {
            const isSelected = eq.id === selectedEquipment.id;
            return (
              <button
                key={eq.id}
                onClick={() => setSelectedEquipmentId(eq.id)}
                className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-cyan-500 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] font-bold text-cyan-400">{eq.tag}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      eq.status === 'healthy'
                        ? 'bg-emerald-400'
                        : eq.status === 'warning'
                        ? 'bg-amber-400'
                        : 'bg-rose-400 animate-ping'
                    }`}
                  ></span>
                </div>
                <span className="text-xs font-semibold text-slate-200 line-clamp-1 block">{eq.name}</span>
                <div className="mt-2 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Score:</span>
                  <span
                    className={`font-mono font-bold ${
                      eq.healthScore >= 80 ? 'text-emerald-400' : eq.healthScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {eq.healthScore}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Asset Comprehensive Health Banner with Equipment Picture */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 shadow-xl space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          {/* Asset Identity with Picture */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Equipment Image & Uploader */}
            <div className="relative group w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl shrink-0">
              {selectedEquipment.imageUrl ? (
                <img
                  src={selectedEquipment.imageUrl}
                  alt={selectedEquipment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                  <ImageIcon className="w-10 h-10 mb-1" />
                  <span className="text-[10px]">No Photo</span>
                </div>
              )}

              {/* Upload Picture Overlay Trigger */}
              <label className="absolute inset-0 bg-slate-950/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center cursor-pointer p-2 text-center text-white">
                <Camera className="w-6 h-6 mb-1 text-cyan-400" />
                <span className="text-[10px] font-bold">Update Photo</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePictureUpload}
                  className="hidden"
                />
              </label>
            </div>

            {/* Details */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <span className="px-2.5 py-1 rounded-md bg-cyan-950 text-cyan-300 font-mono font-bold text-xs border border-cyan-800/60">
                  {selectedEquipment.tag}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-medium text-xs">
                  {selectedEquipment.category}
                </span>
                <span className="px-2.5 py-1 rounded-md bg-indigo-950/60 text-indigo-300 font-medium text-xs border border-indigo-800/40">
                  Criticality: {selectedEquipment.criticality}
                </span>
              </div>

              <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
                {selectedEquipment.name}
              </h1>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400">
                <span className="flex items-center">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {selectedEquipment.location}
                </span>
                <span className="flex items-center">
                  <Factory className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {selectedEquipment.manufacturer} — {selectedEquipment.model}
                </span>
                <span className="flex items-center font-mono">
                  S/N: {selectedEquipment.serialNumber}
                </span>
              </div>
            </div>
          </div>

          {/* Health Gauge & Score */}
          <div className="flex items-center space-x-4 sm:space-x-6 self-end sm:self-auto">
            <div className="text-right">
              <span className="text-xs uppercase font-semibold text-slate-400 block">Overall Condition</span>
              <span className="text-xs text-slate-400 block mt-0.5">
                Runtime: <strong className="text-slate-200 font-mono">{selectedEquipment.operatingHours.toLocaleString()}h</strong>
              </span>
              <span className="text-xs text-slate-400 block">
                Last Service: <strong className="text-slate-200">{selectedEquipment.lastMaintenanceDate}</strong>
              </span>
            </div>

            <div
              className={`w-20 h-20 rounded-2xl flex flex-col items-center justify-center border shadow-xl ${getHealthColor(
                selectedEquipment.healthScore
              )}`}
            >
              <span className="text-2xl font-extrabold font-mono leading-none">
                {selectedEquipment.healthScore}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider mt-1">/ 100</span>
            </div>
          </div>
        </div>

        {/* Subsystem Health Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mechanical Health</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{mechanicalScore}%</span>
              <span className="text-xs text-slate-400">Bearing / Balance</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${mechanicalScore >= 75 ? 'bg-emerald-400' : 'bg-amber-400'}`}
                style={{ width: `${mechanicalScore}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Thermal Equilibrium</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{thermalScore}%</span>
              <span className="text-xs text-slate-400">Heat Dissipation</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${thermalScore >= 75 ? 'bg-emerald-400' : 'bg-rose-400'}`}
                style={{ width: `${thermalScore}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Electrical & Drive</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{electricalScore}%</span>
              <span className="text-xs text-slate-400">Motor / Current</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-emerald-400"
                style={{ width: `${electricalScore}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Hydraulic & Lubrication</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{lubricationScore}%</span>
              <span className="text-xs text-slate-400">Lube Viscosity</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className="h-1 rounded-full bg-cyan-400"
                style={{ width: `${lubricationScore}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Controls Toolbar */}
        <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2 text-xs text-slate-400">
            <Clock className="w-4 h-4 text-cyan-400" />
            <span>Next Scheduled Service: <strong className="text-cyan-300 font-mono">{selectedEquipment.nextScheduledService}</strong></span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Log Work Update CTA */}
            <button
              onClick={() => openWorkUpdateModal(selectedEquipment)}
              className="px-3 py-1.5 rounded-lg bg-emerald-950/50 hover:bg-emerald-900/50 border border-emerald-700/60 text-emerald-300 text-xs font-bold flex items-center transition"
            >
              <Wrench className="w-3.5 h-3.5 mr-1.5" />
              <span>+ Log Work Update</span>
            </button>

            <button
              onClick={() => resetEquipmentToNominal(selectedEquipment.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 flex items-center transition"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1 text-slate-400" />
              Reset Baseline
            </button>

            <button
              onClick={onOpenFaultModal}
              className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-xs font-semibold border border-amber-500/30 flex items-center transition"
            >
              <Flame className="w-3.5 h-3.5 mr-1 text-amber-400" />
              Inject Fault
            </button>

            <button
              onClick={() => startTroubleshootForEquipment(selectedEquipment.id)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-bold flex items-center transition shadow-sm"
            >
              Diagnose & Troubleshoot
            </button>

            <button
              onClick={() =>
                openCreateWorkOrder({
                  equipmentId: selectedEquipment.id,
                  equipmentName: selectedEquipment.name,
                })
              }
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center transition shadow-lg shadow-cyan-600/20"
            >
              Create Work Order
            </button>

            {/* Delete / Decommission Option */}
            <button
              onClick={handleDeleteEquipment}
              className="p-1.5 rounded-lg hover:bg-rose-900/40 text-slate-500 hover:text-rose-400 border border-slate-800 transition"
              title={
                isManager || isAdmin
                  ? 'Decommission and delete this machinery (Direct)'
                  : 'Submit decommission request for Manager approval'
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sensor Gauge Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Vibration Card */}
        {selectedEquipment.telemetry.vibration && (
          <div
            onClick={() => setActiveSensorKey('vibration')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeSensorKey === 'vibration'
                ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Activity className="w-3.5 h-3.5 mr-1.5 text-cyan-400" /> Vibration
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Warn: {selectedEquipment.telemetry.vibration.warningThreshold}
              </span>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  selectedEquipment.telemetry.vibration.value >= selectedEquipment.telemetry.vibration.criticalThreshold
                    ? 'text-rose-400'
                    : selectedEquipment.telemetry.vibration.value >= selectedEquipment.telemetry.vibration.warningThreshold
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {selectedEquipment.telemetry.vibration.value}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedEquipment.telemetry.vibration.unit}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  selectedEquipment.telemetry.vibration.value >= selectedEquipment.telemetry.vibration.criticalThreshold
                    ? 'bg-rose-500'
                    : selectedEquipment.telemetry.vibration.value >= selectedEquipment.telemetry.vibration.warningThreshold
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (selectedEquipment.telemetry.vibration.value / selectedEquipment.telemetry.vibration.max) * 100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{selectedEquipment.telemetry.vibration.name}</p>
          </div>
        )}

        {/* Temperature Card */}
        {selectedEquipment.telemetry.temperature && (
          <div
            onClick={() => setActiveSensorKey('temperature')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeSensorKey === 'temperature'
                ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Thermometer className="w-3.5 h-3.5 mr-1.5 text-amber-400" /> Temperature
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Limit: {selectedEquipment.telemetry.temperature.warningThreshold}°C
              </span>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span
                className={`text-3xl font-extrabold font-mono ${
                  selectedEquipment.telemetry.temperature.value >= selectedEquipment.telemetry.temperature.criticalThreshold
                    ? 'text-rose-400'
                    : selectedEquipment.telemetry.temperature.value >= selectedEquipment.telemetry.temperature.warningThreshold
                    ? 'text-amber-400'
                    : 'text-white'
                }`}
              >
                {selectedEquipment.telemetry.temperature.value}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedEquipment.telemetry.temperature.unit}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  selectedEquipment.telemetry.temperature.value >= selectedEquipment.telemetry.temperature.criticalThreshold
                    ? 'bg-rose-500'
                    : selectedEquipment.telemetry.temperature.value >= selectedEquipment.telemetry.temperature.warningThreshold
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    (selectedEquipment.telemetry.temperature.value / selectedEquipment.telemetry.temperature.max) * 100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{selectedEquipment.telemetry.temperature.name}</p>
          </div>
        )}

        {/* Pressure / Load Card */}
        {selectedEquipment.telemetry.pressure ? (
          <div
            onClick={() => setActiveSensorKey('pressure')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeSensorKey === 'pressure'
                ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Gauge className="w-3.5 h-3.5 mr-1.5 text-blue-400" /> Pressure
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Warn: {selectedEquipment.telemetry.pressure.warningThreshold} bar
              </span>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold font-mono text-white">
                {selectedEquipment.telemetry.pressure.value}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedEquipment.telemetry.pressure.unit}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (selectedEquipment.telemetry.pressure.value / selectedEquipment.telemetry.pressure.max) * 100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{selectedEquipment.telemetry.pressure.name}</p>
          </div>
        ) : selectedEquipment.telemetry.motorLoad ? (
          <div
            onClick={() => setActiveSensorKey('motorLoad')}
            className={`p-4 rounded-xl border cursor-pointer transition-all ${
              activeSensorKey === 'motorLoad'
                ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1.5 text-yellow-400" /> Motor Current
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                Warn: {selectedEquipment.telemetry.motorLoad.warningThreshold}
              </span>
            </div>
            <div className="mt-3 flex items-baseline space-x-1.5">
              <span className="text-3xl font-extrabold font-mono text-white">
                {selectedEquipment.telemetry.motorLoad.value}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {selectedEquipment.telemetry.motorLoad.unit}
              </span>
            </div>
            <div className="mt-3 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
              <div
                className="h-2 rounded-full bg-yellow-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    100,
                    (selectedEquipment.telemetry.motorLoad.value / selectedEquipment.telemetry.motorLoad.max) * 100
                  )}%`,
                }}
              ></div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">{selectedEquipment.telemetry.motorLoad.name}</p>
          </div>
        ) : null}

        {/* Auxiliary Metrics Card */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Auxiliary Sensor
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
          {selectedEquipment.telemetry.rpm ? (
            <div className="mt-3">
              <span className="text-2xl font-extrabold font-mono text-white">
                {selectedEquipment.telemetry.rpm.value.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1">RPM</span>
              <p className="mt-1 text-[11px] text-slate-400">Spindle Speed Velocity</p>
            </div>
          ) : selectedEquipment.telemetry.flowRate ? (
            <div className="mt-3">
              <span className="text-2xl font-extrabold font-mono text-white">
                {selectedEquipment.telemetry.flowRate.value}
              </span>
              <span className="text-xs text-slate-400 ml-1">m³/h</span>
              <p className="mt-1 text-[11px] text-slate-400">Slurry Flow Rate</p>
            </div>
          ) : (
            <div className="mt-3">
              <span className="text-2xl font-extrabold font-mono text-white">
                {selectedEquipment.mtbfHours}h
              </span>
              <span className="text-xs text-slate-400 ml-1">MTBF</span>
              <p className="mt-1 text-[11px] text-slate-400">Mean Time Between Failures</p>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Telemetry Trend Chart */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              <span>Real-time Telemetry Trend Analysis</span>
            </h3>
            <p className="text-xs text-slate-400">
              High-frequency sensor stream with dynamic warning & critical safety limits.
            </p>
          </div>

          <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {selectedEquipment.telemetry.vibration && (
              <button
                onClick={() => setActiveSensorKey('vibration')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeSensorKey === 'vibration'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Vibration
              </button>
            )}
            {selectedEquipment.telemetry.temperature && (
              <button
                onClick={() => setActiveSensorKey('temperature')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeSensorKey === 'temperature'
                    ? 'bg-amber-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Temperature
              </button>
            )}
            {selectedEquipment.telemetry.pressure && (
              <button
                onClick={() => setActiveSensorKey('pressure')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeSensorKey === 'pressure'
                    ? 'bg-blue-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Pressure
              </button>
            )}
            {selectedEquipment.telemetry.motorLoad && (
              <button
                onClick={() => setActiveSensorKey('motorLoad')}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeSensorKey === 'motorLoad'
                    ? 'bg-yellow-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Load
              </button>
            )}
          </div>
        </div>

        {currentSensor && (
          <div className="h-72 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentSensor.history || []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="sensorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor={
                        activeSensorKey === 'vibration'
                          ? '#06b6d4'
                          : activeSensorKey === 'temperature'
                          ? '#f59e0b'
                          : '#3b82f6'
                      }
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={
                        activeSensorKey === 'vibration'
                          ? '#06b6d4'
                          : activeSensorKey === 'temperature'
                          ? '#f59e0b'
                          : '#3b82f6'
                      }
                      stopOpacity={0.0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="timestamp" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  domain={[0, Math.ceil(currentSensor.max * 1.05)]}
                  unit={` ${currentSensor.unit}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val} ${currentSensor.unit}`, currentSensor.name]}
                />
                <ReferenceLine
                  y={currentSensor.warningThreshold}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: `Warn Limit (${currentSensor.warningThreshold})`,
                    fill: '#f59e0b',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <ReferenceLine
                  y={currentSensor.criticalThreshold}
                  stroke="#f43f5e"
                  strokeDasharray="4 4"
                  label={{
                    value: `Critical Limit (${currentSensor.criticalThreshold})`,
                    fill: '#f43f5e',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="val"
                  stroke={
                    activeSensorKey === 'vibration'
                      ? '#06b6d4'
                      : activeSensorKey === 'temperature'
                      ? '#f59e0b'
                      : '#3b82f6'
                  }
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#sensorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Work Updates & Repair Progress Timeline */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Wrench className="w-4 h-4 text-emerald-400" />
              <span>Machinery Work Updates & Progress Timeline</span>
            </h3>
            <p className="text-xs text-slate-400">
              Shift repair logs, progress percentage milestones, and field technician photographic proof.
            </p>
          </div>

          <button
            onClick={() => openWorkUpdateModal(selectedEquipment)}
            className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center space-x-1.5 transition self-start sm:self-auto shadow-lg shadow-emerald-600/20"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Log Work Update</span>
          </button>
        </div>

        {/* Timeline list */}
        <div className="space-y-3 pt-2">
          {(!selectedEquipment.workUpdates || selectedEquipment.workUpdates.length === 0) ? (
            <div className="p-6 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No active work progress updates logged yet. Click "+ Log Work Update" to record shift progress.</span>
            </div>
          ) : (
            selectedEquipment.workUpdates.map((update) => (
              <div
                key={update.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-start gap-4 transition hover:border-slate-700"
              >
                {/* Optional Photo Attachment */}
                {update.photoUrl && (
                  <div className="w-24 h-24 rounded-xl bg-slate-900 border border-slate-800 overflow-hidden shrink-0 shadow-md">
                    <img
                      src={update.photoUrl}
                      alt="Work Proof"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-100 text-sm">{update.title}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                        {update.status}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 text-xs">
                      <span className="font-mono text-cyan-400 font-bold">{update.progressPercent}%</span>
                      <span className="text-slate-400">Complete</span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full"
                      style={{ width: `${update.progressPercent}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed">{update.description}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                    <span>
                      Technician: <strong className="text-white">{update.technicianName}</strong> ({update.technicianRole})
                    </span>
                    <span className="font-mono text-slate-400">{update.timestamp}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
