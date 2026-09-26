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


def embed_text(text: str, normalize: bool = True) -> np.ndarray:
    """Tạo vector nhúng chuẩn hóa (L2 normalized) cho một đoạn văn bản.
    
    Khi normalize=True: ||vector||₂ ≈ 1.0, cho phép FAISS IndexFlatIP thực hiện Cosine Similarity chính xác.
    """
    model = get_embedding_model()
    cleaned = (text or "").strip()
    vector = model.encode(cleaned, normalize_embeddings=normalize)
    arr = np.asarray(vector, dtype=np.float32)
    if normalize:
        norm = float(np.linalg.norm(arr))
        if norm > 0:
            arr = arr / norm
    return arr


def embed_texts(texts: list[str], normalize: bool = True) -> np.ndarray:
    """Tạo mảng vector nhúng chuẩn hóa (L2 normalized) cho danh sách văn bản.
    
    Khi normalize=True: mọi vector hàng đều có ||v||₂ ≈ 1.0.
    """
    if not texts:
        return np.empty((0, EMBEDDING_DIM), dtype=np.float32)
    model = get_embedding_model()
    cleaned = [t.strip() if t else "" for t in texts]
    vectors = model.encode(cleaned, normalize_embeddings=normalize, show_progress_bar=False)
    arr = np.asarray(vectors, dtype=np.float32)
    if normalize:
        norms = np.linalg.norm(arr, axis=1, keepdims=True)
        norms[norms == 0] = 1.0
        arr = arr / norms
    return arr

