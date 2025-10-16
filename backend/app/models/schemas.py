from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, EmailStr
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: Optional[PyObjectId] = Field(alias="_id")
    hashed_password: str
    api_key: str
    threshold: float = Field(default=75.0, ge=70.0, le=90.0)
    is_active: bool = True
    is_admin: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(BaseModel):
    id: str
    email: EmailStr
    api_key: str
    threshold: float
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

class ImageUpload(BaseModel):
    user_id: PyObjectId
    storage_key: Optional[str] = None
    local_path: Optional[str] = None
    file_name: str
    file_size: int
    upload_time: datetime = Field(default_factory=datetime.utcnow)
    faces: List[dict] = Field(default_factory=list)

class FaceDetection(BaseModel):
    face_id: PyObjectId = Field(default_factory=PyObjectId)
    bbox: List[float]
    confidence: float
    landmarks: Optional[dict] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    quality: Optional[float] = None

class FaceComparisonRequest(BaseModel):
    image1_id: Optional[str] = None
    image2_id: Optional[str] = None
    threshold: Optional[float] = None

class FaceComparisonResponse(BaseModel):
    similarity_score: float
    threshold_used: float
    match_status: str
    probe_confidence: float
    candidate_confidence: float

class ThresholdUpdate(BaseModel):
    threshold: float = Field(ge=70.0, le=90.0)