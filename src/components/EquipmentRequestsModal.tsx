import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useAuth } from '../context/AuthContext';
import {
  X,
  FileCheck2,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
  Layers,
  Trash2,
  PlusCircle,
  AlertCircle,
  User,
} from 'lucide-react';

export const EquipmentRequestsModal: React.FC = () => {
  const {
    equipmentRequests,
    equipmentRequestModalOpen,
    closeEquipmentRequestModal,
    approveEquipmentRequest,
    rejectEquipmentRequest,
  } = useDashboard();

  const { currentUser, isManager, isAdmin } = useAuth();
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');

  if (!equipmentRequestModalOpen) return null;

  const handleApprove = (id: string) => {
    approveEquipmentRequest(id, currentUser?.name || 'Plant Manager', 'Approved by Manager authorization.');
  };

  const handleReject = (id: string) => {
    rejectEquipmentRequest(id, currentUser?.name || 'Plant Manager', rejectReason || 'Budget / space allocation postponed.');
    setRejectingId(null);
    setRejectReason('');
  };

  const pendingCount = equipmentRequests.filter((r) => r.status === 'Pending').length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center border border-cyan-500/30">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white">Equipment Authorization Queue</h3>
                {pendingCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse">
                    {pendingCount} Pending
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">
                Equipment additions & decommission requests submitted by Junior / Lower-Level Supervisors.
              </p>
            </div>
          </div>
          <button
            onClick={closeEquipmentRequestModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Requests */}
        <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs">
          {equipmentRequests.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <span>No equipment addition or deletion requests in queue.</span>
            </div>
          ) : (
            equipmentRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          req.type === 'add'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-rose-950 text-rose-300 border border-rose-800'
                        }`}
                      >
                        {req.type === 'add' ? '+ Addition Request' : '- Deletion Request'}
                      </span>
                      <span className="font-mono text-cyan-400 font-bold">{req.id}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-100 mt-1">{req.equipmentName}</h4>
                  </div>

                  <span
                    className={`px-2.5 py-0.5 rounded-full font-bold uppercase text-[10px] ${
                      req.status === 'Approved'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : req.status === 'Rejected'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800/80 space-y-1 text-slate-300">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Stated Operational Reason:
                  </span>
                  <p className="leading-relaxed">{req.reason}</p>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>
                    Requested by: <strong className="text-white">{req.requestedBy}</strong> ({req.requestedByRole})
                  </span>
                  <span className="font-mono">{req.requestDate}</span>
                </div>

                {/* Manager / Admin Action Controls */}
                {req.status === 'Pending' && (isManager || isAdmin) && (
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-end space-x-2">
                    {rejectingId === req.id ? (
                      <div className="flex items-center space-x-2 w-full pt-1">
                        <input
                          type="text"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Rejection reason..."
                          className="flex-1 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-slate-200"
                        />
                        <button
                          onClick={() => handleReject(req.id)}
                          className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
                        >
                          Confirm Reject
                        </button>
                        <button
                          onClick={() => setRejectingId(null)}
                          className="px-2 py-1 rounded-lg bg-slate-800 text-slate-400"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={() => setRejectingId(req.id)}
                          className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-rose-400 font-semibold"
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(req.id)}
                          className="px-3.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center space-x-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Execute</span>
                        </button>
                      </>
                    )}
                  </div>
                )}

                {req.reviewedBy && (
                  <div className="pt-1 text-[10px] text-slate-400 border-t border-slate-800/50 flex items-center justify-between">
                    <span>Reviewed by: <strong className="text-cyan-300">{req.reviewedBy}</strong></span>
                    <span>{req.reviewNotes}</span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
