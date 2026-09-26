# Current Project State

## Assessment Date

26 September 2026

## Current Milestone Status

- Milestone M1 (Core Foundation): PASS
- Milestone M2 (Jobs, Candidates, CV Upload): PASS
- Milestone M3 (Applications & Status Progression): PASS
- Milestone M4 (Interviews & Evaluations): PASS
- Milestone M5 (Google Gemini AI Recruitment Assistant): PASS
- Milestone M6 (Dashboard, Search, Final Testing): PASS
- Milestone M7 (Final Code Review, Security Review, Documentation Audit): PASS WITH DOCUMENTED LIMITATIONS

## Verified State

- React 19 + Vite is the active frontend; Jinja assets are archived in `legacy/`.
- Flask exposes REST endpoints under `/api` and protected CV files under `/uploads`.
- Authentication uses MySQL, Werkzeug password hashes (`scrypt`), and Flask Session with `HttpOnly; SameSite=Lax`.
- Role-based authorization enforced at the API boundary:
  - `ADMIN`: full system management, can edit all evaluations and create all resources.
  - `HR`: recruitment operations (Jobs, Candidates, Applications, Interviews, Evaluations, AI summaries, AI questions, AI email drafting).
  - `MANAGER`: read-only access for Jobs, Candidates, Applications, Interviews, AI results, and Dashboard; can complete assigned interviews and submit candidate evaluations.
- Application management fully functional: listing with search/filter, creation with duplicate prevention (HTTP 409), detail view, and status progression (`NEW` -> `SCREENING` -> `INTERVIEW` -> `PASSED`/`REJECTED`).
- Interview management fully functional: scheduling, interviewers dropdown, detail view, status progression (`SCHEDULED` -> `COMPLETED`/`CANCELLED`), and protection against illegal re-scheduling.
- Candidate evaluation fully functional: 3 score dimensions (1-5), runtime arithmetic average `(t+c+e)/3` rounded to 2 decimals, feedback comments, and edit permissions.
- Google Gemini AI Assistant fully functional across 3 advisory capabilities:
  1. AI CV Summary (`POST /api/ai/cv-summary`): 4-part structured analysis against job description.
  2. AI Interview Questions (`POST /api/ai/interview-questions`): 5 targeted questions (skill, experience, CV verification).
  3. AI Email Draft (`POST /api/ai/email`): Invitation or outcome notification drafting in Vietnamese.
  4. AI Results History (`GET /api/applications/<id>/ai-results`): Stored in `ai_results` table.
- Strict decision-support boundary: AI operations never alter application status, never rank candidates, and never make automated hiring decisions.
- Recruitment Dashboard fully functional (`GET /api/dashboard` and `DashboardPage.jsx`):
  - Summary metrics: open jobs, total jobs, total candidates, total applications, upcoming interviews.
  - Complete status distribution across all 5 application states.
  - Candidate source distribution with responsive progress bars.
  - Pass rate calculated as `PASSED / (PASSED + REJECTED) * 100%`.
  - Up to 5 upcoming scheduled interviews table.
  - Time-to-hire limitation transparently communicated without synthetic data fabrication.
- Search and Filter fully audited across Jobs, Candidates, Applications, and Interviews with parameterized SQL queries.
- MySQL contains exactly seven tables (`ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`); no schema change was made.
- Code Review (`docs/code-review.md`) and Security Review (`docs/security-review.md`) completed and documented.
- Backend automated suite: 136 passed in 3.35s (0 failed).
- Frontend lint (`oxlint`) and production build: passed with 0 warnings and 0 errors across 24 files.
- Live MySQL and browser checks: passed without console errors.

## Deliberately Out of Scope (Accepted Project Limitations)

- Automated hiring decisions or automatic status changes triggered by AI results.
- AI ranking, scoring, or candidate matching percentages.
- Automated email dispatching (only drafts generated; no Gmail API or SMTP integration).
- RAG, vector databases, or multiple parallel AI models.
- Complex BI charting engines, data warehousing, or fabricated time-to-hire formulas.
- Microservices, Redis/Celery background task queues, or external OAuth providers.

## Human Gates Status

- **Human Gate 1 (Requirements Review):** `NEEDS CHANGES` (recorded in `docs/human-gate-1.md`).
- **Human Gate 2 (React REST Architecture Review):** `PENDING HUMAN APPROVAL` (recorded in `docs/human-gate-2.md`).
- **Human Gate 3 (M3/M4 Review):** `PENDING HUMAN APPROVAL` (recorded in `docs/human-gate-3.md`).
- **Human Gate 4 (Final Delivery Review):** `READY FOR HUMAN APPROVAL` (recorded in `docs/human-gate-4.md`).
- Comprehensive Human Review Summary available in `docs/human-review-summary.md`. All gate approvals are reserved strictly for the student reviewer.
