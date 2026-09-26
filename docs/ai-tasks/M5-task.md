# M5 AI Task

Task:
Integrate Gemini Recruitment Assistant with 3 functions: AI CV Summary, AI Interview Question Generator, and AI Email Draft Generator.

Inputs:
- docs/requirements.md (FR-013, FR-014, FR-015, FR-016)
- docs/user-stories.md (US-010, US-011, US-012)
- docs/acceptance-criteria.md (AC-008, AC-009, AC-010)
- docs/architecture.md
- docs/database-design.md (fixed 7-table schema, ai_results)
- docs/project-state.md
- .agents/skills/implementation/SKILL.md
- .agents/skills/testing/SKILL.md

Features Implemented:
1. AI CV Summary (`POST /api/ai/cv-summary`): Extracts core experience, matching skills, CV evidence, and clarification points.
2. AI Interview Question Generator (`POST /api/ai/interview-questions`): Suggests exactly 5 interview questions (2 skill, 2 experience, 1 CV clarification).
3. AI Email Draft Generator (`POST /api/ai/email`): Generates invitation or outcome notifications in Vietnamese based on application status.
4. AI History Retrieval (`GET /api/applications/<id>/ai-results`): Returns recent AI results ordered by `created_at DESC`.

Safety and Scope Boundaries:
- AI is strictly advisory (Decision Support System); it cannot make hiring decisions.
- No automatic ranking, candidate scoring, or status changes.
- CV prompt safety rule enforced: CV content treated as reference data, not system instructions.
- Sensitive personal demographic attributes (gender, age, religion, marital status) are excluded from evaluation.
- No RAG, vector database, embedding, or multiple AI SDKs added.
- Database preserved strictly at exactly 7 tables.

AI Changes:
- backend/requirements.txt: Added `google-genai>=1.0,<3.0`.
- backend/config.py: Added `GEMINI_API_KEY` and `GEMINI_MODEL` configurations.
- backend/.env.example: Created template for environment secrets.
- backend/prompts/cv_summary.txt: Created CV summary prompt template.
- backend/prompts/interview_questions.txt: Created interview question prompt template.
- backend/prompts/email.txt: Created interview invitation and result email templates.
- backend/services/gemini_service.py: Created dedicated Gemini API service with robust error handling.
- backend/services/ai_service.py: Implemented 3 core functions: `summarize_cv`, `generate_interview_questions`, `generate_email`.
- backend/routes/ai_routes.py: Created `ai_bp` blueprint with authentication, role checks, and error responses.
- backend/app.py: Registered `ai_bp`.
- backend/database/db.py: Added `create_ai_result` and `get_ai_results_by_application`.
- backend/tests/test_ai.py: Created 16 automated tests covering all AI flows, role boundaries, and safety constraints.
- frontend/src/services/api.js: Exported `aiApi` helper.
- frontend/src/pages/ApplicationDetailPage.jsx: Added "Trợ lý AI (Google Gemini)" section with 3 action cards, disclaimer, live preview with copy button, and recent results history table.
- docs/ai-bias-check.md: Documented minimal gender bias check with identical qualifications.

Tests:
- 117 backend tests PASS (101 existing + 16 new AI tests).
- Frontend lint (`oxlint`): 0 warnings, 0 errors across 24 files.
- Frontend build (`vite build`): PASS (46 modules transformed).
- Real MySQL integration: 7 tables verified, `ai_results` insertions and retrieval verified.
- Status decoupling confirmed: AI operations never modify application status.

Issues Detected & Resolved:
- Guarded against missing CV text (HTTP 400).
- Guarded result email generation when application is not in final status (HTTP 400).
- Handled missing Gemini API key gracefully without crashing Flask or exposing secrets.
- Blocked MANAGER role from generating emails (HTTP 403).

Human Decision:
PENDING (Awaiting Human Review for Milestone M5).
