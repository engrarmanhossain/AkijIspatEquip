import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
  Flame,
  X,
  AlertTriangle,
  RotateCcw,
  Zap,
  Activity,
  Thermometer,
  Gauge,
  CheckCircle2,
} from 'lucide-react';

export const FaultInjectorModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const { equipmentList, injectFault, resetEquipmentToNominal, setActiveTab, setSelectedEquipmentId } = useDashboard();
  const [targetId, setTargetId] = useState<string>(equipmentList[0].id);
  const [lastInjected, setLastInjected] = useState<string | null>(null);

  if (!isOpen) return null;

  const targetEquipment = equipmentList.find((e) => e.id === targetId) || equipmentList[0];

  const handleInject = (
    faultType: 'bearing_vibration' | 'thermal_runaway' | 'pressure_drop' | 'motor_overload',
    label: string
  ) => {
    injectFault(targetId, faultType);
    setLastInjected(`${label} on ${targetEquipment.name}`);
    setTimeout(() => {
      setLastInjected(null);
    }, 4000);
  };

  const handleReset = () => {
    resetEquipmentToNominal(targetId);
    setLastInjected(`Restored ${targetEquipment.name} to nominal safe baseline.`);
    setTimeout(() => {
      setLastInjected(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden space-y-4">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
              <Flame className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Industrial Fault Injection Simulator</h3>
              <p className="text-xs text-slate-400">
                Stress-test telemetry triggers, alarm workflows, and health score recalculation.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Machine Target Picker */}
          <div>
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
              Target Machinery Asset
            </label>
            <select
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-semibold focus:border-cyan-500 focus:outline-none"
            >
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  [{eq.tag}] {eq.name} — Status: {eq.status.toUpperCase()} ({eq.healthScore}%)
                </option>
              ))}
            </select>
          </div>

          {/* Feedback banner */}
          {lastInjected && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-300 text-xs flex items-center space-x-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{lastInjected}</span>
            </div>
          )}

          {/* Fault Scenario Triggers */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
              Choose Failure Simulation Scenario
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Scenario 1: Bearing Cavitation */}
              <button
                onClick={() => handleInject('bearing_vibration', 'High Bearing Vibration Spike')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-cyan-500/50 hover:bg-slate-800/40 text-left transition group space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-200">Bearing Cavitation</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Surges RMS radial vibration past critical threshold (7.5+ mm/s).
                </p>
              </button>

              {/* Scenario 2: Thermal Runaway */}
              <button
                onClick={() => handleInject('thermal_runaway', 'Thermal Overheat Runaway')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-rose-500/50 hover:bg-slate-800/40 text-left transition group space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <Thermometer className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-200">Thermal Overheat</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Forces core temperature above 105°C trip point triggering emergency alert.
                </p>
              </button>

              {/* Scenario 3: Pressure Drop */}
              <button
                onClick={() => handleInject('pressure_drop', 'Discharge Pressure Collapse')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-500/50 hover:bg-slate-800/40 text-left transition group space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <Gauge className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-200">Pressure Collapse</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Drops line hydraulic or pneumatic pressure below safety cutoff.
                </p>
              </button>

              {/* Scenario 4: Motor Overload */}
              <button
                onClick={() => handleInject('motor_overload', 'Motor Overcurrent Jam')}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:bg-slate-800/40 text-left transition group space-y-1.5"
              >
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                  <span className="text-xs font-bold text-slate-200">Drive Motor Surge</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-snug">
                  Spikes electric motor load / amperage past full-load thermal limit.
                </p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handleReset}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span>Reset Target Baseline</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setSelectedEquipmentId(targetId);
                setActiveTab('health');
                onClose();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-cyan-400 hover:text-cyan-300 transition"
            >
              Inspect Telemetry
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-white transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
