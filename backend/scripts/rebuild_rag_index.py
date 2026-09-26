"""Rebuild RAG Vector Index Script.

Reads recruitment records from MySQL, generates structured documents with metadata,
computes normalized SentenceTransformer embeddings, and writes the FAISS index to disk.
"""

from datetime import datetime
import os
import sys
import faiss

# Ensure both backend root and repo root are on sys.path
backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
root_dir = os.path.abspath(os.path.join(backend_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

try:
    from database.db import get_all_records_for_rag
    from rag.document_builder import build_documents_from_db
    from rag.embedding_service import EMBEDDING_DIM, MODEL_NAME, embed_texts
    from rag.vector_store import save_index
except ImportError:
    from backend.database.db import get_all_records_for_rag
    from backend.rag.document_builder import build_documents_from_db
    from backend.rag.embedding_service import EMBEDDING_DIM, MODEL_NAME, embed_texts
    from backend.rag.vector_store import save_index


def rebuild_index() -> dict:
    """Xây dựng lại toàn bộ chỉ mục vector từ MySQL và lưu vào backend/rag/index/."""
    # 1. Read MySQL records
    data = get_all_records_for_rag()
    jobs_count = len(data["jobs"])
    candidates_count = len(data["candidates"])
    applications_count = len(data["applications"])
    interviews_count = len(data["interviews"])
    evaluations_count = len(data["evaluations"])
    ai_results_count = len(data["ai_results"])

    # 2. Build Documents
    documents = build_documents_from_db(data)
    total_docs = len(documents)

    # Count candidate CV chunks
    cv_chunks_count = sum(
        1 for d in documents if d.get("metadata", {}).get("chunk_index", 0) > 0
    )

    # 3. Embed Documents
    texts = [d["text"] for d in documents]
    vectors = embed_texts(texts)

    # 4. Build FAISS Index (IndexFlatIP with normalized vectors)
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(vectors)

    # 5. Build Index Info
    now_iso = datetime.now().isoformat()
    index_info = {
        "embedding_model": MODEL_NAME,
        "dimension": EMBEDDING_DIM,
        "documents": total_docs,
        "built_at": now_iso,
        "entity_counts": {
            "jobs": jobs_count,
            "candidates": candidates_count,
            "cv_chunks": cv_chunks_count,
            "applications": applications_count,
            "interviews": interviews_count,
            "evaluations": evaluations_count,
        },
    }

    # 6. Save to disk
    save_index(index, documents, index_info)

    # 7. Print Report
    print("=" * 40)
    print("RAG INDEX BUILD")
    print("=" * 40)
    print(f"Jobs: {jobs_count}")
    print(f"Candidates: {candidates_count}")
    print(f"Candidate CV chunks: {cv_chunks_count}")
    print(f"Applications: {applications_count}")
    print(f"Interviews: {interviews_count}")
    print(f"Evaluations: {evaluations_count}")
    print(f"AI Results excluded: {ai_results_count}")
    print()
    print(f"Total documents: {total_docs}")
    print()
    print("Embedding model:")
    print(MODEL_NAME)
    print()
    print("Embedding dimension:")
    print(EMBEDDING_DIM)
    print()
    print("Index:")
    print("SUCCESS")
    print("=" * 40)

    return index_info


if __name__ == "__main__":
    rebuild_index()
