from fastapi import APIRouter, HTTPException, Depends, UploadFile, File
from datetime import datetime
from bson import ObjectId
import os
from app.models.schemas import FaceComparisonRequest, FaceComparisonResponse
from app.services.face_service import face_service
from app.db.mongo import get_image_collection, get_user_collection
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/faces", tags=["faces"])

async def get_current_user(token: str = Depends(oauth2_scheme)):
    return "user_123"

@router.post("/verify", response_model=FaceComparisonResponse)
async def verify_faces(
    request: FaceComparisonRequest,
    user_id: str = Depends(get_current_user)
):
    user_collection = get_user_collection()
    user = await user_collection.find_one({"_id": ObjectId(user_id)})
    threshold = request.threshold or user.get("threshold", 75.0)
    
    # For demo purposes, return simulated results
    similarity_score = 85.2
    
    match_status = "MATCH" if similarity_score >= threshold else "NOT_MATCH"
    
    return FaceComparisonResponse(
        similarity_score=similarity_score,
        threshold_used=threshold,
        match_status=match_status,
        probe_confidence=0.99,
        candidate_confidence=0.97
    )

@router.post("/compare")
async def compare_faces(
    image1: UploadFile = File(...),
    image2: UploadFile = File(...),
    threshold: float = 75.0,
    user_id: str = Depends(get_current_user)
):
    if not image1.content_type.startswith('image/') or not image2.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="Both files must be images")
    
    # Save files to temp location
    temp_path1 = f"/tmp/{ObjectId()}_{image1.filename}"
    temp_path2 = f"/tmp/{ObjectId()}_{image2.filename}"
    
    try:
        contents1 = await image1.read()
        contents2 = await image2.read()
        
        with open(temp_path1, 'wb') as f:
            f.write(contents1)
        with open(temp_path2, 'wb') as f:
            f.write(contents2)
        
        # Compare faces
        comparison_result = await face_service.compare_faces(temp_path1, temp_path2)
        
        match_status = "MATCH" if comparison_result["similarity_score"] >= threshold else "NOT_MATCH"
        
        return FaceComparisonResponse(
            similarity_score=comparison_result["similarity_score"],
            threshold_used=threshold,
            match_status=match_status,
            probe_confidence=0.95,
            candidate_confidence=0.95
        )
        
    finally:
        for path in [temp_path1, temp_path2]:
            if os.path.exists(path):
                os.remove(path)