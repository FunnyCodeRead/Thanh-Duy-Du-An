# M3 AI Task

Task:
Implement Application Management + Candidate Status workflow slice.

Inputs:
- docs/requirements.md (FR-009, FR-010, BR-002, BR-005, BR-006)
- docs/user-stories.md (US-007)
- docs/acceptance-criteria.md (AC-005)
- docs/architecture.md
- docs/database-design.md (fixed 7-table schema, uq_applications_candidate_job)
- .agents/skills/implementation/SKILL.md
- .agents/skills/testing/SKILL.md

Expected Result:
- Application REST API implemented (/api/applications)
- Application list with search and filters (keyword, status, job_id)
- Application create with candidate and job selection, duplicate prevention (HTTP 409)
- Application detail with candidate information, job details, and status history
- Status transition enforcement (NEW -> SCREENING/REJECTED, SCREENING -> INTERVIEW/REJECTED, INTERVIEW -> PASSED/REJECTED, final states PASSED/REJECTED)
- Strict role boundaries (ADMIN, HR full access; MANAGER read-only, 403 on mutations)
- Sidebar link enabled
- Database remains strictly at 7 tables
- Automated tests covering all cases, 0 lint/build warnings

AI Changes:
- backend/database/db.py: added get_applications, get_application_by_id, application_exists, create_application, update_application_status.
- backend/routes/application_routes.py: created blueprint with list, get, create, status endpoints with role and transition validation.
- backend/app.py: registered application_bp.
- backend/tests/test_applications.py: created 23 new test assertions across TC-APP-01 through TC-APP-14 and edge cases.
- frontend/src/services/api.js: exported applicationApi (list, get, create, updateStatus).
- frontend/src/pages/ApplicationsPage.jsx: created list page with search, job/status filters, and Bootstrap badges.
- frontend/src/pages/ApplicationCreatePage.jsx: created application form with duplicate handling (409).
- frontend/src/pages/ApplicationDetailPage.jsx: created 3-section detail page with candidate info, job info, and status transitions.
- frontend/src/App.jsx: registered /applications, /applications/create, /applications/:id routes.
- frontend/src/components/Sidebar.jsx: activated "Hồ sơ ứng tuyển" navigation link.
- frontend/src/pages/DashboardPage.jsx: linked Applications summary card to /applications.
- frontend/src/pages/CandidateDetailPage.jsx: linked candidate view to related applications.

Tests:
- 70 backend tests PASS (47 existing + 23 new application tests).
- Real MySQL integration suite passed (creation, fetching, duplicate 409, valid transitions, invalid transition 400 rejection, MANAGER 403 checks, and cleanup).
- Frontend oxlint: 0 errors, 0 warnings.
- Frontend vite build: PASS (42 modules, production build created).

Issues Detected:
- None unresolved. Duplicate submissions return HTTP 409 and user-friendly Vietnamese notifications. Final states PASSED/REJECTED properly disable further transitions in both UI and API.

Human Decision:
PENDING
