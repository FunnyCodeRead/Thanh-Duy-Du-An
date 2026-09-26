# Test Plan — M1–M4

## Objectives

Verify that the system preserves authentication, role enforcement, Job and Candidate workflows, Application Management, and implements the M4 Interview Management and Candidate Evaluation workflows on the fixed seven-table MySQL design without implementing M5 (Gemini AI features).

## Automated Scope

- Authentication success/failure, session restore, logout and protected routes.
- ADMIN/HR/MANAGER read and mutation permissions.
- Job CRUD validation, search/filter forwarding and referenced-delete conflict.
- Candidate CRUD validation, search/filter forwarding, CV extension handling, edit preservation, file authorization and legacy path compatibility.
- Application management (TC-APP-01 through TC-APP-14 and edge cases).
- Interview management:
  - TC-INT-01: HR list interviews (HTTP 200)
  - TC-INT-02: MANAGER list interviews (HTTP 200)
  - TC-INT-03: Unauthenticated interviews list (HTTP 401)
  - TC-INT-04: HR create valid interview with default status SCHEDULED (HTTP 201)
  - TC-INT-05: Invalid/missing application_id rejection (HTTP 400/404)
  - TC-INT-06: Invalid/missing interviewer_id rejection (HTTP 400/404)
  - TC-INT-07: HR update SCHEDULED interview details (HTTP 200)
  - TC-INT-08: Transition SCHEDULED -> COMPLETED (HTTP 200)
  - TC-INT-09: Transition SCHEDULED -> CANCELLED (HTTP 200)
  - TC-INT-10: Illegal transition COMPLETED -> SCHEDULED rejection (HTTP 400)
  - TC-INT-11: MANAGER create interview forbidden (HTTP 403)
  - TC-INT-12: Interview search and filter parameter forwarding
  - Edge cases: Cannot edit COMPLETED interview (HTTP 400), missing ID (HTTP 404), interviewers list endpoint (HTTP 200).
- Candidate evaluations:
  - TC-EVAL-01: List application evaluations (HTTP 200)
  - TC-EVAL-02: Create valid evaluation with 1-5 scores (HTTP 201)
  - TC-EVAL-03: Technical score out of bounds (< 1) rejected (HTTP 400)
  - TC-EVAL-04: Communication score out of bounds (> 5) rejected (HTTP 400)
  - TC-EVAL-05: Missing/invalid application_id returns 404
  - TC-EVAL-06: Arithmetic average calculation verification `(t+c+e)/3` rounded to 2 decimal places
  - TC-EVAL-07: Unauthenticated evaluation mutation returns 401
  - TC-EVAL-08: Evaluator updates own evaluation (HTTP 200)
  - TC-EVAL-09: Unauthorized user forbidden from editing other's evaluation (HTTP 403)
  - TC-EVAL-10: Detailed evaluation comment persistence verified
- Flask health and dashboard behavior.
- Frontend static analysis and production compilation.

## Integration Scope

- Real MySQL login and session persistence.
- Real Job and Candidate create/read/update/delete with cleanup.
- Real Application create, duplicate rejection, and status transitions against live MySQL.
- Real Interview creation, SCHEDULED status, transition to COMPLETED/CANCELLED against live MySQL.
- Real Evaluation submission, 1-5 score constraints, runtime average calculation against live MySQL.
- Search and filter against inserted records.
- DOCX upload, text extraction and authenticated retrieval.
- Deletion protection for records linked to Applications.
- Strict preservation of the 7 database tables.
- MANAGER read-only behavior across Jobs, Candidates, Applications, and Interviews.
- Vite proxy for `/api` and session cookies.

## Manual Browser Scope

- Login redirects to Dashboard.
- Dashboard renders live counts and clickable cards.
- Applications page lists applications with status badges and filter controls.
- Create Application form links candidates and jobs with duplicate alert handling.
- Detail page displays Candidate info, Job info, Application info, Interviews list, and Evaluations list with role-aware controls.
- Interviews page lists interviews with status filters and "+ Lên lịch phỏng vấn" button.
- Interview form schedules new interview with interviewer dropdown and datetime selection.
- Interview detail page displays candidate/job info, status buttons (Complete/Cancel), and linked evaluations.
- Evaluation form validates 1-5 scores, calculates live runtime average score, and accepts detailed comments.
- Sidebar contains active links for Dashboard, Vị trí tuyển dụng, Ứng viên, Hồ sơ ứng tuyển, and Phỏng vấn.
- MANAGER role hides unauthorized mutation controls.
- Browser console has no errors.

## Exit Criteria

All pytest tests pass (101 tests), oxlint exits zero without warnings, Vite production build succeeds, live MySQL integration suite succeeds, and manual verification confirms the flow.


