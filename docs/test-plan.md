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
- AI Assistant (Google Gemini):
  - TC-AI-01: Authenticated HR generate CV Summary (HTTP 200)
  - TC-AI-02: Missing/invalid application returns HTTP 404
  - TC-AI-03: Candidate CV text empty returns HTTP 400
  - TC-AI-04: Gemini API error handled gracefully with user-friendly error (HTTP 500, no Flask crash)
  - TC-AI-05: CV Summary saved into `ai_results` table
  - TC-AI-06: Generate Interview Questions (HTTP 200)
  - TC-AI-07: Interview Questions saved into `ai_results` table
  - TC-AI-08: Email invitation generation (HTTP 200)
  - TC-AI-09: Result email with valid final status (PASSED/REJECTED) (HTTP 200)
  - TC-AI-10: Result email with non-final status returns HTTP 400
  - TC-AI-11: MANAGER cannot generate email (HTTP 403)
  - TC-AI-12: Authenticated user list AI results (HTTP 200)
  - TC-AI-13: Unauthenticated AI requests return HTTP 401
  - TC-AI-14: Missing Gemini API key handled gracefully without secret exposure
  - TC-AI-15: AI generation NEVER modifies Application status (status preservation guarantee)
  - TC-AI-16: CV Summary prompt safety rule check (CV content is reference data, not instructions)
- Flask health and dashboard behavior.
- Frontend static analysis and production compilation.

## Integration Scope

- Real MySQL login and session persistence.
- Real Job and Candidate create/read/update/delete with cleanup.
- Real Application create, duplicate rejection, and status transitions against live MySQL.
- Real Interview creation, SCHEDULED status, transition to COMPLETED/CANCELLED against live MySQL.
- Real Evaluation submission, 1-5 score constraints, runtime average calculation against live MySQL.
- Real AI Result persistence and retrieval from `ai_results` table.
- Search and filter against inserted records.
- DOCX upload, text extraction and authenticated retrieval.
- Deletion protection for records linked to Applications.
- Strict preservation of the 7 database tables.
- MANAGER read-only behavior across Jobs, Candidates, Applications, Interviews, and Email generation.
- Minimal AI bias check across identical CV qualifications (`docs/ai-bias-check.md`).
- Vite proxy for `/api` and session cookies.

## Manual Browser Scope

- Login redirects to Dashboard.
- Dashboard renders live counts and clickable cards.
- Applications page lists applications with status badges and filter controls.
- Create Application form links candidates and jobs with duplicate alert handling.
- Detail page displays Candidate info, Job info, Application info, Interviews list, Evaluations list, and Trợ lý AI section.
- AI CV Summary generates clear 4-section summary with live copy action.
- AI Interview Questions suggests 5 questions bám sát hồ sơ.
- AI Email Draft generates invitation or outcome templates in Vietnamese.
- AI History displays recent results with fast viewer.
- Interviews page lists interviews with status filters and "+ Lên lịch phỏng vấn" button.
- Interview form schedules new interview with interviewer dropdown and datetime selection.
- Interview detail page displays candidate/job info, status buttons (Complete/Cancel), and linked evaluations.
- Evaluation form validates 1-5 scores, calculates live runtime average score, and accepts detailed comments.
- Sidebar contains active links for Dashboard, Vị trí tuyển dụng, Ứng viên, Hồ sơ ứng tuyển, and Phỏng vấn.
- MANAGER role hides unauthorized mutation controls.
- Browser console has no errors.

## Exit Criteria

All pytest tests pass (117 tests), oxlint exits zero without warnings, Vite production build succeeds, live MySQL integration suite succeeds, minimal bias check documented, and manual verification confirms the flow.



