import {
  CommandStats,
  DuplicateDetectionResult,
  EmergencyCategory,
  EmergencyContact,
  Incident,
  IncidentStatus,
  Responder,
  SeverityLevel
} from '../types';
import { analyzeEmergencyReport, detectDuplicateIncident } from './aiService';

const STORAGE_KEY_INCIDENTS = 'resq_ai_incidents_v1';
const STORAGE_KEY_RESPONDERS = 'resq_ai_responders_v1';
const STORAGE_KEY_CONTACTS = 'resq_ai_contacts_v1';

// Seed coordinates around a vibrant urban center (e.g. Metro area)
const BASE_LAT = 37.7749;
const BASE_LNG = -122.4194;

const INITIAL_RESPONDERS: Responder[] = [
  {
    id: 'resp-amb-01',
    name: 'Paramedic Unit 104',
    callsign: 'MEDIC-04',
    type: 'AMBULANCE',
    latitude: BASE_LAT + 0.008,
    longitude: BASE_LNG - 0.005,
    status: 'AVAILABLE',
    eta_minutes: 4,
    phone: '+1 (555) 019-4821'
  },
  {
    id: 'resp-pol-09',
    name: 'Patrol Squad 9',
    callsign: 'DELTA-09',
    type: 'POLICE',
    latitude: BASE_LAT - 0.006,
    longitude: BASE_LNG + 0.009,
    status: 'AVAILABLE',
    eta_minutes: 3,
    phone: '+1 (555) 019-7732'
  },
  {
    id: 'resp-fire-12',
    name: 'Engine Company 12',
    callsign: 'BRAVO-12',
    type: 'FIRE',
    latitude: BASE_LAT + 0.014,
    longitude: BASE_LNG + 0.012,
    status: 'AVAILABLE',
    eta_minutes: 6,
    phone: '+1 (555) 019-5509'
  },
  {
    id: 'resp-res-02',
    name: 'Metro Heavy Rescue 2',
    callsign: 'RESCUE-02',
    type: 'RESCUE',
    latitude: BASE_LAT - 0.012,
    longitude: BASE_LNG - 0.011,
    status: 'AVAILABLE',
    eta_minutes: 7,
    phone: '+1 (555) 019-3388'
  },
  {
    id: 'resp-amb-03',
    name: 'Rapid Response Paramedic',
    callsign: 'MEDIC-08',
    type: 'AMBULANCE',
    latitude: BASE_LAT + 0.002,
    longitude: BASE_LNG + 0.003,
    status: 'AVAILABLE',
    eta_minutes: 2,
    phone: '+1 (555) 019-8812'
  }
];

