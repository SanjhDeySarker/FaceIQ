from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.db.mongo import images_collection
from app.services.image_storage import upload_to_s3
from app.services.face_detection import detect_faces_from_image_bytes
from app.utils.jwt import decode_token
from bson import ObjectId

router = APIRouter()

@router.post("/upload")
async def upload_image(
    file: UploadFile = File(...),
    user = Depends(decode_token)
):
    content = await file.read()
    key = upload_to_s3(content, file.filename)

    faces = detect_faces_from_image_bytes(content)

    doc = {
        "user_id": user["sub"],
        "filename": file.filename,
        "s3_key": key,
        "faces": faces
    }

    res = await images_collection.insert_one(doc)
    return {
        "image_id": str(res.inserted_id),
        "faces": faces
    }


@router.get("/{image_id}")
async def get_image(image_id: str):
    img = await images_collection.find_one({"_id": ObjectId(image_id)})
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")
    img["_id"] = str(img["_id"])
    return img
