import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  ReferenceLine,
} from 'recharts';
import {
  BarChart3,
  TrendingUp,
  Clock,
  DollarSign,
  AlertTriangle,
} from 'lucide-react';

export const AnalyticsTab: React.FC = () => {
  const { equipmentList, maintenanceRecords, stats } = useDashboard();

  // MTBF and MTTR data by equipment
  const reliabilityByEquipment = equipmentList.map((eq) => ({
    name: eq.tag,
    mtbf: eq.mtbfHours,
    mttr: eq.mttrHours,
    category: eq.category,
    fullName: eq.name,
  }));

  // Downtime by Equipment
  const downtimeByEquipmentMap: Record<string, number> = {};
  maintenanceRecords.forEach((rec) => {
    downtimeByEquipmentMap[rec.equipmentName] =
      (downtimeByEquipmentMap[rec.equipmentName] || 0) + (rec.downtimeHours || 0);
  });

  const downtimeChartData = Object.entries(downtimeByEquipmentMap)
    .map(([name, hours]) => ({
      name: name.split(' ')[0] + ' ' + (name.split(' ')[1] || ''),
      fullName: name,
      hours: Number(hours.toFixed(1)),
    }))
    .sort((a, b) => b.hours - a.hours);

  // Past 6 Months Availability Trend (Historical Mock)
  const availabilityTrendData = [
    { month: 'May 2026', availability: 97.4, target: 95.0 },
    { month: 'Jun 2026', availability: 96.8, target: 95.0 },
    { month: 'Jul 2026', availability: 95.5, target: 95.0 },
    { month: 'Aug 2026', availability: 94.2, target: 95.0 },
    { month: 'Sep 2026', availability: 96.1, target: 95.0 },
    { month: 'Oct 2026 (Live)', availability: stats.operationalAvailability, target: 95.0 },
  ];

  // Cost Breakdown calculation
  const totalPartsCost = maintenanceRecords.reduce((s, r) => s + (r.cost?.partsCost || 0), 0);
  const totalLaborCost = maintenanceRecords.reduce((s, r) => s + (r.cost?.laborCost || 0), 0);
  const grandTotalCost = totalPartsCost + totalLaborCost || 1;

  const partsPercent = Math.round((totalPartsCost / grandTotalCost) * 100);
  const laborPercent = Math.round((totalLaborCost / grandTotalCost) * 100);

  // Preventive vs Corrective spend
  const preventiveSpend = maintenanceRecords
    .filter((r) => r.type === 'Preventive' || r.type === 'Predictive')
    .reduce((s, r) => s + (r.cost?.totalCost || 0), 0);
  const correctiveSpend = maintenanceRecords
    .filter((r) => r.type === 'Corrective' || r.type === 'Emergency Breakdown')
    .reduce((s, r) => s + (r.cost?.totalCost || 0), 0);

  const prevPercent = Math.round((preventiveSpend / grandTotalCost) * 100);
  const corrPercent = Math.round((correctiveSpend / grandTotalCost) * 100);

  // Equipment sorted by lowest health (Bad actors / Needs attention)
  const badActors = [...equipmentList].sort((a, b) => a.healthScore - b.healthScore).slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Analytics Banner */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div className="flex items-center space-x-2">
          <BarChart3 className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">Reliability Engineering & Maintenance KPIs</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          Predictive maintenance effectiveness, Mean Time Between Failures, Mean Time To Repair, and budget allocation.
        </p>

        {/* Top Metric Strip */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fleet MTBF</span>
            <span className="text-2xl font-extrabold font-mono text-white mt-1 block">
              {stats.plantMTBF} hrs
            </span>
            <span className="text-[11px] text-emerald-400 flex items-center mt-0.5">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +4.2% vs last quarter
            </span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Fleet MTTR</span>
            <span className="text-2xl font-extrabold font-mono text-cyan-300 mt-1 block">
              {stats.plantMTTR} hrs
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">Mean Time To Repair</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Downtime Logged</span>
            <span className="text-2xl font-extrabold font-mono text-amber-300 mt-1 block">
              {stats.totalDowntimeThisMonth} hrs
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">Month-to-Date total</span>
          </div>

          <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Maintenance Spend YTD</span>
            <span className="text-2xl font-extrabold font-mono text-emerald-400 mt-1 block">
              ${stats.totalMaintenanceCostYTD.toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5">Parts + Labor combined</span>
          </div>
        </div>
      </div>

      {/* Row 1: Availability Trend & MTBF/MTTR Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Availability 6-Month Trend */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Plant Operational Availability Trend</span>
              </h3>
              <p className="text-xs text-slate-400">Monthly historical trend benchmarked against 95.0% target</p>
            </div>
            <span className="px-2 py-0.5 rounded font-mono text-xs font-bold bg-cyan-950 text-cyan-300 border border-cyan-800/40">
              Live: {stats.operationalAvailability}%
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={availabilityTrendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis domain={[90, 100]} stroke="#64748b" fontSize={11} tickLine={false} unit="%" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Availability']}
                />
                <ReferenceLine
                  y={95.0}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{ value: 'Target 95%', fill: '#f59e0b', fontSize: 10, position: 'insideTopLeft' }}
                />
                <Line
                  type="monotone"
                  dataKey="availability"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#06b6d4' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MTBF per Machine Asset */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-400" />
                <span>Mean Time Between Failures (MTBF) by Asset</span>
              </h3>
              <p className="text-xs text-slate-400">Higher hours indicate superior reliability and uptime</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Hours</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reliabilityByEquipment} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any, name: any, item: any) => [`${val} Hours`, item.payload.fullName]}
                />
                <Bar dataKey="mtbf" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 2: Downtime Hours Pareto & Cost Allocation */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Downtime Pareto */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center space-x-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span>Cumulative Downtime Hours by Asset</span>
              </h3>
              <p className="text-xs text-slate-400">Total duration of emergency and scheduled maintenance outages</p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Total: {stats.totalDowntimeThisMonth}h</span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={downtimeChartData} layout="vertical" margin={{ top: 10, right: 20, left: 30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis type="number" stroke="#64748b" fontSize={11} tickLine={false} unit="h" />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    fontSize: '12px',
                    color: '#f8fafc',
                  }}
                  formatter={(val: any, name: any, item: any) => [`${val} Hours`, item.payload.fullName]}
                />
                <Bar dataKey="hours" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Maintenance Cost & Spend Breakdown */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center space-x-2">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <span>Maintenance Spend & Budget Breakdown</span>
            </h3>
            <p className="text-xs text-slate-400">Analysis of parts inventory vs technician labor, preventive vs corrective</p>
          </div>

          <div className="space-y-4">
            {/* Parts vs Labor */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Parts vs Labor Ratio</span>
                <span className="text-slate-400">
                  Parts: <strong className="text-white">${totalPartsCost}</strong> ({partsPercent}%) | Labor:{' '}
                  <strong className="text-white">${totalLaborCost}</strong> ({laborPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 flex overflow-hidden">
                <div className="bg-cyan-500 h-2.5" style={{ width: `${partsPercent}%` }}></div>
                <div className="bg-indigo-500 h-2.5" style={{ width: `${laborPercent}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-cyan-500 mr-1.5"></span> Spare Parts Inventory
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 mr-1.5"></span> Specialized Labor
                </span>
              </div>
            </div>

            {/* Preventive vs Corrective Spend */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-300">Preventive vs Breakdown Spend</span>
                <span className="text-slate-400">
                  Preventive: <strong className="text-emerald-400">${preventiveSpend}</strong> ({prevPercent}%) | Corrective:{' '}
                  <strong className="text-rose-400">${correctiveSpend}</strong> ({corrPercent}%)
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2.5 flex overflow-hidden">
                <div className="bg-emerald-400 h-2.5" style={{ width: `${prevPercent}%` }}></div>
                <div className="bg-rose-500 h-2.5" style={{ width: `${corrPercent}%` }}></div>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1">
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 mr-1.5"></span> Planned / Predictive
                </span>
                <span className="flex items-center">
                  <span className="w-2 h-2 rounded-full bg-rose-500 mr-1.5"></span> Breakdown / Emergency
                </span>
              </div>
            </div>

            {/* Bad Actors Priority List */}
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 block">
                Priority Attention Assets (Lowest Health Score)
              </span>
              <div className="space-y-1.5 text-xs">
                {badActors.map((actor) => (
                  <div key={actor.id} className="flex items-center justify-between py-1 border-b border-slate-800/60 last:border-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-cyan-400 font-bold">{actor.tag}</span>
                      <span className="text-slate-200">{actor.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-[11px] text-slate-400">{actor.status}</span>
                      <span
                        className={`font-mono font-bold px-1.5 py-0.5 rounded text-[11px] ${
                          actor.healthScore >= 75
                            ? 'bg-emerald-950 text-emerald-400'
                            : actor.healthScore >= 50
                            ? 'bg-amber-950 text-amber-400'
                            : 'bg-rose-950 text-rose-400'
                        }`}
                      >
                        {actor.healthScore}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
