import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { IncidentStore } from '../services/incidentStore';
import { LiveIncidentMap } from '../components/LiveIncidentMap';

interface IncidentStatusPageProps {
  onNavigate: (page: string, params?: any) => void;
  incidentId?: string;
}

export const IncidentStatusPage: React.FC<IncidentStatusPageProps> = ({
  onNavigate,
  incidentId: initialId
}) => {
  const [incidents, setIncidents] = useState<Incident[]>(IncidentStore.getIncidents());
  const [responders, setResponders] = useState(IncidentStore.getResponders());
  const [searchId, setSearchId] = useState(initialId || incidents[0]?.id || '1042');

  // Real-time reactive subscription
  useEffect(() => {
    const unsub = IncidentStore.subscribe(() => {
      setIncidents(IncidentStore.getIncidents());
      setResponders(IncidentStore.getResponders());
    });
    return unsub;
  }, []);

  const incident = incidents.find(i => i.id === searchId) || incidents[0];
  const assignedResponder = incident?.assigned_responder_id
    ? responders.find(r => r.id === incident.assigned_responder_id)
    : undefined;

  // Calculate live distance in meters between responder and incident
  let distanceMeters: number | null = null;
  if (incident && assignedResponder) {
    const dLat = (incident.latitude - assignedResponder.latitude) * 111000;
    const dLng = (incident.longitude - assignedResponder.longitude) * 111000 * Math.cos((incident.latitude * Math.PI) / 180);
    distanceMeters = Math.round(Math.sqrt(dLat * dLat + dLng * dLng));
  }

  // Determine active step index
  // 0: REPORTED, 1: AI_ANALYZED, 2: DISPATCHED, 3: ON_SCENE (IN_PROGRESS), 4: RESOLVED
  const getStepIndex = (status: string) => {
    switch (status) {
      case 'REPORTED': return 0;
      case 'AI_ANALYZED': case 'PENDING': return 1;
      case 'DISPATCHED': return 2;
      case 'IN_PROGRESS': return 3;
      case 'RESOLVED': return 4;
      default: return 0;
    }
  };

  const currentStep = incident ? getStepIndex(incident.status) : 0;

  const steps = [
    { label: 'Report Ingested', desc: 'Civilian / Sensor Trigger' },
    { label: 'AI Triaged', desc: 'NLP Priority & Units' },
    { label: 'Unit Dispatched', desc: 'Sirens & Field Route' },
    { label: 'On Scene', desc: 'Active Intervention' },
    { label: 'Scene Resolved', desc: 'Stabilized & Cleared' }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REPORTED': return 'text-slate-300 bg-slate-800 border-slate-700';
      case 'AI_ANALYZED': return 'text-cyan-400 bg-cyan-950/60 border-cyan-800';
      case 'PENDING': return 'text-amber-400 bg-amber-950/60 border-amber-800';
      case 'DISPATCHED': return 'text-rose-400 bg-rose-950/60 border-rose-800';
      case 'IN_PROGRESS': return 'text-indigo-400 bg-indigo-950/60 border-indigo-800';
      case 'RESOLVED': return 'text-emerald-400 bg-emerald-950/60 border-emerald-800';
      default: return 'text-slate-400 bg-slate-800 border-slate-700';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header & Search Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-xs font-mono font-bold tracking-widest text-emerald-400 uppercase">
                Real-Time Incident Telemetry Link Active
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white uppercase tracking-tight mt-1">
              Live Incident Status Tracker
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Live automated updates streaming from dispatcher CAD and responder mobile beacons.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value.trim())}
              placeholder="Enter Incident # (e.g. 1042)"
              className="bg-slate-900 border border-slate-700 focus:border-red-500 rounded-lg px-3 py-1.5 text-xs text-white font-mono w-44"
            />
            <button
              onClick={() => {}}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-white rounded-lg border border-slate-700 cursor-pointer"
            >
              Track
            </button>
          </div>
        </div>

        {incident ? (
          <div className="space-y-6">
            {/* Top Tactical Stepper */}
            <div className="p-6 rounded-xl bg-slate-900/90 border border-slate-800 shadow-2xl">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center justify-between">
                <span>Operation Pipeline Progress</span>
                <span className="font-mono text-cyan-400">Status: {incident.status}</span>
              </div>

              {/* Stepper Track */}
              <div className="grid grid-cols-5 gap-2 relative">
                {steps.map((st, idx) => {
                  const isPast = idx < currentStep;
                  const isCurrent = idx === currentStep;
                  return (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs font-bold transition-all ${
                          isPast
                            ? 'bg-emerald-600 text-white shadow-[0_0_12px_rgba(16,185,129,0.5)]'
                            : isCurrent
                            ? 'bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.8)] animate-pulse'
                            : 'bg-slate-800 text-slate-500 border border-slate-700'
                        }`}
                      >
                        {isPast ? '✓' : `0${idx + 1}`}
                      </div>
                      <div className="mt-2 text-xs font-bold text-white leading-tight">
                        {st.label}
                      </div>
                      <div className="text-[10px] text-slate-400 hidden sm:block mt-0.5">
                        {st.desc}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Responder Live Intercept Telemetry Card (If Dispatched or In Progress) */}
            {assignedResponder && incident.status !== 'RESOLVED' && (
              <div className="p-5 rounded-xl bg-slate-900/90 border border-amber-500/40 shadow-xl relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-amber-950/80 border border-amber-500/60 flex items-center justify-center text-2xl shadow-lg">
                      {assignedResponder.type === 'AMBULANCE' ? '🚑' : assignedResponder.type === 'POLICE' ? '🚓' : '🚒'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-amber-400 uppercase">
                          Live Unit Intercept Telemetry
                        </span>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-0.5">
                        {assignedResponder.callsign} · {assignedResponder.name}
                      </h3>
                      <p className="text-xs text-slate-400">
                        Responder Direct Hotline: <span className="font-mono text-cyan-300">{assignedResponder.phone}</span>
                      </p>
                    </div>
                  </div>

                  {/* Real-time Distance & ETA Clock */}
                  <div className="flex items-center gap-4 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Distance to Scene</span>
                      <span className="text-xl font-bold font-mono text-white">
                        {distanceMeters !== null
                          ? distanceMeters < 50
                            ? 'On Scene'
                            : `${distanceMeters} m`
                          : 'Calculating'}
                      </span>
                    </div>
                    <div className="h-8 w-px bg-slate-800" />
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-mono">Live ETA</span>
                      <span className="text-xl font-bold font-mono text-cyan-400">
                        {assignedResponder.eta_minutes !== undefined && assignedResponder.eta_minutes > 0
                          ? `~${assignedResponder.eta_minutes.toFixed(1)} min`
                          : 'Arrived'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Overview & Live Map Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Incident Details Card */}
              <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-xs font-mono font-bold text-cyan-400">Incident #{incident.id}</span>
                    <h2 className="text-lg font-bold text-white mt-0.5">{incident.title}</h2>
                    <p className="text-xs text-slate-400">📍 {incident.address}</p>
                  </div>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold border ${getStatusColor(incident.status)}`}>
                    {incident.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Category</span>
                    <span className="font-semibold text-white mt-0.5 block">{incident.type}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded border border-slate-800">
                    <span className="text-[10px] text-slate-400 uppercase block">Severity Priority</span>
                    <span className="font-bold text-red-400 mt-0.5 block">{incident.severity}</span>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase block mb-1">
                    AI Situational Analysis
                  </span>
                  <p className="text-xs text-slate-300 bg-slate-950 p-3 rounded border border-slate-800/80 leading-relaxed">
                    "{incident.ai_summary}"
                  </p>
                </div>
              </div>

              {/* Live Tracking Map Pinpoint */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-300 uppercase flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                    <span>Live GPS Position</span>
                  </span>
                  <span className="text-slate-500 font-mono">
                    {incident.latitude.toFixed(4)}, {incident.longitude.toFixed(4)}
                  </span>
                </div>

                <LiveIncidentMap
                  incidents={[incident]}
                  responders={assignedResponder ? [assignedResponder] : responders}
                  selectedIncidentId={incident.id}
                  heightClass="h-[280px]"
                  zoom={14}
                  center={[incident.latitude, incident.longitude]}
                />
              </div>
            </div>

            {/* Milestone Timeline */}
            <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-6 flex items-center gap-2">
                <span>Real-Time Operation Milestones & Dispatch Log</span>
                <span className="text-[11px] text-slate-500 font-normal font-mono">({incident.updates.length} events logged)</span>
              </h3>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {incident.updates.map((upd, idx) => (
                  <div key={upd.id || idx} className="relative group">
                    <span className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-slate-900 border-2 border-cyan-400 group-hover:scale-125 transition-transform" />

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{upd.timestamp}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs font-semibold text-white uppercase">{upd.status.replace('_', ' ')}</span>
                      </div>
                      <span className="text-[11px] text-slate-500 font-mono">By: {upd.author}</span>
                    </div>

                    <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-950/40 p-2.5 rounded border border-slate-800/60">
                      {upd.note}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center rounded-xl bg-slate-900/50 border border-slate-800 text-slate-400">
            <p className="text-sm">Incident not found. Please verify the Incident ID.</p>
          </div>
        )}
      </div>
    </div>
  );
};
