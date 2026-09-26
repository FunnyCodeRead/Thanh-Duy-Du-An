# M6 AI Task

## Task
Dashboard + Search / Filter Audit + Final Functional Testing

## Input
- Approved requirements (`docs/requirements.md`, `docs/user-stories.md`, `docs/acceptance-criteria.md`, `docs/requirements-issues.md`)
- Architecture (`docs/architecture.md`)
- Database Design (`docs/database-design.md`, `sql/schema.sql`)
- M5 Verified Project State (`docs/project-state.md`, `docs/test-report.md`)

## Implemented
1. **Real MySQL Dashboard Statistics (`backend/database/db.py`)**:
   - Aggregate queries for `summary` (`open_jobs`, `total_jobs`, `total_candidates`, `total_applications`, `upcoming_interviews`).
   - Strict application status breakdown across all 5 states (`NEW`, `SCREENING`, `INTERVIEW`, `PASSED`, `REJECTED`).
   - Grouping of candidate sources (`FACEBOOK`, `LINKEDIN`, `WEBSITE`, `REFERRAL`, `JOB_SITE`, `OTHER`).
   - Accurate pass rate formula: `PASSED / (PASSED + REJECTED) * 100%`, with safe handling for zero finalized applications.
   - Nearest 5 upcoming scheduled interviews (`interview_date >= NOW()`).
2. **Dashboard Frontend (`frontend/src/pages/DashboardPage.jsx`)**:
   - Summary cards with quick links to respective modules.
   - Status distribution list with count, percentage, and badges.
   - Candidate source statistics with clean Bootstrap progress indicators.
   - Pass rate card showing detailed counts and exact formula.
   - Hiring time card explicitly communicating the data limitation.
   - Upcoming interviews table with clean empty state.
3. **Search & Filter Audit**:
   - Verified parameterized SQL queries across Jobs, Candidates, Applications, and Interviews.
   - Verified combined filter capabilities, special character handling, and empty search inputs.

## Tests
- Automated Suite: 136 passed in 3.72s (117 existing + 11 new dashboard tests + 8 new search audit tests).
- Frontend Static Analysis (`oxlint`): 0 errors, 0 warnings across 24 files.
- Frontend Production Build (`vite build`): 46 modules transformed, completed successfully.
- Manual / HTTP Integration: Verified real MySQL responses for `/api/dashboard`, `/api/jobs`, `/api/candidates`, `/api/applications`, and `/api/interviews`.

## Data Limitations
- **Time-to-Hire (Hiring Time)**: The database schema only records `applied_at` in the `applications` table and does not store a transition timestamp for final states (`PASSED` or `REJECTED`). In accordance with the AI-Augmented SDLC principle of never inventing synthetic data, the system explicitly reports:
  `{"available": false, "average_days": null, "message": "Chưa đủ dữ liệu thời điểm kết thúc hồ sơ để tính chính xác."}`.

## AI-Detected Defects & Corrections
1. **Interview Search Mock Signature**: `mock_get_interviews` in search tests initially did not accept optional keyword parameters `application_id` and `interviewer_id`; updated mock to accept `**kwargs`.
2. **Missing Status Key Handling**: Ensured all 5 application status keys default to 0 when status count is empty in the database to prevent frontend `undefined` errors.
3. **Division by Zero Protection**: Ensured pass rate formula defaults safely to `0.0` when total finalized applications (`PASSED + REJECTED`) equals 0.

## Human Corrections
Pending student review.

## Human Decision
PENDING (Human Gate 4 deferred to M7 final review).
