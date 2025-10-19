@echo off
echo 🔧 Fixing Email Validator Issue Permanently...
echo.

cd /d C:\FaceIQ\backend
call venv\Scripts\activate.bat

echo 📝 Updating schemas to remove email validation dependency...
python -c "
# Update schemas.py to remove EmailStr dependency
schemas_content = '''
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, validator
import re
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError('Invalid objectid')
        return ObjectId(v)

    @classmethod
    def __modify_schema__(cls, field_schema):
        field_schema.update(type='string')

class UserBase(BaseModel):
    email: str

    @validator('email')
    def validate_email(cls, v):
        if not v or '@' not in v or '.' not in v:
            raise ValueError('Invalid email address')
        return v.lower().strip()

class UserCreate(UserBase):
    password: str

    @validator('password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class User(UserBase):
    id: Optional[PyObjectId] = Field(alias='_id')
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
    email: str
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
'''

with open('app/models/schemas.py', 'w', encoding='utf-8') as f:
    f.write(schemas_content)
print('✅ Schemas updated successfully!')
"

echo 🚀 Starting backend...
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

pause