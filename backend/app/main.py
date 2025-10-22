from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
from datetime import datetime
from typing import Optional

app = FastAPI(
    title="FaceSaaS Platform",
    version="1.0.0",
    docs_url="/docs"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory storage (replace with database later)
users_db = {}
images_db = {}

# Simple authentication
def verify_password(plain_password, hashed_password):
    return plain_password == hashed_password  # In production, use proper hashing

def get_password_hash(password):
    return password  # In production, use proper hashing

def create_access_token(data: dict):
    return f"mock-token-{uuid.uuid4()}"

# Routes
@app.get("/")
async def root():
    return {"message": "FaceSaaS Platform API", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@app.post("/api/v1/auth/register")
async def register(email: str = Form(...), password: str = Form(...)):
    if email in [user["email"] for user in users_db.values()]:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Simple email validation
    if "@" not in email or "." not in email:
        raise HTTPException(status_code=422, detail="Invalid email format")
    
    if len(password) < 6:
        raise HTTPException(status_code=422, detail="Password must be at least 6 characters")
    
    user_id = str(uuid.uuid4())
    users_db[user_id] = {
        "id": user_id,
        "email": email,
        "hashed_password": get_password_hash(password),
        "api_key": f"api-key-{uuid.uuid4()}",
        "threshold": 75.0,
        "created_at": datetime.utcnow().isoformat()
    }
    
    return users_db[user_id]

@app.post("/api/v1/auth/login")
async def login(username: str = Form(...), password: str = Form(...)):
    user = None
    for user_data in users_db.values():
        if user_data["email"] == username:
            user = user_data
            break
    
    if not user or not verify_password(password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token({"sub": user["email"]})
    return {"access_token": access_token, "token_type": "bearer"}

@app.post("/api/v1/images/upload")
async def upload_image(file: UploadFile = File(...)):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Read file
    contents = await file.read()
    
    # Save file locally
    os.makedirs("uploads", exist_ok=True)
    file_extension = os.path.splitext(file.filename)[1]
    file_name = f"{uuid.uuid4()}{file_extension}"
    file_path = f"uploads/{file_name}"
    
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # Mock face detection
    faces = [
        {
            "face_id": str(uuid.uuid4()),
            "bbox": [100, 100, 200, 200],
            "confidence": 0.98,
            "age": 25,
            "gender": "male",
            "quality": 0.9
        }
    ]
    
    # Store image info
    image_id = str(uuid.uuid4())
    images_db[image_id] = {
        "image_id": image_id,
        "file_name": file.filename,
        "file_path": file_path,
        "upload_time": datetime.utcnow().isoformat(),
        "faces": faces,
        "face_count": len(faces)
    }
    
    return images_db[image_id]

@app.post("/api/v1/faces/compare")
async def compare_faces(
    image1: UploadFile = File(...),
    image2: UploadFile = File(...),
    threshold: float = Form(75.0)
):
    # Mock face comparison
    similarity_score = 85.2
    match_status = "MATCH" if similarity_score >= threshold else "NOT_MATCH"
    
    return {
        "similarity_score": similarity_score,
        "threshold_used": threshold,
        "match_status": match_status,
        "probe_confidence": 0.99,
        "candidate_confidence": 0.97
    }

@app.get("/api/v1/users/profile")
async def get_profile():
    # Mock user profile
    return {
        "id": "mock-user-id",
        "email": "user@example.com",
        "api_key": "mock-api-key-123",
        "threshold": 75.0,
        "created_at": datetime.utcnow().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)