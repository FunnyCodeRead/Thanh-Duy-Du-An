"""Embedding Service for Recruitment RAG Knowledge Base.

Loads local SentenceTransformer model ('all-MiniLM-L6-v2') as a process singleton.
Provides normalized vector embeddings for cosine similarity search in FAISS.
"""

import threading
import numpy as np

_model_lock = threading.Lock()
_model_instance = None
MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


def get_embedding_model():
    """Lay singleton instance cua SentenceTransformer model."""
    global _model_instance
    if _model_instance is None:
        with _model_lock:
            if _model_instance is None:
                from sentence_transformers import SentenceTransformer
                _model_instance = SentenceTransformer(MODEL_NAME)
    return _model_instance


def embed_text(text: str) -> np.ndarray:
    """Tạo vector nhúng chuẩn hóa (L2 normalized) cho một đoạn văn bản."""
    model = get_embedding_model()
    cleaned = (text or "").strip()
    vector = model.encode(cleaned, normalize_embeddings=True)
    return np.asarray(vector, dtype=np.float32)


def embed_texts(texts: list[str]) -> np.ndarray:
    """Tạo mảng vector nhúng chuẩn hóa (L2 normalized) cho danh sách văn bản."""
    if not texts:
        return np.empty((0, EMBEDDING_DIM), dtype=np.float32)
    model = get_embedding_model()
    cleaned = [t.strip() if t else "" for t in texts]
    vectors = model.encode(cleaned, normalize_embeddings=True, show_progress_bar=False)
    return np.asarray(vectors, dtype=np.float32)
