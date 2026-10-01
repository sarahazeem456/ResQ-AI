from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum
from datetime import datetime

class SeverityLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class IncidentStatus(str, Enum):
    REPORTED = "REPORTED"
    AI_ANALYZED = "AI_ANALYZED"
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    CANCELLED = "CANCELLED"

class ResponderType(str, Enum):
    POLICE = "POLICE"
    AMBULANCE = "AMBULANCE"
    FIRE = "FIRE"
    RESCUE = "RESCUE"

class AIAnalysisRequest(BaseModel):
    description: str = Field(..., description="Unstructured description of the emergency incident")
    category_hint: Optional[str] = None
    people_affected: Optional[int] = 1
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class AIAnalysisResponse(BaseModel):
    category: str
    severity: SeverityLevel
    summary: str
    people_affected: int
    recommended_services: List[ResponderType]
    recommended_actions: List[str]
    confidence: float
    disclaimer: str = "Automated operational intelligence assistance only. Does not replace professional dispatch authority."

class DuplicateCheckRequest(BaseModel):
    description: str
    latitude: float
    longitude: float
    recent_incidents: Optional[List[dict]] = None

class DuplicateCheckResponse(BaseModel):
    is_duplicate: bool
    similarity_score: float
    existing_incident_id: Optional[str] = None
    reason: Optional[str] = None

class IncidentCreate(BaseModel):
    title: Optional[str] = None
    description: str
    type: Optional[str] = "Accident"
    latitude: float
    longitude: float
    address: str
    people_affected: int = 1
    contact_name: Optional[str] = None
    contact_phone: Optional[str] = None
    image_url: Optional[str] = None
    is_sos: bool = False

class IncidentResponse(BaseModel):
    id: str
    title: str
    description: str
    type: str
    severity: SeverityLevel
    status: IncidentStatus
    latitude: float
    longitude: float
    address: str
    people_affected: int
    ai_summary: str
    ai_confidence: float
    recommended_services: List[str]
    created_at: datetime
    updated_at: datetime
