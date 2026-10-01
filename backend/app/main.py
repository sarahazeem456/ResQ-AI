from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict, Any
from app.schemas.incident import (
    AIAnalysisRequest,
    AIAnalysisResponse,
    DuplicateCheckRequest,
    DuplicateCheckResponse,
    IncidentCreate,
    IncidentResponse,
    SeverityLevel
)
from app.ai.pipeline import pipeline_instance

app = FastAPI(
    title="ResQ AI — Smart Emergency Response & Intelligence API",
    description="Open-Source REST API for emergency triage, duplicate detection, and tactical dispatch.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage for local runtime demo
INCIDENTS_DB: List[Dict[str, Any]] = [
    {
        "id": "1042",
        "title": "Road Accident with Injuries",
        "description": "Two vehicles collided near university main gate. Two persons injured.",
        "type": "Accident",
        "severity": "CRITICAL",
        "status": "DISPATCHED",
        "latitude": 37.7789,
        "longitude": -122.4214,
        "address": "University Blvd & 10th St, Sector 4",
        "people_affected": 2,
        "ai_summary": "High risk vehicular collision with trauma casualties. Immediate ambulance dispatch required.",
        "ai_confidence": 93.0,
        "recommended_services": ["AMBULANCE", "POLICE"]
    }
]

@app.get("/")
def root():
    return {
        "platform": "ResQ AI",
        "status": "operational",
        "docs_url": "/docs",
        "open_source_license": "Apache-2.0"
    }

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "ai_pipeline": "ready"}

@app.post("/api/ai/analyze", response_model=AIAnalysisResponse)
def analyze_incident(req: AIAnalysisRequest):
    """
    AI Triage Endpoint:
    Processes unstructured emergency text through the Hugging Face / Transformers pipeline.
    """
    if not req.description.strip():
        raise HTTPException(status_code=400, detail="Emergency description cannot be empty.")
    
    return pipeline_instance.analyze_report(
        description=req.description,
        category_hint=req.category_hint,
        people_affected=req.people_affected or 1
    )

@app.post("/api/ai/duplicates", response_model=DuplicateCheckResponse)
def check_duplicates(req: DuplicateCheckRequest):
    """
    AI Duplicate Detection:
    Correlates semantic embeddings and spatial coordinates with existing records.
    """
    incidents_pool = req.recent_incidents if req.recent_incidents is not None else INCIDENTS_DB
    is_dup, score, best_id, reason = pipeline_instance.check_duplicate(
        new_desc=req.description,
        lat=req.latitude,
        lon=req.longitude,
        recent_incidents=incidents_pool
    )
    return DuplicateCheckResponse(
        is_duplicate=is_dup,
        similarity_score=score,
        existing_incident_id=best_id,
        reason=reason
    )

@app.get("/api/incidents", response_model=List[Dict[str, Any]])
def list_incidents():
    return INCIDENTS_DB

@app.post("/api/incidents", status_code=status.HTTP_201_CREATED)
def create_incident(data: IncidentCreate):
    ai_res = pipeline_instance.analyze_report(data.description, data.type, data.people_affected)
    
    new_id = str(1000 + len(INCIDENTS_DB) + 1)
    record = {
        "id": new_id,
        "title": data.title or f"{ai_res.category} Emergency: {data.address}",
        "description": data.description,
        "type": ai_res.category,
        "severity": ai_res.severity.value,
        "status": "AI_ANALYZED",
        "latitude": data.latitude,
        "longitude": data.longitude,
        "address": data.address,
        "people_affected": ai_res.people_affected,
        "ai_summary": ai_res.summary,
        "ai_confidence": ai_res.confidence,
        "recommended_services": [s.value for s in ai_res.recommended_services],
        "is_sos": data.is_sos
    }
    INCIDENTS_DB.insert(0, record)
    return record

@app.get("/api/stats")
def get_stats():
    active = [i for i in INCIDENTS_DB if i.get("status") != "RESOLVED"]
    critical = [i for i in active if i.get("severity") == "CRITICAL"]
    return {
        "active_incidents": len(active),
        "critical": len(critical),
        "total_incidents": len(INCIDENTS_DB),
        "average_response_time_min": 4.8
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
