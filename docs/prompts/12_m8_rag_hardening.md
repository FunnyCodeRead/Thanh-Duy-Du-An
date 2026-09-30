# M8 RAG HARDENING

Kiểm tra 3 điểm.

## 1. COSINE NORMALIZATION
FAISS: `IndexFlatIP`

Document vectors: L2 normalized.  
Query vectors: L2 normalized.

Verify: `||vector||₂ ≈ 1`

`IndexFlatIP + normalized embeddings = cosine similarity`.

## 2. VIETNAMESE RETRIEVAL
Test real embeddings with Vietnamese semantic queries:
- Ai có kinh nghiệm xây dựng ứng dụng web phía máy chủ?
- Ứng viên nào từng làm việc với cơ sở dữ liệu quan hệ?
- Ai có kinh nghiệm tìm kiếm và giao tiếp với ứng viên?
- Tìm người có kinh nghiệm xử lý lỗi trong dự án web.

Measure:
- Top-1 Accuracy
- Top-3 Recall

Do not change embedding model before evidence.

## 3. EXCLUDE AI_RESULTS
Do not index:
- users
- ai_results

Trusted vector sources:
- jobs
- candidates
- applications
- interviews
- evaluations

Reason:
Do not allow `real data → Gemini output → ai_results → embedding → Gemini again`.

`ai_results` stays for M5 history but is excluded from RAG.

Rebuild FAISS index after change.

Verify metadata has no:
- user
- ai_result
- secret
- password_hash
- API key
