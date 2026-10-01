import React, { useState, useEffect } from 'react';
import { Incident, Responder } from '../types';
import { IncidentStore } from '../services/incidentStore';
import { AIAnalysisCard } from '../components/AIAnalysisCard';
import { LiveIncidentMap } from '../components/LiveIncidentMap';

interface IncidentDetailsPageProps {
  incidentId: string;
  onNavigate: (page: string, params?: any) => void;
}

export const IncidentDetailsPage: React.FC<IncidentDetailsPageProps> = ({
  incidentId,
  onNavigate
}) => {
  const [incident, setIncident] = useState<Incident | undefined>(
    IncidentStore.getIncidentById(incidentId)
  );
  const responders = IncidentStore.getResponders();
  const [selectedResponderId, setSelectedResponderId] = useState<string>('');
  const [resolutionNote, setResolutionNote] = useState('');
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [showDispatchModal, setShowDispatchModal] = useState(false);
  const [elapsedMinutes, setElapsedMinutes] = useState(0);

  // Sync with store updates
  useEffect(() => {
    const unsub = IncidentStore.subscribe(() => {
      setIncident(IncidentStore.getIncidentById(incidentId));
    });
    return unsub;
  }, [incidentId]);

  // Elapsed response timer
  useEffect(() => {
    if (!incident) return;
    const calc = () => {
      const created = new Date(incident.created_at).getTime();
      const diff = Math.floor((Date.now() - created) / 60000);
      setElapsedMinutes(Math.max(diff, 1));
    };
    calc();
    const interval = setInterval(calc, 30000);
    return () => clearInterval(interval);
  }, [incident]);

  if (!incident) {
    return (
      <div className="min-h-screen bg-slate-950 p-12 text-center text-slate-400">
        <p>Incident not found.</p>
        <button
          onClick={() => onNavigate('admin')}
          className="mt-4 px-4 py-2 bg-slate-800 text-white rounded text-xs"
        >
          Return to Command Center
        </button>
      </div>
    );
  }

  const handleDispatch = (responderId: string) => {
    IncidentStore.dispatchResponder(incident.id, responderId);
    setShowDispatchModal(false);
  };

  const handleResolve = () => {
    IncidentStore.markIncidentResolved(incident.id, resolutionNote);
    setShowResolveModal(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-8 px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & Status Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('admin')}
              className="text-xs text-slate-400 hover:text-white border border-slate-800 px-2.5 py-1.5 rounded bg-slate-900 cursor-pointer"
            >
              ← Back to Ops
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-cyan-400">Incident #{incident.id}</span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400 font-semibold">{incident.type}</span>
                {incident.is_sos && (
                  <span className="text-[10px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800">
                    SOS BEACON
                  </span>
                )}
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mt-0.5">{incident.title}</h1>
            </div>
          </div>

          {/* Incident Control Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {incident.status !== 'DISPATCHED' && incident.status !== 'RESOLVED' && (
              <button
                onClick={() => setShowDispatchModal(true)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold tracking-wide uppercase transition-colors shadow-lg cursor-pointer"
              >
                ⚡ Dispatch
              </button>
            )}

            {incident.status !== 'RESOLVED' && (
              <button
                onClick={() => setShowResolveModal(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold tracking-wide uppercase transition-colors shadow-lg cursor-pointer"
              >
                ✓ Mark Resolved
              </button>
            )}

            <button
              onClick={() => onNavigate('status', { id: incident.id })}
              className="px-3 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg text-xs font-medium cursor-pointer"
            >
              Public Tracker
            </button>
          </div>
        </div>

        {/* Tactical Key Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Triage Severity</span>
            <span className="text-lg font-bold text-red-400 mt-1 block">{incident.severity}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Casualties / Affected</span>
            <span className="text-lg font-bold font-mono text-white mt-1 block">{incident.people_affected}</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Response Timer</span>
            <span className="text-lg font-bold font-mono text-cyan-400 mt-1 block">
              {incident.status === 'RESOLVED' ? 'Closed' : `${elapsedMinutes}m elapsed`}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase font-semibold block">Assigned Unit</span>
            <span className="text-xs font-bold text-white mt-1 block truncate">
              {incident.assigned_responder_name || 'Queued for Dispatch'}
            </span>
          </div>
        </div>

        {/* Main Content Layout: AI Analysis Card + Map Pinpoint */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI Analysis Card */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Intelligence Briefing & Protocols
            </h2>
            <AIAnalysisCard
              analysis={{
                category: incident.type,
                severity: incident.severity,
                summary: incident.ai_summary,
                people_affected: incident.people_affected,
                recommended_services: incident.recommended_services,
                recommended_actions: incident.recommended_actions,
                confidence: incident.ai_confidence
              }}
            />
          </div>

          {/* Sector Location & Map */}
          <div className="space-y-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Incident Map & Surroundings
            </h2>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs text-slate-300">
                <strong>Address:</strong> {incident.address}
              </div>
              <div className="text-[11px] font-mono text-slate-400">
                Coordinates: {incident.latitude.toFixed(5)}, {incident.longitude.toFixed(5)}
              </div>

              <LiveIncidentMap
                incidents={[incident]}
                responders={responders}
                selectedIncidentId={incident.id}
                heightClass="h-[300px]"
                zoom={14}
                center={[incident.latitude, incident.longitude]}
              />
            </div>
          </div>
        </div>

        {/* Incident Description & Dispatch Log Timeline */}
        <div className="p-6 rounded-xl bg-slate-900 border border-slate-800 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">
            Report Narrative & Timeline
          </h2>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
            "{incident.description}"
          </div>

          <div className="pt-4 border-t border-slate-800 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Operational Event Stream ({incident.updates.length})
            </h3>
            <div className="space-y-2">
              {incident.updates.map((u, i) => (
                <div key={u.id || i} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-cyan-400 text-xs font-bold">{u.timestamp}</span>
                    <span className="text-slate-600">·</span>
                    <span className="font-semibold text-white uppercase text-[11px]">{u.status}</span>
                    <span className="text-slate-400 ml-2">{u.note}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 font-mono">By: {u.author}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Dispatch Modal */}
      {showDispatchModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Assign Responder Unit</h3>
              <button onClick={() => setShowDispatchModal(false)} className="text-slate-400">✕</button>
            </div>
            <div className="space-y-2">
              {responders.map((r, idx) => (
                <button
                  key={`${r.id}-${idx}`}
                  onClick={() => handleDispatch(r.id)}
                  className="w-full p-3 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 flex items-center justify-between text-left cursor-pointer transition-colors"
                >
                  <div>
                    <div className="text-xs font-bold text-white">{r.callsign} · {r.name}</div>
                    <div className="text-[11px] text-slate-400">Type: {r.type} · ETA: {r.eta_minutes || 4}m</div>
                  </div>
                  <span className="text-xs text-red-400 font-bold">Assign →</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Resolve Modal */}
      {showResolveModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white uppercase">Close Incident #{incident.id}</h3>
              <button onClick={() => setShowResolveModal(false)} className="text-slate-400">✕</button>
            </div>
            <div>
              <label className="text-xs text-slate-300 block mb-1">Resolution Summary Note:</label>
              <textarea
                rows={3}
                value={resolutionNote}
                onChange={e => setResolutionNote(e.target.value)}
                placeholder="Scene secured, casualties transferred to trauma care..."
                className="w-full bg-slate-950 border border-slate-700 rounded p-2 text-xs text-white"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowResolveModal(false)}
                className="px-3 py-1.5 bg-slate-800 text-xs text-slate-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white rounded"
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
