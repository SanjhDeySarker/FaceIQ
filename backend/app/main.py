from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
import uuid
from datetime import datetime
from typing import Optional
import shutil

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

# FIX: Create uploads directory FIRST, before mounting it
os.makedirs("uploads", exist_ok=True)

# FIX: Now mount the static files directory AFTER creating it
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

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
    # Check if email already exists
    for user_data in users_db.values():
        if user_data["email"] == email:
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
    print(f"Received file: {file.filename}, type: {file.content_type}")
   
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
   
    try:
        # Read file
        contents = await file.read()
       
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
       
        # Validate file size (10MB limit)
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="File size must be less than 10MB")
       
        # Save file locally
        file_extension = os.path.splitext(file.filename)[1] or '.jpg'
        file_name = f"{uuid.uuid4()}{file_extension}"
        file_path = f"uploads/{file_name}"
       
        with open(file_path, "wb") as f:
            f.write(contents)
       
        print(f"File saved successfully: {file_path}")
       
        # Mock face detection - always return some faces for testing
        faces = [
            {
                "face_id": str(uuid.uuid4()),
                "bbox": [100, 100, 200, 200],
                "confidence": 0.98,
                "age": 25,
                "gender": "male",
                "quality": 0.9
            },
            {
                "face_id": str(uuid.uuid4()),
                "bbox": [400, 150, 180, 180],
                "confidence": 0.96,
                "age": 30,
                "gender": "female",
                "quality": 0.8
            }
        ]
       
        # Store image info
        image_id = str(uuid.uuid4())
        images_db[image_id] = {
            "image_id": image_id,
            "file_name": file.filename,
            "file_path": file_path,
            "file_url": f"/uploads/{file_name}",
            "upload_time": datetime.utcnow().isoformat(),
            "faces": faces,
            "face_count": len(faces)
        }
       
        response_data = {
            "image_id": image_id,
            "file_name": file.filename,
            "file_url": f"/uploads/{file_name}",
            "face_count": len(faces),
            "faces": faces,
            "upload_time": datetime.utcnow().isoformat()
        }
       
        print(f"Returning response: {response_data}")
        return response_data
       
    except Exception as e:
        print(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.post("/api/v1/faces/compare")
async def compare_faces(
    image1: UploadFile = File(...),
    image2: UploadFile = File(...),
    threshold: float = Form(75.0)
):
    print("Comparing faces...")
   
    # Validate files
    for file in [image1, image2]:
        if not file.content_type or not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="Both files must be images")
   
    try:
        # Read both files
        await image1.read()
        await image2.read()
       
        # Mock face comparison - always return a result for testing
        similarity_score = 85.2
        match_status = "MATCH" if similarity_score >= threshold else "NOT_MATCH"
       
        result = {
            "similarity_score": similarity_score,
            "threshold_used": threshold,
            "match_status": match_status,
            "probe_confidence": 0.99,
            "candidate_confidence": 0.97,
            "message": "Comparison completed successfully"
        }
       
        print(f"Comparison result: {result}")
        return result
       
    except Exception as e:
        print(f"Comparison error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Comparison failed: {str(e)}")

@app.get("/api/v1/images/my-images")
async def get_my_images():
    # Return all images for demo
    return list(images_db.values())

@app.get("/api/v1/users/profile")
async def get_profile():
    # Mock user profile - return first user or create one
    if users_db:
        user = list(users_db.values())[0]
        return user
    else:
        # Create a mock user if none exists
        user_id = str(uuid.uuid4())
        mock_user = {
            "id": user_id,
            "email": "demo@example.com",
            "api_key": "demo-api-key-123",
            "threshold": 75.0,
            "created_at": datetime.utcnow().isoformat()
        }
        return mock_user

@app.patch("/api/v1/users/threshold")
async def update_threshold(threshold: float):
    if threshold < 70 or threshold > 90:
        raise HTTPException(status_code=422, detail="Threshold must be between 70 and 90")
   
    # Update first user's threshold for demo
    if users_db:
        user_id = list(users_db.keys())[0]
        users_db[user_id]["threshold"] = threshold
   
    return {"message": "Threshold updated successfully", "new_threshold": threshold}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
