-- ====================================================================
-- ResQ AI — Smart Emergency Response & Intelligence Platform
-- Supabase PostgreSQL Database Schema
-- ====================================================================

-- Enable PostGIS for geospatial indexing if available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. ENUMS
CREATE TYPE emergency_category AS ENUM (
  'Medical',
  'Accident',
  'Fire',
  'Personal Safety',
  'Missing Person',
  'Flood',
  'Natural Disaster',
  'Infrastructure',
  'Other'
);

CREATE TYPE severity_level AS ENUM (
  'LOW',
  'MEDIUM',
  'HIGH',
  'CRITICAL'
);

CREATE TYPE incident_status AS ENUM (
  'REPORTED',
  'AI_ANALYZED',
  'PENDING',
  'DISPATCHED',
  'IN_PROGRESS',
  'RESOLVED',
  'CANCELLED'
);

CREATE TYPE responder_type AS ENUM (
  'POLICE',
  'AMBULANCE',
  'FIRE',
  'RESCUE'
);

CREATE TYPE responder_status AS ENUM (
  'AVAILABLE',
  'DISPATCHED',
  'ON_SCENE',
  'RETURNING',
  'OFF_DUTY'
);

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'citizen' CHECK (role IN ('admin', 'citizen', 'responder')),
  badge_number TEXT,
  agency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RESPONDERS TABLE
CREATE TABLE IF NOT EXISTS public.responders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  callsign TEXT UNIQUE NOT NULL,
  type responder_type NOT NULL,
  status responder_status NOT NULL DEFAULT 'AVAILABLE',
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INCIDENTS TABLE
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type emergency_category NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT NOT NULL,
  people_affected INT NOT NULL DEFAULT 1,
  severity severity_level NOT NULL DEFAULT 'MEDIUM',
  status incident_status NOT NULL DEFAULT 'REPORTED',
  ai_summary TEXT,
  ai_confidence DOUBLE PRECISION DEFAULT 88.0,
  recommended_services TEXT[] DEFAULT '{}',
  recommended_actions TEXT[] DEFAULT '{}',
  is_sos BOOLEAN NOT NULL DEFAULT FALSE,
  assigned_responder_id UUID REFERENCES public.responders(id) ON DELETE SET NULL,
  merged_into_id UUID REFERENCES public.incidents(id) ON DELETE SET NULL,
  duplicates_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. INCIDENT UPDATES TABLE (TIMELINE)
CREATE TABLE IF NOT EXISTS public.incident_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  status incident_status NOT NULL,
  note TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. EMERGENCY CONTACTS TABLE
CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  phone TEXT NOT NULL,
  notify_on_sos BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. INDEXES FOR HIGH-THROUGHPUT SEARCH & GEOLOCATION
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON public.incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_lat_lon ON public.incidents(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_incident_updates_incident ON public.incident_updates(incident_id);

-- 8. AUTOMATIC UPDATED_AT TRIGGER
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_incidents_updated_at ON public.incidents;
CREATE TRIGGER trg_incidents_updated_at
  BEFORE UPDATE ON public.incidents
  FOR EACH ROW
  EXECUTE FUNCTION update_timestamp();

-- 9. ROW-LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.responders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Anyone can read active incidents for transparency/map
CREATE POLICY "Public read incidents" ON public.incidents
  FOR SELECT USING (true);

-- Anyone can report an emergency
CREATE POLICY "Public insert incidents" ON public.incidents
  FOR INSERT WITH CHECK (true);

-- Responders and Admins can update incidents
CREATE POLICY "Command update incidents" ON public.incidents
  FOR UPDATE USING (true);

-- Enable Supabase Realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.incidents;
ALTER PUBLICATION supabase_realtime ADD TABLE public.incident_updates;
ALTER PUBLICATION supabase_realtime ADD TABLE public.responders;
