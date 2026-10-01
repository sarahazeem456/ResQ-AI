export type EmergencyCategory =
  | 'Medical'
  | 'Accident'
  | 'Fire'
  | 'Personal Safety'
  | 'Missing Person'
  | 'Flood'
  | 'Natural Disaster'
  | 'Infrastructure'
  | 'Other';

export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type IncidentStatus =
  | 'REPORTED'
  | 'AI_ANALYZED'
  | 'PENDING'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CANCELLED';

export type ResponderType = 'POLICE' | 'AMBULANCE' | 'FIRE' | 'RESCUE';

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
  address?: string;
  landmark?: string;
}

export interface AIAnalysisResult {
  category: EmergencyCategory;
  severity: SeverityLevel;
  summary: string;
  people_affected: number;
  recommended_services: ResponderType[];
  recommended_actions: string[];
  confidence: number; // 0 to 100
  key_risks?: string[];
  suggested_priority_score?: number;
  disclaimer?: string;
}

export interface IncidentUpdate {
  id: string;
  incident_id: string;
  timestamp: string;
  status: IncidentStatus;
  note: string;
  author: string;
}

export interface Incident {
  id: string;
  user_id?: string;
  title: string;
  description: string;
  type: EmergencyCategory;
  severity: SeverityLevel;
  status: IncidentStatus;
  latitude: number;
  longitude: number;
  address: string;
  people_affected: number;
  contact_name?: string;
  contact_phone?: string;
  image_url?: string;
  ai_summary: string;
  ai_confidence: number;
  recommended_services: ResponderType[];
  recommended_actions: string[];
  assigned_responder_id?: string;
  assigned_responder_name?: string;
  assigned_responder_type?: ResponderType;
  created_at: string;
  updated_at: string;
  is_sos?: boolean;
  updates: IncidentUpdate[];
  merged_into_id?: string;
  duplicates_count?: number;
}

export interface Responder {
  id: string;
  name: string;
  callsign: string;
  type: ResponderType;
  latitude: number;
  longitude: number;
  status: 'AVAILABLE' | 'DISPATCHED' | 'ON_SCENE' | 'RETURNING' | 'OFF_DUTY';
  eta_minutes?: number;
  assigned_incident_id?: string;
  phone: string;
}

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  notify_on_sos: boolean;
}

export interface DuplicateDetectionResult {
  is_duplicate: boolean;
  similarity_score: number; // 0 - 100
  existing_incident?: Incident;
  reason?: string;
}

export interface CommandStats {
  active_incidents: number;
  critical: number;
  high_priority: number;
  resolved_today: number;
  average_response_time_min: number;
  total_incidents: number;
}
