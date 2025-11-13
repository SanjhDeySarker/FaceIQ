from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class UserSettings(BaseModel):
    user_id: str
    threshold_percentage: int = Field(75, ge=0, le=100)
    store_raw_images: bool = Field(True)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = None

    class Config:
        json_encoders = { 'datetime': lambda dt: dt.isoformat() }
