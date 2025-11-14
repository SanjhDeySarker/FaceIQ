from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class FaceMeta(BaseModel):
    face_id: str
    bbox: List[int] = Field(..., description="x, y, w, h")
    landmarks: Optional[List[float]] = None
    confidence: float = 1.0
    quality: Optional[float] = None  # 0-1 quality metric
    embedding_stored: bool = False

class FaceCreate(BaseModel):
    image_id: str
    face_id: str
    bbox: List[int]
    landmarks: Optional[List[float]] = None
    confidence: float = 1.0
    quality: Optional[float] = None

class FaceInDB(FaceMeta):
    id: Optional[str] = Field(None, alias="_id")
    image_id: str
    enrolled_label: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        allow_population_by_field_name = True
        json_encoders = { 'datetime': lambda dt: dt.isoformat() }  # simple encoder