const INITIAL_INCIDENTS: Incident[] = [
  {
    id: '1042',
    title: 'Multi-Vehicle Collision with Trauma',
    description: 'Road accident involving two vehicles near the central university intersection. Two individuals sustained head and limb injuries.',
    type: 'Accident',
    severity: 'CRITICAL',
    status: 'DISPATCHED',
    latitude: BASE_LAT + 0.004,
    longitude: BASE_LNG - 0.002,
    address: 'University Blvd & 10th St, Sector 4',
    people_affected: 2,
    contact_name: 'Marcus Vance',
    contact_phone: '+1 (555) 902-1144',
    ai_summary: 'Severe vehicular collision with multiple injured occupants. High risk of secondary obstruction. Urgent ambulance triage activated.',
    ai_confidence: 93,
    recommended_services: ['AMBULANCE', 'POLICE'],
    recommended_actions: [
      'Dispatch Level-1 paramedic squad',
      'Seal university intersection to ensure clear corridor',
      'Alert Regional Emergency Center'
    ],
    assigned_responder_id: 'resp-amb-01',
    assigned_responder_name: 'Paramedic Unit 104',
    assigned_responder_type: 'AMBULANCE',
    created_at: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    is_sos: false,
    duplicates_count: 1,
    updates: [
      {
        id: 'upd-1',
        incident_id: '1042',
        timestamp: new Date(Date.now() - 28 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'REPORTED',
        note: 'Emergency report logged via civilian web portal',
        author: 'System Ingestion'
      },
      {
        id: 'upd-2',
        incident_id: '1042',
        timestamp: new Date(Date.now() - 27 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'AI_ANALYZED',
        note: 'AI classified as Critical Accident. Recommended: Ambulance & Police.',
        author: 'ResQ AI Engine'
      },
      {
        id: 'upd-3',
        incident_id: '1042',
        timestamp: new Date(Date.now() - 25 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'DISPATCHED',
        note: 'Assigned Paramedic Unit 104 and Delta-09 interceptor. En route, ETA 4 min.',
        author: 'Dispatcher Sarah Jenkins'
      }
    ]
  },
  {
    id: '1038',
    title: 'Commercial Substation Electrical Fire',
    description: 'Transformer fire in rear loading bay of commercial logistics warehouse. Heavy black smoke and sparking equipment observed.',
    type: 'Fire',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    latitude: BASE_LAT + 0.011,
    longitude: BASE_LNG + 0.007,
    address: '840 Industrial Way, Warehouse District',
    people_affected: 1,
    contact_name: 'Security Ops',
    contact_phone: '+1 (555) 334-9090',
    ai_summary: 'Electrical equipment fire with toxic smoke potential. Multi-unit fire suppression deployment with perimeter safety zone.',
    ai_confidence: 91,
    recommended_services: ['FIRE', 'AMBULANCE'],
    recommended_actions: [
      'Dispatch Class-C electrical firefighting team',
      'Cut municipal grid feed to transformer vault',
      'Establish 150m smoke buffer zone'
    ],
    assigned_responder_id: 'resp-fire-12',
    assigned_responder_name: 'Engine Company 12',
    assigned_responder_type: 'FIRE',
    created_at: new Date(Date.now() - 55 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    is_sos: false,
    updates: [
      {
        id: 'upd-10',
        incident_id: '1038',
        timestamp: new Date(Date.now() - 55 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'REPORTED',
        note: 'Automated warehouse telemetry + human visual confirmation',
        author: 'Security Console'
      },
      {
        id: 'upd-11',
        incident_id: '1038',
        timestamp: new Date(Date.now() - 52 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'DISPATCHED',
        note: 'Engine 12 arriving on scene. Chemical suppression underway.',
        author: 'Command Base'
      }
    ]
  },
  {
    id: '1031',
    title: 'Flash Water Inundation in Underpass',
    description: 'Rapid stormwater buildup trapping low-clearance sedan in rail underpass. Water level approximately 2.5 feet and rising.',
    type: 'Flood',
    severity: 'MEDIUM',
    status: 'PENDING',
    latitude: BASE_LAT - 0.009,
    longitude: BASE_LNG - 0.004,
    address: 'Grand Underpass & 4th Ave',
    people_affected: 1,
    contact_name: 'Driver Alex Chen',
    ai_summary: 'Urban flash water accumulation trapping vehicle. Technical water rescue apparatus required.',
    ai_confidence: 88,
    recommended_services: ['RESCUE', 'POLICE'],
    recommended_actions: [
      'Deploy high-water rescue vehicle',
      'Barricade underpass approaches on north and south ends'
    ],
    created_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    is_sos: false,
    updates: [
      {
        id: 'upd-20',
        incident_id: '1031',
        timestamp: new Date(Date.now() - 18 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'REPORTED',
        note: 'Civilian mobile web submission',
        author: 'Web Citizen'
      }
    ]
  },
  {
    id: '1025',
    title: 'Acute Cardiac Distress at Sports Arena',
    description: '54-year-old spectator collapsed at Gate C. Unresponsive, bystander CPR initiated with automated external defibrillator.',
    type: 'Medical',
    severity: 'CRITICAL',
    status: 'RESOLVED',
    latitude: BASE_LAT + 0.001,
    longitude: BASE_LNG + 0.015,
    address: 'Civic Arena Plaza, Gate C',
    people_affected: 1,
    contact_name: 'Event Staff EMT',
    ai_summary: 'Cardiac arrest event with ongoing bystander CPR. Immediate ALS paramedic intercept completed.',
    ai_confidence: 96,
    recommended_services: ['AMBULANCE'],
    recommended_actions: [
      'Rapid ALS intercept',
      'Emergency room trauma notification'
    ],
    assigned_responder_id: 'resp-amb-03',
    assigned_responder_name: 'Rapid Response Paramedic',
    assigned_responder_type: 'AMBULANCE',
    created_at: new Date(Date.now() - 140 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 100 * 60 * 1000).toISOString(),
    is_sos: false,
    updates: [
      {
        id: 'upd-30',
        incident_id: '1025',
        timestamp: new Date(Date.now() - 140 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'REPORTED',
        note: 'Direct 911 / ResQ portal crossover',
        author: 'Plaza Staff'
      },
      {
        id: 'upd-31',
        incident_id: '1025',
        timestamp: new Date(Date.now() - 138 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'DISPATCHED',
        note: 'Medic-08 on scene within 3m 40s.',
        author: 'Dispatch'
      },
      {
        id: 'upd-32',
        incident_id: '1025',
        timestamp: new Date(Date.now() - 100 * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'RESOLVED',
        note: 'Patient stabilized and transported to Regional Hospital Cardiology Unit.',
        author: 'Paramedic Unit 08'
      }
    ]
  }
];

const INITIAL_CONTACTS: EmergencyContact[] = [
  {
    id: 'cnt-1',
    name: 'Elena Vance (Spouse)',
    relationship: 'Family / Next of Kin',
    phone: '+1 (555) 882-9901',
    notify_on_sos: true
  },
  {
    id: 'cnt-2',
    name: 'Dr. Raymond Scott',
    relationship: 'Primary Physician',
    phone: '+1 (555) 771-4433',
    notify_on_sos: false
  },
  {
    id: 'cnt-3',
    name: 'Campus Safety Dispatch',
    relationship: 'Local Security Desk',
    phone: '+1 (555) 902-SAFE',
    notify_on_sos: true
  }
];

// In-memory / storage sync
let listeners: Array<() => void> = [];
let broadcastChannel: BroadcastChannel | null = null;

if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel('resq_ai_live_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data?.type === 'STORE_UPDATED') {
        listeners.forEach(fn => fn());
      }
    };
  } catch (e) {
    console.warn('BroadcastChannel not supported or error:', e);
  }

  // Cross-tab storage fallback
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY_INCIDENTS || e.key === STORAGE_KEY_RESPONDERS) {
      listeners.forEach(fn => fn());
    }
  });
}

function notifyListeners() {
  listeners.forEach(fn => {
    try {
      fn();
    } catch (e) {
      console.error('Listener notify error', e);
    }
  });
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('resq_incident_store_change'));
    if (broadcastChannel) {
      try {
        broadcastChannel.postMessage({ type: 'STORE_UPDATED', timestamp: Date.now() });
      } catch (err) {
        // ignore
      }
    }
  }
}

// Background Live Telemetry & GPS Movement Loop
let liveEngineInterval: any = null;
let simulationSpeedMultiplier = 1;

function startLiveMovementEngine() {
  if (typeof window === 'undefined' || liveEngineInterval) return;

  liveEngineInterval = setInterval(() => {
    const incidents = IncidentStore.getIncidents();
    const responders = IncidentStore.getResponders();
    let hasChanges = false;

    // Check all active responders assigned to active incidents
    responders.forEach(resp => {
      if (resp.status === 'DISPATCHED' && resp.assigned_incident_id) {
        const inc = incidents.find(i => i.id === resp.assigned_incident_id);
        if (inc && inc.status !== 'RESOLVED' && inc.status !== 'CANCELLED') {
          // Calculate vector towards incident
          const dLat = inc.latitude - resp.latitude;
          const dLng = inc.longitude - resp.longitude;
          const dist = Math.sqrt(dLat * dLat + dLng * dLng);

          // Step size proportional to simulation speed
          const step = 0.0006 * simulationSpeedMultiplier;

          if (dist > step) {
            // Move closer
            resp.latitude += (dLat / dist) * step;
            resp.longitude += (dLng / dist) * step;
            // Approximate ETA remaining (dist * 111km / 50km/h in minutes)
            const remainingKm = dist * 111;
            const remainingMins = Math.max(Math.round((remainingKm / 45) * 60 * 10) / 10, 0.2);
            resp.eta_minutes = remainingMins;
            hasChanges = true;
          } else {
            // Arrived on scene!
            resp.latitude = inc.latitude;
            resp.longitude = inc.longitude;
            resp.status = 'ON_SCENE';
            resp.eta_minutes = 0;

            inc.status = 'IN_PROGRESS';
            inc.updated_at = new Date().toISOString();
            inc.updates.push({
              id: `upd-${Date.now()}-onscene`,
              incident_id: inc.id,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: 'IN_PROGRESS',
              note: `Unit ${resp.callsign} (${resp.name}) has arrived ON SCENE. Perimeter secured, active intervention in progress.`,
              author: resp.callsign
            });
            hasChanges = true;
          }
        }
      }
    });

    if (hasChanges) {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
      localStorage.setItem(STORAGE_KEY_RESPONDERS, JSON.stringify(responders));
      notifyListeners();
    }
  }, 1200);
}

// Start live movement loop automatically
if (typeof window !== 'undefined') {
  startLiveMovementEngine();
}

export const IncidentStore = {
  subscribe(fn: () => void): () => void {
    listeners.push(fn);
    return () => {
      listeners = listeners.filter(l => l !== fn);
    };
  },

  getIncidents(): Incident[] {
    let items: Incident[] = [];
    if (typeof window === 'undefined') {
      items = INITIAL_INCIDENTS;
    } else {
      const raw = localStorage.getItem(STORAGE_KEY_INCIDENTS);
      if (!raw) {
        localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(INITIAL_INCIDENTS));
        items = INITIAL_INCIDENTS;
      } else {
        try {
          items = JSON.parse(raw);
        } catch {
          items = INITIAL_INCIDENTS;
        }
      }
    }

    // Deduplicate by ID to guarantee unique keys across React components
    const seen = new Set<string>();
    const deduplicated: Incident[] = [];
    for (const item of items) {
      if (item && item.id) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          deduplicated.push(item);
        } else {
          // Collision detected: generate a distinct unique ID
          const uniqueItem = { ...item, id: `${item.id}-${Math.floor(Math.random() * 8999 + 1000)}` };
          seen.add(uniqueItem.id);
          deduplicated.push(uniqueItem);
        }
      }
    }

    if (typeof window !== 'undefined' && deduplicated.length !== items.length) {
      localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(deduplicated));
    }

    return deduplicated;
  },

  getIncidentById(id: string): Incident | undefined {
    return this.getIncidents().find(i => i.id === id);
  },

  getResponders(): Responder[] {
    if (typeof window === 'undefined') return INITIAL_RESPONDERS;
    const raw = localStorage.getItem(STORAGE_KEY_RESPONDERS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_RESPONDERS, JSON.stringify(INITIAL_RESPONDERS));
      return INITIAL_RESPONDERS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_RESPONDERS;
    }
  },

  getContacts(): EmergencyContact[] {
    if (typeof window === 'undefined') return INITIAL_CONTACTS;
    const raw = localStorage.getItem(STORAGE_KEY_CONTACTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(INITIAL_CONTACTS));
      return INITIAL_CONTACTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CONTACTS;
    }
  },

  addContact(contact: Omit<EmergencyContact, 'id'>): EmergencyContact {
    const contacts = this.getContacts();
    const newContact: EmergencyContact = {
      ...contact,
      id: `cnt-${Date.now()}`
    };
    contacts.push(newContact);
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    notifyListeners();
    return newContact;
  },

  deleteContact(id: string): void {
    const contacts = this.getContacts().filter(c => c.id !== id);
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(contacts));
    notifyListeners();
  },

  createIncident(input: {
    title?: string;
    description: string;
    type?: EmergencyCategory;
    latitude?: number;
    longitude?: number;
    address?: string;
    people_affected?: number;
    contact_name?: string;
    contact_phone?: string;
    image_url?: string;
    is_sos?: boolean;
  }): { incident: Incident; duplicateCheck: DuplicateDetectionResult } {
    const incidents = this.getIncidents();

    // Analyze with ResQ AI engine
    const ai = analyzeEmergencyReport(input.description, input.type, input.people_affected);

    const lat = input.latitude || (BASE_LAT + (Math.random() - 0.5) * 0.015);
    const lng = input.longitude || (BASE_LNG + (Math.random() - 0.5) * 0.015);

    // Duplicate detection check
    const duplicateCheck = detectDuplicateIncident(input.description, lat, lng, incidents);

    const existingIds = new Set(incidents.map(i => i.id));
    let nextNum = Math.max(
      1050,
      ...incidents.map(i => {
        const n = parseInt(i.id, 10);
        return isNaN(n) ? 0 : n;
      })
    ) + 1;
    while (existingIds.has(String(nextNum))) {
      nextNum++;
    }
    const id = String(nextNum);
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newIncident: Incident = {
      id,
      title: input.title || `${ai.category} Alert: ${input.address || 'Reported Sector'}`,
      description: input.description,
      type: ai.category,
      severity: ai.severity,
      status: 'AI_ANALYZED',
      latitude: lat,
      longitude: lng,
      address: input.address || 'Near University District & Central Ave',
      people_affected: input.people_affected || ai.people_affected || 1,
      contact_name: input.contact_name,
      contact_phone: input.contact_phone,
      image_url: input.image_url,
      ai_summary: ai.summary,
      ai_confidence: ai.confidence,
      recommended_services: ai.recommended_services,
      recommended_actions: ai.recommended_actions,
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
      is_sos: !!input.is_sos,
      duplicates_count: duplicateCheck.is_duplicate ? 1 : 0,
      updates: [
        {
          id: `upd-${Date.now()}-1`,
          incident_id: id,
          timestamp: timeStr,
          status: 'REPORTED',
          note: input.is_sos ? 'Instant SOS trigger activated with real-time GPS coordinates' : 'Civilian incident submitted via web triage portal',
          author: input.is_sos ? 'SOS System' : (input.contact_name || 'Civilian Reporter')
        },
        {
          id: `upd-${Date.now()}-2`,
          incident_id: id,
          timestamp: timeStr,
          status: 'AI_ANALYZED',
          note: `ResQ AI classified as ${ai.severity} ${ai.category} (${ai.confidence}% confidence). Recommended: ${ai.recommended_services.join(', ')}`,
          author: 'ResQ AI Engine'
        }
      ]
    };

    incidents.unshift(newIncident);
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    notifyListeners();

    return { incident: newIncident, duplicateCheck };
  },

  dispatchResponder(incidentId: string, responderId: string, customNote?: string): Incident | null {
    const incidents = this.getIncidents();
    const responders = this.getResponders();

    const incident = incidents.find(i => i.id === incidentId);
    const responder = responders.find(r => r.id === responderId);

    if (!incident || !responder) return null;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    incident.status = 'DISPATCHED';
    incident.assigned_responder_id = responder.id;
    incident.assigned_responder_name = responder.name;
    incident.assigned_responder_type = responder.type;
    incident.updated_at = new Date().toISOString();

    incident.updates.push({
      id: `upd-${Date.now()}`,
      incident_id: incident.id,
      timestamp: timeStr,
      status: 'DISPATCHED',
      note: customNote || `Unit ${responder.callsign} (${responder.name}) dispatched. Estimated arrival in ${responder.eta_minutes || 4} minutes.`,
      author: 'Tactical Command'
    });

    // Update responder status
    responder.status = 'DISPATCHED';
    responder.assigned_incident_id = incident.id;

    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    localStorage.setItem(STORAGE_KEY_RESPONDERS, JSON.stringify(responders));
    notifyListeners();

    return incident;
  },

  markIncidentResolved(incidentId: string, resolutionNote?: string): Incident | null {
    const incidents = this.getIncidents();
    const responders = this.getResponders();

    const incident = incidents.find(i => i.id === incidentId);
    if (!incident) return null;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    incident.status = 'RESOLVED';
    incident.updated_at = new Date().toISOString();

    incident.updates.push({
      id: `upd-${Date.now()}`,
      incident_id: incident.id,
      timestamp: timeStr,
      status: 'RESOLVED',
      note: resolutionNote || 'Incident resolved. Casualties transported and scene secured by emergency responders.',
      author: 'On-Scene Commander'
    });

    // Free any assigned responder
    if (incident.assigned_responder_id) {
      const resp = responders.find(r => r.id === incident.assigned_responder_id);
      if (resp) {
        resp.status = 'AVAILABLE';
        resp.assigned_incident_id = undefined;
      }
    }

    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    localStorage.setItem(STORAGE_KEY_RESPONDERS, JSON.stringify(responders));
    notifyListeners();

    return incident;
  },

  mergeIncidents(primaryIncidentId: string, duplicateIncidentId: string): boolean {
    const incidents = this.getIncidents();
    const primary = incidents.find(i => i.id === primaryIncidentId);
    const duplicate = incidents.find(i => i.id === duplicateIncidentId);

    if (!primary || !duplicate) return false;

    primary.duplicates_count = (primary.duplicates_count || 0) + 1;
    primary.updates.push({
      id: `upd-${Date.now()}`,
      incident_id: primary.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: primary.status,
      note: `Duplicate report #${duplicate.id} merged into this master incident. Additional witness reports correlated.`,
      author: 'AI Duplicate Pipeline'
    });

    duplicate.status = 'CANCELLED';
    duplicate.merged_into_id = primary.id;

    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(incidents));
    notifyListeners();
    return true;
  },

  getStats(): CommandStats {
    const incidents = this.getIncidents();
    const active = incidents.filter(i => i.status !== 'RESOLVED' && i.status !== 'CANCELLED');
    const critical = incidents.filter(i => i.severity === 'CRITICAL' && i.status !== 'RESOLVED');
    const high = incidents.filter(i => i.severity === 'HIGH' && i.status !== 'RESOLVED');
    const resolvedToday = incidents.filter(i => i.status === 'RESOLVED').length;

    return {
      active_incidents: active.length,
      critical: critical.length,
      high_priority: high.length,
      resolved_today: resolvedToday,
      average_response_time_min: 4.8,
      total_incidents: incidents.length
    };
  },

  setSimulationSpeed(multiplier: number): void {
    simulationSpeedMultiplier = multiplier;
  },

  getSimulationSpeed(): number {
    return simulationSpeedMultiplier;
  },

  simulateIncomingIncident(): Incident {
    const scenarios = [
      {
        description: 'Multi-car pileup with smoke on Downtown Expressway. Multiple passengers trapped in vehicle.',
        type: 'Accident' as const,
        address: 'Downtown Expressway & 8th Interchange',
        people_affected: 3
      },
      {
        description: 'Severe gas pipeline leak reported near senior living facility. Strong chemical odor and dizziness reported.',
        type: 'Infrastructure' as const,
        address: '320 Evergreen Way, Senior Care Complex',
        people_affected: 4
      },
      {
        description: 'Sudden cardiac arrest in central transit metro concourse. Bystanders initiating compression.',
        type: 'Medical' as const,
        address: 'Central Metro Concourse, Platform 2',
        people_affected: 1
      },
      {
        description: 'Basement fire spreading to ground floor retail store. Sparks and heavy smoke billowing from vents.',
        type: 'Fire' as const,
        address: '512 Market St, Commercial Row',
        people_affected: 2
      }
    ];

    const pick = scenarios[Math.floor(Math.random() * scenarios.length)];
    const { incident } = this.createIncident(pick);
    return incident;
  },

  resetToDemo(): void {
    localStorage.setItem(STORAGE_KEY_INCIDENTS, JSON.stringify(INITIAL_INCIDENTS));
    localStorage.setItem(STORAGE_KEY_RESPONDERS, JSON.stringify(INITIAL_RESPONDERS));
    localStorage.setItem(STORAGE_KEY_CONTACTS, JSON.stringify(INITIAL_CONTACTS));
    notifyListeners();
  }
};
