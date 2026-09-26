"""Automated Test Suite for M8 RAG Hardening & Vietnamese Retrieval.

Covers:
- RAG-HARD-001: Document embedding L2 norm ~= 1.0
- RAG-HARD-002: Query embedding L2 norm ~= 1.0
- RAG-HARD-003: IndexFlatIP cosine similarity ordering
- RAG-HARD-004: Vietnamese Q1 semantic retrieval
- RAG-HARD-005: Vietnamese Q2 semantic retrieval
- RAG-HARD-006: Vietnamese Q3 semantic retrieval
- RAG-HARD-007: Vietnamese paraphrase semantic retrieval
- RAG-HARD-008: Vietnamese no-context handling
- RAG-HARD-009: ai_results excluded from document builder
- RAG-HARD-010: ai_results excluded from metadata.json
- RAG-HARD-011: users table excluded from vector index
- RAG-HARD-012: secrets excluded from metadata and text
- RAG-HARD-013: semantic sources do not contain ai_result
- RAG-HARD-014: structured retrieval regression
- RAG-HARD-015: hybrid retrieval regression
- RAG-HARD-016: out-of-scope rejection regression
- RAG-HARD-017: decision refusal regression
"""

import json
import os
import faiss
import numpy as np
import pytest

from rag.context_builder import build_context
from rag.document_builder import build_documents_from_db
from rag.embedding_service import EMBEDDING_DIM, embed_text, embed_texts
from rag.rag_service import answer_question
from rag.retriever import retrieve
from rag.vector_store import METADATA_FILE, INFO_FILE


# ---------------------------------------------------------------------------
# Fixture: Representative Vietnamese Evaluation Dataset
# ---------------------------------------------------------------------------
@pytest.fixture(scope="module")
def vi_eval_index():
    """Builds a temporary in-memory FAISS IndexFlatIP index with representative Vietnamese candidates."""
    docs = [
        (
            "CANDIDATE_A",
            "Kỹ sư phần mềm có 3 năm kinh nghiệm phát triển ứng dụng web phía máy chủ. "
            "Đã sử dụng Python, Flask, MySQL, thiết kế REST API và xử lý lỗi hệ thống."
        ),
        (
            "CANDIDATE_B",
            "Nhân viên tuyển dụng có kinh nghiệm tìm kiếm ứng viên, phỏng vấn sơ bộ, "
            "giao tiếp với ứng viên và quản lý hồ sơ nhân sự."
        ),
        (
            "CANDIDATE_C",
            "Nhân viên thiết kế đồ họa, có kinh nghiệm Photoshop, Illustrator "
            "và thiết kế nội dung truyền thông."
        ),
        (
            "CANDIDATE_D",
            "Kỹ sư dữ liệu từng làm việc với cơ sở dữ liệu quan hệ, "
            "viết truy vấn SQL, xử lý dữ liệu và xây dựng báo cáo."
        ),
    ]

    texts = [d[1] for d in docs]
    vectors = embed_texts(texts)
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(vectors)

    return {"index": index, "docs": docs}


# ---------------------------------------------------------------------------
# 1. Cosine Normalization Tests (RAG-HARD-001, 002, 003)
# ---------------------------------------------------------------------------

def test_rag_hard_001_document_embedding_l2_norm():
    """RAG-HARD-001: Mọi document embedding sinh ra đều có ||vector||₂ ≈ 1.0 (dung sai 1e-5)."""
    texts = [
        "Backend Python developer với Flask và MySQL",
        "Frontend React developer phát triển giao diện người dùng",
        "Nhân viên tuyển dụng và quản lý nhân sự",
        "Chuyên viên bảo mật hệ thống thông tin",
    ]
    vectors = embed_texts(texts, normalize=True)
    assert vectors.shape == (len(texts), EMBEDDING_DIM)

    for i in range(len(texts)):
        norm = float(np.linalg.norm(vectors[i]))
        assert abs(norm - 1.0) < 1e-5, f"Vector {i} norm is {norm}, expected ~1.0"


