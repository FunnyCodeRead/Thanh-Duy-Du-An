# Current Project State

## Assessment Date

26 September 2026

## Current Milestone

M3 (Application Management & Candidate Status) implemented and verified. M4 (Interview & Evaluation) has not started.

## Verified State

- React 19 + Vite is the active frontend; Jinja assets are archived in `legacy/`.
- Flask exposes REST endpoints under `/api` and protected CV files under `/uploads`.
- Authentication uses MySQL, Werkzeug password hashes and Flask Session.
- ADMIN/HR can mutate Jobs, Candidates, and Applications (including status transitions); MANAGER is read-only at the API boundary (HTTP 403 on mutations).
- Application management fully functional: listing with search/filter (keyword, status, job), creation with candidate and job selection, duplicate rejection (HTTP 409), detail view (Candidate, Job, Application), and status progression (`NEW` -> `SCREENING` -> `INTERVIEW` -> `PASSED`/`REJECTED`).
- Job and Candidate CRUD, search, filters, validation and CV upload operate against MySQL.
- MySQL contains exactly seven tables (`ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`); no schema change was made.
- Backend automated suite: 70 passed (47 existing + 23 new).
- Frontend lint (oxlint) and production build: passed with 0 warnings and 0 errors.
- Live MySQL and browser checks: passed without console errors.

## Deliberately Out of Scope

- Interview and Evaluation UI/API (Milestone M4).
- Gemini integration and AI result screens (Milestone M5).
- Email sending, automatic ranking or automatic hiring decisions.

## Human Gates

Formal Human Gate 1 remains `NEEDS CHANGES` and Human Gate 2 remains `PENDING HUMAN APPROVAL` in their respective review records. Human Gate 3 remains `PENDING` and will be reviewed following the combined M3+M4 core system implementation. The M3 implementation was performed in response to the student's explicit authorization; no formal gate approval is inferred.

