# ResQ AI — Smart Emergency Response & Intelligence Platform

> **"Turn emergency reports into actionable intelligence."**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Open Source](https://img.shields.io/badge/Open_Source-100%25-brightgreen.svg)](#)
[![Python](https://img.shields.io/badge/Python-3.11+-yellow.svg)](#)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](#)
[![React](https://img.shields.io/badge/Frontend-React_19_%2B_Vite-61DAFB.svg)](#)
[![Leaflet](https://img.shields.io/badge/Maps-Leaflet_%2B_OSM-199900.svg)](#)

ResQ AI is an open-source, web-based emergency reporting and response coordination platform. When citizens or sensors submit unstructured emergency reports, an AI triage engine classifies the incident category, calculates priority severity (Critical, High, Medium, Low), identifies affected casualties, suggests responders, and flags potential duplicates.

Simultaneously, tactical dispatchers and responders monitor incidents across a real-time command-center map with 1-click dispatch and timeline resolution.

---

## Key Features

- **Automated AI Triage**: Evaluates crisis reports in milliseconds to extract category, severity level, estimated casualties, and operational checklists.
- **One-Touch Instant SOS**: Geolocation-enabled emergency distress beacon with immediate nearest-unit alert and live response timer.
- **Real-Time Tactical Command Center**: Operations dashboard with top-tier KPIs, interactive Leaflet + OpenStreetMap GIS map, and colored severity beacons.
- **AI Duplicate Detection**: Compares semantic sentence embeddings and spatial radius (< 2.5km) to prevent dispatch saturation.
- **Commander AI Dispatch Assistant**: Natural language operational queries over live incident records ("What are the critical incidents?", "Which incidents need medical assistance?").
- **Live Recharts Analytics**: Real-time breakdown of incident volume over time, triage severity distribution, and response time metrics.
- **Supabase Authentication & Role-Based Access**: Specialized views for Dispatch Commanders and Civilians.

---

## Demo Flow Walkthrough

1. Open ResQ AI and click **Report an Emergency** (or use the one-click demo button).
2. Enter the prompt:
   > *"There has been a major road accident near the university. Two people appear injured."*
3. The AI analyzes the report:
   - **Category**: Traffic Accident
   - **Severity**: Critical (🔴)
   - **Recommended Units**: Ambulance (🚑) & Police (🚓)
   - **Confidence**: 93%
4. The incident immediately appears on the **Admin Command Center** and on the **Live Map**.
5. The dispatcher opens the incident and dispatches Paramedic Unit 104.
6. The incident status updates to `DISPATCHED`, reflected on the user's tracker.
7. The dispatcher marks the incident `RESOLVED`, updating real-time analytics.

---

## System Architecture

```
[ Civilian Web / Mobile UI / SOS ]
              │
              ▼
   [ ResQ AI Ingestion Layer ]
              │
              ├──► [ Zero-Shot NLP Classifier (HF / BART) ]
              ├──► [ Spatial Distance Engine (Haversine) ]
              └──► [ Duplicate Cluster Detector (MiniLM-L6) ]
              │
              ▼
    [ Structured Incident Record ]
   (Category, Severity, Units, ETA)
              │
              ▼
   [ Supabase PostgreSQL & Realtime ]
              │
              ▼
[ Tactical Command Center & Live Map (Leaflet) ]
              │
              ▼
   [ Responder Dispatch & Field Updates ]
```

---

## Technology Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Leaflet, OpenStreetMap, Recharts, Lucide Icons
- **Backend**: Python 3.11, FastAPI, Pydantic v2, Uvicorn
- **AI / NLP**: Hugging Face Transformers (`facebook/bart-large-mnli`), Sentence Transformers (`all-MiniLM-L6-v2`)
- **Database & Auth**: Supabase PostgreSQL, PostGIS, Row-Level Security (RLS), Supabase Realtime

---

## Installation & Setup

### Prerequisites
- Node.js 18+ & npm
- Python 3.11+
- Docker & Docker Compose (Optional)

### Option 1: Quickstart with Docker Compose
```bash
docker compose up --build
```
- Frontend available at: `http://localhost:3000`
- Backend API docs at: `http://localhost:8000/docs`

### Option 2: Running Independently

#### 1. Frontend Setup
```bash
cd frontend  # or project root
npm install
npm run dev
```

#### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

#### 3. Database Setup (Supabase)
1. In your Supabase dashboard or local PostgreSQL instance, open the SQL Editor.
2. Run the migration script in `database/schema.sql`.

---

## Environment Variables

Copy `.env.example` to `.env`:
```env
# Supabase Configuration
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-key"

# Backend API URL
VITE_API_URL="http://localhost:8000"

# Optional Gemini API key if using cloud LLM proxy
GEMINI_API_KEY=""
```

---

## Ethical & Safety Notice

ResQ AI is designed as an operational aid for emergency management and humanitarian response. Automated AI triage recommendations do not replace certified human emergency dispatchers or medical emergency protocols.

---

## License

Distributed under the Apache-2.0 License. See `LICENSE` for details.
