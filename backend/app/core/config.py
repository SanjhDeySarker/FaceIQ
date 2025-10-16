from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "FaceSaaS Platform"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # MongoDB
    MONGODB_URL: str = "mongodb://mongodb:27017"
    MONGODB_DB_NAME: str = "facesaas"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # AWS S3
    AWS_ACCESS_KEY_ID: Optional[str] = None
    AWS_SECRET_ACCESS_KEY: Optional[str] = None
    AWS_S3_BUCKET: Optional[str] = None
    AWS_REGION: Optional[str] = "us-east-1"
    
    # Use local storage if S3 not configured
    USE_S3: bool = False
    LOCAL_STORAGE_PATH: str = "./uploads"
    
    # Face Detection
    FACE_DETECTION_BACKEND: str = "opencv"
    FACE_DETECTION_MODEL: str = "VGG-Face"
    
    # Celery
    CELERY_BROKER_URL: str = "redis://redis:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://redis:6379/0"
    
    class Config:
        case_sensitive = True
        env_file = ".env"

settings = Settings()