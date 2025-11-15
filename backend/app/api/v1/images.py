# backend/app/api/v1/images.py
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from app.services.image_storage import upload_to_s3
from app.services.face_detection import detect_faces_from_image_bytes, compute_embedding_from_image
from app.db.mongo import images_collection, embeddings_collection
from app.services.webhook import dispatch_event_async
from app.utils.jwt import decode_token
from bson import ObjectId
import uuid
import base64

router = APIRouter()

@router.post("/upload")
async def upload_image(file: UploadFile = File(...), user=Depends(decode_token)):
    content = await file.read()
    s3_key = upload_to_s3(content, file.filename)

    # detect faces & attributes: detect_faces_from_image_bytes should now return embedding + attributes
    faces = detect_faces_from_image_bytes(content)

    # persist image doc
    image_doc = {
        "user_id": user["sub"],
        "filename": file.filename,
        "s3_key": s3_key,
        "faces": faces
    }
    res = await images_collection.insert_one(image_doc)
    image_id = str(res.inserted_id)

    # Persist embeddings per face to embeddings_collection
    for f in faces:
        if f.get("embedding"):
            emb_doc = {
                "face_id": f["face_id"],
                "image_id": image_id,
                "vector": f["embedding"],
                "label": None
            }
            await embeddings_collection.insert_one(emb_doc)

    # dispatch webhook (async)
    await dispatch_event_async("image.uploaded", {"image_id": image_id, "user_id": user["sub"], "faces": len(faces)})

    return {"image_id": image_id, "faces": faces}
