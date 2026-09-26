# React and Flask REST Architecture

## Scope

This architecture migrates the working M1 and M2 interface from Flask-rendered Jinja pages to a React and Vite frontend. It preserves the Flask session, existing MySQL database, validation rules, role model, and database functions. Applications, interviews, evaluations, and Gemini remain later milestones.

## System Context

```text
Browser
  |
  v
React and Vite frontend
  |
  | HTTP JSON or multipart form data
  v
Flask REST API
  |                   \
  | parameterized SQL  \ Prompt string
  v                     v
MySQL ai_recruitment    AI Service -> Gemini Service -> Google Gemini API
(7 tables)              (Advisory only)                     |
  ^                                                         | Text result
  |=========================================================|
                     Stored in ai_results
```

## Components

### React Frontend

React Router owns navigation. `ProtectedRoute` calls `GET /api/auth/me` before rendering protected pages. Layout components show the authenticated user and hide mutation controls from MANAGER. Page components use the shared Fetch API helper and never access database or Gemini credentials. The AI assistant section in `ApplicationDetailPage` provides UI triggers and displays results with a clear decision support disclaimer.

### Flask REST API

`backend/app.py` initializes Flask, configuration, session support, health and dashboard endpoints, then registers authentication, Job, Candidate, Application, Interview, Evaluation, and AI blueprints. Route modules validate input, enforce roles, call existing database functions, and return consistent JSON.

### AI Service & Gemini Integration Layer

- `backend/services/gemini_service.py`: Dedicated API wrapper calling `google-genai` with model `gemini-2.5-flash`. Handles timeouts, API errors, and missing keys without crashing Flask. Never queries the database directly.
- `backend/services/ai_service.py`: Domain layer fetching required context (job details, candidate CV text, application status) via parameterized SQL, formatting prompts from `backend/prompts/`, calling Gemini, and persisting outputs into the `ai_results` table.

### Recruitment Knowledge RAG Subsystem (Milestone M8)

- `backend/rag/scope_guard.py`: Intent and domain boundary filter that blocks out-of-scope queries (general trivia, weather, system administration) and prevents secret leaks.
- `backend/rag/intent_router.py`: Classifies questions into `DECISION_REFUSAL` (blocks candidate rankings/automated hiring), `STRUCTURED` (direct SQL lookups/counts), `HYBRID`, or `SEMANTIC`.
- `backend/rag/document_builder.py`: Extracts and chunks recruitment records from the 7 MySQL tables into normalized text chunks (1,000 chars, 150 overlap) with strict credential exclusion.
- `backend/rag/embedding_service.py`: Singleton `sentence-transformers/all-MiniLM-L6-v2` generating 384-dimensional dense vectors locally on CPU.
- `backend/rag/vector_store.py`: FAISS `IndexFlatIP` store with persistence in `backend/rag/index/` (`recruitment.faiss`, `metadata.json`, `index_info.json`). Avoids creating an 8th MySQL table.
- `backend/rag/retriever.py` & `context_builder.py`: Threshold-filtered retrieval (cosine >= 0.25) with source deduplication and citation linking.
- `backend/rag/rag_service.py`: Orchestrator coordinating structured queries, vector retrieval, and grounded Gemini response synthesis.

### Database Layer

`backend/database/db.py` retains explicit mysql-connector operations across exactly 7 tables (`users`, `jobs`, `candidates`, `applications`, `interviews`, `evaluations`, `ai_results`). Each operation opens and closes its own connection and uses parameters for user-controlled values.

### File Storage

Candidate CVs are stored under `backend/uploads` with UUID-prefixed safe filenames. Flask validates extension and request size, extracts PDF or DOCX text when possible, and serves files only to authenticated users.

## Authentication Flow

1. React posts email and password to `/api/auth/login`.
2. Flask verifies the Werkzeug password hash from MySQL.
3. Flask stores public identity and role fields in the signed session cookie.
4. React calls `/api/auth/me` after refresh.
5. Flask returns HTTP 401 when no valid session exists.

