# AI-Augmented SDLC Report

## Scope and Outcome

The AI agent continued the verified recruitment management system by executing Milestone M7 (Final Code Review, Security Review, Documentation Audit & Human Gate Preparation) and Milestone M8 (Recruitment Knowledge Chatbot with Hybrid RAG).
- In M8, developed a domain-grounded recruitment chatbot combining direct parameterized MySQL queries, local dense vector search (FAISS IndexFlatIP + SentenceTransformers `all-MiniLM-L6-v2`), and Google Gemini LLM synthesis.
- Implemented strict Scope Guard (refuses general knowledge, weather, cooking, system admin) and Decision Guard (refuses automated hiring decisions and candidate rankings).
- Enforced zero arbitrary SQL generation by LLM; all structured queries execute via predefined parameterized functions.
- Preserved the strict architectural boundary of exactly 7 tables in MySQL (FAISS vector index stored locally on disk in `backend/rag/index/`).
- Implemented comprehensive RBAC: reindexing is strictly restricted to `ADMIN`, returning HTTP 403 for `HR` and `MANAGER`.
- Created 22 new automated tests in `backend/tests/test_chat.py`, elevating the backend test suite from 136 to 158 tests (100% passing).
- Built interactive frontend chat interface (`/ai-chat`) with source citations linking directly to candidate and job details.
- A comprehensive static code review was performed and recorded in `docs/code-review.md`, confirming requirement-to-code traceability across all 20 functional requirements.
- An extensive security review was executed and documented in `docs/security-review.md`.
- Session cookie configuration was hardened in `backend/config.py` with explicit `SESSION_COOKIE_SAMESITE = "Lax"` and `SESSION_COOKIE_HTTPONLY = True`.
- Documentation was thoroughly synchronized: `docs/rag-design.md`, `README.md`, `docs/code-review.md`, `docs/security-review.md`, `docs/project-state.md`, `docs/test-report.md`, and `docs/ai-tasks/M8-task.md`.
- Automated regression suite achieved 158 passing tests with 0 failures; frontend linting confirmed 0 errors and 0 warnings; production build succeeded with 47 modules transformed.
- The fixed seven-table MySQL database schema was strictly preserved.
- Human Gate 4 was prepared in `docs/human-gate-4.md`. All Human Gates strictly reserve the final approval action for the student.

## Skills Applied

- **Requirements analysis:** confirmed complete traceability for all functional requirements (FR-001 through FR-019) and maintained data limitation transparency.
- **Architecture design:** preserved the React 19 + Flask REST + MySQL 8.4 multi-tiered architecture with clean legacy Jinja isolation.
- **Database design:** confirmed strict preservation of the seven-table MySQL schema without introducing migrations or artificial columns.
- **Code review:** performed structured review with severity classifications (`HIGH`, `MEDIUM`, `LOW`, `INFO`) and recorded actionable findings in `docs/code-review.md`.
- **Security review:** audited authentication, RBAC boundaries, 100% parameterized SQL queries, XSS prevention via JSX escaping, CSRF defense via SameSite cookies, UUID file uploads, path traversal mitigation, and secret isolation.
- **Testing:** verified all 136 backend unit and integration tests, frontend static linting (`oxlint`), and production build bundling.
- **Documentation:** updated `README.md`, created `docs/code-review.md`, `docs/security-review.md`, `docs/human-gate-4.md`, `docs/human-review-summary.md`, `docs/ai-tasks/M7-task.md`, and updated project state records.

## Generated or Updated Artifacts in M7

