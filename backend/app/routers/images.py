from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from datetime import datetime
from bson import ObjectId
import os
from app.db.mongo import get_image_collection, get_embedding_collection
from app.services.face_service import face_service
from app.services.storage_service import storage_service
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/images", tags=["images"])

async def get_current_user(token: str = Depends(oauth2_scheme)):
    # Simplified user extraction - in production, verify JWT token
    return "user_123"

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user)
):
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    contents = await file.read()
    file_extension = os.path.splitext(file.filename)[1]
    
    storage_key = await storage_service.upload_file(contents, file_extension, user_id)
    
    temp_path = f"/tmp/{ObjectId()}{file_extension}"
    with open(temp_path, 'wb') as f:
        f.write(contents)
    
    try:
        faces_metadata = await face_service.detect_faces(temp_path)
        
        image_doc = {
            "user_id": ObjectId(user_id),
            "storage_key": storage_key,
            "file_name": file.filename,
            "file_size": len(contents),
            "upload_time": datetime.utcnow(),
            "faces": faces_metadata,
            "face_count": len(faces_metadata)
        }
        
        images_collection = get_image_collection()
        result = await images_collection.insert_one(image_doc)
        
        embeddings_collection = get_embedding_collection()
        for face in faces_metadata:
            embedding = await face_service.extract_embedding(temp_path)
            if embedding:
                embedding_doc = {
                    "face_id": face["face_id"],
                    "embedding": embedding,
                    "user_id": ObjectId(user_id),
                    "image_id": result.inserted_id,
                    "created_at": datetime.utcnow()
                }
                await embeddings_collection.insert_one(embedding_doc)
        
        return {
            "image_id": str(result.inserted_id),
            "face_count": len(faces_metadata),
            "faces": faces_metadata,
            "storage_key": storage_key
        }
        
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

@router.get("/my-images")
async def get_my_images(user_id: str = Depends(get_current_user)):
    images_collection = get_image_collection()
    images = await images_collection.find({"user_id": ObjectId(user_id)}).to_list(100)
    
    for image in images:
        image["_id"] = str(image["_id"])
        image["user_id"] = str(image["user_id"])
    
    return images