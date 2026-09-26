# Recruitment Knowledge Chatbot — Hybrid RAG Architecture Design

## 1. Executive Summary

Milestone M8 introduces the **Recruitment Knowledge Chatbot** (`Trợ lý AI Tuyển dụng`) — an intelligent, domain-grounded conversational assistant designed exclusively to query and synthesize information from the recruitment system.

The chatbot implements a **Hybrid RAG (Retrieval-Augmented Generation)** architecture combining:
1. **Direct Parameterized SQL Queries:** For deterministic aggregations, counts, and entity lookups.
2. **Dense Vector Search (FAISS + SentenceTransformers):** For semantic matching across candidate CVs, job descriptions, interview feedback, and evaluation comments.
3. **Google Gemini LLM (`gemini-2.5-flash`):** For grounded synthesis in Vietnamese based strictly on retrieved context.

---

## 2. Core Principles & Safety Guards

```text
User Question
      │
      ▼
┌─────────────────────────┐
│ 1. Scope Guard          │──[Out of scope / Secrets]──► Safe Vietnamese Refusal
└───────────┬─────────────┘
            │ Allowed
            ▼
┌─────────────────────────┐
│ 2. Intent Router        │──[Hiring/Ranking Decision]─► Decision Guard Refusal
└───────────┬─────────────┘
            │
      ┌─────┴──────────────────┐
      ▼                        ▼
[STRUCTURED QUERY]       [SEMANTIC / HYBRID]
      │                        │
Parameterize MySQL       Dense Vector Search (FAISS)
(Predefined Functions)   + Context Builder
      │                        │
      ▼                        ▼
Direct Data Response     Gemini LLM (Grounded Prompt)
      │                        │
      └────────────┬───────────┘
                   ▼
       Answer + Clickable Sources
```

### 2.1 Scope Guard
- **Strict Boundary:** The chatbot exclusively answers questions about recruitment data existing within the 7 MySQL tables.
- **Refusal Behavior:** Any query regarding general knowledge, weather, recipes, sports, casual jokes, programming assistance, or system administration is immediately rejected with:
  > *"Tôi chỉ hỗ trợ hỏi đáp dựa trên dữ liệu tuyển dụng hiện có trong hệ thống."*
- **Secret Protection:** Any prompt asking for database passwords, API keys, password hashes, or full raw table dumps is rejected immediately.

### 2.2 Decision Guard
- **No Automated Hiring Decisions:** The chatbot strictly refuses requests to rank candidates ("ai tốt nhất", "ai nên đỗ", "xếp hạng ứng viên") or make hiring recommendations.
- **Standard Refusal:**
  > *"Tôi có thể cung cấp thông tin hồ sơ, kỹ năng, kinh nghiệm và các đánh giá đã được lưu trong hệ thống, nhưng quyết định tuyển dụng cần do người phụ trách thực hiện."*

### 2.3 Zero Dynamic SQL Generation by LLM
- The LLM is **never** permitted to generate arbitrary SQL queries.
- All structured questions map deterministically via regex/intent rules to safe, parameterized database functions in `backend/database/db.py`.

---

## 3. Hybrid RAG Architecture Components

### 3.1 Document Builder (`backend/rag/document_builder.py`)
Extracts and normalizes records from the 7 MySQL tables into standardized search documents:
- **Jobs:** Title, department, requirements, description, salary, status.
- **Candidates & CVs:** Candidate info, skills, education, experience, with long CV text chunked into 1,000 characters with 150-character sliding overlap.
- **Applications:** Candidate, job, status, stage, dates.
- **Interviews:** Candidate, job, interview type, scheduled time, status.
- **Evaluations:** Technical, communication, experience ratings, evaluation comments.
- **AI Results:** Historical CV summaries, generated interview questions, email drafts.

*Security Guarantee:* The `users` table password hashes and system credentials are strictly excluded from document building.

### 3.2 Embedding Service (`backend/rag/embedding_service.py`)
- **Model:** `sentence-transformers/all-MiniLM-L6-v2` (384-dimensional dense vectors).
- **Execution:** Runs locally on CPU via PyTorch CPU wheel (`torch==2.14.0+cpu`), requiring zero external network calls for vectorization.
- **Normalization:** L2-normalized embeddings enable exact inner product (`IndexFlatIP`) to compute cosine similarity directly.

### 3.3 Vector Store (`backend/rag/vector_store.py`)
- **Engine:** Meta FAISS (`faiss-cpu==1.15.1`).
- **Index Type:** `faiss.IndexFlatIP` (Cosine similarity via inner product of normalized vectors).
- **Persistence:** Saved locally in `backend/rag/index/`:
  - `recruitment.faiss`: Binary dense vector index.
  - `metadata.json`: Document chunks, entity IDs, titles, and sources.
  - `index_info.json`: Build timestamp, document count, and dimension metadata.
- **Zero 8th Table:** Retains the strict architectural rule of exactly 7 tables in MySQL.

### 3.4 Retriever (`backend/rag/retriever.py`)
- **Cosine Threshold:** `similarity_threshold = 0.25` prevents low-relevance noise from entering prompt context.
- **Top K:** Retrieves up to `top_k = 8` most relevant chunks.
- **Fallback:** If no documents exceed the similarity threshold, the system returns a polite Vietnamese clarification notice without calling the LLM.

### 3.5 Context Builder & Citations (`backend/rag/context_builder.py`)
- Formats chunks into concise, structured context sections.
- Enforces an 8,000-character ceiling to prevent prompt bloat.
- Deduplicates sources and provides citation metadata (`entity_type`, `entity_id`, `title`, `url`).

### 3.6 LLM Grounded Prompt (`backend/prompts/recruitment_chat.txt`)
- Injects strict instructions: answer only from context, say "dữ liệu hệ thống chưa có thông tin này" if context lacks data, cite entities explicitly, and defend against prompt injection inside CV chunks.

---

## 4. API Endpoints

### 4.1 `POST /api/chat`
- **Roles:** `ADMIN`, `HR`, `MANAGER`.
- **Request:**
  ```json
  {
    "message": "Có bao nhiêu ứng viên đang ở trạng thái Phỏng vấn?"
  }
  ```
- **Response:**
  ```json
  {
    "reply": "Hiện có 2 ứng viên đang ở trạng thái INTERVIEW...",
    "retrieval_type": "STRUCTURED",
    "sources": [...]
  }
  ```

### 4.2 `POST /api/chat/reindex`
- **Roles:** `ADMIN` only (403 for `HR` and `MANAGER`).
- **Function:** Rebuilds vector index from current MySQL data.
- **Response:**
  ```json
  {
    "message": "Index rebuilt successfully",
    "document_count": 39,
    "last_updated": "2026-09-26T21:55:00"
  }
  ```

### 4.3 `GET /api/chat/index-info`
- **Roles:** `ADMIN`, `HR`, `MANAGER`.
- **Response:** Returns index status, document count, and last updated time.

---

## 5. Verification & Performance

- **Automated Tests:** 22 unit & integration tests in `backend/tests/test_chat.py`. Total test suite: 158 tests passing.
- **Embedding Latency:** ~20ms per query on CPU.
- **FAISS Retrieval:** < 5ms for top-8 search.
- **End-to-End Latency:**
  - Structured queries (SQL): ~30ms.
  - Semantic queries (FAISS + Gemini): ~1.5s - 2.5s.
