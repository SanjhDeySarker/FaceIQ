from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class EmbeddingCreate(BaseModel):
    face_id: str
    vector: List[float]
    label: Optional[str] = None

class EmbeddingInDB(EmbeddingCreate):
    id: Optional[str] = Field(None, alias="_id")
    created_at: datetime = Field(default_factory=datetime.utcnow)
    vector_len: int = Field(..., description="length of embedding vector")

    class Config:
        allow_population_by_field_name = True
        json_encoders = { 'datetime': lambda dt: dt.isoformat() }

    @classmethod
    def from_create(cls, data: EmbeddingCreate):
        return cls(
            face_id=data.face_id,
            vector=data.vector,
            label=data.label,
            vector_len=len(data.vector),
        )
