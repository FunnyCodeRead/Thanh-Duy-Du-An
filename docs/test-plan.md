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
- Dashboard Statistics (M6):
  - TC-DASH-01: Authenticated HR gets Dashboard (HTTP 200)
  - TC-DASH-02: MANAGER gets Dashboard (HTTP 200)
  - TC-DASH-03: Unauthenticated dashboard access returns 401
  - TC-DASH-04: Summary counts (open_jobs, total_jobs, total_candidates, total_applications, upcoming_interviews)
  - TC-DASH-05: Application status breakdown contains all 5 keys (NEW, SCREENING, INTERVIEW, PASSED, REJECTED)
  - TC-DASH-06: Candidate source grouping contains valid sources and counts
  - TC-DASH-07: Pass rate formula accuracy `PASSED / (PASSED + REJECTED) * 100%`
  - TC-DASH-08: Safe handling of zero finalized applications without division by zero
  - TC-DASH-09: Upcoming interviews list formatted properly (top 5 nearest)
  - TC-DASH-10: Hiring-time data limitation handling (available=False, message present, average_days=None)
  - TC-DASH-11: Database failure returns 500
- Search & Filter Audit (M6):
  - TC-SRCH-01: Job combined filter (keyword + status)
  - TC-SRCH-02: Job search special characters
  - TC-SRCH-03: Candidate combined filter (keyword + source)
  - TC-SRCH-04: Candidate search special characters / SQL injection safety
  - TC-SRCH-05: Application combined filter (keyword + status + job_id)
  - TC-SRCH-06: Application search no results returns empty array
  - TC-SRCH-07: Interview combined filter (keyword + status)
  - TC-SRCH-08: Empty keyword handling across all endpoints
- Flask health and dashboard behavior.
- Frontend static analysis and production compilation.

- Recruitment Knowledge Chatbot (M8):
  - TC-CHAT-01: Authenticated user chat query returns 200
  - TC-CHAT-02: Unauthenticated chat query returns 401
  - TC-CHAT-03: Empty message rejected with 400
  - TC-CHAT-04: Excessively long message (> 1000 chars) rejected with 400
  - TC-CHAT-05: Non-JSON body rejected with 400
  - TC-CHAT-06: Out-of-scope question (weather) rejected safely
  - TC-CHAT-07: Out-of-scope question (cooking recipe) rejected safely
  - TC-CHAT-08: General programming help rejected safely
  - TC-CHAT-09: Decision guard blocks candidate ranking / hiring recommendations
  - TC-CHAT-10: Decision guard blocks "who should be hired" queries
  - TC-CHAT-11: Structured query: count candidates returns accurate count
  - TC-CHAT-12: Structured query: count applications by status
  - TC-CHAT-13: Structured query: list candidates by status
  - TC-CHAT-14: Structured query: candidate lookup by name with sources
  - TC-CHAT-15: Structured query: upcoming interviews query
  - TC-CHAT-16: Semantic search retrieves matching candidate skills via FAISS + Gemini
  - TC-CHAT-17: Hybrid query combines structured filters and semantic retrieval
  - TC-CHAT-18: No matching documents returns polite clarification without error
  - TC-CHAT-19: Secret extraction attempts rejected safely
  - TC-CHAT-20: Admin can rebuild FAISS vector index (HTTP 200)
  - TC-CHAT-21: HR / Manager cannot rebuild index (HTTP 403)
  - TC-CHAT-22: Authenticated user can query vector index metadata (HTTP 200)

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
- Local FAISS index building and querying with SentenceTransformers.

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
- Sidebar contains active links for Dashboard, Vị trí tuyển dụng, Ứng viên, Hồ sơ ứng tuyển, Phỏng vấn, and Trợ lý AI.
- AI Chatbot page (`/ai-chat`) allows conversational query answering grounded in recruitment data with clickable source links.
- MANAGER role hides unauthorized mutation controls and cannot trigger re-indexing.
- Browser console has no errors.

## Exit Criteria

All pytest tests pass (158 tests), oxlint exits zero without warnings, Vite production build succeeds, live MySQL integration suite succeeds, minimal bias check documented, and manual verification confirms the flow.




