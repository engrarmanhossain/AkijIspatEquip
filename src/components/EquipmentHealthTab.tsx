import React, { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import { calculateEquipmentHealth } from '../utils/healthCalculator';
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
  Lock,
  Unlock,
  Sliders,
  History,
  Info,
  User,
  Check,
  AlertOctagon,
  AlertTriangle,
  Layers,
  Cpu,
  Shield,
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
    openManualInputModal,
    openEditPhysicalStandardModal,
    openAuditModal,
    parameterInputLogs,
  } = useDashboard();

  const { currentUser, isManager, isLowerManagement, isManagementEmployee, isAdmin, companySettings } = useAuth();

  const [activeSensorKey, setActiveSensorKey] = useState<string>('voltage');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [paramPriorityFilter, setParamPriorityFilter] = useState<'All' | 'High Priority' | 'Less Priority'>('All');

  if (!selectedEquipment) return null;

  const categories = [
    'All',
    'VFD',
    'DC Drive',
    'DC Motor',
    'Induction Motor',
    'Transformer',
    'Mill Field Sensor',
    'PLC & Automation',
    'Pump',
    'CNC',
    'Compressor',
    'Conveyor',
    'Hydraulic',
  ];
  const filteredEquipment = filterCategory === 'All' 
    ? equipmentList 
    : equipmentList.filter((e) => e.category === filterCategory);

  const assessment = useMemo(() => {
    return calculateEquipmentHealth(selectedEquipment.parameters);
  }, [selectedEquipment.parameters]);

  const availableSensors = useMemo(() => {
    if (!selectedEquipment) return [];
    const list: {
      key: string;
      label: string;
      icon: any;
      color: string;
      hexColor: string;
      sensor: SensorParameter;
    }[] = [];

    if (selectedEquipment.telemetry.voltage) {
      list.push({
        key: 'voltage',
        label: 'Voltage',
        icon: Zap,
        color: 'text-amber-400',
        hexColor: '#f59e0b',
        sensor: selectedEquipment.telemetry.voltage,
      });
    }

    if (selectedEquipment.telemetry.current) {
      list.push({
        key: 'current',
        label: 'Current',
        icon: Zap,
        color: 'text-yellow-400',
        hexColor: '#eab308',
        sensor: selectedEquipment.telemetry.current,
      });
    }

    if (selectedEquipment.telemetry.temperature) {
      list.push({
        key: 'temperature',
        label: 'Temperature',
        icon: Thermometer,
        color: 'text-rose-400',
        hexColor: '#f43f5e',
        sensor: selectedEquipment.telemetry.temperature,
      });
    }

    if (selectedEquipment.telemetry.vibration) {
      list.push({
        key: 'vibration',
        label: 'Vibration',
        icon: Activity,
        color: 'text-cyan-400',
        hexColor: '#06b6d4',
        sensor: selectedEquipment.telemetry.vibration,
      });
    }

    if (selectedEquipment.telemetry.pressure) {
      list.push({
        key: 'pressure',
        label: 'Pressure',
        icon: Gauge,
        color: 'text-blue-400',
        hexColor: '#3b82f6',
        sensor: selectedEquipment.telemetry.pressure,
      });
    }

    if (selectedEquipment.telemetry.motorLoad && !selectedEquipment.telemetry.current) {
      list.push({
        key: 'motorLoad',
        label: 'Motor Load',
        icon: Zap,
        color: 'text-yellow-400',
        hexColor: '#eab308',
        sensor: selectedEquipment.telemetry.motorLoad,
      });
    }

    return list;
  }, [selectedEquipment]);

  const activeSensorObj = useMemo(() => {
    return availableSensors.find((s) => s.key === activeSensorKey) || availableSensors[0];
  }, [availableSensors, activeSensorKey]);

  const currentSensor: SensorParameter | undefined = activeSensorObj?.sensor;

  const mechanicalScore = assessment.subsystems.mechanical.score;
  const thermalScore = assessment.subsystems.thermal.score;
  const electricalScore = assessment.subsystems.electrical.score;
  const processScore = assessment.subsystems.process.score;

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl glass-panel shadow-xl relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
              <Factory className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-white">Machinery Telemetry & Health Diagnostics</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
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
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-cyan-300 text-xs font-semibold border border-slate-800 hover:border-cyan-500/40 flex items-center space-x-1.5 transition shadow-sm"
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
              className="px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-200 text-xs font-semibold border border-slate-800 hover:border-slate-700 flex items-center space-x-1.5 transition shadow-sm"
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
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/25 flex items-center space-x-1.5 transition transform active:scale-95"
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
                className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
                  filterCategory === cat
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white border border-slate-800/80'
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
                className={`p-3 rounded-2xl border text-left transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-xl shadow-cyan-500/15 ring-1 ring-cyan-500/60'
                    : 'glass-card-subtle hover:border-slate-700/80 hover:bg-slate-850/60'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-mono text-[11px] font-bold text-cyan-300 bg-cyan-950/80 px-2 py-0.5 rounded-md border border-cyan-800/60">{eq.tag}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      eq.status === 'healthy'
                        ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                        : eq.status === 'warning'
                        ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                        : 'bg-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.7)] animate-pulse'
                    }`}
                  ></span>
                </div>
                <span className="text-xs font-bold text-slate-100 line-clamp-1 block">{eq.name}</span>
                <div className="mt-2.5 flex items-center justify-between text-[11px] pt-1.5 border-t border-slate-800/60">
                  <span className="text-slate-400">Score:</span>
                  <span
                    className={`font-mono font-extrabold ${
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
      <div className="p-5 sm:p-6 rounded-2xl glass-panel shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
          {/* Asset Identity with Picture */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            {/* Equipment Image & Uploader */}
            <div className="relative group w-32 h-32 sm:w-36 sm:h-36 rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shadow-2xl shrink-0 ring-1 ring-white/10 group-hover:ring-cyan-500/50 transition duration-300">
              {selectedEquipment.imageUrl ? (
                <img
                  src={selectedEquipment.imageUrl}
                  alt={selectedEquipment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
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

        {/* Physical Specifications & Mill Application Details Panel */}
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Physical Asset Data & Engineering Specifications
              </span>
            </div>

            <button
              onClick={() => openEditPhysicalStandardModal(selectedEquipment)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition ${
                isManagementEmployee
                  ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 shadow-sm'
                  : 'bg-slate-800/80 text-slate-400 border border-slate-700'
              }`}
              title={
                isManagementEmployee
                  ? 'Edit Equipment Physical Data & Standard Benchmarks'
                  : 'Management Authorization Required: Physical data & standard benchmarks locked'
              }
            >
              {isManagementEmployee ? (
                <>
                  <Unlock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Edit Physical & Standard Data</span>
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-rose-400" />
                  <span>Physical & Standard Data Locked 🔒 (Management Only)</span>
                </>
              )}
            </button>
          </div>

          {selectedEquipment.physicalData?.applicationArea && (
            <div className="text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 leading-relaxed">
              <strong className="text-amber-400">Application Area & Process Duty: </strong>
              {selectedEquipment.physicalData.applicationArea}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {selectedEquipment.physicalData?.voltageRating && (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block">Voltage Rating</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedEquipment.physicalData.voltageRating}</span>
              </div>
            )}
            {selectedEquipment.physicalData?.powerRating && (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block">Power Rating</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedEquipment.physicalData.powerRating}</span>
              </div>
            )}
            {selectedEquipment.physicalData?.coolingType && (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block">Cooling System</span>
                <span className="text-slate-200 font-semibold">{selectedEquipment.physicalData.coolingType}</span>
              </div>
            )}
            {selectedEquipment.physicalData?.enclosureClass && (
              <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 block">Enclosure Protection</span>
                <span className="font-mono text-slate-200 font-semibold">{selectedEquipment.physicalData.enclosureClass}</span>
              </div>
            )}
          </div>
        </div>

        {/* Subsystem Health Matrix (Directly driven by manual parameter entries) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Mechanical Health</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{mechanicalScore}%</span>
              <span className="text-xs text-slate-400 truncate ml-1">{assessment.subsystems.mechanical.details}</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${mechanicalScore >= 80 ? 'bg-emerald-400' : mechanicalScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${mechanicalScore}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Thermal Equilibrium</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{thermalScore}%</span>
              <span className="text-xs text-slate-400 truncate ml-1">{assessment.subsystems.thermal.details}</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${thermalScore >= 80 ? 'bg-emerald-400' : thermalScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${thermalScore}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Electrical & Power</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{electricalScore}%</span>
              <span className="text-xs text-slate-400 truncate ml-1">{assessment.subsystems.electrical.details}</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${electricalScore >= 80 ? 'bg-emerald-400' : electricalScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${electricalScore}%` }}
              ></div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-semibold text-slate-400 block">Process & Controls</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-lg font-bold font-mono text-white">{processScore}%</span>
              <span className="text-xs text-slate-400 truncate ml-1">{assessment.subsystems.process.details}</span>
            </div>
            <div className="mt-1.5 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
              <div
                className={`h-1 rounded-full ${processScore >= 80 ? 'bg-cyan-400' : processScore >= 60 ? 'bg-amber-400' : 'bg-rose-500'}`}
                style={{ width: `${processScore}%` }}
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
            {/* Manual Parameter Input CTA (All Employees) */}
            <button
              onClick={() => openManualInputModal(selectedEquipment)}
              className="px-3 py-1.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/60 text-cyan-300 text-xs font-bold flex items-center transition shadow-sm"
              title="Manual Input for all parameters (Available to all staff)"
            >
              <PlusCircle className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              <span>+ Record Parameter (All Staff)</span>
            </button>

            {/* Audit Trail CTA */}
            <button
              onClick={() => openAuditModal(selectedEquipment.id)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 flex items-center transition"
              title="See who input parameter data"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              <span>Audit Log: Who Input Data</span>
            </button>

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

      {/* Sensor Gauge Cards Grid (Dynamic channels: Voltage, Current, Temperature, Vibration, Pressure, etc.) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {availableSensors.map((item) => {
          const isSelected = activeSensorObj?.key === item.key;
          const s = item.sensor;
          const Icon = item.icon;
          const sMax = s.max && s.max > 0 ? s.max : 100;
          const pct = Math.min(100, Math.max(0, (s.value / sMax) * 100));
          const isCritical = s.criticalThreshold > s.warningThreshold 
            ? s.value >= s.criticalThreshold 
            : s.value <= s.criticalThreshold;
          const isWarning = s.criticalThreshold > s.warningThreshold 
            ? s.value >= s.warningThreshold 
            : s.value <= s.warningThreshold;

          return (
            <div
              key={item.key}
              onClick={() => setActiveSensorKey(item.key)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                  : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center">
                  <Icon className={`w-3.5 h-3.5 mr-1.5 ${item.color}`} /> {item.label}
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  Warn: {s.warningThreshold} {s.unit}
                </span>
              </div>
              <div className="mt-3 flex items-baseline space-x-1.5">
                <span
                  className={`text-3xl font-extrabold font-mono ${
                    isCritical
                      ? 'text-rose-400'
                      : isWarning
                      ? 'text-amber-400'
                      : 'text-white'
                  }`}
                >
                  {s.value}
                </span>
                <span className="text-xs text-slate-400 font-medium">
                  {s.unit}
                </span>
              </div>
              <div className="mt-3 w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    isCritical
                      ? 'bg-rose-500'
                      : isWarning
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${pct}%` }}
                ></div>
              </div>
              <p className="mt-2 text-[11px] text-slate-400 truncate">{s.name}</p>
            </div>
          );
        })}

        {/* Auxiliary Metrics Card (if fewer than 4 primary sensors, or for secondary info) */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Auxiliary Sensor / KPI
            </span>
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          </div>
          {selectedEquipment.telemetry.rpm ? (
            <div className="mt-3">
              <span className="text-2xl font-extrabold font-mono text-white">
                {selectedEquipment.telemetry.rpm.value.toLocaleString()}
              </span>
              <span className="text-xs text-slate-400 ml-1">RPM</span>
              <p className="mt-1 text-[11px] text-slate-400">Operating Velocity / Speed</p>
            </div>
          ) : selectedEquipment.telemetry.flowRate ? (
            <div className="mt-3">
              <span className="text-2xl font-extrabold font-mono text-white">
                {selectedEquipment.telemetry.flowRate.value}
              </span>
              <span className="text-xs text-slate-400 ml-1">m³/h</span>
              <p className="mt-1 text-[11px] text-slate-400">Process Flow Rate</p>
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
              High-frequency sensor stream for {activeSensorObj?.label || 'Telemetry'} with dynamic safety limits.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {availableSensors.map((s) => (
              <button
                key={s.key}
                onClick={() => setActiveSensorKey(s.key)}
                className={`px-3 py-1 rounded-lg font-medium transition ${
                  activeSensorObj?.key === s.key
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
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
                      stopColor={activeSensorObj?.hexColor || '#06b6d4'}
                      stopOpacity={0.4}
                    />
                    <stop
                      offset="95%"
                      stopColor={activeSensorObj?.hexColor || '#06b6d4'}
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
                  domain={[0, Math.ceil((currentSensor.max || 100) * 1.05)]}
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
                  stroke={activeSensorObj?.hexColor || '#06b6d4'}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#sensorGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Comprehensive Equipment Health Parameter Breakdown & Shift Register */}
      <div className="p-5 sm:p-6 rounded-2xl glass-panel shadow-2xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                  <span>Equipment Health Parameters & Shift Register</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                    {selectedEquipment.tag}
                  </span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  High & Less Priority condition breakdown, standard benchmark targets, and verifiable operator entry audit logs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Manual Parameter Input Button (ALL EMPLOYEES) */}
            <button
              onClick={() => openManualInputModal(selectedEquipment)}
              className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-cyan-600/20"
            >
              <PlusCircle className="w-4 h-4" />
              <span>+ Manual Parameter Input (All Staff)</span>
            </button>

            {/* Edit Physical & Standard Data Button (MANAGEMENT ONLY) */}
            <button
              onClick={() => openEditPhysicalStandardModal(selectedEquipment)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
                isManagementEmployee
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border border-slate-700'
              }`}
              title={
                isManagementEmployee
                  ? 'Edit Equipment Physical Data & Standard Benchmarks'
                  : 'Management Authorization Required: Physical data & standard benchmarks locked'
              }
            >
              {isManagementEmployee ? (
                <>
                  <Unlock className="w-4 h-4 text-slate-950" />
                  <span>Edit Physical & Standard Data</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-rose-400" />
                  <span>Edit Data 🔒 (Management Only)</span>
                </>
              )}
            </button>

            {/* Audit Trail Button */}
            <button
              onClick={() => openAuditModal(selectedEquipment.id)}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs flex items-center space-x-1.5 transition shadow-sm"
              title="See who input parameter data"
            >
              <History className="w-4 h-4 text-cyan-400" />
              <span>Audit Trail: Who Input Data</span>
            </button>
          </div>
        </div>

        {/* Priority Filter Tabs & Policy Notice */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setParamPriorityFilter('All')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                paramPriorityFilter === 'All'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              All Parameters ({(selectedEquipment.parameters || []).length})
            </button>
            <button
              onClick={() => setParamPriorityFilter('High Priority')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                paramPriorityFilter === 'High Priority'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-300" />
              <span>
                High Priority (Shift/Daily){' '}
                (
                {
                  (selectedEquipment.parameters || []).filter(
                    (p) => p.priority === 'High Priority'
                  ).length
                }
                )
              </span>
            </button>
            <button
              onClick={() => setParamPriorityFilter('Less Priority')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 ${
                paramPriorityFilter === 'Less Priority'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>
                Less Priority (Monthly/PM){' '}
                (
                {
                  (selectedEquipment.parameters || []).filter(
                    (p) => p.priority === 'Less Priority'
                  ).length
                }
                )
              </span>
            </button>
          </div>

          <div className="text-xs text-slate-400 flex items-center space-x-2">
            {isManagementEmployee ? (
              <span className="inline-flex items-center text-emerald-400 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Management Calibration & Auditor Privileges Active
              </span>
            ) : (
              <span className="inline-flex items-center text-slate-400">
                <Lock className="w-3.5 h-3.5 mr-1 text-slate-400" /> Standard Benchmarks Locked (Management Only)
              </span>
            )}
          </div>
        </div>

        {/* Parameter List Cards */}
        <div className="space-y-3">
          {(!selectedEquipment.parameters || selectedEquipment.parameters.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
              <Sliders className="w-8 h-8 text-slate-600 mx-auto mb-2" />
              <span>No health parameters defined for this asset yet. Management can calibrate parameters using "Edit Physical & Standard Data".</span>
            </div>
          ) : (
            (selectedEquipment.parameters || [])
              .filter((p) => paramPriorityFilter === 'All' || p.priority === paramPriorityFilter)
              .map((param) => (
                <div
                  key={param.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 flex flex-col xl:flex-row xl:items-center justify-between gap-4 transition hover:border-slate-700"
                >
                  {/* Left Column: Priority Badge, Parameter Name, Benchmark & Measured Value */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase ${
                          param.priority === 'High Priority'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                        }`}
                      >
                        {param.priority}
                      </span>
                      {(() => {
                        const ln = param.name.toLowerCase();
                        const lu = (param.unit || '').toLowerCase();
                        if (ln.includes('voltage') || ln.includes('bus') || lu.includes('v')) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-amber-400" /> Voltage
                            </span>
                          );
                        }
                        if (ln.includes('current') || lu.includes('a')) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 flex items-center gap-1">
                              <Zap className="w-3 h-3 text-yellow-400" /> Current
                            </span>
                          );
                        }
                        if (ln.includes('temp') || lu.includes('°c') || ln.includes('oti') || ln.includes('wti')) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30 flex items-center gap-1">
                              <Thermometer className="w-3 h-3 text-rose-400" /> Temperature
                            </span>
                          );
                        }
                        if (ln.includes('vibration') || lu.includes('mm/s')) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                              <Activity className="w-3 h-3 text-cyan-400" /> Vibration
                            </span>
                          );
                        }
                        if (ln.includes('pressure') || lu.includes('bar')) {
                          return (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1">
                              <Gauge className="w-3 h-3 text-blue-400" /> Pressure
                            </span>
                          );
                        }
                        return null;
                      })()}
                      <span className="font-bold text-sm text-white">{param.name}</span>
                      {param.unit && (
                        <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/40">
                          {param.unit}
                        </span>
                      )}
                    </div>

                    {/* Target / Benchmark (Standard Data) */}
                    <div className="flex items-start space-x-2 text-xs bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                      <span className="font-bold text-amber-400 shrink-0 flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-amber-400" />
                        Target / Benchmark (Standard Data):
                      </span>
                      <span className="text-slate-200 font-mono text-xs">{param.benchmark}</span>
                    </div>

                    {/* Current Measured Value */}
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
                      <span className="text-slate-400">Current Field Reading:</span>
                      <span className="font-mono font-bold text-white text-xs bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                        {param.currentValue}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          param.status === 'healthy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : param.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30 animate-pulse'
                        }`}
                      >
                        {param.status}
                      </span>
                    </div>

                    {param.notes && (
                      <p className="text-xs text-slate-300 italic pt-1">
                        Observation: "{param.notes}"
                      </p>
                    )}
                  </div>

                  {/* Middle Column: Who Inputted This Data (Management Auditor Chip) */}
                  <div className="xl:w-80 shrink-0 p-3 rounded-xl bg-slate-900/90 border border-slate-800 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                      {param.lastUpdatedBy?.name ? param.lastUpdatedBy.name.charAt(0) : 'U'}
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      <div className="text-[10px] uppercase font-semibold text-slate-400 flex items-center justify-between">
                        <span>Inputted By:</span>
                        <span className="font-mono text-cyan-400">{param.lastUpdatedBy?.employeeId || 'ID: —'}</span>
                      </div>
                      <div className="font-bold text-white truncate text-xs">
                        {param.lastUpdatedBy?.name || 'Shift Operator'}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {param.lastUpdatedBy?.designation || 'Field Staff'}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 mt-1 border-t border-slate-800/80">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${
                            param.lastUpdatedBy?.role === 'non_management'
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {param.lastUpdatedBy?.role === 'non_management' ? 'Non-Management Tech' : 'Management'}
                        </span>
                        <span className="font-mono text-slate-400">{param.lastUpdated}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex xl:flex-col items-center justify-end gap-2 shrink-0">
                    {/* Manual Input CTA for this parameter (available to all) */}
                    <button
                      onClick={() => openManualInputModal(selectedEquipment, param)}
                      className="w-full px-3 py-1.5 rounded-lg bg-cyan-600/90 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <PlusCircle className="w-3.5 h-3.5" />
                      <span>Record Reading</span>
                    </button>

                    {/* Audit History CTA */}
                    <button
                      onClick={() => openAuditModal(selectedEquipment.id, param.id)}
                      className="w-full px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition flex items-center justify-center space-x-1"
                      title="View full audit log history of who inputted readings for this parameter"
                    >
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Audit Trail</span>
                    </button>

                    {/* Management edit standard shortcut */}
                    {isManagementEmployee && (
                      <button
                        onClick={() => openEditPhysicalStandardModal(selectedEquipment)}
                        className="w-full px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 text-[10px] font-semibold border border-amber-500/30 transition flex items-center justify-center space-x-1"
                      >
                        <Sliders className="w-3 h-3" />
                        <span>Edit Standard</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
          )}
        </div>
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
