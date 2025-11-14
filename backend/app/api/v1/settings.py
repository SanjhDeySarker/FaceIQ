from fastapi import APIRouter, Depends, HTTPException
from app.db.mongo import settings_collection
from bson import ObjectId
from app.utils.jwt import decode_token

router = APIRouter()

@router.get("/threshold")
async def get_threshold(user=Depends(decode_token)):
    s = await settings_collection.find_one({"user_id": user["sub"]})
    return {"threshold": s["threshold_percentage"] if s else 75}


@router.post("/threshold")
async def set_threshold(value: int, user=Depends(decode_token)):
    if value < 0 or value > 100:
        raise HTTPException(status_code=400, detail="Threshold must be between 0-100")

    await settings_collection.update_one(
        {"user_id": user["sub"]},
        {"$set": {"threshold_percentage": value}},
        upsert=True
    )

    return {"status": "updated", "threshold": value}
