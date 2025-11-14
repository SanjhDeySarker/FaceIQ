from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.db.mongo import users_collection
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.schemas.auth_schemas import RegisterRequest, TokenResponse
from bson import ObjectId

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    existing = await users_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    user_doc = {
        "email": req.email,
        "hashed_password": hashed,
        "role": "user",
        "threshold": 75
    }

    res = await users_collection.insert_one(user_doc)
    token = create_access_token({"sub": str(res.inserted_id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token)
from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from app.db.mongo import users_collection
from app.utils.hashing import hash_password, verify_password
from app.utils.jwt import create_access_token
from app.schemas.auth_schemas import RegisterRequest, TokenResponse
from bson import ObjectId

router = APIRouter()

@router.post("/register", response_model=TokenResponse)
async def register(req: RegisterRequest):
    existing = await users_collection.find_one({"email": req.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed = hash_password(req.password)
    user_doc = {
        "email": req.email,
        "hashed_password": hashed,
        "role": "user",
        "threshold": 75
    }

    res = await users_collection.insert_one(user_doc)
    token = create_access_token({"sub": str(res.inserted_id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token({"sub": str(user["_id"])})
    return TokenResponse(access_token=token)
