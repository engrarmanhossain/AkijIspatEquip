import React from 'react';
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
  Layers,
  Zap,
  ArrowUpRight,
  Calendar,
  PlusCircle,
  FileCheck2,
  Image as ImageIcon,
} from 'lucide-react';
import type { HealthStatus } from '../types';

export const OverviewTab: React.FC = () => {
  const {
    equipmentList,
    equipmentRequests,
    maintenanceRecords,
    alerts,
    stats,
    setActiveTab,
    setSelectedEquipmentId,
    startTroubleshootForEquipment,
    openCreateWorkOrder,
    openAddEquipmentModal,
    openEquipmentRequestModal,
    acknowledgeAlert,
  } = useDashboard();

  const { isManager, isAdmin } = useAuth();

  const getStatusBadge = (status: HealthStatus) => {
    switch (status) {
      case 'healthy':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-emerald-400"></span>
            Operational
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-amber-400"></span>
            Warning
          </span>
        );
      case 'critical':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 animate-pulse">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-rose-400"></span>
            Critical Fault
          </span>
        );
      case 'maintenance':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
            <span className="w-1.5 h-1.5 mr-1.5 rounded-full bg-blue-400"></span>
            Under Service
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/30">
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
    if (score >= 80) return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    if (score >= 60) return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  };

  const activeWorkOrdersCount = maintenanceRecords.filter(
    (r) => r.status === 'In Progress' || r.status === 'Pending Parts' || r.status === 'Scheduled'
  ).length;

  return (
    <div className="space-y-6">
      {/* Top Plant KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Availability KPI */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Plant Operational Availability
            </span>
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {stats.operationalAvailability}%
            </span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5 inline" /> Target: 95.0%
            </span>
          </div>
          <div className="mt-3 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, stats.operationalAvailability)}%` }}
            ></div>
          </div>
        </div>

        {/* Equipment Status Summary */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Fleet Health Status
            </span>
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-lg font-bold text-slate-100 font-mono">{stats.healthyCount}</span>
              <span className="text-xs text-slate-400">Nominal</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-lg font-bold text-slate-100 font-mono">{stats.warningCount}</span>
              <span className="text-xs text-slate-400">Warning</span>
            </div>
            <div className="flex items-center space-x-1">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span>
              <span className="text-lg font-bold text-slate-100 font-mono">{stats.criticalCount}</span>
              <span className="text-xs text-slate-400">Critical</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            {stats.totalEquipment} monitored machinery assets online
          </p>
        </div>

        {/* Reliability MTBF / MTTR */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Reliability Metrics
            </span>
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div>
              <span className="text-xs text-slate-400 block">Plant MTBF</span>
              <span className="text-2xl font-bold text-white font-mono">{stats.plantMTBF}h</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block">Plant MTTR</span>
              <span className="text-2xl font-bold text-cyan-300 font-mono">{stats.plantMTTR}h</span>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Downtime this month: <span className="text-slate-200 font-mono">{stats.totalDowntimeThisMonth}h</span>
          </p>
        </div>

        {/* Work Orders in Queue */}
        <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Maintenance Register
            </span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {activeWorkOrdersCount}
            </span>
            <span className="text-xs font-medium text-slate-400">Active Work Orders</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
            <span>YTD Spend: <strong className="text-slate-200">${stats.totalMaintenanceCostYTD.toLocaleString()}</strong></span>
            <button
              onClick={() => setActiveTab('register')}
              className="text-cyan-400 hover:text-cyan-300 flex items-center font-medium"
            >
              Open Log <ChevronRight className="w-3 h-3 ml-0.5" />
            </button>
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
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between group"
                >
                  <div>
                    {/* Header: Picture Thumbnail, Name, Tag, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start space-x-3">
                        {/* Equipment Thumbnail Image */}
                        <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 overflow-hidden shrink-0 shadow-inner">
                          {eq.imageUrl ? (
                            <img
                              src={eq.imageUrl}
                              alt={eq.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-slate-600">
                              <ImageIcon className="w-5 h-5" />
                            </div>
                          )}
                        </div>

                        <div className="space-y-0.5">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-mono font-semibold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                              {eq.tag}
                            </span>
                            <span className="text-xs text-slate-400">{eq.category}</span>
                          </div>
                          <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition line-clamp-1">
                            {eq.name}
                          </h3>
                          <p className="text-xs text-slate-400 line-clamp-1">{eq.location}</p>
                        </div>
                      </div>

                      {/* Health Score Pill */}
                      <div className="flex flex-col items-end shrink-0">
                        <div className={`px-2 py-1 rounded-lg border font-mono text-xs font-bold ${scoreBg}`}>
                          {eq.healthScore}%
                        </div>
                        <span className="text-[10px] text-slate-400 mt-0.5">Health</span>
                      </div>
                    </div>

                    {/* Sensor Badges / Key Telemetry */}
                    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                      {/* Vibration */}
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Vibration</span>
                        <div className="flex items-baseline space-x-1 mt-0.5">
                          <span
                            className={`font-mono font-bold ${
                              eq.telemetry.vibration.value >= eq.telemetry.vibration.criticalThreshold
                                ? 'text-rose-400'
                                : eq.telemetry.vibration.value >= eq.telemetry.vibration.warningThreshold
                                ? 'text-amber-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {eq.telemetry.vibration.value}
                          </span>
                          <span className="text-[10px] text-slate-400">{eq.telemetry.vibration.unit}</span>
                        </div>
                      </div>

                      {/* Temperature */}
                      <div className="p-2 rounded-lg bg-slate-950/60 border border-slate-800/80">
                        <span className="text-[10px] uppercase text-slate-400 block font-medium">Temperature</span>
                        <div className="flex items-baseline space-x-1 mt-0.5">
                          <span
                            className={`font-mono font-bold ${
                              eq.telemetry.temperature.value >= eq.telemetry.temperature.criticalThreshold
                                ? 'text-rose-400'
                                : eq.telemetry.temperature.value >= eq.telemetry.temperature.warningThreshold
                                ? 'text-amber-400'
                                : 'text-slate-200'
                            }`}
                          >
                            {eq.telemetry.temperature.value}
                          </span>
                          <span className="text-[10px] text-slate-400">{eq.telemetry.temperature.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between text-xs">
                      {getStatusBadge(eq.status)}
                      <span className="text-[11px] text-slate-400 font-mono">
                        {eq.operatingHours.toLocaleString()} hrs logged
                      </span>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between space-x-2">
                    <button
                      onClick={() => {
                        setSelectedEquipmentId(eq.id);
                        setActiveTab('health');
                      }}
                      className="flex-1 py-1 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium text-center transition"
                    >
                      Health View
                    </button>
                    <button
                      onClick={() => startTroubleshootForEquipment(eq.id)}
                      className="flex-1 py-1 px-2 rounded-lg bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/40 text-cyan-300 text-xs font-medium text-center transition"
                    >
                      Troubleshoot
                    </button>
                    <button
                      onClick={() => openCreateWorkOrder({ equipmentId: eq.id, equipmentName: eq.name })}
                      title="Log Maintenance Work Order"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    >
                      <Wrench className="w-3.5 h-3.5" />
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
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-bold text-white">Active Alarm Stream</h3>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
                {alerts.length} Total
              </span>
            </div>

            <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
              {alerts.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  All equipment operating within normal safe thresholds.
                </div>
              ) : (
                alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border text-xs transition ${
                      alert.severity === 'critical'
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                        : 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-1.5">
                        <span
                          className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                            alert.severity === 'critical'
                              ? 'bg-rose-900/60 text-rose-300'
                              : 'bg-amber-900/60 text-amber-300'
                          }`}
                        >
                          {alert.code}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-200 line-clamp-1">
                          {alert.equipmentName}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-1">{alert.timestamp}</span>
                    </div>

                    <p className="mt-1 text-[11px] text-slate-300 leading-relaxed">{alert.message}</p>

                    <div className="mt-2.5 flex items-center justify-between pt-2 border-t border-slate-800/50">
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-[10px] font-medium text-slate-400 hover:text-slate-200 underline"
                        >
                          Acknowledge
                        </button>
                      ) : (
                        <span className="text-[10px] text-emerald-400 flex items-center">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Acknowledged
                        </span>
                      )}

                      <button
                        onClick={() => startTroubleshootForEquipment(alert.equipmentId, alert.code)}
                        className="px-2 py-0.5 rounded bg-cyan-950 hover:bg-cyan-900 border border-cyan-800/50 text-cyan-300 font-medium text-[10px] flex items-center"
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
          <div className="p-4 sm:p-5 rounded-xl bg-slate-900/80 border border-slate-800 shadow-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white">Preventive Maintenance Schedule</h3>
              </div>
              <button
                onClick={() => setActiveTab('register')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
              >
                All
              </button>
            </div>

            <div className="space-y-2">
              {equipmentList.slice(0, 4).map((eq) => (
                <div
                  key={eq.id}
                  className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-200 block line-clamp-1">{eq.name}</span>
                    <span className="text-[10px] text-slate-400">
                      Next Due: <strong className="text-cyan-300 font-mono">{eq.nextScheduledService}</strong>
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
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs"
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
    </div>
  );
};
