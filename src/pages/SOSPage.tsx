import React, { useState, useEffect } from 'react';
import { Incident, Responder } from '../types';
import { IncidentStore } from '../services/incidentStore';

interface SOSPageProps {
  onNavigate: (page: string, params?: any) => void;
  onNewIncidentCreated?: (incident: Incident) => void;
}

export const SOSPage: React.FC<SOSPageProps> = ({ onNavigate, onNewIncidentCreated }) => {
  const [isActivating, setIsActivating] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [incident, setIncident] = useState<Incident | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [nearestResponder, setNearestResponder] = useState<Responder | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer when activated
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActivated) {
      interval = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isActivated]);

  const handleActivateSOS = () => {
    setIsActivating(true);

    const proceedWithCoords = (latitude: number, longitude: number) => {
      setCoords({ lat: latitude, lng: longitude });

      // Create high-priority SOS emergency incident
      const { incident: newInc } = IncidentStore.createIncident({
        title: 'EMERGENCY SOS BEACON ACTIVATED',
        description: 'Instant distress beacon triggered by user. High risk personal safety / immediate peril. Critical dispatcher intervention requested.',
        type: 'Personal Safety',
        latitude,
        longitude,
        address: `Sector Coordinate ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        people_affected: 1,
        is_sos: true,
        contact_name: 'Distress Beacon User'
      });

      // Automatically dispatch nearest available responder
      const responders = IncidentStore.getResponders();
      const available = responders.find(r => r.status === 'AVAILABLE') || responders[0];

      if (available) {
        IncidentStore.dispatchResponder(
          newInc.id,
          available.id,
          `Automated Priority SOS Dispatch: Unit ${available.callsign} en route with flashing sirens.`
        );
        setNearestResponder(available);
      }

      setIncident(newInc);
      setIsActivating(false);
      setIsActivated(true);

      if (onNewIncidentCreated) {
        onNewIncidentCreated(newInc);
      }
    };

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          proceedWithCoords(pos.coords.latitude, pos.coords.longitude);
        },
        _err => {
          // Fallback simulation coordinates (central urban district)
          proceedWithCoords(37.7749 + 0.003, -122.4194 - 0.002);
        },
        { timeout: 4000 }
      );
    } else {
      proceedWithCoords(37.7749 + 0.003, -122.4194 - 0.002);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Background Pulse Effect when SOS is active */}
      {isActivated && (
        <div className="absolute inset-0 bg-red-950/20 animate-pulse pointer-events-none" />
      )}

      <div className="max-w-xl w-full text-center z-10">
        {!isActivated ? (
          <>
            <div className="mb-4">
              <span className="text-xs font-bold tracking-widest text-red-500 uppercase font-mono">
                One-Touch Emergency Channel
              </span>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white uppercase mt-1">
                Instant SOS Beacon
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-2 max-w-md mx-auto">
                Pressing this button transmits your live GPS coordinates, initiates emergency AI triage, and alerts the nearest tactical responder immediately.
              </p>
            </div>

            {/* Giant SOS Button */}
            <div className="my-10 flex justify-center">
              <button
                type="button"
                onClick={handleActivateSOS}
                disabled={isActivating}
                className="relative group w-52 h-52 sm:w-60 sm:h-60 rounded-full bg-gradient-to-br from-red-600 to-rose-800 hover:from-red-500 hover:to-rose-700 text-white font-black text-4xl sm:text-5xl tracking-widest shadow-[0_0_60px_rgba(239,68,68,0.6)] hover:shadow-[0_0_90px_rgba(239,68,68,0.9)] transition-all cursor-pointer flex flex-col items-center justify-center border-4 border-red-400/40 active:scale-95"
              >
                {/* Ripple rings */}
                <span className="absolute inset-0 rounded-full border-2 border-red-500 animate-ping opacity-30"></span>
                <span className="absolute -inset-4 rounded-full border border-red-500/30"></span>

                <span className="relative z-10 flex flex-col items-center">
                  <span>{isActivating ? 'LOCKING...' : 'SOS'}</span>
                  <span className="text-[11px] font-sans font-semibold tracking-normal uppercase text-red-200 mt-1">
                    {isActivating ? 'Acquiring GPS' : 'Hold to Trigger'}
                  </span>
                </span>
              </button>
            </div>

            <div className="flex items-center justify-center gap-6 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span>GPS Telemetry Ready</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>AI Dispatch Listening</span>
              </div>
            </div>
          </>
        ) : (
          /* SOS Activated Confirmation State */
          <div className="space-y-6 animate-in fade-in zoom-in-95">
            {/* Status Header */}
            <div className="p-6 rounded-2xl bg-red-950/70 border-2 border-red-500 shadow-[0_0_40px_rgba(239,68,68,0.4)]">
              <div className="flex items-center justify-center gap-2 text-red-400 text-sm font-bold tracking-widest uppercase mb-1">
                <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
                <span>SOS ACTIVATED · DISPATCH BROADCASTED</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white uppercase">
                Help Is En Route
              </h2>
              <p className="text-xs text-red-200 mt-1">
                Do not leave your current safe zone unless immediate peril threatens. Responders have locked onto your beacon.
              </p>

              {/* Response Timer */}
              <div className="mt-5 p-3 rounded-xl bg-slate-950/80 border border-red-800/60 max-w-xs mx-auto">
                <div className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                  Beacon Active Duration
                </div>
                <div className="text-3xl font-bold font-mono text-red-400 mt-1">
                  {formatTimer(elapsedSeconds)}
                </div>
                <div className="text-[11px] text-cyan-400 mt-1">
                  Target responder ETA: ~{nearestResponder?.eta_minutes || 3} mins
                </div>
              </div>
            </div>

            {/* Incident Telemetry Card */}
            {incident && (
              <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 text-left space-y-3 shadow-xl">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Emergency ID</span>
                  <span className="text-sm font-bold font-mono text-cyan-400">#{incident.id}</span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Time Triggered</span>
                  <span className="text-xs font-mono text-white">
                    {new Date(incident.created_at).toLocaleTimeString()}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Current Coordinates</span>
                  <span className="text-xs font-mono text-emerald-400">
                    {coords ? `${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}` : 'Secured'}
                  </span>
                </div>

                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase">Incident Status</span>
                  <span className="px-2.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold">
                    {incident.status}
                  </span>
                </div>

                {nearestResponder && (
                  <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 mt-2">
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Assigned Unit</span>
                    <div className="text-xs font-semibold text-white mt-0.5 flex items-center justify-between">
                      <span>{nearestResponder.callsign} ({nearestResponder.name})</span>
                      <span className="text-cyan-400 font-mono">ETA {nearestResponder.eta_minutes || 3}m</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              {incident && (
                <button
                  type="button"
                  onClick={() => onNavigate('status', { id: incident.id })}
                  className="flex-1 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg border border-slate-700 transition-colors cursor-pointer"
                >
                  View Live Incident Status Timeline
                </button>
              )}
              <button
                type="button"
                onClick={() => onNavigate('admin', { selectedId: incident?.id })}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer"
              >
                Open in Command Center
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
