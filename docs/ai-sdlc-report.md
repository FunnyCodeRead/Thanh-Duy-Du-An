# AI-Augmented SDLC Report

## Scope and Outcome

The AI agent continued the verified recruitment management system by implementing Milestone M5: Google Gemini AI Recruitment Assistant. Exactly three core AI capabilities were introduced: AI CV Summary, AI Interview Question Generator, and AI Email Draft Generator. Existing database behavior and the fixed seven-table schema were strictly preserved. No database migrations, additional tables, workflow engines, vector databases, RAG, or AI ranking mechanisms were introduced.

## Skills Applied

- Requirements analysis: preserved traceability (FR-013 through FR-016) and decision-support boundaries.
- Architecture design: maintained React REST, session, database, and decoupled external AI boundaries.
- Database design: confirmed no schema change and exactly seven tables (`ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`).
- Implementation: built the Flask AI APIs, Gemini integration service, domain AI service, and React AI section incrementally.
- Testing: added 16 new test assertions (117 total passing tests) and collected real MySQL integration evidence.
- Security & Ethics: ensured no API keys or PII leak to the client, implemented prompt safety rules (CV content treated as data, not instruction), and performed minimal bias verification.
- Documentation: aligned setup, architecture, API, test plan/report, user guide, and AI task records with verified code.

## Generated or Updated Artifacts

- `backend/requirements.txt`: Added `google-genai>=1.0,<3.0`.
- `backend/config.py`: Added `GEMINI_API_KEY` and `GEMINI_MODEL`.
- `backend/.env.example`: Created environment variable template.
- `backend/prompts/`: Created `cv_summary.txt`, `interview_questions.txt`, and `email.txt`.
- `backend/services/gemini_service.py`: Dedicated Gemini API client wrapper with robust exception handling.
- `backend/services/ai_service.py`: Core AI service for CV summary, interview questions, and email drafting.
- `backend/routes/ai_routes.py`: Flask blueprint `ai_bp` with authentication and role boundaries.
- `backend/app.py`: Registered `ai_bp`.
- `backend/database/db.py`: Added `create_ai_result` and `get_ai_results_by_application`.
- `backend/tests/test_ai.py`: 16 test assertions covering TC-AI-01 through TC-AI-16.
- `frontend/src/services/api.js`: Exported `aiApi`.
- `frontend/src/pages/ApplicationDetailPage.jsx`: Integrated Trợ lý AI section with 3 actions, disclaimer, live preview, copy button, and results history.
- `docs/ai-bias-check.md`: Documented minimal demographic bias check.
- Architecture, API, user guide, test plan, test report, M5 task evidence, and AI-SDLC report documents.

## Verification Evidence

- 117 backend tests pass (`117 passed in 3.22s`).
- Frontend lint passes without warnings (`oxlint` exits 0 on 24 files).
- Vite production build passes (46 modules transformed).
- Direct Flask and Vite-proxied health checks pass.
- Live MySQL flows pass: 7 tables verified, `ai_results` insertions and retrieval verified.
- Status decoupling confirmed: AI operations never modify application status.
- Minimal AI bias check verified (`docs/ai-bias-check.md`: PASS).
- Manual browser verification passes for Login, Dashboard, Jobs, Candidates, Applications, Interviews, and AI Assistant with no console errors.

## AI-Detected Defects & Fixes

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend emits a basename-only URL and the backend accepts both representations.
2. *Linter Warnings in React Components*: Initial oxlint pass in M3/M4 flagged fast-refresh warning for non-component exports, unused variables, and synchronous setState in effects. Refactored into promise chains and cleaned unused imports to achieve 0 warnings and 0 errors.
3. *Interview Re-scheduling Guard*: Transitioning from COMPLETED or CANCELLED back to SCHEDULED returned 400 with user-friendly error message.
4. *Evaluation Score Boundaries*: Submitting scores outside 1-5 returned HTTP 400.
5. *Result Email Guard*: Generating result email on non-final application status (e.g. SCREENING) returned HTTP 400.
6. *Missing CV Text Guard*: Generating CV summary without extracted CV text returned HTTP 400.

## Tools and MCP Usage

Shell, file viewing/editing, and task management tools handled repository inspection, implementation, MySQL checks, automated tests and builds. No external issue tracker, hosting service, or workflow engine was used.

## Human Oversight

Formal Human Gate 1 remains `NEEDS CHANGES`; Human Gate 2 remains `PENDING HUMAN APPROVAL`; Human Gate 3 remains `PENDING HUMAN APPROVAL`. The student's explicit prompt authorized the M5 implementation work. AI output is strictly advisory and human review is required before taking any recruitment action.

## Current Evaluation

Technical M5 criteria are satisfied with reproducible automated, integration, and manual evidence. Next authorized milestone: M6 (Dashboard + Search + Final Testing).



