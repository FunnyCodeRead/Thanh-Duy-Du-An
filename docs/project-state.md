# Current Project State

## Assessment Date

26 September 2026

## Current Milestone

M4 (Interview Management & Candidate Evaluation) implemented and verified. M5 (Gemini AI features) has not started.

## Verified State

- React 19 + Vite is the active frontend; Jinja assets are archived in `legacy/`.
- Flask exposes REST endpoints under `/api` and protected CV files under `/uploads`.
- Authentication uses MySQL, Werkzeug password hashes and Flask Session.
- ADMIN/HR can mutate Jobs, Candidates, Applications, and Interviews; MANAGER is read-only at the API boundary (HTTP 403 on mutations, except marking assigned interviews COMPLETED).
- All authenticated roles (`ADMIN`, `HR`, `MANAGER`) can submit candidate evaluations with 1-5 score boundaries and runtime arithmetic average calculation; only the evaluator or ADMIN can edit an evaluation.
- Application management fully functional: listing with search/filter (keyword, status, job), creation with candidate and job selection, duplicate rejection (HTTP 409), detail view (Candidate, Job, Application, Interviews, Evaluations), and status progression (`NEW` -> `SCREENING` -> `INTERVIEW` -> `PASSED`/`REJECTED`).
- Interview management fully functional: scheduling, interviewers dropdown, detail view, status progression (`SCHEDULED` -> `COMPLETED`/`CANCELLED`), and protection against illegal re-scheduling.
- Candidate evaluation fully functional: 3 score dimensions (1-5), runtime arithmetic average `(t+c+e)/3` rounded to 2 decimals, feedback comments, and edit permissions.
- Job and Candidate CRUD, search, filters, validation and CV upload operate against MySQL.
- MySQL contains exactly seven tables (`ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`); no schema change was made.
- Backend automated suite: 101 passed (70 existing + 31 new).
- Frontend lint (oxlint) and production build: passed with 0 warnings and 0 errors.
- Live MySQL and browser checks: passed without console errors.

## Deliberately Out of Scope

- Gemini integration and AI result screens (Milestone M5).
- CV summarization, AI interview questions generation, email drafting, or automated AI scoring.
- Automated hiring decisions or automatic status changes triggered by interview completion or evaluation scores.

## Human Gates

Formal Human Gate 1 remains `NEEDS CHANGES` and Human Gate 2 remains `PENDING HUMAN APPROVAL` in their respective review records. Human Gate 3 covers M3 and M4 (Application, Interview, Evaluation workflows) and is recorded as `PENDING HUMAN APPROVAL` in `docs/human-gate-3.md`. The M4 implementation was performed in response to the student's explicit authorization; no formal gate approval is inferred.