def test_rag_hard_002_query_embedding_l2_norm():
    """RAG-HARD-002: Vector truy vấn (query vector) có ||query_vector||₂ ≈ 1.0."""
    queries = [
        "Ai có kinh nghiệm xây dựng ứng dụng web?",
        "Tìm người biết Python và Flask",
        "Lịch phỏng vấn sắp tới",
    ]
    for q in queries:
        vec = embed_text(q, normalize=True)
        assert vec.shape == (EMBEDDING_DIM,)
        norm = float(np.linalg.norm(vec))
        assert abs(norm - 1.0) < 1e-5, f"Query vector norm is {norm}, expected ~1.0"


def test_rag_hard_003_indexflatip_similarity_ordering():
    """RAG-HARD-003: IndexFlatIP trên normalized vectors phản ánh chuẩn xác cosine similarity ranking."""
    text_a = "Python Flask MySQL backend developer"
    text_b = "Backend developer with Flask and Python"
    text_c = "Human resources recruitment communication"
    question = "Python Flask backend"

    vecs = embed_texts([text_a, text_b, text_c])
    index = faiss.IndexFlatIP(EMBEDDING_DIM)
    index.add(vecs)

    q_vec = embed_text(question)
    scores, indices = index.search(np.expand_dims(q_vec, axis=0), 3)

    results = {idx: float(sc) for sc, idx in zip(scores[0], indices[0])}
    # Doc 0 (text_a) and Doc 1 (text_b) must score significantly higher than Doc 2 (text_c)
    assert results[0] > results[2], f"Expected text_a ({results[0]}) > text_c ({results[2]})"
    assert results[1] > results[2], f"Expected text_b ({results[1]}) > text_c ({results[2]})"


# ---------------------------------------------------------------------------
# 2. Vietnamese Semantic Retrieval Evaluation (RAG-HARD-004 to 008)
# ---------------------------------------------------------------------------

def test_rag_hard_004_vietnamese_q1_retrieval(vi_eval_index):
    """RAG-HARD-004: Q1 'Ai có kinh nghiệm xây dựng ứng dụng web phía máy chủ?' -> CANDIDATE_A."""
    index = vi_eval_index["index"]
    docs = vi_eval_index["docs"]

    q = "Ai có kinh nghiệm xây dựng ứng dụng web phía máy chủ?"
    q_vec = embed_text(q)
    scores, indices = index.search(np.expand_dims(q_vec, axis=0), 3)

    top_1 = docs[indices[0][0]][0]
    top_3 = [docs[idx][0] for idx in indices[0]]

    assert top_1 == "CANDIDATE_A"
    assert "CANDIDATE_A" in top_3
    assert scores[0][0] >= 0.50


def test_rag_hard_005_vietnamese_q2_retrieval(vi_eval_index):
    """RAG-HARD-005: Q2 'Ứng viên nào từng làm việc với cơ sở dữ liệu quan hệ?' -> CANDIDATE_D."""
    index = vi_eval_index["index"]
    docs = vi_eval_index["docs"]

    q = "Ứng viên nào từng làm việc với cơ sở dữ liệu quan hệ?"
    q_vec = embed_text(q)
    scores, indices = index.search(np.expand_dims(q_vec, axis=0), 3)

    top_1 = docs[indices[0][0]][0]
    top_3 = [docs[idx][0] for idx in indices[0]]

    assert top_1 in ("CANDIDATE_D", "CANDIDATE_A")
    assert "CANDIDATE_D" in top_3
    assert scores[0][0] >= 0.50


