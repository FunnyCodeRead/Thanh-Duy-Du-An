"""Vector Store for Recruitment RAG Knowledge Base.

Manages FAISS IndexFlatIP index and associated metadata persisted to disk at backend/rag/index/.
Does not query MySQL directly. Supports metadata-filtered retrieval.
"""

import json
import logging
import os
import threading
import faiss
import numpy as np

logger = logging.getLogger(__name__)

INDEX_DIR = os.path.join(os.path.dirname(__file__), "index")
FAISS_FILE = os.path.join(INDEX_DIR, "recruitment.faiss")
METADATA_FILE = os.path.join(INDEX_DIR, "metadata.json")
INFO_FILE = os.path.join(INDEX_DIR, "index_info.json")

_store_lock = threading.Lock()
_cached_index = None
_cached_metadata = None
_cached_info = None


def is_index_available() -> bool:
    """Kiem tra xem file chi muc FAISS va metadata da ton tai tren dia hay chua."""
    return os.path.exists(FAISS_FILE) and os.path.exists(METADATA_FILE)


def get_index_info() -> dict | None:
    """Doc thong tin tom tat ve chi muc tu index_info.json."""
    if not os.path.exists(INFO_FILE):
        return None
    try:
        with open(INFO_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        logger.warning("Khong the doc file index_info.json: %s", e)
        return None


def save_index(index: faiss.Index, documents: list[dict], index_info: dict) -> bool:
    """Luu chi muc FAISS va danh sach document (text + metadata) xuong thu muc index/."""
    global _cached_index, _cached_metadata, _cached_info
    os.makedirs(INDEX_DIR, exist_ok=True)

    with _store_lock:
        faiss.write_index(index, FAISS_FILE)

        with open(METADATA_FILE, "w", encoding="utf-8") as f:
            json.dump(documents, f, ensure_ascii=False, indent=2)

        with open(INFO_FILE, "w", encoding="utf-8") as f:
            json.dump(index_info, f, ensure_ascii=False, indent=2)

        _cached_index = index
        _cached_metadata = documents
        _cached_info = index_info

    logger.info("Da luu thanh cong chi muc FAISS voi %d documents.", len(documents))
    return True


def load_index():
    """Doc chi muc FAISS va danh sach documents tu dia, cache trong bo nho."""
    global _cached_index, _cached_metadata, _cached_info

    if _cached_index is not None and _cached_metadata is not None:
        return _cached_index, _cached_metadata, _cached_info

    with _store_lock:
        if _cached_index is not None and _cached_metadata is not None:
            return _cached_index, _cached_metadata, _cached_info

        if not is_index_available():
            return None, None, None

        try:
            index = faiss.read_index(FAISS_FILE)
            with open(METADATA_FILE, "r", encoding="utf-8") as f:
                documents = json.load(f)

            info = None
            if os.path.exists(INFO_FILE):
                with open(INFO_FILE, "r", encoding="utf-8") as f:
                    info = json.load(f)

            _cached_index = index
            _cached_metadata = documents
            _cached_info = info
            return _cached_index, _cached_metadata, _cached_info
        except Exception as exc:
            logger.error("Loi khi doc chi muc FAISS tu dia: %s", exc)
            return None, None, None


def search_vectors(
    query_vector: np.ndarray,
    top_k: int = 5,
    filter_candidate_ids: list[int] | None = None,
    filter_entity_types: list[str] | None = None,
) -> list[dict]:
    """Tim kiem vector tuong dong trong chi muc kem loc metadata (neu co).
    
    Args:
        query_vector: Vector truy van 1D hoac 2D float32.
        top_k: So luong ket qua toi da.
        filter_candidate_ids: Danh sach candidate_id can loc (dung cho Hybrid RAG).
        filter_entity_types: Danh sach entity_type can loc ('candidate', 'job', etc.).
        
    Returns:
        list of dict: [
            {
                "text": str,
                "metadata": dict,
                "score": float (cosine similarity)
            }
        ]
    """
    index, documents, _ = load_index()
    if index is None or not documents:
        return []

    if query_vector.ndim == 1:
        query_vector = np.expand_dims(query_vector, axis=0)

    # Search top N candidates in FAISS (search all docs if filter is active)
    total_docs = len(documents)
    search_k = total_docs if (filter_candidate_ids or filter_entity_types) else min(total_docs, top_k)

    scores, indices = index.search(query_vector, search_k)
    results = []

    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(documents):
            continue

        doc = documents[idx]
        meta = doc.get("metadata", {})

        # Apply candidate_id filter if specified
        if filter_candidate_ids is not None:
            cand_id = meta.get("candidate_id")
            if cand_id not in filter_candidate_ids:
                continue

        # Apply entity_type filter if specified
        if filter_entity_types is not None:
            if meta.get("entity_type") not in filter_entity_types:
                continue

        results.append({
            "text": doc.get("text", ""),
            "metadata": meta,
            "score": float(score),
        })

        if len(results) >= top_k:
            break

    return results
