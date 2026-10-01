import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory persistent database store for incidents and responders
interface IncidentRecord {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  status: string;
  latitude: number;
  longitude: number;
  address: string;
  people_affected: number;
  contact_name?: string;
  contact_phone?: string;
  ai_summary: string;
  ai_confidence: number;
  recommended_services: string[];
  recommended_actions: string[];
  assigned_responder_id?: string;
  assigned_responder_name?: string;
  assigned_responder_type?: string;
  created_at: string;
  updated_at: string;
  is_sos?: boolean;
  updates: Array<{
    id: string;
    incident_id: string;
    timestamp: string;
    status: string;
    note: string;
    author: string;
  }>;
}

const BASE_LAT = 37.7749;
const BASE_LNG = -122.4194;

const incidentsDB: IncidentRecord[] = [
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
  }
];

// Connected SSE clients
const sseClients: Response[] = [];

function broadcastToClients(eventData: any) {
  const payload = `data: ${JSON.stringify(eventData)}\n\n`;
  sseClients.forEach(res => {
    try {
      res.write(payload);
    } catch {
      // client disconnected
    }
  });
}

// 1. REST Endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    platform: 'ResQ AI Full-Stack Server',
    total_incidents: incidentsDB.length,
    active_sse_clients: sseClients.length
  });
});

app.get('/api/incidents', (_req: Request, res: Response) => {
  res.setHeader('Cache-Control', 'no-cache');
  res.json(incidentsDB);
});

app.get('/api/incidents/poll', (req: Request, res: Response) => {
  const since = req.query.since ? new Date(req.query.since as string).getTime() : 0;
  const filtered = since > 0
    ? incidentsDB.filter(i => new Date(i.updated_at).getTime() > since)
    : incidentsDB;

  res.setHeader('Cache-Control', 'no-cache');
  res.json({
    timestamp: new Date().toISOString(),
    incidents: filtered,
    total: incidentsDB.length
  });
});

app.post('/api/incidents', (req: Request, res: Response) => {
  const body = req.body;
  const existingIds = new Set(incidentsDB.map(i => i.id));
  let nextNum = Math.max(1050, ...incidentsDB.map(i => parseInt(i.id, 10) || 0)) + 1;
  while (existingIds.has(String(nextNum))) {
    nextNum++;
  }
  const newId = String(nextNum);
  const now = new Date();

  const newRecord: IncidentRecord = {
    id: newId,
    title: body.title || `${body.type || 'Emergency'} Alert: ${body.address || 'Target Sector'}`,
    description: body.description || 'Emergency incident reported',
    type: body.type || 'Accident',
    severity: body.severity || 'HIGH',
    status: 'AI_ANALYZED',
    latitude: body.latitude || (BASE_LAT + (Math.random() - 0.5) * 0.015),
    longitude: body.longitude || (BASE_LNG + (Math.random() - 0.5) * 0.015),
    address: body.address || 'Reported Sector',
    people_affected: body.people_affected || 1,
    contact_name: body.contact_name,
    contact_phone: body.contact_phone,
    ai_summary: body.ai_summary || 'Incident logged into operational queue.',
    ai_confidence: body.ai_confidence || 90,
    recommended_services: body.recommended_services || ['AMBULANCE', 'POLICE'],
    recommended_actions: body.recommended_actions || ['Dispatch emergency unit to target sector'],
    created_at: now.toISOString(),
    updated_at: now.toISOString(),
    is_sos: !!body.is_sos,
    updates: [
      {
        id: `upd-${Date.now()}-1`,
        incident_id: newId,
        timestamp: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'REPORTED',
        note: 'Emergency ingested via API',
        author: body.contact_name || 'System'
      }
    ]
  };

  incidentsDB.unshift(newRecord);

  // Broadcast to all active clients
  broadcastToClients({ type: 'NEW_INCIDENT', incident: newRecord, incidents: incidentsDB });

  res.status(201).json(newRecord);
});

// 2. Real-Time Server-Sent Events (SSE) Stream
app.get('/api/incidents/stream', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial state
  res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', incidents: incidentsDB })}\n\n`);
  sseClients.push(res);

  req.on('close', () => {
    const idx = sseClients.indexOf(res);
    if (idx !== -1) {
      sseClients.splice(idx, 1);
    }
  });
});

// 3. Vite Middlewares Integration
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`ResQ AI server running at http://localhost:${PORT}`);
  });
}

startServer();
