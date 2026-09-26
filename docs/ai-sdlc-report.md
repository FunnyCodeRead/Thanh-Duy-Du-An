# AI-Augmented SDLC Report

## Scope and Outcome

The AI agent continued the verified recruitment management system by implementing Milestone M5 (Google Gemini AI Recruitment Assistant) and Milestone M6 (Dashboard Statistics, Search/Filter Audit, and Final Functional Testing).
- M6 Dashboard was implemented directly from real MySQL database aggregates without inventing synthetic metrics or adding external BI charting engines.
- Search and filter queries across Jobs, Candidates, Applications, and Interviews were thoroughly audited for parameterized SQL and combined filtering.
- Full functional regression testing across M1 to M6 was executed successfully with 136 backend tests passing, 0 lint errors/warnings, and successful production build.
- The Hiring-time limitation was transparently communicated and documented because the current database schema only stores `applied_at` without final completion timestamps.
- Existing database behavior and the fixed seven-table schema were strictly preserved. No database migrations, additional tables, or complex microservices were introduced.

## Skills Applied

- Requirements analysis: preserved traceability (FR-017 through FR-018) and documented data limitations.
- Architecture design: maintained React REST, session, database, and decoupled external AI boundaries.
- Database design: confirmed no schema change and exactly seven tables (`ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`).
- Implementation: built real MySQL dashboard aggregations in `backend/database/db.py` and enhanced `DashboardPage.jsx` with responsive Bootstrap elements.
- Testing: added 11 dashboard tests and 8 search audit tests (136 total passing tests) and collected real MySQL integration evidence.
- Security & Ethics: audited parameterized SQL queries to prevent injection vulnerabilities; verified secret protection and role boundaries across all endpoints.
- Documentation: aligned setup, architecture, API, user guide, test plan, test report, M6 task evidence, and AI-SDLC report documents.

## Generated or Updated Artifacts

- `backend/database/db.py`: Expanded `get_dashboard_counts` to compute summary metrics, status distribution, candidate sources, pass rate, hiring-time limitation, and top 5 upcoming interviews.
- `frontend/src/pages/DashboardPage.jsx`: Overhauled dashboard UI with responsive Bootstrap summary cards, status badges, candidate source progress bars, pass rate card, hiring-time data limitation notice, and upcoming interviews table.
- `backend/tests/test_dashboard.py`: 11 test assertions covering TC-DASH-01 through TC-DASH-11.
- `backend/tests/test_search.py`: 8 test assertions covering TC-SRCH-01 through TC-SRCH-08.
- `docs/ai-tasks/M6-task.md`: Created M6 AI task evidence record.
- `docs/requirements-issues.md`: Recorded REQ-ISSUE-06 regarding hiring-time schema limitation.
- `docs/api.md`: Documented full response structure of `GET /api/dashboard`.
- `docs/user-guide.md`: Added comprehensive user guide section for the recruitment dashboard.
- `docs/architecture.md`: Updated traceability matrix for Dashboard (FR-017) and Search (FR-018).
- `docs/project-state.md`: Marked M6 as TECHNICAL PASS.
- `docs/test-plan.md` & `docs/test-report.md`: Updated test cases, execution evidence, and defect logs.

## Verification Evidence

- 136 backend tests pass (`136 passed in 3.72s`).
- Frontend lint passes without warnings (`oxlint` exits 0 on 24 files).
- Vite production build passes (46 modules transformed).
- Direct Flask and Vite-proxied health and dashboard checks pass.
- Live MySQL flows pass: 7 tables verified, real data aggregations verified.
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
7. *Missing cv_text in get_application_by_id*: Fixed query in `db.py` to retrieve `c.cv_text` from candidates for live Gemini processing.
8. *Zero Finalized Applications Division*: Handled `finalized == 0` safely in `pass_rate` calculation to return `0.0%` instead of division-by-zero error.
9. *Empty Application Status Handling*: Ensured all 5 status keys default to `0` when no database rows exist for that state.

## Tools and MCP Usage

Shell, file viewing/editing, and task management tools handled repository inspection, implementation, MySQL checks, automated tests and builds. No external issue tracker, hosting service, or workflow engine was used.

## Human Oversight

Formal Human Gate 1 remains `NEEDS CHANGES`; Human Gate 2 remains `PENDING HUMAN APPROVAL`; Human Gate 3 remains `PENDING HUMAN APPROVAL`. The student's explicit prompt authorized the M5 implementation work. AI output is strictly advisory and human review is required before taking any recruitment action.

## Current Evaluation

Technical M5 criteria are satisfied with reproducible automated, integration, and manual evidence. Next authorized milestone: M6 (Dashboard + Search + Final Testing).