- `backend/config.py`: Hardened session cookie attributes (`SESSION_COOKIE_SAMESITE = "Lax"` and `SESSION_COOKIE_HTTPONLY = True`).
- `README.md`: Completely rewritten to reflect M1–M6 deliverables, setup commands, demo credentials, and 136 passing tests.
- `docs/code-review.md`: Comprehensive code review report with findings table and traceability matrix.
- `docs/security-review.md`: Comprehensive security review report with findings table, vulnerability analysis, and mitigations.
- `docs/human-gate-4.md`: Final delivery verification checklist with status `READY FOR HUMAN APPROVAL`.
- `docs/human-review-summary.md`: Consolidated summary of Human Gates 1 to 4 with instructions for student review.
- `docs/ai-tasks/M7-task.md`: Detailed record of M7 task execution and evidence.
- `docs/project-state.md`: Updated project state marking M7 as `PASS WITH DOCUMENTED LIMITATIONS`.
- `docs/test-report.md`: Updated test report with M7 verification evidence and defect resolution history.
- `docs/ai-sdlc-report.md`: Current document reflecting full project lifecycle from M1 to M7.

## Verification Evidence

- 136 backend tests pass (`136 passed in 3.35s`, 0 failed).
- Frontend static lint passes with 0 warnings and 0 errors (`oxlint` on 24 files).
- Vite production build succeeds (46 modules transformed).
- Direct Flask health check returns `status: "ok"`, `database: "connected"`.
- Set-Cookie header on `/api/auth/login` confirms `HttpOnly; SameSite=Lax`.
- Live MySQL database verified with exactly 7 tables via `SHOW TABLES;`.
- AI operations decoupled: Gemini API calls never alter application status and never perform automated hiring.
- Manual browser verification passes across all modules without console errors.

## AI-Detected Defects & Fixes

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. Solved via `os.path.basename` to maintain backward compatibility while preventing path traversal.
2. *Linter Warnings in React Components*: Initial oxlint pass in M3/M4 flagged fast-refresh warning for non-component exports, unused variables, and synchronous setState in effects. Refactored into promise chains and cleaned unused imports to achieve 0 warnings and 0 errors.
3. *Interview Re-scheduling Guard*: Transitioning from COMPLETED or CANCELLED back to SCHEDULED returned 400 with user-friendly error message.
4. *Evaluation Score Boundaries*: Submitting scores outside 1-5 returned HTTP 400.
5. *Result Email Guard*: Generating result email on non-final application status (e.g. SCREENING) returned HTTP 400.
6. *Missing CV Text Guard*: Generating CV summary without extracted CV text returned HTTP 400.
7. *Missing cv_text in get_application_by_id*: Fixed query in `db.py` to retrieve `c.cv_text` from candidates for live Gemini processing.
8. *Zero Finalized Applications Division*: Handled `finalized == 0` safely in `pass_rate` calculation to return `0.0%` instead of division-by-zero error.
9. *Empty Application Status Handling*: Ensured all 5 status keys default to `0` when no database rows exist for that state.
10. *Session Cookie Hardening (M7)*: Added explicit `SESSION_COOKIE_SAMESITE = "Lax"` and `SESSION_COOKIE_HTTPONLY = True` in `Config` to ensure consistent browser CSRF mitigation.
11. *Outdated Documentation (M7)*: Synchronized `README.md`, `docs/project-state.md`, and test reports with completed M1–M6 deliverables.

## Tools and MCP Usage

Shell, file viewing/editing, and task management tools handled repository inspection, configuration hardening, MySQL checks, automated tests and builds. No external issue tracker, hosting service, or workflow engine was used.

## Human Oversight

In strict compliance with the AI-SDLC framework, the AI agent has NOT approved any Human Gate autonomously.
- Human Gate 1 remains `NEEDS CHANGES` in `docs/human-gate-1.md`.
- Human Gate 2 remains `PENDING HUMAN APPROVAL` in `docs/human-gate-2.md`.
- Human Gate 3 remains `PENDING HUMAN APPROVAL` in `docs/human-gate-3.md`.
- Human Gate 4 is prepared and marked `READY FOR HUMAN APPROVAL` in `docs/human-gate-4.md`.
All gate approvals require explicit student inspection and sign-off.

## Final Evaluation

All technical criteria for Milestone M7 are satisfied with reproducible automated, integration, and manual evidence. The system is in a stable, verified state, fully documented, and ready for human review.
