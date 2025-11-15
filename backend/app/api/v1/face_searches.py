# backend/app/api/v1/faces_search.py
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from app.services.faiss_index import faiss_manager
from app.services.face_detection import compute_embedding_from_image, detect_faces_from_image_bytes
from app.db.mongo import embeddings_collection, images_collection
from app.utils.jwt import decode_token
import numpy as np

router = APIRouter()

@router.post("/search")
async def search_face(probe: UploadFile = File(...), top_k: int = 5, user=Depends(decode_token)):
    b = await probe.read()
    # decode to numpy image
    import cv2
    arr = np.frombuffer(b, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image")

    emb = compute_embedding_from_image(img)
    if not emb:
        raise HTTPException(status_code=400, detail="Could not compute embedding")

    # search using FAISS
    results = faiss_manager.search(emb, top_k=top_k)
    # Look up metadata from DB for the returned face_ids
    out = []
    for face_id, score in results:
        doc = await embeddings_collection.find_one({"face_id": face_id})
        if doc:
            img_doc = None
            if doc.get("image_id"):
                img_doc = await images_collection.find_one({"_id": ObjectId(doc["image_id"])})
            out.append({
                "face_id": face_id,
                "image_id": doc.get("image_id"),
                "score": float(score),
                "label": doc.get("label"),
                "s3_crop": img_doc.get("faces", [{}])[0].get("crop_s3") if img_doc else None
            })
    return {"results": out}
