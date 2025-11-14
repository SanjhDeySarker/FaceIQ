from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from bson import ObjectId
from app.db.mongo import images_collection, embeddings_collection
from app.schemas.face_schemas import EnrollRequest, VerifyRequest
from app.services.face_verification import verify_embeddings
from app.services.face_detection import detect_faces_from_image_bytes, compute_embedding_from_image
from app.utils.jwt import decode_token
import numpy as np
import cv2

router = APIRouter()


@router.post("/enroll")
async def enroll_face(req: EnrollRequest, user=Depends(decode_token)):
    # Get image
    img = await images_collection.find_one({"_id": ObjectId(req.image_id)})
    if not img:
        raise HTTPException(status_code=404, detail="Image not found")

    # Extract face embedding from stored metadata
    face = next((f for f in img["faces"] if f["face_id"] == req.face_id), None)
    if not face:
        raise HTTPException(status_code=404, detail="Face ID not found")

    embedding = face.get("embedding")
    if not embedding:
        raise HTTPException(status_code=400, detail="No embedding available for this face")

    doc = {
        "face_id": req.face_id,
        "label": req.label,
        "embedding": embedding
    }

    await embeddings_collection.insert_one(doc)
    return {"status": "enrolled", "face_id": req.face_id}


# ------------------------ VERIFY USING IMAGE IDs ------------------------
@router.post("/verify/ids")
async def verify_ids(req: VerifyRequest):
    threshold = req.threshold or 75

    probe = await images_collection.find_one({"_id": ObjectId(req.probe_image_id)})
    candidate = await images_collection.find_one({"_id": ObjectId(req.candidate_image_id)})

    if not probe or not candidate:
        raise HTTPException(status_code=404, detail="Image not found")

    probe_emb = probe["faces"][0].get("embedding")
    candidate_emb = candidate["faces"][0].get("embedding")

    if not probe_emb or not candidate_emb:
        raise HTTPException(status_code=400, detail="Missing embeddings")

    result = verify_embeddings(probe_emb, candidate_emb, threshold)

    result.update({
        "probe_confidence": probe["faces"][0]["confidence"],
        "candidate_confidence": candidate["faces"][0]["confidence"]
    })

    return result


# ------------------------ VERIFY USING FILE UPLOAD ------------------------
@router.post("/verify")
async def verify_files(
    probe: UploadFile = File(...),
    candidate: UploadFile = File(...),
    threshold: int = 75
):
    probe_bytes = await probe.read()
    cand_bytes = await candidate.read()

    # Convert bytes -> numpy array
    arr1 = np.frombuffer(probe_bytes, np.uint8)
    arr2 = np.frombuffer(cand_bytes, np.uint8)
    img1 = cv2.imdecode(arr1, cv2.IMREAD_COLOR)
    img2 = cv2.imdecode(arr2, cv2.IMREAD_COLOR)

    # Compute embeddings
    emb1 = compute_embedding_from_image(img1)
    emb2 = compute_embedding_from_image(img2)

    result = verify_embeddings(emb1, emb2, threshold)
    result.update({
        "probe_confidence": 1.0,
        "candidate_confidence": 1.0
    })

    return result