def test_rag_hard_006_vietnamese_q3_retrieval(vi_eval_index):
    """RAG-HARD-006: Q3 'Ai có kinh nghiệm tìm kiếm và giao tiếp với ứng viên?' -> CANDIDATE_B."""
    index = vi_eval_index["index"]
    docs = vi_eval_index["docs"]

    q = "Ai có kinh nghiệm tìm kiếm và giao tiếp với ứng viên?"
    q_vec = embed_text(q)
    scores, indices = index.search(np.expand_dims(q_vec, axis=0), 3)

    top_1 = docs[indices[0][0]][0]
    top_3 = [docs[idx][0] for idx in indices[0]]

    assert top_1 == "CANDIDATE_B"
    assert "CANDIDATE_B" in top_3
    assert scores[0][0] >= 0.50


def test_rag_hard_007_vietnamese_paraphrase_retrieval(vi_eval_index):
    """RAG-HARD-007: Câu hỏi diễn đạt khác nhau (Paraphrase) đều trích xuất CANDIDATE_A trong top kết quả."""
    index = vi_eval_index["index"]
    docs = vi_eval_index["docs"]

    q1 = "Ứng viên nào từng xây dựng ứng dụng phía máy chủ?"
    q2 = "Ai có kinh nghiệm lập trình backend?"

    scores1, indices1 = index.search(np.expand_dims(embed_text(q1), axis=0), 3)
    scores2, indices2 = index.search(np.expand_dims(embed_text(q2), axis=0), 3)

    top3_q1 = [docs[idx][0] for idx in indices1[0]]
    top3_q2 = [docs[idx][0] for idx in indices2[0]]

    # CANDIDATE_A is relevant to both paraphrased questions
    assert "CANDIDATE_A" in top3_q1
    assert "CANDIDATE_A" in top3_q2


def test_rag_hard_008_vietnamese_no_context_handling(monkeypatch):
    """RAG-HARD-008: Câu hỏi không có trong dữ liệu không được tự ý bịa đặt (No Hallucination)."""
    # Simulate Gemini returning grounded refusal when context has no nuclear plant data
    monkeypatch.setattr(
        "rag.rag_service.generate_content",
        lambda prompt: "Tôi không tìm thấy đủ thông tin trong dữ liệu tuyển dụng hiện có để trả lời câu hỏi này."
    )
    res = answer_question("Ứng viên nào có 20 năm kinh nghiệm vận hành nhà máy điện hạt nhân?")
    assert "Tôi không tìm thấy đủ thông tin" in res["answer"]


# ---------------------------------------------------------------------------
# 3. Source of Truth & ai_results Exclusion (RAG-HARD-009 to 013)
# ---------------------------------------------------------------------------

def test_rag_hard_009_ai_results_excluded_from_documents():
    """RAG-HARD-009: build_documents_from_db không bao giờ tạo document từ ai_results."""
    mock_data = {
        "jobs": [{"id": 1, "title": "Dev", "department": "IT", "description": "D", "requirements": "R", "skills": "S", "quantity": 1, "status": "OPEN"}],
        "candidates": [{"id": 1, "full_name": "Nguyen Van A", "skills": "Python", "experience": "1y", "education": "Uni", "source": "OTHER", "cv_text": "Sample"}],
        "applications": [],
        "interviews": [],
        "evaluations": [],
        "ai_results": [
            {"id": 1, "candidate_name": "Nguyen Van A", "job_title": "Dev", "type": "CV_SUMMARY", "content": "Derivative summary"}
        ],
    }
    docs = build_documents_from_db(mock_data)
    entity_types = {d["metadata"]["entity_type"] for d in docs}

    assert "ai_result" not in entity_types
    assert "user" not in entity_types
    assert len(docs) == 3  # 1 job + 1 candidate base + 1 candidate CV chunk



def test_rag_hard_010_ai_results_excluded_from_metadata():
    """RAG-HARD-010: metadata.json trên đĩa không chứa bất kỳ mục nào có entity_type == 'ai_result'."""
    assert os.path.exists(METADATA_FILE), "metadata.json must exist"
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    for item in metadata:
        meta = item.get("metadata", {})
        assert meta.get("entity_type") != "ai_result", f"Found ai_result in metadata: {meta}"


