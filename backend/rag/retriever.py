"""Retriever for Recruitment RAG Knowledge Base.

Performs semantic and metadata-filtered hybrid retrieval using SentenceTransformer embeddings
and FAISS cosine similarity search with score thresholding.
"""

import unicodedata

try:
    from rag.embedding_service import embed_text
    from rag.vector_store import load_index, search_vectors
except ImportError:
    from backend.rag.embedding_service import embed_text
    from backend.rag.vector_store import load_index, search_vectors

# Baseline threshold for cosine similarity on normalized all-MiniLM-L6-v2 embeddings
DEFAULT_SIMILARITY_THRESHOLD = 0.25
MAX_TOP_K = 8


def _normalize_text(text: str) -> str:
    nfkd = unicodedata.normalize("NFKD", str(text or ""))
    return "".join(c for c in nfkd if not unicodedata.combining(c)).replace("đ", "d").replace("Đ", "D").lower().strip()


def detect_candidate_entity(question: str, documents: list[dict]) -> int | None:
    """Nhan dien xem cau hoi co de cap truc tiep den ten ung vien cu the hay khong."""
    norm_q = _normalize_text(question)
    cand_names = {}
    for doc in documents:
        meta = doc.get("metadata", {})
        cid = meta.get("candidate_id")
        if not cid:
            continue
        # Extract full name from text
        for line in doc.get("text", "").split("\n"):
            if "Họ tên" in line:
                name_val = line.split(":", 1)[-1].strip()
                if name_val and len(name_val) >= 4:
                    cand_names[cid] = name_val
                    break
        if cid not in cand_names and meta.get("display_name"):
            d_name = meta["display_name"].split(" - ")[0].split(" (")[0].strip()
            if len(d_name) >= 4:
                cand_names[cid] = d_name

    # Check which candidate name is mentioned in the question (longest first)
    sorted_cands = sorted(cand_names.items(), key=lambda x: len(x[1]), reverse=True)
    for cid, name in sorted_cands:
        norm_name = _normalize_text(name)
        if norm_name and norm_name in norm_q:
            return cid
    return None


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

    # If no candidate_ids specified, check if query explicitly mentions a candidate name
    is_exact_candidate_query = False
    if candidate_ids is None:
        _, docs, _ = load_index()
        if docs:
            detected_cid = detect_candidate_entity(question, docs)
            if detected_cid is not None:
                candidate_ids = [detected_cid]
                is_exact_candidate_query = True
                similarity_threshold = 0.05  # Preserve docs for the requested candidate

    q_vec = embed_text(question)

    matches = search_vectors(
        query_vector=q_vec,
        top_k=effective_k,
        filter_candidate_ids=candidate_ids,
        filter_entity_types=entity_types,
    )

    # Filter by threshold
    qualified = [m for m in matches if m["score"] >= similarity_threshold]

    # If exact candidate query was matched, ensure results are never empty if candidate docs exist
    if is_exact_candidate_query and not qualified and matches:
        qualified = matches[:effective_k]

    return qualified
