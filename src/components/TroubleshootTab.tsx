import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import {
  Wrench,
  AlertTriangle,
  Search,
  CheckCircle2,
  HelpCircle,
  FileText,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  Clock,
  Package,
  UserCheck,
  CheckSquare,
  Square,
  Flame,
} from 'lucide-react';
import type { TroubleshootingGuide } from '../types';

export const TroubleshootTab: React.FC = () => {
  const {
    troubleshootingGuides,
    equipmentList,
    selectedEquipmentId,
    setSelectedEquipmentId,
    activeDiagnosticFaultCode,
    openCreateWorkOrder,
  } = useDashboard();

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedGuideId, setSelectedGuideId] = useState<string>(
    troubleshootingGuides[0].id
  );
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  // Auto-select guide if navigated with a specific fault code
  useEffect(() => {
    if (activeDiagnosticFaultCode) {
      const match = troubleshootingGuides.find((g) => g.faultCode === activeDiagnosticFaultCode);
      if (match) {
        setSelectedGuideId(match.id);
      }
    }
  }, [activeDiagnosticFaultCode, troubleshootingGuides]);

  // Filtered guides based on search query
  const filteredGuides = troubleshootingGuides.filter((guide) => {
    const q = searchQuery.toLowerCase();
    return (
      guide.faultCode.toLowerCase().includes(q) ||
      guide.title.toLowerCase().includes(q) ||
      guide.symptom.toLowerCase().includes(q) ||
      guide.equipmentCategory.toLowerCase().includes(q)
    );
  });

  const activeGuide = troubleshootingGuides.find((g) => g.id === selectedGuideId) || troubleshootingGuides[0];
  const targetEquipment = equipmentList.find((e) => e.category === activeGuide.equipmentCategory) || equipmentList[0];

  const toggleStep = (stepNumber: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleCreateWorkOrderFromDiagnosis = (solutionIndex = 0) => {
    const sol = activeGuide.recommendedSolutions[solutionIndex] || activeGuide.recommendedSolutions[0];
    const topCause = activeGuide.possibleCauses[0]?.cause || activeGuide.symptom;

    openCreateWorkOrder({
      equipmentId: targetEquipment.id,
      equipmentName: targetEquipment.name,
      title: `Corrective Action: ${activeGuide.title}`,
      type: activeGuide.severity === 'critical' ? 'Emergency Breakdown' : 'Corrective',
      priority: activeGuide.severity === 'critical' ? 'Emergency' : 'High',
      rootCause: `[${activeGuide.faultCode}] ${topCause}`,
      troubleshootProcedure: `Completed triage steps for ${activeGuide.title}. Checked telemetry and mechanical tolerance.`,
      actionTaken: sol.action,
      notes: `Parts required: ${sol.requiredParts.join(', ')}. Est. Downtime: ${sol.estimatedTime}`,
      downtimeHours: parseFloat(sol.estimatedTime) || 2.0,
      partsReplaced: sol.requiredParts.map((partName) => ({
        partName,
        partNumber: `OEM-${partName.slice(0, 3).toUpperCase()}-900`,
        quantity: 1,
        unitCost: 120,
      })),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center space-x-2">
            <Wrench className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Interactive Diagnostic & Troubleshooting Engine</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard Operating Procedures, root cause fault trees, and instant work order synthesis.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search fault code (e.g. ERR-VIB) or symptom..."
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 focus:border-cyan-500 focus:outline-none text-xs text-slate-200 placeholder:text-slate-500 transition"
          />
        </div>
      </div>

      {/* Main Grid: Guide Directory & Interactive Diagnostic Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Fault Guides Directory (4 Cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Troubleshooting Guides</span>
            <span className="font-mono text-cyan-400">{filteredGuides.length} Found</span>
          </h3>

          <div className="space-y-2.5 max-h-[680px] overflow-y-auto pr-1">
            {filteredGuides.map((guide) => {
              const isSelected = guide.id === activeGuide.id;
              return (
                <button
                  key={guide.id}
                  onClick={() => {
                    setSelectedGuideId(guide.id);
                    setCompletedSteps({});
                  }}
                  className={`w-full p-4 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-lg'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-950 text-cyan-400 border border-slate-800">
                      {guide.faultCode}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        guide.severity === 'critical'
                          ? 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                          : 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                      }`}
                    >
                      {guide.severity}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 line-clamp-1">{guide.title}</h4>
                  <p className="mt-1 text-xs text-slate-400 line-clamp-2 leading-relaxed">
                    {guide.symptom}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60">
                    <span className="font-medium text-cyan-300">{guide.equipmentCategory} Machinery</span>
                    <span>{guide.diagnosticSteps.length} Diagnostic Steps</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Active Interactive Diagnostic Tree & Solution (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Guide Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-5">
            {/* Guide Header */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-800">
              <div className="space-y-1.5">
                <div className="flex items-center space-x-2">
                  <span className="px-2.5 py-1 rounded bg-cyan-950 font-mono font-bold text-cyan-300 text-xs border border-cyan-800/50">
                    {activeGuide.faultCode}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-medium">
                    Category: {activeGuide.equipmentCategory}
                  </span>
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      activeGuide.severity === 'critical'
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {activeGuide.severity} Severity
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-white tracking-tight">{activeGuide.title}</h2>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
                  <strong className="text-cyan-400 font-semibold block mb-0.5">Reported Symptom:</strong>
                  {activeGuide.symptom}
                </p>
              </div>

              {/* Equipment Association Pill */}
              <div className="text-right sm:min-w-[180px] p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Matched Equipment</span>
                <span className="text-xs font-bold text-cyan-300 block line-clamp-1 mt-0.5">
                  {targetEquipment.name}
                </span>
                <span className="text-[11px] font-mono text-slate-400 block mt-0.5">
                  Health: <strong className="text-white">{targetEquipment.healthScore}%</strong> | {targetEquipment.tag}
                </span>
              </div>
            </div>

            {/* Root Cause Probability Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Probable Root Causes (Bayesian Triage)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {activeGuide.possibleCauses.map((cause, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between"
                  >
                    <span className="text-xs text-slate-300 font-medium leading-snug">
                      {cause.cause}
                    </span>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Likelihood</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">{cause.probability}%</span>
                    </div>
                    <div className="mt-1 w-full bg-slate-800 rounded-full h-1 overflow-hidden">
                      <div
                        className="bg-cyan-500 h-1 rounded-full"
                        style={{ width: `${cause.probability}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Step-by-Step Diagnostic Workflow Checklist */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Step-by-Step Diagnostic Tree
                </span>
                <span className="text-xs text-slate-400">
                  Completed {Object.values(completedSteps).filter(Boolean).length} of {activeGuide.diagnosticSteps.length}
                </span>
              </div>

              <div className="space-y-3">
                {activeGuide.diagnosticSteps.map((step) => {
                  const isChecked = !!completedSteps[step.stepNumber];
                  return (
                    <div
                      key={step.stepNumber}
                      onClick={() => toggleStep(step.stepNumber)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        isChecked
                          ? 'bg-cyan-950/20 border-cyan-500/40'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <button className="mt-0.5 text-cyan-400">
                          {isChecked ? (
                            <CheckSquare className="w-5 h-5 text-cyan-400" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-600 hover:text-slate-400" />
                          )}
                        </button>
                        <div className="flex-1 space-y-1.5">
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                              STEP {step.stepNumber}
                            </span>
                            <span className="text-xs font-semibold text-slate-200">
                              {step.checklistQuestion}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 leading-relaxed">{step.instruction}</p>

                          {step.safetyWarning && (
                            <div className="flex items-center space-x-1.5 text-[11px] text-amber-300 bg-amber-950/40 px-2.5 py-1 rounded-md border border-amber-800/40 mt-1">
                              <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                              <span>{step.safetyWarning}</span>
                            </div>
                          )}

                          {step.telemetryCheck && (
                            <div className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2.5 py-1 rounded-md border border-cyan-800/40 mt-1 inline-block">
                              ⚡ Sensor Cross-Check: {step.telemetryCheck}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recommended Solutions / Corrective Actions */}
            <div className="space-y-3 pt-3 border-t border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Standard Corrective Action & Spare Parts
              </span>

              <div className="space-y-3">
                {activeGuide.recommendedSolutions.map((sol, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 hover:border-slate-700 transition space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="w-6 h-6 rounded-full bg-cyan-500/10 text-cyan-400 flex items-center justify-center font-mono font-bold text-xs border border-cyan-500/20">
                          {idx + 1}
                        </span>
                        <h4 className="text-sm font-bold text-slate-100">{sol.action}</h4>
                      </div>
                      <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 whitespace-nowrap self-start sm:self-auto">
                        Skill: {sol.skillLevel}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        <span>Estimated Downtime: <strong className="text-slate-200">{sol.estimatedTime}</strong></span>
                      </div>
                      <div className="flex items-center space-x-2 text-slate-400">
                        <Package className="w-4 h-4 text-indigo-400" />
                        <span>Spare Parts: <strong className="text-slate-200">{sol.requiredParts.join(', ')}</strong></span>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button
                        onClick={() => handleCreateWorkOrderFromDiagnosis(idx)}
                        className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20 transition-all active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Create Work Order From This Action</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Prevention Tips */}
            {activeGuide.preventionTips.length > 0 && (
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                  Predictive Maintenance & Recurrence Prevention
                </span>
                <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
                  {activeGuide.preventionTips.map((tip, i) => (
                    <li key={i} className="leading-relaxed">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
