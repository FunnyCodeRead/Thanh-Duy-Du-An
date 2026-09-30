# M8 – RECRUITMENT KNOWLEDGE CHATBOT

Add a Recruitment AI chatbot that ONLY answers from recruitment database data.

No general ChatGPT behavior.

## Architecture
Question
↓
Scope Guard
↓
Decision Guard
↓
Intent Router
↓

STRUCTURED → predefined read-only SQL  
SEMANTIC → Embedding → FAISS  
HYBRID → SQL filter → Vector Search  
OUT_OF_SCOPE → refuse  
DECISION_REQUEST → refuse

Then:
retrieved context → Gemini → grounded answer + sources

Use:
- FAISS
- sentence-transformers
- all-MiniLM-L6-v2

Do not use:
- Pinecone
- Qdrant
- LangChain Agent
- Redis
- Celery
- new MySQL tables

Database remains 7 tables.

Vector index: `backend/rag/index/`

Create:
- `document_builder.py`
- `embedding_service.py`
- `vector_store.py`
- `retriever.py`
- `intent_router.py`
- `scope_guard.py`
- `context_builder.py`
- `rag_service.py`

## API
- `POST /api/chat`
- `POST /api/chat/reindex`
- `GET /api/chat/index-info`

ADMIN/HR/MANAGER can ask questions. ADMIN only can reindex.

Do NOT allow Gemini to generate arbitrary SQL.

Structured queries use safe predefined SELECT functions.

## Out-of-scope refusal
For questions such as weather, poetry, or general knowledge:
"Tôi chỉ hỗ trợ hỏi đáp dựa trên dữ liệu tuyển dụng hiện có trong hệ thống."

## Hiring decision refusal
For "Ai tốt nhất?", "Nên tuyển ai?", "Xếp hạng ứng viên?":
"Tôi có thể cung cấp thông tin hồ sơ, kỹ năng, kinh nghiệm và đánh giá đã lưu, nhưng quyết định tuyển dụng cần do người phụ trách thực hiện."

## Frontend
Route: `/ai-chat`

Show:
- answer
- sources
- retrieval type

Do not create `chat_sessions` or `chat_messages`.

## Tests
- auth
- structured
- semantic
- hybrid
- scope guard
- decision guard
- prompt injection
- secret leakage
- sources
- reindex permissions
