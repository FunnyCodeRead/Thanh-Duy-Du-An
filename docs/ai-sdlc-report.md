# AI-Augmented SDLC Report

## Scope and Outcome

The AI agent continued the verified recruitment management system by implementing Milestone M4: Interview Management & Candidate Evaluation. Existing database behavior and the fixed seven-table schema were strictly preserved. No database migrations, additional tables, workflow engines, or Gemini integrations were introduced.

## Skills Applied

- Requirements analysis: preserved traceability (FR-011, FR-012) and human review boundaries.
- Architecture design: maintained React REST, session, database and trust boundaries.
- Database design: confirmed no schema change and exactly seven tables (`ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`).
- Implementation: built the Flask Interview and Evaluation APIs, database operations, and React pages incrementally.
- Testing: added 31 new test assertions (101 total passing tests) and collected real MySQL and integration evidence.
- Documentation: aligned setup, architecture, API, test plan/report, user guide, and AI task records with verified code.

## Generated or Updated Artifacts

- `backend/routes/interview_routes.py`: Flask blueprint for Interview management with role boundaries, interviewers list, and status transition validation.
- `backend/routes/evaluation_routes.py`: Flask blueprint for Candidate Evaluations with 1-5 score boundaries, runtime average calculation, and author/admin edit permissions.
- `backend/database/db.py`: parameterized SQL functions for interview and evaluation operations.
- `backend/tests/test_interviews.py`: 19 test assertions covering TC-INT-01 through TC-INT-12 and edge cases.
- `backend/tests/test_evaluations.py`: 12 test assertions covering TC-EVAL-01 through TC-EVAL-10 and score boundary validation.
- `frontend/src/pages/InterviewsPage.jsx`, `InterviewFormPage.jsx`, `InterviewDetailPage.jsx`: React views for listing, scheduling, and tracking interviews.
- `frontend/src/pages/EvaluationFormPage.jsx`: React view for submitting and editing candidate evaluations with dynamic score calculation.
- `frontend/src/pages/ApplicationDetailPage.jsx`: integrated interviews and evaluations sections with action links.
- `frontend/src/services/api.js`: exported `interviewApi` and `evaluationApi`.
- `frontend/src/App.jsx`, `Sidebar.jsx`: routing and navigation integration.
- Architecture, API, user guide, test plan, test report, M4 task evidence, and AI-SDLC report documents.

## Verification Evidence

- 101 backend tests pass (`101 passed in 3.17s`).
- Frontend lint passes without warnings (`oxlint` exits 0 on 24 files).
- Vite production build passes (46 modules transformed).
- Direct Flask and Vite-proxied health checks pass.
- Live MySQL flows pass for HR and MANAGER, interview scheduling, interview status completion/cancellation, illegal transition rejection (HTTP 400), evaluation submission, 1-5 score validation, runtime average score calculation, and cleanup.
- Manual browser verification passes for Login, Dashboard, Jobs, Candidates, Applications, Interviews, and Evaluations with no console errors.
- Exactly 7 database tables verified in MySQL (`SHOW TABLES;`).

## AI-Detected Defects & Fixes

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend emits a basename-only URL and the backend accepts both representations.
2. *Linter Warnings in React Components*: Initial oxlint pass in M3/M4 flagged fast-refresh warning for non-component exports, unused variables, and synchronous setState in effects. Refactored into promise chains and cleaned unused imports to achieve 0 warnings and 0 errors.
3. *Interview Re-scheduling Guard*: Transitioning from COMPLETED or CANCELLED back to SCHEDULED returned 400 with user-friendly error message.
4. *Evaluation Score Boundaries*: Submitting scores outside 1-5 returned HTTP 400.

## Tools and MCP Usage

Shell, file viewing/editing, and task management tools handled repository inspection, implementation, MySQL checks, automated tests and builds. No external issue tracker, hosting service, workflow engine, or Gemini API was used.

## Human Oversight

Formal Human Gate 1 remains `NEEDS CHANGES`; Human Gate 2 remains `PENDING HUMAN APPROVAL`. Human Gate 3 for M3+M4 is created with status `PENDING HUMAN APPROVAL` awaiting the student's review and approval.

## Current Evaluation

Technical M4 criteria are satisfied with reproducible automated, integration, and manual evidence. Next authorized milestone: M5 (Gemini AI features).


