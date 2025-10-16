import os
from typing import List, Optional, Dict, Any
from deepface import DeepFace
from app.core.config import settings

class FaceService:
    def __init__(self):
        self.model_name = settings.FACE_DETECTION_MODEL
        self.detector_backend = settings.FACE_DETECTION_BACKEND
    
    async def detect_faces(self, image_path: str) -> List[dict]:
        try:
            objs = DeepFace.analyze(
                img_path=image_path,
                actions=['age', 'gender', 'emotion'],
                detector_backend=self.detector_backend,
                enforce_detection=False,
                silent=True
            )
            
            faces_metadata = []
            for obj in objs:
                face_data = {
                    "face_id": str(obj.get("face_id", "default_id")),
                    "bbox": [
                        obj.get("region", {}).get("x", 0),
                        obj.get("region", {}).get("y", 0),
                        obj.get("region", {}).get("w", 0),
                        obj.get("region", {}).get("h", 0)
                    ],
                    "confidence": obj.get("face_confidence", 0.99),
                    "age": obj.get("age"),
                    "gender": obj.get("dominant_gender"),
                    "emotion": obj.get("dominant_emotion"),
                    "quality": self._calculate_face_quality(obj)
                }
                faces_metadata.append(face_data)
            
            return faces_metadata
            
        except Exception as e:
            print(f"Face detection error: {e}")
            return []
    
    async def extract_embedding(self, image_path: str) -> Optional[List[float]]:
        try:
            embedding_objs = DeepFace.represent(
                img_path=image_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=False
            )
            
            if embedding_objs:
                return embedding_objs[0]["embedding"]
            return None
            
        except Exception as e:
            print(f"Embedding extraction error: {e}")
            return None
    
    async def compare_faces(self, image1_path: str, image2_path: str) -> dict:
        try:
            result = DeepFace.verify(
                img1_path=image1_path,
                img2_path=image2_path,
                model_name=self.model_name,
                detector_backend=self.detector_backend,
                enforce_detection=False,
                distance_metric="cosine"
            )
            
            distance = result.get("distance", 1.0)
            similarity_score = max(0, min(100, (1 - distance) * 100))
            
            return {
                "verified": result.get("verified", False),
                "similarity_score": similarity_score,
                "distance": distance,
                "model": self.model_name
            }
            
        except Exception as e:
            print(f"Face comparison error: {e}")
            return {
                "verified": False,
                "similarity_score": 0.0,
                "distance": 1.0,
                "model": self.model_name
            }
    
    def _calculate_face_quality(self, face_data: dict) -> float:
        quality_score = 0.5
        confidence = face_data.get("face_confidence", 0)
        quality_score += confidence * 0.3
        
        if face_data.get("age") and face_data.get("gender"):
            quality_score += 0.2
            
        return min(1.0, quality_score)

face_service = FaceService()