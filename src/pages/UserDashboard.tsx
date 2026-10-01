import React, { useState } from 'react';
import { EmergencyContact, Incident } from '../types';
import { IncidentStore } from '../services/incidentStore';
import { UserProfile } from '../services/authService';

interface UserDashboardProps {
  onNavigate: (page: string, params?: any) => void;
  currentUser: UserProfile | null;
}

export const UserDashboard: React.FC<UserDashboardProps> = ({ onNavigate, currentUser }) => {
  const incidents = IncidentStore.getIncidents();
  const contacts = IncidentStore.getContacts();

  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRel, setNewContactRel] = useState('Family');
  const [showAddContact, setShowAddContact] = useState(false);

  const activeIncidents = React.useMemo(() => {
    const list = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CANCELLED');
    const seen = new Set<string>();
    return list.filter(i => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  }, [incidents]);

  const resolvedIncidents = React.useMemo(() => {
    const list = incidents.filter(i => i.status === 'RESOLVED');
    const seen = new Set<string>();
    return list.filter(i => {
      if (seen.has(i.id)) return false;
      seen.add(i.id);
      return true;
    });
  }, [incidents]);

  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName || !newContactPhone) return;

    IncidentStore.addContact({
      name: newContactName,
      phone: newContactPhone,
      relationship: newContactRel,
      notify_on_sos: true
    });

    setNewContactName('');
    setNewContactPhone('');
    setShowAddContact(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Banner */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400 font-mono">
                Citizen Safety Console
              </span>
              <span className="text-slate-600">·</span>
              <span className="text-xs text-emerald-400">Authenticated</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1">
              {currentUser?.full_name || 'Civilian Responder'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Registered ID: <span className="font-mono text-slate-300">{currentUser?.id || 'usr-local'}</span> · {currentUser?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('sos')}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider shadow-lg cursor-pointer"
            >
              🚨 Trigger SOS
            </button>
            <button
              onClick={() => onNavigate('report')}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              + File Report
            </button>
          </div>
        </div>

        {/* Active Incident Showcase */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
              <span>Active Emergencies ({activeIncidents.length})</span>
            </h2>
            <span className="text-xs text-slate-500">Live operational link</span>
          </div>

          {activeIncidents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeIncidents.map((inc, idx) => (
                <div
                  key={`${inc.id}-${idx}`}
                  className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-colors shadow-lg flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">#{inc.id}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-white font-semibold">{inc.type}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded text-[11px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        {inc.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white mt-3">{inc.title}</h3>
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{inc.description}</p>
                    <div className="mt-3 text-[11px] text-slate-500">📍 {inc.address}</div>

                    {/* Timeline Snippet */}
                    <div className="mt-4 pt-3 border-t border-slate-800/60 space-y-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                        Recent Log
                      </span>
                      {inc.updates.slice(-2).map((u, i) => (
                        <div key={i} className="text-[11px] text-slate-300 flex items-center gap-2">
                          <span className="font-mono text-cyan-400 text-[10px]">{u.timestamp}</span>
                          <span className="text-slate-400 line-clamp-1">{u.note}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-red-400 font-semibold">{inc.severity} Priority</span>
                    <button
                      onClick={() => onNavigate('status', { id: inc.id })}
                      className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold cursor-pointer"
                    >
                      Track Live Timeline →
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-slate-800 text-slate-400 text-xs">
              No active emergencies linked to this profile.
            </div>
          )}
        </div>

        {/* Emergency Contacts & SOS Dispatch Recipients */}
        <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Emergency SOS Contacts ({contacts.length})
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Contacts automatically messaged with live GPS coordinates upon SOS trigger.
              </p>
            </div>
            <button
              onClick={() => setShowAddContact(!showAddContact)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs font-semibold border border-slate-700 cursor-pointer"
            >
              {showAddContact ? 'Cancel' : '+ Add Contact'}
            </button>
          </div>

          {showAddContact && (
            <form onSubmit={handleCreateContact} className="p-4 bg-slate-950 rounded-lg border border-slate-800 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newContactName}
                  onChange={e => setNewContactName(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white p-2 rounded focus:outline-none focus:border-red-500"
                  required
                />
                <input
                  type="tel"
                  placeholder="Phone Number"
                  value={newContactPhone}
                  onChange={e => setNewContactPhone(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white p-2 rounded focus:outline-none focus:border-red-500"
                  required
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Spouse, Parent)"
                  value={newContactRel}
                  onChange={e => setNewContactRel(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-xs text-white p-2 rounded focus:outline-none focus:border-red-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-1.5 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded cursor-pointer"
              >
                Save Emergency Contact
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {contacts.map(c => (
              <div key={c.id} className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white">{c.name}</div>
                  <div className="text-[11px] text-slate-400">{c.relationship}</div>
                  <div className="text-[11px] font-mono text-cyan-400 mt-1">{c.phone}</div>
                </div>
                <button
                  onClick={() => IncidentStore.deleteContact(c.id)}
                  className="text-slate-600 hover:text-red-400 text-xs p-1 cursor-pointer"
                  title="Remove"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Resolved Reports History */}
        <div className="space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Resolved Incident Archive ({resolvedIncidents.length})
          </h3>
          <div className="rounded-xl bg-slate-900 border border-slate-800 overflow-hidden">
            <div className="divide-y divide-slate-800">
              {resolvedIncidents.map((inc, idx) => (
                <div key={`${inc.id}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-800/40 transition-colors">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{inc.id}</span>
                      <span className="text-xs font-semibold text-white">{inc.title}</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-950/50 px-2 py-0.5 rounded border border-emerald-900">
                        Resolved
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{inc.address}</p>
                  </div>
                  <button
                    onClick={() => onNavigate('details', { id: inc.id })}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    View File →
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