## Authorization Boundary

Frontend controls improve usability but are not security controls. Flask permits ADMIN and HR to mutate Jobs, Candidates, Applications, and Interviews. MANAGER has read-only access for Jobs, Candidates, Applications, and Interviews (except marking an assigned interview COMPLETED). For Evaluations, all authenticated roles (`ADMIN`, `HR`, `MANAGER`) may submit evaluations; only the original evaluator or ADMIN may edit an evaluation. For AI services, `ADMIN`, `HR`, and `MANAGER` can generate CV summaries, interview questions, and view AI history; only `ADMIN` and `HR` may generate recruitment email drafts. Unauthorized API calls return HTTP 403.

## Migration Result

The equivalent React flows passed build, API, session, role, upload, MySQL integration, and manual browser checks. The old templates and static files now live under `legacy/`; they remain only as migration history and are not an active frontend.

## Traceability

| Requirements | React Components | Flask API | Database |
|---|---|---|---|
| FR-001 to FR-003 | LoginPage, ProtectedRoute, Layout | `/api/auth/*` | users |
| FR-004 to FR-005 | JobsPage, JobFormPage, JobDetailPage | `/api/jobs*` | jobs, applications delete check |
| FR-006 to FR-008 | CandidatesPage, CandidateFormPage, CandidateDetailPage | `/api/candidates*`, `/uploads/*` | candidates, applications delete check |
| FR-009 to FR-010 | ApplicationsPage, ApplicationCreatePage, ApplicationDetailPage | `/api/applications*` | applications, candidates, jobs |
| FR-011 | InterviewsPage, InterviewFormPage, InterviewDetailPage | `/api/interviews*` | interviews, applications, users |
| FR-012 | EvaluationFormPage, ApplicationDetailPage, InterviewDetailPage | `/api/evaluations*` | evaluations, applications, users |
| FR-013 | ApplicationDetailPage (AI Section) | `POST /api/ai/cv-summary` | ai_results, applications, candidates, jobs |
| FR-014 | ApplicationDetailPage (AI Section) | `POST /api/ai/interview-questions` | ai_results, applications, candidates, jobs |
| FR-015 | ApplicationDetailPage (AI Section) | `POST /api/ai/email` | ai_results, applications, candidates, jobs, interviews |
| FR-016 | ApplicationDetailPage (AI History) | `GET /api/applications/{id}/ai-results` | ai_results |
| FR-017 (Dashboard) | DashboardPage | `GET /api/dashboard` | aggregate queries on jobs, candidates, applications, interviews |
| FR-018 (Search/Filter) | React Search Controls on Jobs, Candidates, Applications, Interviews | `/api/jobs`, `/api/candidates`, `/api/applications`, `/api/interviews` | Parameterized SQL queries with indexed column filtering |
| FR-019 | Development verification | `/api/health` | connection check |
| FR-020 (RAG Chatbot) | AIChatPage (`/ai-chat`), Sidebar (`✨ Trợ lý AI`) | `/api/chat`, `/api/chat/reindex`, `/api/chat/index-info` | MySQL 7 tables + FAISS local index |

## Trust & Security Boundaries

1. **Browser / Frontend:** Untrusted. The browser never receives or stores `GEMINI_API_KEY`. All AI interactions pass through authenticated Flask endpoints.
2. **Backend Secrets:** `GEMINI_API_KEY` is loaded from server environment variables via `backend/config.py` and is never exposed in API responses or logs.
3. **External Gemini Boundary:** Gemini receives only sanitized professional text (job requirements and extracted CV text). PII such as passwords, addresses, phone numbers, and internal IDs are withheld.
4. **Prompt Injection Defense:** Prompt templates explicitly instruct Gemini that CV text is external reference data and never executable instructions.
5. **Decoupled Decision Making:** AI results are strictly advisory. AI cannot change application statuses, assign hiring scores, or automatically send emails. All recruitment decisions remain exclusively with human recruiters.


