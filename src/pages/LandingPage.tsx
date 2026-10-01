import React from 'react';
import { CommandStats } from '../types';

interface LandingPageProps {
  onNavigate: (page: string, params?: any) => void;
  stats: CommandStats;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, stats }) => {
  return (
    <div className="relative min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Background Tactical Grid & Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-red-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div className="text-center max-w-3xl mx-auto">
          {/* Operational Status Tagline */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/90 border border-slate-800 text-xs text-slate-300 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>ResQ Operational Grid Active</span>
            <span className="text-slate-600">·</span>
            <span className="font-mono text-cyan-400">Open-Source AI Triage</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white uppercase text-balance">
            RESQ AI
            <span className="block text-2xl sm:text-3xl font-semibold text-slate-300 mt-2 font-mono">
              Smart Emergency Response
            </span>
          </h1>

          <p className="mt-5 text-base sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Turn emergency reports into actionable intelligence. Automated real-time NLP classification, geospatial priority triage, duplicate cluster detection, and tactical responder dispatch.
          </p>

          {/* Primary Action Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => onNavigate('sos')}
              className="w-full sm:w-auto px-8 py-3.5 bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wider uppercase rounded-lg shadow-[0_0_25px_rgba(239,68,68,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping"></span>
              <span>Send SOS</span>
            </button>

            <button
              onClick={() => onNavigate('report')}
              className="w-full sm:w-auto px-7 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm tracking-wide border border-slate-700 hover:border-slate-500 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <span>Report an Emergency</span>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className="w-full sm:w-auto px-5 py-3.5 bg-transparent hover:bg-slate-900/60 text-slate-300 hover:text-white font-medium text-xs rounded-lg transition-all cursor-pointer border border-transparent hover:border-slate-800"
            >
              Commander Portal →
            </button>
          </div>

          {/* One-Click Hackathon Demo Shortcut Banner */}
          <div className="mt-8 p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 max-w-xl mx-auto flex items-center justify-between gap-3 text-left">
            <div>
              <span className="text-[11px] font-bold text-red-400 uppercase tracking-wider block">Official Demo Flow</span>
              <p className="text-xs text-slate-300 line-clamp-1">
                "There has been a major road accident near the university. Two people appear injured."
              </p>
            </div>
            <button
              onClick={() =>
                onNavigate('report', {
                  prefill: 'There has been a major road accident near the university. Two people appear injured.'
                })
              }
              className="px-3 py-1.5 bg-red-600/30 hover:bg-red-600/50 text-red-200 border border-red-500/40 rounded text-xs font-semibold whitespace-nowrap cursor-pointer transition-colors"
            >
              Run Demo
            </button>
          </div>
        </div>

        {/* Animated Emergency Status Visual & Command Preview */}
        <div className="mt-14 relative rounded-xl border border-slate-800 bg-slate-900/50 p-2 sm:p-4 backdrop-blur-xl shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent z-10 pointer-events-none" />

          {/* Hero Image Asset with Scrim */}
          <div className="relative h-64 sm:h-96 w-full rounded-lg overflow-hidden border border-slate-800/80">
            <img
              src="/src/assets/images/resq_command_center_1790836743763.jpg"
              alt="Emergency Operations Command Center"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover brightness-90 hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent" />

            {/* Tactical Telemetry Overlay */}
            <div className="absolute top-4 left-4 z-20 flex items-center gap-3">
              <div className="flex items-center gap-2 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded border border-slate-800 text-xs">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-mono text-white">METRO CENTRAL DISPATCH ACTIVE</span>
              </div>
            </div>

            <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-4 bg-slate-950/85 backdrop-blur-md px-4 py-2 rounded-lg border border-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">ACTIVE INCIDENTS</span>
                  <span className="font-mono font-bold text-white text-base">{stats.active_incidents}</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-400 block text-[10px]">CRITICAL</span>
                  <span className="font-mono font-bold text-red-400 text-base">{stats.critical}</span>
                </div>
                <div className="h-6 w-px bg-slate-800" />
                <div>
                  <span className="text-slate-400 block text-[10px]">AVG RESPONSE</span>
                  <span className="font-mono font-bold text-cyan-400 text-base">{stats.average_response_time_min}m</span>
                </div>
              </div>

              <button
                onClick={() => onNavigate('admin')}
                className="px-4 py-2 bg-slate-900/90 hover:bg-slate-800 text-white font-medium rounded-lg border border-slate-700 transition-colors backdrop-blur-md cursor-pointer"
              >
                Launch Tactical Map →
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Section */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 border-t border-slate-900">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold tracking-widest uppercase text-cyan-400 font-mono">
            Platform Capabilities
          </h2>
          <p className="text-2xl font-bold text-white mt-2">
            Integrated Emergency Response Architecture
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {/* Card 1 */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">🧠</div>
              <h3 className="text-sm font-bold text-white mb-2">AI Emergency Analysis</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Automated NLP extraction determines casualty count, hazard category, and immediate protocols in milliseconds.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-cyan-400 font-mono">
              Transformers Pipeline
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-amber-500/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">📡</div>
              <h3 className="text-sm font-bold text-white mb-2">Real-Time Incident Monitoring</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Live reactive event streaming updates dispatchers and citizens instantaneously without screen refreshing.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-amber-400 font-mono">
              Supabase Realtime
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-red-500/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">⚡</div>
              <h3 className="text-sm font-bold text-white mb-2">Smart Priority Detection</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Calculates risk vectors (Critical, High, Medium, Low) to prevent dispatch saturation during citywide emergencies.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-red-400 font-mono">
              Risk Weighting
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-cyan-500/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">🗺️</div>
              <h3 className="text-sm font-bold text-white mb-2">Live Emergency Map</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interactive tactical GIS map with pulsing critical alerts, sector clustering, and responder location markers.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-cyan-400 font-mono">
              Leaflet + OSM
            </div>
          </div>

          {/* Card 5 */}
          <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-emerald-500/40 transition-colors flex flex-col justify-between">
            <div>
              <div className="text-2xl mb-3">🚑</div>
              <h3 className="text-sm font-bold text-white mb-2">Responder Coordination</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Interlocks Police, Paramedics, Fire, and Tactical Rescue units with real-time ETA countdowns and status transitions.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/60 text-[11px] text-emerald-400 font-mono">
              Multi-Agency Dispatch
            </div>
          </div>
        </div>
      </section>

      {/* Dual Showcase Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <span className="text-xs font-bold text-red-400 uppercase tracking-wider font-mono">
              Duplicate Incident Intelligence
            </span>
            <h3 className="text-2xl font-bold text-white">
              Stop Duplicate Dispatches Before Resources Are Wasted
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              When a major incident occurs, dozens of 911 calls flood dispatch centers with varied descriptions. ResQ AI computes semantic sentence embeddings and geographic proximity to correlate reports in real time, enabling dispatchers to merge duplicates into a single command view.
            </p>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-xs text-slate-300">
              <span className="text-emerald-400 font-semibold">94% Semantic Similarity match</span> detected between university road accident reports.
            </div>
          </div>

          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900/50 shadow-xl">
            <img
              src="/src/assets/images/ai_triage_network_1790836770064.jpg"
              alt="AI Triage Network"
              referrerPolicy="no-referrer"
              className="w-full h-64 object-cover"
            />
          </div>
        </div>
      </section>
    </div>
  );
};
