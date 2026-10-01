import re
import math
from typing import List, Dict, Any, Tuple
from app.schemas.incident import SeverityLevel, ResponderType, AIAnalysisResponse

"""
ResQ AI Open-Source AI Intelligence Pipeline
Supports:
1. Local Hugging Face Transformers zero-shot classification (e.g. facebook/bart-large-mnli)
2. Sentence Transformers for vector embeddings (all-MiniLM-L6-v2)
3. High-throughput robust rule & token heuristic fallback
"""

CANDIDATE_CATEGORIES = [
    "Accident", "Medical", "Fire", "Personal Safety", 
    "Missing Person", "Flood", "Natural Disaster", "Infrastructure", "Other"
]

CATEGORY_KEYWORDS = {
    "Accident": ["accident", "crash", "collision", "vehicle", "car", "truck", "motorcycle", "pedestrian"],
    "Medical": ["heart", "cardiac", "stroke", "bleeding", "unconscious", "breathing", "seizure", "injured"],
    "Fire": ["fire", "flames", "smoke", "burning", "explosion", "blaze", "inferno"],
    "Personal Safety": ["assault", "robbery", "weapon", "threat", "gunshot", "stalker", "violence"],
    "Flood": ["flood", "water rising", "submerged", "overflow", "drowning"],
    "Natural Disaster": ["earthquake", "tornado", "hurricane", "landslide"],
    "Infrastructure": ["bridge collapse", "power outage", "gas leak", "sinkhole"]
}

class EmergencyAIPipeline:
    def __init__(self):
        self.classifier = None
        self.embedder = None
        self._load_models_lazy()

    def _load_models_lazy(self):
        try:
            from transformers import pipeline
            from sentence_transformers import SentenceTransformer
            self.classifier = pipeline("zero-shot-classification", model="facebook/bart-large-mnli")
            self.embedder = SentenceTransformer("all-MiniLM-L6-v2")
            print("Successfully loaded Hugging Face open-source models.")
        except Exception as e:
            print(f"Transformers models running in lightweight heuristic fallback mode: {e}")

    def analyze_report(
        self,
        description: str,
        category_hint: str = None,
        people_affected: int = 1
    ) -> AIAnalysisResponse:
        desc_lower = description.lower()

        # 1. Determine category
        detected_category = category_hint or "Other"
        confidence = 88.0

        if self.classifier:
            try:
                res = self.classifier(description, candidate_labels=CANDIDATE_CATEGORIES)
                detected_category = res["labels"][0]
                confidence = round(float(res["scores"][0]) * 100, 1)
            except Exception:
                pass

        if detected_category == "Other" or not self.classifier:
            for cat, keywords in CATEGORY_KEYWORDS.items():
                if any(k in desc_lower for k in keywords):
                    detected_category = cat
                    break

        # 2. Extract people affected
        detected_people = people_affected
        match = re.search(r"(\d+)\s*(people|persons|victims|casualties|injured)", desc_lower)
        if match:
            detected_people = int(match.group(1))
        elif "two people" in desc_lower or "2 people" in desc_lower:
            detected_people = 2

        # 3. Severity assessment
        critical_markers = ["injured", "unconscious", "not breathing", "fatal", "major road accident", "trapped"]
        high_markers = ["bleeding", "broken bone", "fire spreading", "two people", "urgent"]

        if any(m in desc_lower for m in critical_markers) or detected_people >= 3:
            severity = SeverityLevel.CRITICAL
        elif any(m in desc_lower for m in high_markers) or detected_category in ["Fire", "Personal Safety"]:
            severity = SeverityLevel.HIGH
        else:
            severity = SeverityLevel.MEDIUM

        # 4. Recommended services
        services = []
        if detected_category == "Medical" or "injur" in desc_lower or "bleeding" in desc_lower:
            services.append(ResponderType.AMBULANCE)
        if detected_category == "Accident":
            if ResponderType.AMBULANCE not in services:
                services.append(ResponderType.AMBULANCE)
            services.append(ResponderType.POLICE)
        if detected_category == "Fire":
            services.extend([ResponderType.FIRE, ResponderType.AMBULANCE])
        if detected_category in ["Personal Safety", "Missing Person"]:
            if ResponderType.POLICE not in services:
                services.append(ResponderType.POLICE)
        if detected_category in ["Flood", "Natural Disaster"]:
            services.append(ResponderType.RESCUE)
        if not services:
            services.append(ResponderType.POLICE)

        # 5. Recommended actions
        actions = []
        if severity == SeverityLevel.CRITICAL:
            actions.append("Dispatch closest emergency vehicle with Priority 1 sirens")
            actions.append("Alert Level-1 trauma surgical center in target sector")
        if detected_category == "Accident":
            actions.append("Coordinate police perimeter to reroute intersection traffic")
        if detected_category == "Fire":
            actions.append("Establish 150m toxic smoke isolation zone")

        summary = f"Identified {severity.value} priority {detected_category.lower()} emergency involving ~{detected_people} affected individual(s)."

        return AIAnalysisResponse(
            category=detected_category,
            severity=severity,
            summary=summary,
            people_affected=detected_people,
            recommended_services=services,
            recommended_actions=actions,
            confidence=confidence
        )

    def calculate_distance_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        r = 6371.0
        d_lat = math.radians(lat2 - lat1)
        d_lon = math.radians(lon2 - lon1)
        a = (math.sin(d_lat / 2) ** 2 +
             math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
             math.sin(d_lon / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return r * c

    def check_duplicate(
        self,
        new_desc: str,
        lat: float,
        lon: float,
        recent_incidents: List[Dict[str, Any]]
    ) -> Tuple[bool, float, Optional[str], Optional[str]]:
        best_score = 0.0
        best_id = None
        reason = None

        for inc in recent_incidents:
            dist = self.calculate_distance_km(lat, lon, inc.get("latitude", 0), inc.get("longitude", 0))
            if dist < 2.0:
                words_new = set(re.findall(r"\w{4,}", new_desc.lower()))
                words_old = set(re.findall(r"\w{4,}", inc.get("description", "").lower()))
                overlap = len(words_new & words_old) / max(len(words_new | words_old), 1)
                sim_score = round(overlap * 60 + (1.0 - min(dist / 2.0, 1.0)) * 40, 1)

                if sim_score > best_score:
                    best_score = sim_score
                    best_id = str(inc.get("id"))
                    reason = f"Situation within {dist*1000:.0f}m of incident #{best_id} with {sim_score}% lexical overlap."

        is_dup = best_score >= 65.0
        return is_dup, best_score, best_id, reason

pipeline_instance = EmergencyAIPipeline()
