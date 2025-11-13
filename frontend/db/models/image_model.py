from datetime import datetime
from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class UserInDB(BaseModel):
id: Optional[str] = Field(None, alias="_id")
email: EmailStr
hashed_password: str
api_key: Optional[str]
role: str = "user"
threshold: int = 75
created_at: datetime = datetime.utcnow()


class Config:
arbitrary_types_allowed = True
json_encoders = {datetime: lambda v: v.isoformat()}