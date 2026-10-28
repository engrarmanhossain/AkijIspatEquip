import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  ClipboardList,
  Search,
  Filter,
  Download,
  PlusCircle,
  FileSpreadsheet,
  Printer,
  ChevronDown,
  ChevronUp,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  AlertCircle,
  Package,
  Wrench,
  DollarSign,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import type {
  MaintenanceRecord,
  MaintenanceStatus,
  MaintenanceType,
  PriorityLevel,
} from '../types';

export const MaintenanceRegisterTab: React.FC = () => {
  const {
    maintenanceRecords,
    equipmentList,
    openCreateWorkOrder,
    openEditWorkOrder,
    deleteMaintenanceRecord,
    updateMaintenanceStatus,
    exportRecordsToCSV,
    exportRecordsToJSON,
  } = useDashboard();

  const { companySettings } = useAuth();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [typeFilter, setTypeFilter] = useState<string>('All');
  const [priorityFilter, setPriorityFilter] = useState<string>('All');
  const [expandedRecordId, setExpandedRecordId] = useState<string | null>(null);

  // Filtered maintenance logs
  const filteredRecords = maintenanceRecords.filter((rec) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      rec.id.toLowerCase().includes(q) ||
      rec.title.toLowerCase().includes(q) ||
      rec.equipmentName.toLowerCase().includes(q) ||
      rec.technician.toLowerCase().includes(q) ||
      (rec.rootCause && rec.rootCause.toLowerCase().includes(q));

    const matchStatus = statusFilter === 'All' || rec.status === statusFilter;
    const matchType = typeFilter === 'All' || rec.type === typeFilter;
    const matchPriority = priorityFilter === 'All' || rec.priority === priorityFilter;

    return matchSearch && matchStatus && matchType && matchPriority;
  });

  const getPriorityBadge = (priority: PriorityLevel) => {
    switch (priority) {
      case 'Emergency':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/30">
            Emergency
          </span>
        );
      case 'High':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/30">
            High
          </span>
        );
      case 'Medium':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/30">
            Medium
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-500/10 text-slate-400 border border-slate-500/30">
            Low
          </span>
        );
    }
  };

  const getStatusBadge = (status: MaintenanceStatus) => {
    switch (status) {
      case 'Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'In Progress':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Pending Parts':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'Scheduled':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const getTypeBadge = (type: MaintenanceType) => {
    switch (type) {
      case 'Preventive':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40';
      case 'Predictive':
        return 'text-indigo-400 bg-indigo-950/60 border-indigo-800/40';
      case 'Emergency Breakdown':
        return 'text-rose-400 bg-rose-950/60 border-rose-800/40';
      default:
        return 'text-amber-400 bg-amber-950/60 border-amber-800/40';
    }
  };

  const totalDowntimeFiltered = filteredRecords.reduce((s, r) => s + (r.downtimeHours || 0), 0);
  const totalCostFiltered = filteredRecords.reduce((s, r) => s + (r.cost?.totalCost || 0), 0);

  const toggleExpand = (id: string) => {
    setExpandedRecordId((prev) => (prev === id ? null : id));
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <ClipboardList className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">Digital Maintenance Register & Work Order Logbook</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              ISO 55000 / CMMS compliant maintenance register, parts log, labor records, and downtime tracking.
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {companySettings.googleSpreadsheetUrl && (
              <a
                href={companySettings.googleSpreadsheetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-300 border border-emerald-600/50 text-xs font-semibold flex items-center transition shadow-sm"
                title="Open live Google Spreadsheet database"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
                <span>Google Sheet Database</span>
                <ExternalLink className="w-2.5 h-2.5 ml-1 text-emerald-400/60" />
              </a>
            )}
            <button
              onClick={exportRecordsToCSV}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center transition"
              title="Export maintenance register to Excel-compatible CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-400" />
              Export CSV
            </button>
            <button
              onClick={exportRecordsToJSON}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center transition"
              title="Export maintenance register as raw JSON"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              Export JSON
            </button>
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center transition"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5 text-slate-300" />
              Print Log
            </button>
            <button
              onClick={() => openCreateWorkOrder()}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold flex items-center transition shadow-lg shadow-cyan-600/20"
            >
              <PlusCircle className="w-4 h-4 mr-1.5" />
              + Create Work Order
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {/* Search box */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search work order #, machine, technician, or issue..."
              className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none placeholder:text-slate-500 text-xs transition"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs"
            >
              <option value="All">All Statuses</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Pending Parts">Pending Parts</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs"
            >
              <option value="All">All Maintenance Types</option>
              <option value="Preventive">Preventive</option>
              <option value="Corrective">Corrective</option>
              <option value="Predictive">Predictive</option>
              <option value="Emergency Breakdown">Emergency Breakdown</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none text-xs"
            >
              <option value="All">All Priorities</option>
              <option value="Emergency">Emergency</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>

        {/* Tally Summary Strip */}
        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400 pt-1">
          <div>
            Showing <strong className="text-white font-mono">{filteredRecords.length}</strong> of{' '}
            <strong className="text-white font-mono">{maintenanceRecords.length}</strong> records
          </div>
          <div className="flex items-center space-x-4">
            <span>
              Cumulative Downtime:{' '}
              <strong className="text-cyan-300 font-mono">{totalDowntimeFiltered.toFixed(1)} hrs</strong>
            </span>
            <span>
              Maintenance Cost:{' '}
              <strong className="text-emerald-300 font-mono">${totalCostFiltered.toLocaleString()}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Register Table */}
      <div className="rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 uppercase font-bold tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">WO #</th>
                <th className="py-3 px-4">Equipment</th>
                <th className="py-3 px-4">Work Order Title & Type</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Scheduled / Date</th>
                <th className="py-3 px-3 text-right">Downtime</th>
                <th className="py-3 px-4 text-right">Cost</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-400">
                    No maintenance records matching the selected filter criteria.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => {
                  const isExpanded = expandedRecordId === rec.id;
                  return (
                    <React.Fragment key={rec.id}>
                      <tr
                        className={`hover:bg-slate-800/40 transition cursor-pointer ${
                          isExpanded ? 'bg-slate-800/50' : ''
                        }`}
                        onClick={() => toggleExpand(rec.id)}
                      >
                        {/* WO ID */}
                        <td className="py-3 px-4 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          {rec.id}
                        </td>

                        {/* Equipment Name */}
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-200 block line-clamp-1">
                            {rec.equipmentName}
                          </span>
                          <span className="text-[10px] font-mono text-slate-400">{rec.equipmentId}</span>
                        </td>

                        {/* Title & Type */}
                        <td className="py-3 px-4">
                          <span className="font-medium text-slate-100 block line-clamp-1">{rec.title}</span>
                          <span
                            className={`inline-block mt-0.5 px-2 py-0.2 rounded text-[10px] font-semibold border ${getTypeBadge(
                              rec.type
                            )}`}
                          >
                            {rec.type}
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3 px-3 whitespace-nowrap">{getPriorityBadge(rec.priority)}</td>

                        {/* Status (Interactive Dropdown) */}
                        <td className="py-3 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <select
                            value={rec.status}
                            onChange={(e) => updateMaintenanceStatus(rec.id, e.target.value as MaintenanceStatus)}
                            className={`px-2 py-1 rounded text-xs font-semibold border focus:outline-none cursor-pointer ${getStatusBadge(
                              rec.status
                            )} bg-slate-950`}
                          >
                            <option value="Scheduled">Scheduled</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Pending Parts">Pending Parts</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* Technician */}
                        <td className="py-3 px-4 text-slate-300 whitespace-nowrap">{rec.technician}</td>

                        {/* Date */}
                        <td className="py-3 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                          <div>{rec.scheduledDate.slice(0, 10)}</div>
                          {rec.completedDate && (
                            <span className="text-[10px] text-emerald-400 block">
                              Done: {rec.completedDate.slice(0, 10)}
                            </span>
                          )}
                        </td>

                        {/* Downtime */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-slate-200 whitespace-nowrap">
                          {rec.downtimeHours}h
                        </td>

                        {/* Cost */}
                        <td className="py-3 px-4 text-right font-mono font-bold text-emerald-400 whitespace-nowrap">
                          ${rec.cost?.totalCost.toLocaleString() || '0'}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center space-x-1.5">
                            <button
                              onClick={() => toggleExpand(rec.id)}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-white transition"
                              title="Toggle details"
                            >
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => openEditWorkOrder(rec)}
                              className="p-1.5 rounded hover:bg-slate-700 text-slate-400 hover:text-cyan-300 transition"
                              title="Edit Work Order"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Delete Work Order ${rec.id}?`)) {
                                  deleteMaintenanceRecord(rec.id);
                                }
                              }}
                              className="p-1.5 rounded hover:bg-rose-900/50 text-slate-400 hover:text-rose-400 transition"
                              title="Delete record"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Record Details Drawer */}
                      {isExpanded && (
                        <tr className="bg-slate-950/90 border-b border-slate-800">
                          <td colSpan={10} className="p-5">
                            <div className="space-y-4 max-w-5xl mx-auto">
                              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                                <h4 className="text-sm font-bold text-white flex items-center space-x-2">
                                  <span>Work Order Details & Maintenance Sign-Off</span>
                                  <span className="font-mono text-cyan-400">[{rec.id}]</span>
                                </h4>
                                <div className="text-xs text-slate-400">
                                  Reported: <strong className="text-slate-200">{rec.reportedDate}</strong> | Sign-Off: <strong className="text-slate-200">{rec.signOffBy || 'Pending'}</strong>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Root Cause & Procedure */}
                                <div className="space-y-2">
                                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-cyan-400 block mb-1">
                                      Root Cause Diagnostics
                                    </span>
                                    <p className="text-slate-300 leading-relaxed">
                                      {rec.rootCause || 'Routine preventive maintenance schedule.'}
                                    </p>
                                  </div>

                                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-indigo-400 block mb-1">
                                      Corrective Action & Procedure
                                    </span>
                                    <p className="text-slate-300 leading-relaxed">
                                      {rec.actionTaken || 'No action summary provided.'}
                                    </p>
                                  </div>
                                </div>

                                {/* Spare Parts Line Items & Cost Breakdown */}
                                <div className="space-y-2">
                                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-2">
                                      Spare Parts Consumed
                                    </span>
                                    {rec.partsReplaced && rec.partsReplaced.length > 0 ? (
                                      <div className="space-y-1.5">
                                        {rec.partsReplaced.map((part, idx) => (
                                          <div
                                            key={idx}
                                            className="flex items-center justify-between text-xs py-1 border-b border-slate-800/60 last:border-0"
                                          >
                                            <div>
                                              <span className="font-semibold text-slate-200">{part.partName}</span>
                                              <span className="text-[10px] font-mono text-slate-400 block">
                                                P/N: {part.partNumber} &times; {part.quantity}
                                              </span>
                                            </div>
                                            <span className="font-mono text-slate-300">
                                              ${(part.quantity * part.unitCost).toLocaleString()}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-slate-400 text-xs italic">
                                        No spare parts replaced for this task.
                                      </p>
                                    )}
                                  </div>

                                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Cost Structure
                                      </span>
                                      <span className="text-xs text-slate-300">
                                        Parts: <strong className="text-white">${rec.cost.partsCost}</strong> | Labor:{' '}
                                        <strong className="text-white">${rec.cost.laborCost}</strong>
                                      </span>
                                    </div>
                                    <div className="text-right">
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                                        Total Cost
                                      </span>
                                      <span className="text-base font-extrabold font-mono text-emerald-400">
                                        ${rec.cost.totalCost.toLocaleString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
