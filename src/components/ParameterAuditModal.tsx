import React, { useState, useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  History,
  ShieldCheck,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Clock,
  Layers,
  ArrowUpDown,
} from 'lucide-react';
import type { ParameterInputLog } from '../types';

export const ParameterAuditModal: React.FC = () => {
  const {
    auditModalOpen,
    closeAuditModal,
    auditEquipmentId,
    auditParameterId,
    parameterInputLogs,
    equipmentList,
  } = useDashboard();

  const { isManagementEmployee, currentUser } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('All');
  const [equipmentFilter, setEquipmentFilter] = useState(auditEquipmentId || 'All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Sync initial equipment filter if opened for specific equipment
  React.useEffect(() => {
    if (auditEquipmentId) {
      setEquipmentFilter(auditEquipmentId);
    }
  }, [auditEquipmentId, auditModalOpen]);

  // Unique list of employees who have submitted logs (Called unconditionally before any early returns)
  const employeeOptions = useMemo(() => {
    if (!auditModalOpen) return ['All'];
    const names = new Set<string>();
    parameterInputLogs.forEach((log) => {
      if (log.inputBy?.name) names.add(log.inputBy.name);
    });
    return ['All', ...Array.from(names)];
  }, [auditModalOpen, parameterInputLogs]);

  // Filtered logs (Called unconditionally before any early returns)
  const filteredLogs = useMemo(() => {
    if (!auditModalOpen) return [];
    return parameterInputLogs.filter((log) => {
      // Equipment filter
      if (equipmentFilter !== 'All' && log.equipmentId !== equipmentFilter) return false;

      // Parameter ID filter if opened for specific parameter
      if (auditParameterId && log.parameterId !== auditParameterId) return false;

      // Employee filter
      if (employeeFilter !== 'All' && log.inputBy?.name !== employeeFilter) return false;

      // Status filter
      if (statusFilter !== 'All' && log.status !== statusFilter) return false;

      // Search query (search in param name, equipment name, employee name, notes, or value)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          log.parameterName.toLowerCase().includes(q) ||
          log.equipmentName.toLowerCase().includes(q) ||
          log.inputBy?.name.toLowerCase().includes(q) ||
          log.inputBy?.employeeId.toLowerCase().includes(q) ||
          log.value.toLowerCase().includes(q) ||
          (log.notes && log.notes.toLowerCase().includes(q));
        if (!match) return false;
      }

      return true;
    });
  }, [auditModalOpen, parameterInputLogs, equipmentFilter, auditParameterId, employeeFilter, statusFilter, searchQuery]);

  if (!auditModalOpen) return null;

  const handleExportAuditCSV = () => {
    const headers = [
      'Log ID',
      'Timestamp',
      'Equipment ID',
      'Equipment Name',
      'Parameter Name',
      'Recorded Value',
      'Status',
      'Shift',
      'Recorded By Name',
      'Employee ID',
      'Role',
      'Designation',
      'Technician Notes',
    ];

    const rows = filteredLogs.map((log) => [
      `"${log.id}"`,
      `"${log.timestamp}"`,
      `"${log.equipmentId}"`,
      `"${log.equipmentName.replace(/"/g, '""')}"`,
      `"${log.parameterName.replace(/"/g, '""')}"`,
      `"${log.value.replace(/"/g, '""')}"`,
      `"${log.status}"`,
      `"${log.shift || 'General Shift'}"`,
      `"${log.inputBy?.name || ''}"`,
      `"${log.inputBy?.employeeId || ''}"`,
      `"${log.inputBy?.role || ''}"`,
      `"${log.inputBy?.designation || ''}"`,
      `"${(log.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Parameter_Input_Audit_Trail_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/90 border-b border-slate-800/80 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <History className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-bold text-white">Parameter Input Audit Trail & Operator Register</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  Management Audit View
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Track exactly which technician/employee recorded every operational parameter reading and shift observation.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleExportAuditCSV}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center space-x-1.5 border border-slate-700 transition"
              title="Download CSV Audit Report"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={closeAuditModal}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-950/60 border-b border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 shrink-0">
          {/* Search box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search technician, parameter, value..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Filter by Employee */}
          <div>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Operators / Staff</option>
              {employeeOptions
                .filter((name) => name !== 'All')
                .map((name) => (
                  <option key={name} value={name}>
                    Staff: {name}
                  </option>
                ))}
            </select>
          </div>

          {/* Filter by Equipment */}
          <div>
            <select
              value={equipmentFilter}
              onChange={(e) => setEquipmentFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Equipment Machinery</option>
              {equipmentList.map((eq) => (
                <option key={eq.id} value={eq.id}>
                  {eq.tag} — {eq.name}
                </option>
              ))}
            </select>
          </div>

          {/* Filter by Status */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              <option value="All">All Health Statuses</option>
              <option value="healthy">Normal / Healthy</option>
              <option value="warning">Warning Condition</option>
              <option value="critical">Critical Fault</option>
            </select>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>
              Showing <strong className="text-white">{filteredLogs.length}</strong> logged measurement entries
            </span>
            {auditParameterId && (
              <span className="text-cyan-400 font-semibold bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                Filtered to specific parameter
              </span>
            )}
          </div>

          {filteredLogs.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs bg-slate-950/60 rounded-2xl border border-slate-800">
              <History className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">No parameter input logs match the filter criteria.</p>
              <p className="mt-1">Technicians can record new parameter values via "+ Record Parameter Reading".</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 transition hover:border-slate-700 hover:bg-slate-950"
                >
                  {/* Left Column: Parameter & Equipment info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-white">{log.parameterName}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.status === 'healthy'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : log.status === 'warning'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {log.status === 'healthy' ? 'Normal' : log.status === 'warning' ? 'Warning' : 'Critical'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {log.shift || 'General Shift'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                      <span className="text-cyan-400 font-medium">{log.equipmentName}</span>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-300 font-bold bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                        Reading: {log.value}
                      </span>
                    </div>

                    {log.notes && (
                      <p className="text-xs text-slate-300 italic bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                        "{log.notes}"
                      </p>
                    )}
                  </div>

                  {/* Right Column: Operator Attribution (Who Inputted This Data) */}
                  <div className="md:w-72 shrink-0 p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md">
                      {log.inputBy?.name ? log.inputBy.name.charAt(0) : 'U'}
                    </div>

                    <div className="flex-1 min-w-0 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white truncate">{log.inputBy?.name}</span>
                        <span className="text-[10px] font-mono text-cyan-400 shrink-0 ml-1">
                          {log.inputBy?.employeeId}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate">
                        {log.inputBy?.designation}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 mt-1 border-t border-slate-800">
                        <span
                          className={`px-1.5 py-0.2 rounded font-semibold ${
                            log.inputBy?.role === 'non_management'
                              ? 'bg-blue-950 text-blue-300'
                              : 'bg-amber-950 text-amber-300'
                          }`}
                        >
                          {log.inputBy?.role === 'non_management' ? 'Non-Management Tech' : 'Management'}
                        </span>
                        <span className="font-mono">{log.timestamp}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>ISO 55001 Asset Management Tamper-Evident Audit Ledger</span>
          </div>

          <button
            onClick={closeAuditModal}
            className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Audit View
          </button>
        </div>
      </div>
    </div>
  );
};
