from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
import uvicorn
import os
from datetime import datetime
import uuid

app = FastAPI(
    title="Face Detection API",
    description="API for face detection and analysis",
    version="1.0.0"
)

# CORS middleware - IMPORTANT for frontend connection
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173"],  # React/Vite dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create uploads directory if it doesn't exist
os.makedirs("uploads", exist_ok=True)

# Serve uploaded files statically
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/")
async def root():
    return {"message": "Face Detection API is running!", "status": "healthy"}

# Add the exact endpoint your frontend is looking for
@app.get("/api/v1/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Also keep the shorter version
@app.get("/health")
async def health_check_short():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

@app.post("/api/v1/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image for face detection
    """
    try:
        print(f"📨 Received upload request for file: {file.filename}")
        
        # Validate file type
        if not file.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Validate file size (10MB limit)
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="File size must be less than 10MB")
        
        # Generate unique filename
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = os.path.join("uploads", unique_filename)
        
        # Save the file
        with open(file_path, "wb") as f:
            f.write(contents)
        
        print(f"✅ File saved: {file_path}")
        
        # Mock face detection data
        mock_faces = [
            {
                "face_id": str(uuid.uuid4()),
                "bbox": [100, 100, 200, 200],
                "confidence": 0.95,
                "age": 25,
                "gender": "male",
                "quality": 0.89,
                "emotions": {"happy": 85, "neutral": 10, "surprised": 5}
            },
            {
                "face_id": str(uuid.uuid4()),
                "bbox": [400, 150, 180, 180],
                "confidence": 0.87,
                "age": 32,
                "gender": "female", 
                "quality": 0.78,
                "emotions": {"happy": 70, "neutral": 25, "sad": 5}
            }
        ]
        
        response_data = {
            "image_id": str(uuid.uuid4()),
            "file_name": file.filename,
            "file_size": len(contents),
            "file_url": f"/uploads/{unique_filename}",
            "face_count": len(mock_faces),
            "faces": mock_faces,
            "upload_time": datetime.now().isoformat(),
            "processing_time": "0.5s",
            "message": "Face detection completed successfully"
        }
        
        print(f"🎯 Sending response: {response_data}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Error processing image: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error processing image: {str(e)}")

@app.get("/api/v1/images")
async def get_images():
    """Get list of uploaded images"""
    return {
        "images": [
            {
                "id": str(uuid.uuid4()),
                "name": "sample1.jpg",
                "upload_date": datetime.now().isoformat(),
                "face_count": 2
            }
        ]
    }

@app.post("/api/v1/compare")
async def compare_faces(image1: UploadFile = File(...), image2: UploadFile = File(...)):
    """Compare faces in two images"""
    return {
        "match": True,
        "confidence": 0.89,
        "message": "Faces match with high confidence"
    }

# Add a simple test endpoint
@app.get("/api/v1/test")
async def test_endpoint():
    return {"message": "Test endpoint working!", "status": "success"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0", 
        port=8000,
        reload=True
    )