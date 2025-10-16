from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from bson import ObjectId
from app.db.mongo import get_user_collection
from app.models.schemas import UserCreate, UserResponse, Token
from app.utils.auth import verify_password, get_password_hash, create_access_token, generate_api_key

router = APIRouter(prefix="/auth", tags=["authentication"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    users_collection = get_user_collection()
    
    existing_user = await users_collection.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    user_dict = {
        "email": user_data.email,
        "hashed_password": get_password_hash(user_data.password),
        "api_key": generate_api_key(),
        "threshold": 75.0,
        "is_active": True,
        "is_admin": False,
        "created_at": datetime.utcnow()
    }
    
    result = await users_collection.insert_one(user_dict)
    user_dict["_id"] = result.inserted_id
    
    return UserResponse(
        id=str(user_dict["_id"]),
        email=user_dict["email"],
        api_key=user_dict["api_key"],
        threshold=user_dict["threshold"],
        created_at=user_dict["created_at"]
    )

@router.post("/login", response_model=Token)
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    users_collection = get_user_collection()
    
    user = await users_collection.find_one({"email": form_data.username})
    if not user or not verify_password(form_data.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account deactivated"
        )
    
    access_token = create_access_token(data={"sub": user["email"]})
    return Token(access_token=access_token, token_type="bearer")