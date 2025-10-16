from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from app.db.mongo import get_user_collection
from app.models.schemas import UserResponse, ThresholdUpdate
from app.routers.auth import oauth2_scheme

router = APIRouter(prefix="/users", tags=["users"])

async def get_current_user(token: str = Depends(oauth2_scheme)):
    return "user_123"

@router.get("/profile", response_model=UserResponse)
async def get_profile(user_id: str = Depends(get_current_user)):
    users_collection = get_user_collection()
    user = await users_collection.find_one({"_id": ObjectId(user_id)})
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return UserResponse(
        id=str(user["_id"]),
        email=user["email"],
        api_key=user["api_key"],
        threshold=user["threshold"],
        created_at=user["created_at"]
    )

@router.patch("/threshold")
async def update_threshold(
    threshold_data: ThresholdUpdate,
    user_id: str = Depends(get_current_user)
):
    users_collection = get_user_collection()
    
    result = await users_collection.update_one(
        {"_id": ObjectId(user_id)},
        {"$set": {"threshold": threshold_data.threshold}}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="User not found")
    
    return {"message": "Threshold updated successfully", "new_threshold": threshold_data.threshold}