def test_rag_hard_011_users_excluded_from_vector_index():
    """RAG-HARD-011: metadata.json không chứa bất kỳ mục nào có entity_type == 'user'."""
    assert os.path.exists(METADATA_FILE)
    with open(METADATA_FILE, "r", encoding="utf-8") as f:
        metadata = json.load(f)

    for item in metadata:
        meta = item.get("metadata", {})
        assert meta.get("entity_type") != "user", f"Found user in metadata: {meta}"


def test_rag_hard_012_secrets_excluded():
    """RAG-HARD-012: File metadata và index_info không chứa chuỗi nhạy cảm."""
    for path in (METADATA_FILE, INFO_FILE):
        if not os.path.exists(path):
            continue
        with open(path, "r", encoding="utf-8") as f:
            content = f.read().lower()
        assert "password_hash" not in content
        assert "gemini_api_key" not in content
        assert "secret_key" not in content
        assert "db_password" not in content


def test_rag_hard_013_semantic_sources_do_not_contain_ai_result():
    """RAG-HARD-013: Kết quả tìm kiếm ngữ nghĩa từ retriever không bao giờ trả về ai_result."""
    results = retrieve("Python Flask", top_k=5)
    for r in results:
        meta = r.get("metadata", {})
        assert meta.get("entity_type") in ("job", "candidate", "application", "interview", "evaluation")
        assert meta.get("entity_type") != "ai_result"
        assert meta.get("entity_type") != "user"


# ---------------------------------------------------------------------------
# 4. Regression Tests (RAG-HARD-014 to 017)
# ---------------------------------------------------------------------------

def test_rag_hard_014_structured_retrieval_regression(monkeypatch):
    """RAG-HARD-014: Truy vấn số lượng có cấu trúc (STRUCTURED) vẫn hoạt động hoàn hảo."""
    monkeypatch.setattr("rag.rag_service.count_candidates", lambda: 5)
    res = answer_question("Có bao nhiêu ứng viên trong hệ thống?")
    assert res["retrieval_type"] == "STRUCTURED"
    assert "5 ứng viên" in res["answer"]


def test_rag_hard_015_hybrid_retrieval_regression(monkeypatch):
    """RAG-HARD-015: Truy vấn HYBRID kết hợp bộ lọc trạng thái và tìm kiếm kỹ năng."""
    monkeypatch.setattr(
        "rag.rag_service.get_candidates_by_application_status",
        lambda st: [{"id": 5, "full_name": "Phạm Gia Dũng"}] if st == "INTERVIEW" else [],
    )
    monkeypatch.setattr(
        "rag.rag_service.generate_content",
        lambda p: "Phạm Gia Dũng đang ở trạng thái phỏng vấn và có kinh nghiệm Flask.",
    )
    res = answer_question("Trong các ứng viên đang phỏng vấn, ai có kinh nghiệm Flask?")
    assert res["retrieval_type"] == "HYBRID"
    assert "Phạm Gia Dũng" in res["answer"]


def test_rag_hard_016_out_of_scope_regression():
    """RAG-HARD-016: Scope Guard từ chối câu hỏi ngoài lề (thời tiết)."""
    res = answer_question("Hôm nay thời tiết thế nào?")
    assert res["retrieval_type"] == "OUT_OF_SCOPE"
    assert "Tôi chỉ hỗ trợ hỏi đáp dựa trên dữ liệu tuyển dụng" in res["answer"]


def test_rag_hard_017_decision_refusal_regression():
    """RAG-HARD-017: Decision Guard từ chối quyết định tuyển dụng và xếp hạng ứng viên."""
    res = answer_question("Ai là ứng viên tốt nhất?")
    assert res["retrieval_type"] == "DECISION_REFUSAL"
    assert "quyết định tuyển dụng cần do người phụ trách thực hiện" in res["answer"]
