import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  Lock,
  Shield,
  Sliders,
  Cpu,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Settings,
  Layers,
  Wrench,
  Check,
} from 'lucide-react';
import type { EquipmentCategory, ParameterPriority, HealthParameterItem, EquipmentPhysicalData } from '../types';

export const EditPhysicalStandardModal: React.FC = () => {
  const {
    editPhysicalStandardModalOpen,
    closeEditPhysicalStandardModal,
    targetEquipmentForPhysicalEdit,
    updatePhysicalAndStandardData,
  } = useDashboard();

  const { isManagementEmployee, currentUser } = useAuth();

  const equipment = targetEquipmentForPhysicalEdit;

  const [activeSubTab, setActiveSubTab] = useState<'physical' | 'standard'>('physical');

  // Physical Data state
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('VFD');
  const [location, setLocation] = useState('');
  const [manufacturer, setManufacturer] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [installationDate, setInstallationDate] = useState('');
  const [operatingHours, setOperatingHours] = useState<number>(0);
  const [criticality, setCriticality] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('Critical');
  const [mtbfHours, setMtbfHours] = useState<number>(1000);
  const [mttrHours, setMttrHours] = useState<number>(3.0);

  // Physical Specs
  const [applicationArea, setApplicationArea] = useState('');
  const [voltageRating, setVoltageRating] = useState('');
  const [powerRating, setPowerRating] = useState('');
  const [ratedSpeed, setRatedSpeed] = useState('');
  const [coolingType, setCoolingType] = useState('');
  const [enclosureClass, setEnclosureClass] = useState('');

  // Standard Parameters state
  const [parameters, setParameters] = useState<HealthParameterItem[]>([]);
  const [newParamName, setNewParamName] = useState('');
  const [newParamPriority, setNewParamPriority] = useState<ParameterPriority>('High Priority');
  const [newParamBenchmark, setNewParamBenchmark] = useState('');
  const [newParamUnit, setNewParamUnit] = useState('');

  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!equipment) return;

    setName(equipment.name);
    setTag(equipment.tag);
    setCategory(equipment.category);
    setLocation(equipment.location);
    setManufacturer(equipment.manufacturer);
    setModel(equipment.model);
    setSerialNumber(equipment.serialNumber);
    setInstallationDate(equipment.installationDate);
    setOperatingHours(equipment.operatingHours);
    setCriticality(equipment.criticality);
    setMtbfHours(equipment.mtbfHours);
    setMttrHours(equipment.mttrHours);

    // Specs
    setApplicationArea(equipment.physicalData?.applicationArea || '');
    setVoltageRating(equipment.physicalData?.voltageRating || '');
    setPowerRating(equipment.physicalData?.powerRating || '');
    setRatedSpeed(equipment.physicalData?.ratedSpeed || '');
    setCoolingType(equipment.physicalData?.coolingType || '');
    setEnclosureClass(equipment.physicalData?.enclosureClass || '');

    // Parameters clone
    setParameters(JSON.parse(JSON.stringify(equipment.parameters || [])));
    setFeedbackMsg(null);
  }, [equipment, editPhysicalStandardModalOpen]);

  if (!editPhysicalStandardModalOpen || !equipment) return null;

  // Security Check: If not a management employee, render restricted dialog
  if (!isManagementEmployee) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
        <div className="relative w-full max-w-md bg-slate-900 border border-rose-500/40 rounded-2xl p-6 shadow-2xl space-y-4 text-center animate-in fade-in zoom-in-95">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Management Access Restricted</h3>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed">
              Only <strong>Management Employees</strong> (Plant Reliability Director, Maintenance Managers, and Junior Supervisors)
              are authorized to edit physical equipment data and calibrate standard baseline parameters.
            </p>
            <div className="mt-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-left text-xs text-slate-400 space-y-1">
              <div>Your Account: <span className="text-white font-medium">{currentUser?.name}</span></div>
              <div>Your Role: <span className="text-amber-400 font-bold uppercase">{currentUser?.role}</span></div>
              <div>Authorized Capability: <span className="text-emerald-400">Manual Parameter Inspection & Work Order Logging</span></div>
            </div>
          </div>

          <button
            onClick={closeEditPhysicalStandardModal}
            className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition"
          >
            Acknowledge & Close
          </button>
        </div>
      </div>
    );
  }

  const handleUpdateParameterBenchmark = (id: string, benchmark: string) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, benchmark } : p))
    );
  };

  const handleUpdateParameterPriority = (id: string, priority: ParameterPriority) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, priority } : p))
    );
  };

  const handleUpdateParameterUnit = (id: string, unit: string) => {
    setParameters((prev) =>
      prev.map((p) => (p.id === id ? { ...p, unit } : p))
    );
  };

  const handleAddParameter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newParamName.trim() || !newParamBenchmark.trim()) return;

    const newParam: HealthParameterItem = {
      id: `param-cust-${Date.now().toString().slice(-5)}`,
      name: newParamName.trim(),
      priority: newParamPriority,
      benchmark: newParamBenchmark.trim(),
      currentValue: 'Nominal baseline (Awaiting shift check)',
      unit: newParamUnit.trim() || undefined,
      status: 'healthy',
      lastUpdated: new Date().toISOString().replace('T', ' ').slice(0, 16),
      lastUpdatedBy: {
        id: currentUser!.id,
        employeeId: currentUser!.employeeId,
        name: currentUser!.name,
        role: currentUser!.role,
        designation: currentUser!.designation,
      },
      inputLogs: [],
    };

    setParameters((prev) => [...prev, newParam]);
    setNewParamName('');
    setNewParamBenchmark('');
    setNewParamUnit('');
  };

  const handleRemoveParameter = (id: string) => {
    setParameters((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    const physicalUpdates = {
      name,
      tag,
      category,
      location,
      manufacturer,
      model,
      serialNumber,
      installationDate,
      operatingHours: Number(operatingHours),
      criticality,
      mtbfHours: Number(mtbfHours),
      mttrHours: Number(mttrHours),
      physicalData: {
        ...equipment.physicalData,
        applicationArea,
        voltageRating,
        powerRating,
        ratedSpeed,
        coolingType,
        enclosureClass,
      },
    };

    const res = updatePhysicalAndStandardData(equipment.id, physicalUpdates, parameters);

    if (res.success) {
      setFeedbackMsg({
        type: 'success',
        text: 'Physical asset data and standard benchmarks successfully calibrated by Management!',
      });
      setTimeout(() => {
        closeEditPhysicalStandardModal();
      }, 1000);
    } else {
      setFeedbackMsg({
        type: 'error',
        text: res.error || 'Failed to update physical/standard data.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800/80">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Edit Physical Data & Standard Benchmarks</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  Management Authorization Required
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {equipment.name} <span className="font-mono text-cyan-300">({equipment.tag})</span>
              </p>
            </div>
          </div>

          <button
            onClick={closeEditPhysicalStandardModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Management Auditor Chip */}
        <div className="px-6 py-2 bg-slate-950/40 border-b border-slate-800/60 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>
              Authorized Manager:{' '}
              <strong className="text-white">{currentUser?.name}</strong>{' '}
              <span className="text-slate-400">({currentUser?.designation})</span>
            </span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {currentUser?.role?.toUpperCase()} ACCESS
          </span>
        </div>

        {/* Tab Selection */}
        <div className="px-6 pt-3 pb-1 flex border-b border-slate-800/80 space-x-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('physical')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeSubTab === 'physical'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>1. Physical Asset Data & Specifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('standard')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center space-x-2 transition ${
              activeSubTab === 'standard'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>2. Standard Target & Benchmark Calibration ({parameters.length})</span>
          </button>
        </div>

        {feedbackMsg && (
          <div
            className={`mx-6 mt-4 p-3 rounded-xl text-xs flex items-center space-x-2 animate-in fade-in ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-300'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        <form onSubmit={handleSaveAll} className="p-6 space-y-5">
          {/* TAB 1: PHYSICAL DATA */}
          {activeSubTab === 'physical' && (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                Physical metadata describes the machine name, tag, location, ratings, operating hours, and plant application.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Equipment Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Equipment Tag</label>
                  <input
                    type="text"
                    required
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Equipment Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="VFD">Variable Frequency Drive (VFD)</option>
                    <option value="DC Drive">DC Drive (Thyristor / SCR)</option>
                    <option value="DC Motor">DC Motor (Main Mill Stands)</option>
                    <option value="Induction Motor">Induction Motor (AC Motor)</option>
                    <option value="Transformer">Power & Converter Transformer</option>
                    <option value="Mill Field Sensor">Mill Field Sensor (HMD / Loop)</option>
                    <option value="PLC & Automation">PLC & Automation System</option>
                    <option value="Pump">Centrifugal Pump</option>
                    <option value="CNC">CNC Milling Center</option>
                    <option value="Compressor">Rotary Screw Compressor</option>
                    <option value="Motor">Motor General</option>
                    <option value="Conveyor">Belt Conveyor</option>
                    <option value="Hydraulic">Hydraulic Press</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Plant Location / Drive Bay</label>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Manufacturer OEM</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Model Designation</label>
                  <input
                    type="text"
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Serial Number</label>
                  <input
                    type="text"
                    value={serialNumber}
                    onChange={(e) => setSerialNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Commissioning / Install Date</label>
                  <input
                    type="date"
                    value={installationDate}
                    onChange={(e) => setInstallationDate(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Total Operating Runtime (Hours)</label>
                  <input
                    type="number"
                    value={operatingHours}
                    onChange={(e) => setOperatingHours(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Criticality Rating</label>
                  <select
                    value={criticality}
                    onChange={(e) => setCriticality(e.target.value as any)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="Critical">Critical (Immediate Line Stop Hazard)</option>
                    <option value="High">High (Redundant Standby Available)</option>
                    <option value="Medium">Medium (Auxiliary Process)</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>

              {/* Physical Specifications & Plant Application */}
              <div className="pt-2 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Physical Engineering Ratings & Application Details
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Mill Application Area / Process Duty</label>
                  <textarea
                    rows={2}
                    value={applicationArea}
                    onChange={(e) => setApplicationArea(e.target.value)}
                    placeholder="e.g. Used in Pinch Rolls, Flying Shears, Finishing Block, Cooling Bed Roller Tables..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Voltage Rating</label>
                    <input
                      type="text"
                      placeholder="e.g., 400–480V AC / 680V DC"
                      value={voltageRating}
                      onChange={(e) => setVoltageRating(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Power Rating</label>
                    <input
                      type="text"
                      placeholder="e.g., 630 kW (850 HP)"
                      value={powerRating}
                      onChange={(e) => setPowerRating(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Cooling Mechanism</label>
                    <input
                      type="text"
                      placeholder="e.g., Forced Air & Heat Pipe"
                      value={coolingType}
                      onChange={(e) => setCoolingType(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: STANDARD BENCHMARKS DATA */}
          {activeSubTab === 'standard' && (
            <div className="space-y-4 max-h-[55vh] overflow-y-auto pr-1">
              <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-400">
                Standard benchmarks define target operational limits, baseline safety thresholds, and priority classifications.
                Only Management can edit these benchmarks to prevent unauthorized baseline alterations.
              </div>

              {/* List of current parameters */}
              <div className="space-y-3">
                {parameters.map((param, index) => (
                  <div
                    key={param.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3 transition hover:border-slate-700"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold flex items-center justify-center">
                          {index + 1}
                        </span>
                        <span className="font-bold text-xs text-white">{param.name}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {/* Priority Level Select */}
                        <select
                          value={param.priority}
                          onChange={(e) => handleUpdateParameterPriority(param.id, e.target.value as ParameterPriority)}
                          className={`text-[10px] font-bold rounded-lg px-2 py-1 border focus:outline-none ${
                            param.priority === 'High Priority'
                              ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                              : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          }`}
                        >
                          <option value="High Priority">High Priority (Shift/Daily)</option>
                          <option value="Less Priority">Less Priority (Monthly/PM)</option>
                        </select>

                        {/* Delete parameter button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveParameter(param.id)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition"
                          title="Remove Parameter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Benchmark text */}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                        Target / Benchmark Specification (Standard Data)
                      </label>
                      <input
                        type="text"
                        value={param.benchmark}
                        onChange={(e) => handleUpdateParameterBenchmark(param.id, e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>
                        Current Field Reading: <strong className="text-slate-200">{param.currentValue}</strong>
                      </span>
                      <span>
                        Status: <strong className="text-emerald-400 uppercase">{param.status}</strong>
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add New Standard Parameter Form */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center space-x-1.5">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add New Standard Parameter Benchmark</span>
                </h4>

                <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Parameter Name</label>
                      <input
                        type="text"
                        placeholder="e.g. Excitation Field Current Balance"
                        value={newParamName}
                        onChange={(e) => setNewParamName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">Priority</label>
                      <select
                        value={newParamPriority}
                        onChange={(e) => setNewParamPriority(e.target.value as ParameterPriority)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      >
                        <option value="High Priority">High Priority</option>
                        <option value="Less Priority">Less Priority</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">Target / Benchmark Rule</label>
                    <input
                      type="text"
                      placeholder="e.g. Stable ~120A DC; Ripple less than 1.5A"
                      value={newParamBenchmark}
                      onChange={(e) => setNewParamBenchmark(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddParameter}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Include Parameter in Standard</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Footer Save Buttons */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              Only Management changes will calibrate fleet telemetry targets.
            </div>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={closeEditPhysicalStandardModal}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
              >
                <Save className="w-4 h-4" />
                <span>Save Physical & Standard Data</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
