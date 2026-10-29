import React, { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Wrench,
  ChevronRight,
  TrendingUp,
  Cpu,
  ArrowUpRight,
  Calendar,
  PlusCircle,
  FileCheck2,
  Image as ImageIcon,
  Zap,
  History,
  Search,
  User,
  Filter,
} from 'lucide-react';
import type { HealthStatus } from '../types';

export const OverviewTab: React.FC = () => {
  const {
    equipmentList,
    equipmentRequests,
    maintenanceRecords,
    alerts,
    stats,
    parameterInputLogs,
    openAuditModal,
    setActiveTab,
    setSelectedEquipmentId,
    startTroubleshootForEquipment,
    openCreateWorkOrder,
    openAddEquipmentModal,
    openEquipmentRequestModal,
    acknowledgeAlert,
    openManualInputModal,
  } = useDashboard();

  const { isManager, isAdmin } = useAuth();

  const [auditFilter, setAuditFilter] = useState<'all' | 'alerts' | 'shiftA' | 'shiftBC'>('all');
  const [auditSearch, setAuditSearch] = useState('');

  const filteredOverviewLogs = useMemo(() => {
    return (parameterInputLogs || []).filter((log) => {
      if (auditFilter === 'alerts' && log.status === 'healthy') return false;
      if (auditFilter === 'shiftA' && log.shift !== 'Shift A (Morning)') return false;
      if (auditFilter === 'shiftBC' && log.shift === 'Shift A (Morning)') return false;

      if (auditSearch.trim()) {
        const q = auditSearch.toLowerCase();
        return (
          log.parameterName.toLowerCase().includes(q) ||
          log.equipmentName.toLowerCase().includes(q) ||
          log.inputBy?.name.toLowerCase().includes(q) ||
          log.value.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [parameterInputLogs, auditFilter, auditSearch]);

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-[0_0_8px_rgba(16,185,129,0.15)]">
            <span className="relative flex h-2 w-2 mr-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            Operational
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-amber-400 animate-pulse"></span>
            Warning
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/15 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)] animate-pulse">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-rose-400"></span>
            Critical Fault
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <span className="w-2 h-2 mr-1.5 rounded-full bg-blue-400"></span>
            Under Service
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Offline
          </span>
        );
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400 stroke-emerald-400';
    if (score >= 60) return 'text-amber-400 stroke-amber-400';
    return 'text-rose-400 stroke-rose-400';
  };

  const getHealthScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 shadow-[0_0_10px_rgba(16,185,129,0.15)]';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/30 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.15)]';
    return 'bg-rose-500/15 border-rose-500/40 text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.25)]';
  };

  const activeWorkOrdersCount = maintenanceRecords.filter(
    (r) => r.status === 'In Progress' || r.status === 'Pending Parts' || r.status === 'Scheduled'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Plant KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Availability KPI */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Plant Operational Availability
            </span>
            <div className="p-2.5 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_12px_rgba(6,182,212,0.15)] group-hover:scale-105 transition">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
              {stats.operationalAvailability}%
            </span>
            <span className="text-[11px] font-semibold text-emerald-300 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center">
              <TrendingUp className="w-3 h-3 mr-1 inline" /> 95% Target
            </span>
          </div>
          <div className="mt-3.5 w-full bg-slate-950/80 rounded-full h-2 p-0.5 border border-slate-800 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 h-full rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(6,182,212,0.4)]"
              style={{ width: `${Math.min(100, stats.operationalAvailability)}%` }}
            ></div>
          </div>
        </div>

        {/* Equipment Status Summary */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Fleet Health Status
            </span>
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-[0_0_12px_rgba(59,130,246,0.15)] group-hover:scale-105 transition">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-center justify-between">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]"></span>
              <span className="text-base font-bold text-slate-100 font-mono">{stats.healthyCount}</span>
              <span className="text-[10px] text-slate-400">Nominal</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]"></span>
              <span className="text-base font-bold text-slate-100 font-mono">{stats.warningCount}</span>
              <span className="text-[10px] text-slate-400">Warn</span>
            </div>
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)] animate-pulse"></span>
              <span className="text-base font-bold text-slate-100 font-mono">{stats.criticalCount}</span>
              <span className="text-[10px] text-slate-400">Crit</span>
            </div>
          </div>
          <p className="mt-3 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Active Machinery Units:</span>
            <span className="text-slate-200 font-mono font-semibold">{stats.totalEquipment} Online</span>
          </p>
        </div>

        {/* Reliability MTBF / MTTR */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Reliability Metrics
            </span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-[0_0_12px_rgba(99,102,241,0.15)] group-hover:scale-105 transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 grid grid-cols-2 gap-2">
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Plant MTBF</span>
              <span className="text-2xl font-extrabold text-white font-mono">{stats.plantMTBF}h</span>
            </div>
            <div className="p-2 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 block font-medium">Plant MTTR</span>
              <span className="text-2xl font-extrabold text-cyan-300 font-mono">{stats.plantMTTR}h</span>
            </div>
          </div>
          <p className="mt-2.5 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Downtime this month:</span>
            <span className="text-slate-200 font-mono font-semibold">{stats.totalDowntimeThisMonth}h</span>
          </p>
        </div>

        {/* Work Orders in Queue */}
        <div className="glass-panel rounded-2xl p-5 shadow-xl relative overflow-hidden group hover:border-slate-700/80 transition-all duration-300">
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Maintenance Register
            </span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20 shadow-[0_0_12px_rgba(168,85,247,0.15)] group-hover:scale-105 transition">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3.5 flex items-baseline justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold text-white font-mono tracking-tight">
                {activeWorkOrdersCount}
              </span>
              <span className="text-xs font-medium text-slate-400">Active Orders</span>
            </div>
            <button
              onClick={() => setActiveTab('register')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center font-semibold bg-cyan-950/60 border border-cyan-800/40 px-2.5 py-1 rounded-xl transition"
            >
              Open Log <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span>YTD Total Spend:</span>
            <strong className="text-slate-200 font-mono">${stats.totalMaintenanceCostYTD.toLocaleString()}</strong>
          </div>
        </div>
      </div>

      {/* Main Grid: Equipment Fleet Matrix & Real-time Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Fleet Cards (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          {/* Pending Approval Requests Banner for Managers */}
          {(isManager || isAdmin) && equipmentRequests.filter((r) => r.status === 'Pending').length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/30 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center space-x-2">
                <FileCheck2 className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  <strong>Approval Notice:</strong> You have{' '}
                  <strong className="text-amber-300 font-mono">
                    {equipmentRequests.filter((r) => r.status === 'Pending').length}
                  </strong>{' '}
                  equipment addition/deletion requests awaiting Manager review.
                </span>
              </div>
              <button
                onClick={openEquipmentRequestModal}
                className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-[11px] transition shrink-0 ml-2"
              >
                Open Queue
              </button>
            </div>
          )}

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-white flex items-center space-x-2">
                <span>Monitored Machinery Fleet</span>
                <span className="text-xs font-normal text-slate-400 font-mono">
                  ({equipmentList.length} Active Units)
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Click any asset to drill down into high-frequency telemetry, diagnostic history, or log maintenance.
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={openAddEquipmentModal}
                className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-cyan-600/20"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Add Machinery</span>
              </button>
              <button
                onClick={() => setActiveTab('health')}
                className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center px-2 py-1.5"
              >
                Detailed View <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {equipmentList.map((eq) => {
              const scoreBg = getHealthScoreBg(eq.healthScore);
              return (
                <div
                  key={eq.id}
                  className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-800/80 hover:border-slate-700/80 flex flex-col justify-between group transition-all duration-300 relative overflow-hidden"
                >
                  <div>
                    {/* Header: Picture Thumbnail, Name, Tag, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3.5">
                        {/* Equipment Thumbnail Image */}
                        <div className="w-14 h-14 rounded-2xl bg-slate-950 border border-slate-800/90 overflow-hidden shrink-0 shadow-inner ring-1 ring-white/10 group-hover:ring-cyan-500/40 transition">
                          {eq.imageUrl ? (
                            <img
                              src={eq.imageUrl}
                              alt={eq.name}
                              className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon className="w-6 h-6" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-bold text-cyan-300 bg-cyan-950/70 px-2.5 py-0.5 rounded-lg border border-cyan-800/50 shadow-sm">
                              {eq.tag}
                            </span>
                            <span className="text-xs font-medium text-slate-400">{eq.category}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                            {eq.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-1">{eq.location}</p>
                        </div>
                      </div>

                      {/* Health Score Pill */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className={`px-2.5 py-1 rounded-xl border font-mono text-xs font-bold ${scoreBg}`}>
                          {eq.healthScore}%
                        </div>
                        <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">Health</span>
                      </div>
                    </div>

                    {/* Sensor Badges / Key Telemetry (Safely rendered with Voltage, Current, Vibration, or Temp) */}
                    <div className="mt-4 grid grid-cols-2 gap-2.5 text-xs">
                      {/* Telemetry Channel 1: Voltage or Vibration */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 group-hover:border-slate-700/80 transition">
                        <span className="text-[10px] uppercase text-slate-400 block font-semibold tracking-wider flex items-center gap-1">
                          {eq.telemetry.voltage ? (
                            <><Zap className="w-3 h-3 text-amber-400" /> Voltage</>
                          ) : (
                            <><Activity className="w-3 h-3 text-cyan-400" /> Vibration</>
                          )}
                        </span>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span
                            className={`font-mono text-sm font-bold ${
                              eq.telemetry.voltage
                                ? eq.telemetry.voltage.value >= eq.telemetry.voltage.criticalThreshold
                                  ? 'text-rose-400'
                                  : eq.telemetry.voltage.value >= eq.telemetry.voltage.warningThreshold
                                  ? 'text-amber-400'
                                  : 'text-slate-100'
                                : eq.telemetry.vibration && eq.telemetry.vibration.value >= eq.telemetry.vibration.criticalThreshold
                                ? 'text-rose-400'
                                : eq.telemetry.vibration && eq.telemetry.vibration.value >= eq.telemetry.vibration.warningThreshold
                                ? 'text-amber-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {eq.telemetry.voltage?.value ?? eq.telemetry.vibration?.value ?? 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {eq.telemetry.voltage?.unit ?? eq.telemetry.vibration?.unit ?? ''}
                          </span>
                        </div>
                      </div>

                      {/* Telemetry Channel 2: Current or Temperature */}
                      <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 group-hover:border-slate-700/80 transition">
                        <span className="text-[10px] uppercase text-slate-400 block font-semibold tracking-wider flex items-center gap-1">
                          {eq.telemetry.current ? (
                            <><Zap className="w-3 h-3 text-yellow-400" /> Current</>
                          ) : (
                            <>Temperature</>
                          )}
                        </span>
                        <div className="flex items-baseline space-x-1.5 mt-1">
                          <span
                            className={`font-mono text-sm font-bold ${
                              eq.telemetry.current
                                ? eq.telemetry.current.value >= eq.telemetry.current.criticalThreshold
                                  ? 'text-rose-400'
                                  : eq.telemetry.current.value >= eq.telemetry.current.warningThreshold
                                  ? 'text-amber-400'
                                  : 'text-slate-100'
                                : eq.telemetry.temperature && eq.telemetry.temperature.value >= eq.telemetry.temperature.criticalThreshold
                                ? 'text-rose-400'
                                : eq.telemetry.temperature && eq.telemetry.temperature.value >= eq.telemetry.temperature.warningThreshold
                                ? 'text-amber-400'
                                : 'text-slate-100'
                            }`}
                          >
                            {eq.telemetry.current?.value ?? eq.telemetry.temperature?.value ?? 'N/A'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {eq.telemetry.current?.unit ?? eq.telemetry.temperature?.unit ?? ''}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Latest Manual Parameter Inspection Strip */}
                    {(() => {
                      const latestLog = (parameterInputLogs || []).find((l) => l.equipmentId === eq.id);
                      if (latestLog) {
                        return (
                          <div className="mt-3 p-2.5 rounded-xl bg-slate-950/90 border border-slate-800 text-xs space-y-1">
                            <div className="flex items-center justify-between gap-1.5">
                              <span className="text-[11px] font-bold text-slate-200 truncate flex items-center gap-1.5">
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    latestLog.status === 'healthy'
                                      ? 'bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.5)]'
                                      : latestLog.status === 'warning'
                                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(245,158,11,0.5)]'
                                      : 'bg-rose-400 shadow-[0_0_6px_rgba(244,63,94,0.5)] animate-pulse'
                                  }`}
                                ></span>
                                <span className="truncate">{latestLog.parameterName}</span>
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                                  latestLog.status === 'healthy'
                                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                                    : latestLog.status === 'warning'
                                    ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
                                }`}
                              >
                                {latestLog.status}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                              <span className="font-mono font-bold text-cyan-300 truncate">
                                {latestLog.value}
                              </span>
                              <span className="text-[10px] text-slate-400 shrink-0 ml-1">
                                by <strong className="text-slate-300">{latestLog.inputBy?.name?.split(' ')[0] || 'Staff'}</strong> ({latestLog.timestamp.slice(-5)})
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return (
                        <div className="mt-3 p-2 rounded-xl bg-slate-950/40 border border-slate-800/60 text-[11px] flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1.5 text-[10px]">
                            <Clock className="w-3 h-3 text-slate-600" /> Standard benchmark targets active
                          </span>
                          <button
                            onClick={() => openManualInputModal(eq)}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 font-semibold"
                          >
                            + Log Reading
                          </button>
                        </div>
                      );
                    })()}

                    <div className="mt-3 flex items-center justify-between text-xs">
                      {getStatusBadge(eq.status)}
                      <span className="text-[11px] text-slate-400 font-mono flex items-center">
                        <Clock className="w-3 h-3 mr-1 text-slate-500" />
                        {eq.operatingHours.toLocaleString()} hrs logged
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3.5 border-t border-slate-800/80 flex items-center justify-between space-x-1.5">
                    <button
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        setActiveTab('health');
                      }}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold text-center transition shadow-sm"
                    >
                      Health View
                    </button>
                    <button
                      onClick={() => openManualInputModal(eq)}
                      title="Quick Manual Parameter Input"
                      className="py-1.5 px-2 rounded-xl bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-bold text-center transition shadow-sm"
                    >
                      + Param
                    </button>
                    <button
                      onClick={() => startTroubleshootForEquipment(eq.id)}
                      className="flex-1 py-1.5 px-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold text-center transition shadow-sm"
                    >
                      Diagnose
                    </button>
                    <button
                      onClick={() => openCreateWorkOrder({ equipmentId: eq.id, equipmentName: eq.name })}
                      title="Log Maintenance Work Order"
                      className="p-1.5 rounded-xl bg-slate-800/90 hover:bg-cyan-600 hover:text-white text-slate-300 transition shadow-sm"
                    >
                      <Wrench className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: Real-time Alarms & Upcoming Schedule */}
        <div className="space-y-6">
          {/* Active Alarms Card */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
                  <AlertTriangle className="w-4 h-4 animate-pulse" />
                </div>
                <h3 className="text-sm font-bold text-white">Active Alarm Stream</h3>
              </div>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-300 shadow-sm">
                {alerts.length} Total
              </span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-slate-950/40 border border-slate-800/60">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2.5 shadow-[0_0_12px_rgba(16,185,129,0.3)]" />
                  <p className="font-semibold text-slate-300">All Systems Nominal</p>
                  <p className="text-[11px] text-slate-400 mt-1">Telemetry parameters within safe operating thresholds.</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-xl border text-xs transition duration-200 ${
                      alert.severity === 'critical'
                        ? 'bg-rose-950/30 border-rose-800/50 text-rose-200 border-l-4 border-l-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.1)]'
                        : 'bg-amber-950/30 border-amber-800/50 text-amber-200 border-l-4 border-l-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.1)]'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <span
                          className={`px-2 py-0.5 rounded-lg font-mono text-[10px] font-extrabold ${
                            alert.severity === 'critical'
                              ? 'bg-rose-900/80 text-rose-200 border border-rose-700/60'
                              : 'bg-amber-900/80 text-amber-200 border border-amber-700/60'
                          }`}
                        >
                          {alert.code}
                        </span>
                        <span className="text-[12px] font-bold text-slate-100 line-clamp-1">
                          {alert.equipmentName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono whitespace-nowrap ml-1">{alert.timestamp}</span>
                    </div>

                    <p className="mt-1.5 text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>

                    <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-slate-800/60">
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-[11px] font-semibold text-slate-400 hover:text-slate-100 transition underline underline-offset-2"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-300 font-medium flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Acknowledged
                        </span>
                      )}

                      <button
                        onClick={() => startTroubleshootForEquipment(alert.equipmentId, alert.code)}
                        className="px-2.5 py-1 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-700/60 text-cyan-300 font-bold text-[10px] flex items-center transition shadow-sm"
                      >
                        Troubleshoot Guide <ChevronRight className="w-3 h-3 ml-0.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Upcoming Maintenance Services Card */}
          <div className="glass-panel rounded-2xl p-5 shadow-xl space-y-4 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/50 to-transparent"></div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_10px_rgba(6,182,212,0.15)]">
                  <Calendar className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-white">Preventive Maintenance Schedule</h3>
              </div>
              <button
                onClick={() => setActiveTab('register')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold px-2 py-0.5 rounded-lg hover:bg-cyan-950/50 transition"
              >
                All
              </button>
            </div>

            <div className="space-y-2.5">
              {equipmentList.slice(0, 4).map((eq) => (
                <div
                  key={eq.id}
                  className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 flex items-center justify-between text-xs transition duration-200"
                >
                  <div className="space-y-1">
                    <span className="font-bold text-slate-200 block line-clamp-1">{eq.name}</span>
                    <span className="text-[10px] text-slate-400 flex items-center">
                      <Clock className="w-3 h-3 mr-1 text-cyan-400" />
                      Next Due: <strong className="text-cyan-300 font-mono ml-1">{eq.nextScheduledService}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      openCreateWorkOrder({
                        equipmentId: eq.id,
                        equipmentName: eq.name,
                        title: `Scheduled Preventive Service for ${eq.name}`,
                        type: 'Preventive',
                        priority: 'Medium',
                      })
                    }
                    className="p-2 rounded-xl bg-slate-800/90 hover:bg-cyan-600 text-slate-300 hover:text-white transition shadow-sm"
                    title="Schedule / Create Work Order"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Live Parameter Inspections & Operator Updates Stream (All Employees) */}
      <div className="glass-panel rounded-2xl p-6 shadow-xl space-y-5 border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-500/60 to-transparent"></div>

        {/* Section Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start space-x-3.5">
            <div className="p-3 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.15)] shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2.5">
                <h3 className="text-base font-bold text-white">Live Parameter Inspections & Condition Updates</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  Real-time Feed (All Staff)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Audited timeline of manual observations, shift walk-down readings, and calibrations submitted across the fleet.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => openAuditModal()}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:border-slate-600 text-xs font-semibold flex items-center space-x-1.5 transition shadow-sm"
              title="Open full verifiable audit trail and export CSV report"
            >
              <FileCheck2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Full Audit Trail & CSV</span>
            </button>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setAuditFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                auditFilter === 'all'
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              All Readings ({(parameterInputLogs || []).length})
            </button>
            <button
              onClick={() => setAuditFilter('alerts')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center space-x-1 transition ${
                auditFilter === 'alerts'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-sm shadow-amber-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <AlertTriangle className="w-3 h-3" />
              <span>Warnings & Faults ({(parameterInputLogs || []).filter((l) => l.status !== 'healthy').length})</span>
            </button>
            <button
              onClick={() => setAuditFilter('shiftA')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                auditFilter === 'shiftA'
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Shift A (Morning)
            </button>
            <button
              onClick={() => setAuditFilter('shiftBC')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                auditFilter === 'shiftBC'
                  ? 'bg-cyan-500 text-white shadow-sm shadow-cyan-500/20'
                  : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              Evening / Night Shift
            </button>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by tech, machine, or value..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Live Logs Stream */}
        <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
          {filteredOverviewLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs rounded-xl bg-slate-950/40 border border-slate-800/60">
              <CheckCircle2 className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No logs found matching your filter.</p>
              <p className="text-[11px] text-slate-500 mt-1">Manual parameter entries recorded by any staff will appear here instantly.</p>
            </div>
          ) : (
            filteredOverviewLogs.slice(0, 15).map((log) => {
              const isMgmt = log.inputBy?.role === 'manager' || log.inputBy?.role === 'admin' || log.inputBy?.role === 'management';
              return (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700/80 transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  {/* Left: Employee Info & Timestamp */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <div className="w-8 h-8 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center font-bold text-white text-xs">
                      {log.inputBy?.name ? log.inputBy.name.slice(0, 2).toUpperCase() : 'OP'}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <strong className="text-white font-medium">{log.inputBy?.name || 'Technician'}</strong>
                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase ${
                            isMgmt
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                          }`}
                        >
                          {isMgmt ? 'Management' : 'Field Tech'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 flex items-center space-x-1 mt-0.5">
                        <span>{log.inputBy?.designation}</span>
                        <span>•</span>
                        <span className="font-mono text-cyan-400">{log.shift || 'General Shift'}</span>
                        <span>•</span>
                        <span className="font-mono text-slate-400">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Equipment & Parameter Reading */}
                  <div className="flex-1 px-0 md:px-4 space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-200">{log.equipmentName}</span>
                      <span className="font-mono text-[10px] text-slate-400">({log.equipmentId})</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-slate-400 font-semibold">{log.parameterName}:</span>
                      <span className="font-mono font-bold text-cyan-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        {log.value}
                      </span>
                      {log.notes && (
                        <span className="text-[11px] text-slate-400 italic line-clamp-1">
                          "{log.notes}"
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Condition Status Badge & Audit Button */}
                  <div className="flex items-center space-x-3 shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase flex items-center space-x-1 ${
                        log.status === 'healthy'
                          ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                          : log.status === 'warning'
                          ? 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                          : 'bg-rose-500/10 text-rose-300 border border-rose-500/30 animate-pulse'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1 ${
                          log.status === 'healthy' ? 'bg-emerald-400' : log.status === 'warning' ? 'bg-amber-400' : 'bg-rose-400'
                        }`}
                      ></span>
                      {log.status === 'healthy' ? 'Normal' : log.status}
                    </span>

                    <button
                      onClick={() => openAuditModal(log.equipmentId, log.parameterId)}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold transition"
                    >
                      Audit
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
