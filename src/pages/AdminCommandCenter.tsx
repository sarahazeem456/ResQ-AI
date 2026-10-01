import React, { useState, useEffect } from 'react';
import { CommandStats, Incident, IncidentStatus, Responder, SeverityLevel } from '../types';
import { IncidentStore } from '../services/incidentStore';
import { RealtimeSync, SyncStatusInfo, SyncMode } from '../services/realtimeSync';
import { LiveIncidentMap } from '../components/LiveIncidentMap';
import { AiAssistantModal } from '../components/AiAssistantModal';
import { AnalyticsSection } from '../components/AnalyticsSection';
import { SupabaseConfigModal } from '../components/SupabaseConfigModal';

interface AdminCommandCenterProps {
  onNavigate: (page: string, params?: any) => void;
  stats: CommandStats;
  selectedIncidentId?: string | null;
}

export const AdminCommandCenter: React.FC<AdminCommandCenterProps> = ({
  onNavigate,
  stats: initialStats,
  selectedIncidentId: initialSelectedId
}) => {
  const [incidents, setIncidents] = useState<Incident[]>(IncidentStore.getIncidents());
  const [responders, setResponders] = useState<Responder[]>(IncidentStore.getResponders());
  const [stats, setStats] = useState<CommandStats>(IncidentStore.getStats());
  const [simSpeed, setSimSpeed] = useState<number>(IncidentStore.getSimulationSpeed());
  const [syncStatus, setSyncStatus] = useState<SyncStatusInfo>(RealtimeSync.getStatus());
  const [newArrivalId, setNewArrivalId] = useState<string | null>(null);
  const [isManualSyncing, setIsManualSyncing] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<'map_table' | 'analytics'>('map_table');
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(
    initialSelectedId ? incidents.find(i => i.id === initialSelectedId) || null : null
  );
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);
  const [dispatchModalIncident, setDispatchModalIncident] = useState<Incident | null>(null);

  // Poll IncidentStore every 3 seconds to fetch the latest incident data and refresh map markers and table rows automatically
  useEffect(() => {
    const pollInterval = setInterval(() => {
      const latestIncidents = IncidentStore.getIncidents();
      const latestResponders = IncidentStore.getResponders();
      const latestStats = IncidentStore.getStats();

      setIncidents(latestIncidents);
      setResponders(latestResponders);
      setStats(latestStats);

      if (selectedIncident) {
        const updated = latestIncidents.find(i => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [selectedIncident]);

  // Subscribe to real-time events and movement updates
  useEffect(() => {
    // 1. Subscribe to IncidentStore events
    const unsubStore = IncidentStore.subscribe(() => {
      const freshIncidents = IncidentStore.getIncidents();
      setIncidents(freshIncidents);
      setResponders(IncidentStore.getResponders());
      setStats(IncidentStore.getStats());

      if (selectedIncident) {
        const updated = freshIncidents.find(i => i.id === selectedIncident.id);
        if (updated) setSelectedIncident(updated);
      }
    });

    // 2. Subscribe to RealtimeSync polling and streaming
    const unsubSyncIncidents = RealtimeSync.subscribeIncidents((fresh, newArrivals) => {
      setIncidents(fresh);
      if (newArrivals.length > 0) {
        const latest = newArrivals[0];
        setNewArrivalId(latest.id);
        // Clear highlight after 6 seconds
        setTimeout(() => {
          setNewArrivalId(prev => (prev === latest.id ? null : prev));
        }, 6000);
      }
    });

    const unsubSyncStatus = RealtimeSync.subscribeStatus(status => {
      setSyncStatus(status);
    });

    return () => {
      unsubStore();
      unsubSyncIncidents();
      unsubSyncStatus();
    };
  }, [selectedIncident]);

  const handleSetSpeed = (speed: number) => {
    IncidentStore.setSimulationSpeed(speed);
    setSimSpeed(speed);
  };

  const handleSimulateCall = () => {
    const newInc = IncidentStore.simulateIncomingIncident();
    setSelectedIncident(newInc);
    setNewArrivalId(newInc.id);
  };

  const handleManualSync = async () => {
    setIsManualSyncing(true);
    await RealtimeSync.syncNow();
    setTimeout(() => setIsManualSyncing(false), 350);
  };

  // Filtered incidents for table with strict ID deduplication guarantee
  const filteredIncidents = React.useMemo(() => {
    const list = incidents.filter(inc => {
      if (severityFilter !== 'ALL' && inc.severity !== severityFilter) return false;
      if (statusFilter !== 'ALL' && inc.status !== statusFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const match =
          inc.id.includes(q) ||
          inc.title.toLowerCase().includes(q) ||
          inc.address.toLowerCase().includes(q) ||
          inc.type.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });

    const seen = new Set<string>();
    return list.filter(item => {
      if (!item || !item.id || seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [incidents, severityFilter, statusFilter, searchQuery]);

  const handleQuickDispatch = (incident: Incident, responder: Responder) => {
    IncidentStore.dispatchResponder(
      incident.id,
      responder.id,
      `Direct Command Dispatch: Assigned Unit ${responder.callsign} (${responder.name}) with Priority 1 sirens.`
    );
    setDispatchModalIncident(null);
  };

  const handleResolve = (incident: Incident) => {
    IncidentStore.markIncidentResolved(incident.id, 'Resolved via Command Center Operations Console.');
  };

  const getSeverityBadgeClass = (sev: SeverityLevel) => {
    switch (sev) {
      case 'CRITICAL': return 'text-red-400 bg-red-950/70 border-red-800';
      case 'HIGH': return 'text-amber-400 bg-amber-950/70 border-amber-800';
      case 'MEDIUM': return 'text-yellow-400 bg-yellow-950/70 border-yellow-800';
      case 'LOW': return 'text-emerald-400 bg-emerald-950/70 border-emerald-800';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 space-y-6">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse-fast"></span>
            <span className="text-xs font-mono font-bold tracking-widest text-red-400 uppercase">
              Tactical Operations Command
            </span>
            <span className="text-slate-600">·</span>
            <span className="text-xs text-slate-400 font-mono">SECTOR METRO CENTRAL</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white uppercase mt-0.5">
            Emergency Command Center
          </h1>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          {/* Tab Switcher */}
          <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('map_table')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'map_table'
                  ? 'bg-slate-800 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Operations & Map
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                activeTab === 'analytics'
                  ? 'bg-slate-800 text-white font-semibold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Analytics
            </button>
          </div>

          <button
            onClick={() => setIsSupabaseModalOpen(true)}
            className="px-3.5 py-1.5 bg-emerald-950/80 hover:bg-emerald-900/90 text-emerald-300 border border-emerald-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-emerald-950/50"
            title="Configure and monitor Supabase PostgreSQL database"
          >
            <span>⚡ Supabase DB</span>
          </button>

          <button
            onClick={() => setIsAiModalOpen(true)}
            className="px-3.5 py-1.5 bg-cyan-950/80 hover:bg-cyan-900/90 text-cyan-300 border border-cyan-700/60 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-lg shadow-cyan-950/50"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
            <span>Ask AI Assistant</span>
          </button>

          <button
            onClick={() => onNavigate('report')}
            className="px-3.5 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold tracking-wide transition-colors cursor-pointer shadow-md"
          >
            + New Incident
          </button>
        </div>
      </div>

      {/* Real-Time Live Telemetry & Simulation Controller Bar */}
      <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Connection Status & Mode Telemetry */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className={`flex items-center gap-2 bg-slate-950 px-2.5 py-1 rounded border ${
              syncStatus.state === 'CONNECTED' ? 'border-emerald-900/80 text-emerald-400' :
              syncStatus.state === 'SYNCING' ? 'border-cyan-900/80 text-cyan-300' :
              'border-amber-900/80 text-amber-300'
            }`}>
              <span className={`w-2 h-2 rounded-full ${
                syncStatus.state === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' :
                syncStatus.state === 'SYNCING' ? 'bg-cyan-400 animate-spin' :
                'bg-amber-400'
              }`}></span>
              <span className="text-xs font-mono font-bold uppercase">
                {syncStatus.mode === 'STREAM' ? 'SOCKET STREAM: CONNECTED' : `POLLING ACTIVE (${syncStatus.pollingIntervalMs}ms)`}
              </span>
            </div>

            <div className="text-xs font-mono text-slate-400 flex items-center gap-2">
              <span>Latency: <strong className="text-white">{syncStatus.latencyMs}ms</strong></span>
              <span className="text-slate-600">·</span>
              <span>Polls: <strong className="text-white">{syncStatus.totalPolls}</strong></span>
              <span className="text-slate-600">·</span>
              <span>Last Sync: <strong className="text-cyan-300">{syncStatus.lastSyncTimestamp}</strong></span>
            </div>
          </div>

          {/* Sync Mode Switcher & Polling Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Mode Toggle */}
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => RealtimeSync.setMode('STREAM')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  syncStatus.mode === 'STREAM'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Stream Push
              </button>
              <button
                type="button"
                onClick={() => RealtimeSync.setMode('POLLING')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  syncStatus.mode === 'POLLING'
                    ? 'bg-amber-600 text-white font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Polling
              </button>
            </div>

            {/* Polling Interval Selectors */}
            {syncStatus.mode === 'POLLING' && (
              <div className="flex items-center gap-1 bg-slate-950 px-2 py-1 rounded border border-slate-800 text-xs font-mono">
                <span className="text-slate-500 text-[10px]">Freq:</span>
                {[1000, 2000, 5000].map(ms => (
                  <button
                    key={ms}
                    type="button"
                    onClick={() => RealtimeSync.setPollingInterval(ms)}
                    className={`px-1.5 py-0.5 rounded text-[10px] cursor-pointer ${
                      syncStatus.pollingIntervalMs === ms
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {ms / 1000}s
                  </button>
                ))}
              </div>
            )}

            {/* Manual Sync Now */}
            <button
              type="button"
              onClick={handleManualSync}
              disabled={isManualSyncing}
              className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span className={isManualSyncing ? 'animate-spin' : ''}>↻</span>
              <span>Sync Now</span>
            </button>
          </div>
        </div>

        {/* Secondary Operational Controls: Simulation Speed & Quick Call Injection */}
        <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px] font-semibold uppercase">Responder Vehicle Movement:</span>
            <div className="flex items-center gap-1 bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800 font-mono">
              {[1, 2, 5].map(spd => (
                <button
                  key={spd}
                  type="button"
                  onClick={() => handleSetSpeed(spd)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                    simSpeed === spd
                      ? 'bg-cyan-500 text-slate-950'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {spd}x
                </button>
              ))}
            </div>
            <span className="text-[11px] text-slate-500 hidden md:inline">
              (Live GPS tick updates vehicle coordinates toward scene)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSimulateCall}
              className="px-3 py-1 bg-red-600/20 hover:bg-red-600/40 text-red-300 border border-red-500/40 rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>⚡ Trigger Incoming Crisis Call</span>
            </button>

            <button
              type="button"
              onClick={() => {
                IncidentStore.resetToDemo();
                setSelectedIncident(null);
                setNewArrivalId(null);
              }}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded text-xs border border-slate-700 cursor-pointer"
            >
              ↺ Reset
            </button>
          </div>
        </div>
      </div>

      {/* New Incident Arrival Alert Banner */}
      {newArrivalId && (
        <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-500/70 shadow-lg flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping"></span>
            <div>
              <span className="text-xs font-mono font-bold text-red-300 uppercase tracking-wider">
                Real-Time Database Ingestion Event
              </span>
              <p className="text-xs text-white mt-0.5">
                New emergency incident <strong className="font-mono text-cyan-300">#{newArrivalId}</strong> detected in database. Marker & table synchronized.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const target = incidents.find(i => i.id === newArrivalId);
                if (target) setSelectedIncident(target);
              }}
              className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-semibold cursor-pointer"
            >
              Inspect on Map →
            </button>
            <button
              type="button"
              onClick={() => setNewArrivalId(null)}
              className="text-slate-400 hover:text-white text-xs p-1 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Top Statistics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            Active Incidents
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-white mt-1">
            {stats.active_incidents}
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Requiring command oversight</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-red-900/50 shadow-md">
          <div className="text-[11px] font-semibold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Critical</span>
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-red-400 mt-1">
            {stats.critical}
          </div>
          <div className="text-[11px] text-red-300/70 mt-1">Immediate life hazard</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-amber-900/50 shadow-md">
          <div className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">
            High Priority
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-amber-400 mt-1">
            {stats.high_priority}
          </div>
          <div className="text-[11px] text-amber-300/70 mt-1">Dispatched or queued</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md">
          <div className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider">
            Resolved Today
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400 mt-1">
            {stats.resolved_today}
          </div>
          <div className="text-[11px] text-emerald-300/70 mt-1">Scene secured & cleared</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 shadow-md col-span-2 sm:col-span-1">
          <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider">
            Average Response Time
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono text-cyan-300 mt-1">
            {stats.average_response_time_min}m
          </div>
          <div className="text-[11px] text-cyan-300/70 mt-1">Target benchmark: &lt; 6.0m</div>
        </div>
      </div>

      {/* Main View: Operations Map & Incident Table OR Analytics */}
      {activeTab === 'map_table' ? (
        <div className="space-y-6">
          {/* Live Incident Map Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>Live Incident Map (Leaflet & OpenStreetMap)</span>
              </h2>
              <span className="text-xs text-slate-500">
                Click any marker for tactical popup details
              </span>
            </div>

            <LiveIncidentMap
              incidents={incidents}
              responders={responders}
              selectedIncidentId={selectedIncident?.id}
              onSelectIncident={inc => setSelectedIncident(inc)}
              heightClass="h-[420px]"
            />
          </div>

          {/* Selected Incident Drawer / Quick Action Bar if selected */}
          {selectedIncident && (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-700 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-400">Selected Incident #{selectedIncident.id}</span>
                  <span className="text-slate-600">·</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(selectedIncident.severity)}`}>
                    {selectedIncident.severity}
                  </span>
                  <span className="text-xs text-slate-300 font-semibold">{selectedIncident.type}</span>
                </div>
                <p className="text-xs text-white font-medium">{selectedIncident.title}</p>
                <p className="text-[11px] text-slate-400">📍 {selectedIncident.address} · Casualties: {selectedIncident.people_affected}</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => onNavigate('details', { id: selectedIncident.id })}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  View Full File
                </button>
                {selectedIncident.status !== 'DISPATCHED' && selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => setDispatchModalIncident(selectedIncident)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-semibold shadow cursor-pointer"
                  >
                    Dispatch Unit
                  </button>
                )}
                {selectedIncident.status !== 'RESOLVED' && (
                  <button
                    onClick={() => handleResolve(selectedIncident)}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="text-slate-500 hover:text-slate-300 text-xs p-1"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Incident Table Filter & Search Controls */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-semibold uppercase">Filter Severity:</span>
                {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => (
                  <button
                    key={s}
                    onClick={() => setSeverityFilter(s)}
                    className={`px-2.5 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                      severityFilter === s
                        ? 'bg-slate-800 text-white font-semibold border border-slate-600'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-3">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="REPORTED">REPORTED</option>
                  <option value="AI_ANALYZED">AI_ANALYZED</option>
                  <option value="DISPATCHED">DISPATCHED</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="RESOLVED">RESOLVED</option>
                </select>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search ID, title, street..."
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-500 w-48 sm:w-60"
                />
              </div>
            </div>

            {/* Incident Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-2.5 px-3">ID</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Severity</th>
                    <th className="py-2.5 px-3">Location</th>
                    <th className="py-2.5 px-3">Time</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredIncidents.map((inc, index) => {
                    const isNewArrival = inc.id === newArrivalId;
                    return (
                      <tr
                        key={`${inc.id}-${index}`}
                        onClick={() => setSelectedIncident(inc)}
                        className={`transition-all cursor-pointer ${
                          isNewArrival
                            ? 'bg-red-950/60 border-l-4 border-red-500 shadow-[inset_0_0_15px_rgba(239,68,68,0.3)] animate-pulse'
                            : selectedIncident?.id === inc.id
                            ? 'bg-slate-800/50'
                            : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-3 px-3 font-mono font-bold text-cyan-400 whitespace-nowrap">
                          #{inc.id}
                          {inc.is_sos && <span className="ml-1 text-[10px] text-red-400 font-bold">SOS</span>}
                          {isNewArrival && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-red-600 text-white text-[9px] font-extrabold uppercase animate-bounce inline-block">
                              NEW
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                          {inc.type}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadgeClass(inc.severity)}`}>
                            {inc.severity}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-300 max-w-xs truncate" title={inc.address}>
                          {inc.address}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                          {inc.updates[0]?.timestamp || 'Recent'}
                        </td>
                        <td className="py-3 px-3 whitespace-nowrap">
                          <span className="font-mono text-xs font-semibold text-slate-300">
                            {inc.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right whitespace-nowrap space-x-2">
                          <button
                            type="button"
                            onClick={e => {
                              e.stopPropagation();
                              onNavigate('details', { id: inc.id });
                            }}
                            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-semibold border border-slate-700 cursor-pointer"
                          >
                            View
                          </button>
                          {inc.status !== 'DISPATCHED' && inc.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                setDispatchModalIncident(inc);
                              }}
                              className="px-2.5 py-1 bg-amber-600/80 hover:bg-amber-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Dispatch
                            </button>
                          )}
                          {inc.status !== 'RESOLVED' && (
                            <button
                              type="button"
                              onClick={e => {
                                e.stopPropagation();
                                handleResolve(inc);
                              }}
                              className="px-2.5 py-1 bg-emerald-600/80 hover:bg-emerald-600 text-white rounded text-[11px] font-semibold cursor-pointer"
                            >
                              Resolve
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                  {filteredIncidents.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No incidents match current filter criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Analytics View */
        <AnalyticsSection incidents={incidents} />
      )}

      {/* Quick Dispatch Modal */}
      {dispatchModalIncident && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-sm font-bold text-white uppercase">
                  Tactical Unit Dispatch · Incident #{dispatchModalIncident.id}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">{dispatchModalIncident.title}</p>
              </div>
              <button
                onClick={() => setDispatchModalIncident(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="text-xs text-slate-300">
              AI Recommended Units: <strong className="text-cyan-300">{dispatchModalIncident.recommended_services.join(', ')}</strong>
            </div>

            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Available Sector Responders:</span>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {responders.map((r, idx) => (
                  <div
                    key={`${r.id}-${idx}`}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{r.type === 'AMBULANCE' ? '🚑' : r.type === 'POLICE' ? '🚓' : r.type === 'FIRE' ? '🚒' : '🛟'}</span>
                        <span>{r.callsign} · {r.name}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Status: <span className="text-emerald-400">{r.status}</span> · ETA to sector: {r.eta_minutes || 4}m
                      </div>
                    </div>
                    <button
                      onClick={() => handleQuickDispatch(dispatchModalIncident, r)}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white rounded text-xs font-bold cursor-pointer"
                    >
                      Dispatch
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Assistant Modal */}
      <AiAssistantModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        incidents={incidents}
        onSelectIncident={inc => {
          setSelectedIncident(inc);
          setIsAiModalOpen(false);
        }}
      />

      {/* Supabase PostgreSQL & Architecture Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
      />
    </div>
  );
};
