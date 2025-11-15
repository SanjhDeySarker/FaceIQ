# backend/app/services/face_detection.py (replace/extend)
from deepface import DeepFace
import cv2
import numpy as np
from typing import List, Dict
from app.services.image_storage import upload_to_s3
import io

DEEPFACE_MODEL = None
EMBED_MODEL_NAME = "ArcFace"  # or 'Facenet' depending on accuracy vs speed

def _load_model():
    global DEEPFACE_MODEL
    if DEEPFACE_MODEL is None:
        # DeepFace will load models internally on first call to represent/extract
        DEEPFACE_MODEL = True
    return DEEPFACE_MODEL

def detect_faces_from_image_bytes(image_bytes: bytes) -> List[Dict]:
    _load_model()
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        return []

    # use DeepFace.detectFace? We'll use DeepFace.extract_faces for metadata
    # DeepFace.extract_faces accepts image path or numpy array for recent versions
    try:
        extracted = DeepFace.extract_faces(img_path=img, detector_backend='mtcnn', enforce_detection=False)
    except Exception:
        extracted = []

    faces = []
    for e in extracted:
        face_img = e.get("face")  # numpy array of the cropped face by DeepFace
        facial_area = e.get("facial_area", {})
        bbox = [int(facial_area.get("x",0)), int(facial_area.get("y",0)),
                int(facial_area.get("w",0)), int(facial_area.get("h",0))] if isinstance(facial_area, dict) else [0,0,0,0]

        # compute embedding
        try:
            emb = DeepFace.represent(img_path=face_img, model_name=EMBED_MODEL_NAME, enforce_detection=False)
            if isinstance(emb, dict) and "embedding" in emb:
                embedding = emb["embedding"]
            else:
                embedding = emb
        except Exception:
            embedding = None

        # compute attributes (age, gender, emotion) using DeepFace.analyze
        try:
            attrs = DeepFace.analyze(img_path=face_img, actions=['age','gender','emotion'], enforce_detection=False)
            age = int(attrs.get("age")) if attrs.get("age") else None
            gender = attrs.get("gender")
            dominant_emotion = attrs.get("dominant_emotion")
        except Exception:
            age = None; gender = None; dominant_emotion = None

        # store crop to s3 (optional)
        try:
            _, buf = cv2.imencode('.jpg', face_img)
            crop_key = upload_to_s3(buf.tobytes(), f"crop_{np.random.randint(1e9)}.jpg")
        except Exception:
            crop_key = None

        face_record = {
            "face_id": f"face_{np.random.randint(1e12)}",
            "bbox": bbox,
            "landmarks": e.get("keypoints") or None,
            "confidence": float(e.get("confidence", 1.0) or 1.0),
            "embedding": embedding,
            "crop_s3": crop_key,
            "age": age,
            "gender": gender,
            "emotion": dominant_emotion,
            "quality": None
        }
        faces.append(face_record)

    return faces

def compute_embedding_from_image(img_array) -> List[float]:
    _load_model()
    try:
        emb = DeepFace.represent(img_path=img_array, model_name=EMBED_MODEL_NAME, enforce_detection=False)
        if isinstance(emb, dict) and "embedding" in emb:
            return emb["embedding"]
        return emb
    except Exception:
        return []
