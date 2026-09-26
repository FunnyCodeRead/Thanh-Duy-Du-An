# M4 AI Task

Task:
Implement Interview Management + Candidate Evaluation workflow slice.

Inputs:
- docs/requirements.md (FR-011, FR-012, BR-003, BR-004)
- docs/user-stories.md (US-008, US-009)
- docs/acceptance-criteria.md (AC-006, AC-007)
- docs/architecture.md
- docs/database-design.md (fixed 7-table schema, interviews, evaluations)
- .agents/skills/implementation/SKILL.md
- .agents/skills/testing/SKILL.md

Expected Result:
- Interview REST API implemented (/api/interviews, /api/interviews/interviewers, /api/interviews/<id>, /api/interviews/<id>/status)
- Interview list with search and filters (keyword, status, application_id)
- Interview schedule form with application select, interviewer select, datetime, location, note
- Interview detail with candidate, job, interviewer, and status transition buttons (COMPLETED, CANCELLED)
- Illegal transition guard: cannot revert COMPLETED or CANCELLED back to SCHEDULED (HTTP 400)
- Evaluation REST API implemented (/api/evaluations, /api/applications/<id>/evaluations, /api/evaluations/<id>)
- Evaluation create/edit form with 3 score dimensions (1-5), runtime arithmetic average calculation (technical + communication + experience) / 3 rounded to 2 decimals, feedback comment
- Role boundaries: ADMIN/HR create/edit/cancel/complete interviews; MANAGER read-only (unless assigned interviewer completing it). All authenticated roles submit evaluations. Evaluator or ADMIN can edit evaluation.
- Application detail page displays linked interviews and evaluations.
- Sidebar "Phỏng vấn" navigation link activated.
- Database remains strictly at 7 tables (no 8th table created).
- Automated tests covering all cases, 0 lint warnings, clean build.

AI Changes:
- backend/database/db.py: added get_user_by_id, get_interviewers, get_interviews, get_interview_by_id, get_interviews_by_application, create_interview, update_interview, update_interview_status, get_evaluations, get_evaluation_by_id, get_application_evaluations, create_evaluation, update_evaluation.
- backend/routes/interview_routes.py: created blueprint with list, detail, create, edit, status transition, and interviewers list endpoints.
- backend/routes/evaluation_routes.py: created blueprint with list by application, detail, create, edit, 1-5 score validation, and runtime average calculation.
- backend/app.py: registered interview_bp and evaluation_bp.
- backend/tests/test_interviews.py: 19 test assertions covering TC-INT-01 through TC-INT-12 and edge cases.
- backend/tests/test_evaluations.py: 12 test assertions covering TC-EVAL-01 through TC-EVAL-10 and score boundaries.
- frontend/src/services/api.js: exported interviewApi and evaluationApi.
- frontend/src/pages/InterviewsPage.jsx: created list page with search, status filter, and "+ Lên lịch phỏng vấn" button.
- frontend/src/pages/InterviewFormPage.jsx: created schedule and edit interview form.
- frontend/src/pages/InterviewDetailPage.jsx: created detail page with status transition buttons (COMPLETED, CANCELLED) and linked evaluations list.
- frontend/src/pages/EvaluationFormPage.jsx: created evaluation form with 1-5 selects, live average calculation, and comments.
- frontend/src/pages/ApplicationDetailPage.jsx: replaced placeholder with live interviews and evaluations lists with action links.
- frontend/src/components/Sidebar.jsx: activated "Phỏng vấn" navigation link.
- frontend/src/App.jsx: registered /interviews, /interviews/create, /interviews/:id, /interviews/:id/edit, /applications/:id/evaluations/create, /evaluations/:id/edit routes.

Tests:
- 101 backend tests PASS (70 existing + 31 new interview and evaluation tests).
- Real MySQL integration suite passed: interview scheduling, completion, evaluation submission, score average check (4.33), cleanup, and 7 tables verified.
- Frontend oxlint: 0 errors, 0 warnings across 24 files.
- Frontend vite build: PASS (46 modules transformed).

Issues Detected & Resolved:
- COMPLETED -> SCHEDULED illegal transition returns HTTP 400.
- Out of range scores (<1 or >5) return HTTP 400.
- Synchronous effect set-state warnings resolved using promise chains.

Human Decision:
PENDING (Human Gate 3 status: PENDING HUMAN APPROVAL).
