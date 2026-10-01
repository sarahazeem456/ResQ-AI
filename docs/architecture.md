# ResQ AI System Architecture

## 1. Overview
ResQ AI is an open-source, resilient emergency response and intelligence platform that pairs civilian-facing crisis reporting with a real-time tactical command center for emergency dispatchers.

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

## 2. Ingestion & NLP Pipeline
1. **Unstructured Narrative Ingestion**: Reports received via text input or instant SOS triggers.
2. **Category & Priority Classification**: Classifies incidents into categories (Medical, Accident, Fire, Personal Safety, Flood, Infrastructure, etc.) and assigns severity (LOW, MEDIUM, HIGH, CRITICAL).
3. **Duplicate Detection Matrix**: Evaluates recent reports in the same geographic radius (< 2.5km) using lexical overlap and vector similarity to avoid duplicate dispatches.
4. **Responder Recommendation**: Identifies appropriate responding units (Ambulance, Police, Fire, Rescue) and tactical protocol checklists.

## 3. Real-Time Operations & Data Store
- **PostgreSQL**: Stores incidents, updates, responder telemetry, and contacts.
- **Supabase Realtime**: Broadcasts inserts and updates to all connected dispatcher and civilian dashboards instantaneously.
- **Leaflet & OSM**: Visualizes incidents with color-coded severity beacons and animated responder positions.
