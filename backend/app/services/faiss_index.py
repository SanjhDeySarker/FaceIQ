# backend/app/services/faiss_index.py
import faiss
import numpy as np
import os
import pickle
from typing import List, Tuple
from app.db.mongo import embeddings_collection

INDEX_DIR = os.environ.get("FAISS_INDEX_DIR", "/tmp/faiss")
INDEX_PATH = os.path.join(INDEX_DIR, "face_index.faiss")
META_PATH = os.path.join(INDEX_DIR, "face_index_meta.pkl")

# Use a simple Flat index for MVP (replace with IVF/PQ for scale)
class FaissIndexManager:
    def __init__(self, dim: int = 512):
        self.dim = dim
        os.makedirs(INDEX_DIR, exist_ok=True)
        self.index = None
        self.id_map = []  # maps row -> document id (face_id)

    def build_index_from_db(self):
        """
        Load all embeddings from MongoDB and build a FAISS index.
        This should run in a background job on startup and periodically.
        """
        # Gather embeddings
        docs = list(embeddings_collection.find({}, {"face_id": 1, "vector": 1}))
        if not docs:
            self.index = faiss.IndexFlatIP(self.dim)  # dot-product (cosine if normalized)
            self.id_map = []
            return

        vectors = []
        ids = []
        for d in docs:
            vec = d.get("vector")
            if vec and len(vec) == self.dim:
                vectors.append(np.array(vec, dtype='float32'))
                ids.append(d["face_id"])

        if not vectors:
            self.index = faiss.IndexFlatIP(self.dim)
            self.id_map = []
            return

        mat = np.vstack(vectors)
        # Normalize for cosine (optional)
        faiss.normalize_L2(mat)
        index = faiss.IndexFlatIP(self.dim)
        index.add(mat)
        self.index = index
        self.id_map = ids
        # persist to disk
        faiss.write_index(self.index, INDEX_PATH)
        with open(META_PATH, "wb") as f:
            pickle.dump(self.id_map, f)

    def load_index(self):
        if os.path.exists(INDEX_PATH) and os.path.exists(META_PATH):
            self.index = faiss.read_index(INDEX_PATH)
            with open(META_PATH, "rb") as f:
                self.id_map = pickle.load(f)
        else:
            self.build_index_from_db()

    def search(self, vector: List[float], top_k: int = 5) -> List[Tuple[str, float]]:
        if self.index is None:
            self.load_index()
        v = np.array(vector, dtype='float32').reshape(1, -1)
        faiss.normalize_L2(v)
        scores, idxs = self.index.search(v, top_k)
        results = []
        for score, idx in zip(scores[0], idxs[0]):
            if idx < 0 or idx >= len(self.id_map):
                continue
            results.append((self.id_map[idx], float(score)))
        return results

# Singleton to use in app
faiss_manager = FaissIndexManager(dim=int(os.environ.get("EMBED_DIM", "512")))
