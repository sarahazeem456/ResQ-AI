import React from 'react';
import { AIAnalysisResult, DuplicateDetectionResult } from '../types';

interface AIAnalysisCardProps {
  analysis: AIAnalysisResult;
  duplicateResult?: DuplicateDetectionResult;
  onMergeReports?: () => void;
  onCreateNewIncident?: () => void;
  compact?: boolean;
}

export const AIAnalysisCard: React.FC<AIAnalysisCardProps> = ({
  analysis,
  duplicateResult,
  onMergeReports,
  onCreateNewIncident,
  compact = false
}) => {
  const severityColors = {
    CRITICAL: {
      badge: 'text-red-400 bg-red-950/80 border-red-800/60',
      border: 'border-red-600/40',
      dot: 'bg-red-500'
    },
    HIGH: {
      badge: 'text-amber-400 bg-amber-950/80 border-amber-800/60',
      border: 'border-amber-600/40',
      dot: 'bg-amber-500'
    },
    MEDIUM: {
      badge: 'text-yellow-300 bg-yellow-950/80 border-yellow-800/60',
      border: 'border-yellow-600/40',
      dot: 'bg-yellow-400'
    },
    LOW: {
      badge: 'text-emerald-400 bg-emerald-950/80 border-emerald-800/60',
      border: 'border-emerald-600/40',
      dot: 'bg-emerald-500'
    }
  }[analysis.severity];

  const serviceBadges: Record<string, { label: string; icon: string }> = {
    AMBULANCE: { label: 'Ambulance (Paramedic)', icon: '🚑' },
    POLICE: { label: 'Police (Law Enforcement)', icon: '🚓' },
    FIRE: { label: 'Fire Suppression', icon: '🚒' },
    RESCUE: { label: 'Technical Rescue', icon: '🛟' }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Duplicate Alert Banner if detected */}
      {duplicateResult && duplicateResult.is_duplicate && duplicateResult.existing_incident && (
        <div className="p-4 rounded-lg bg-amber-950/40 border border-amber-500/50 shadow-lg">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-amber-300 font-semibold text-xs uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                <span>Possible Duplicate Incident Detected</span>
              </div>
              <p className="text-sm text-amber-100/90 mt-1">
                This report matches existing incident <strong className="text-white">#{duplicateResult.existing_incident.id} ({duplicateResult.existing_incident.title})</strong> situated in the same sector.
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-amber-300/80 font-mono">
                <span>Semantic & Spatial Similarity: <strong className="text-amber-200">{duplicateResult.similarity_score}%</strong></span>
                <span aria-hidden="true">·</span>
                <span>Reported {duplicateResult.existing_incident.updates[0]?.timestamp || 'recently'}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 shrink-0">
              {onMergeReports && (
                <button
                  type="button"
                  onClick={onMergeReports}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-500 rounded transition-colors whitespace-nowrap cursor-pointer"
                >
                  Merge Reports
                </button>
              )}
              {onCreateNewIncident && (
                <button
                  type="button"
                  onClick={onCreateNewIncident}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded transition-colors whitespace-nowrap cursor-pointer"
                >
                  Create New Incident
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main AI Incident Analysis Card */}
      <div className={`rounded-xl border ${severityColors.border} bg-slate-900/90 backdrop-blur-md p-5 shadow-2xl relative overflow-hidden`}>
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-red-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Card Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse"></span>
            <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
              AI Incident Analysis
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-slate-400">Model Confidence:</span>
            <span className="font-bold text-cyan-300">{analysis.confidence}%</span>
          </div>
        </div>

        {/* Primary Classification Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block">
              Emergency Category
            </span>
            <div className="text-sm font-semibold text-white mt-1 flex items-center gap-2">
              <span>{analysis.category}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block">
              Triage Severity
            </span>
            <div className="text-sm font-bold mt-1 flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${severityColors.dot}`}></span>
              <span className={severityColors.badge.split(' ')[0]}>{analysis.severity}</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block">
              Estimated Casualties / Affected
            </span>
            <div className="text-sm font-semibold text-white mt-1 font-mono">
              {analysis.people_affected} {analysis.people_affected === 1 ? 'person' : 'people'}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="mb-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-1">
            Situational Summary
          </span>
          <p className="text-xs sm:text-sm text-slate-200 bg-slate-950/40 p-3 rounded-lg border border-slate-800/80 leading-relaxed font-sans">
            "{analysis.summary}"
          </p>
        </div>

        {/* Recommended Services */}
        <div className="mb-4">
          <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-2">
            Recommended Units
          </span>
          <div className="flex flex-wrap gap-2">
            {analysis.recommended_services.map(svc => {
              const info = serviceBadges[svc] || { label: svc, icon: '🚨' };
              return (
                <div
                  key={svc}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/90 border border-slate-700 text-xs font-medium text-slate-200"
                >
                  <span>{info.icon}</span>
                  <span>{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recommended Actions */}
        {!compact && analysis.recommended_actions.length > 0 && (
          <div className="mb-4">
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wide block mb-2">
              Recommended Protocol Actions
            </span>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {analysis.recommended_actions.map((act, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-cyan-400 font-mono">0{idx + 1}.</span>
                  <span>{act}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Disclaimer */}
        <div className="pt-3 border-t border-slate-800 text-[11px] text-slate-400 italic">
          ⚠️ Operational Notice: This assessment is an automated AI triage recommendation and does not replace official emergency dispatch or medical protocols.
        </div>
      </div>
    </div>
  );
};
