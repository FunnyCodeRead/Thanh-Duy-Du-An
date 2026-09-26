"""Retriever for Recruitment RAG Knowledge Base.

Performs semantic and metadata-filtered hybrid retrieval using SentenceTransformer embeddings
and FAISS cosine similarity search with score thresholding.
"""

try:
    from rag.embedding_service import embed_text
    from rag.vector_store import search_vectors
except ImportError:
    from backend.rag.embedding_service import embed_text
    from backend.rag.vector_store import search_vectors

# Baseline threshold for cosine similarity on normalized all-MiniLM-L6-v2 embeddings
DEFAULT_SIMILARITY_THRESHOLD = 0.25
MAX_TOP_K = 8


def retrieve(
    question: str,
    top_k: int = 5,
    candidate_ids: list[int] | None = None,
    entity_types: list[str] | None = None,
    similarity_threshold: float = DEFAULT_SIMILARITY_THRESHOLD,
) -> list[dict]:
    """Truy xuất các đoạn tài liệu phù hợp nhất từ chỉ mục FAISS.
    
    Args:
        question: Câu hỏi tuyển dụng bằng ngôn ngữ tự nhiên.
        top_k: Số lượng tài liệu tối đa (mặc định 5, tối đa 8).
        candidate_ids: Danh sách candidate_id để lọc (dùng cho hybrid search).
        entity_types: Danh sách loại thực thể để lọc ('candidate', 'job', etc.).
        similarity_threshold: Ngưỡng tương đồng cosine tối thiểu.
        
    Returns:
        list of dict: danh sách tài liệu đạt chuẩn kèm metadata và điểm tương đồng.
    """
    effective_k = min(max(1, top_k), MAX_TOP_K)
    q_vec = embed_text(question)

    matches = search_vectors(
        query_vector=q_vec,
        top_k=effective_k,
        filter_candidate_ids=candidate_ids,
        filter_entity_types=entity_types,
    )

    # Filter by threshold
    qualified = [m for m in matches if m["score"] >= similarity_threshold]
    return qualified
