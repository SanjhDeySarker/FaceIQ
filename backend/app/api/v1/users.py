from fastapi import APIRouter, Depends, HTTPException
from app.db.mongo import users_collection
from app.utils.jwt import decode_token
from bson import ObjectId

router = APIRouter()

async def get_current_user(token: str = Depends(decode_token)):
    user = await users_collection.find_one({"_id": ObjectId(token["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/me")
async def get_me(current_user = Depends(get_current_user)):
    current_user["_id"] = str(current_user["_id"])
    return current_user
