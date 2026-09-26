# Acceptance Criteria

## AC-001 Session Authentication

Given a seeded user with a valid password, when the user posts credentials to the login API, then the backend creates a session and returns only public user fields. Given no valid session, when the frontend calls the current-user API, then the backend returns HTTP 401.

Traceability: FR-001, FR-002, FR-003, US-001.

## AC-002 Job Management

Given an ADMIN or HR session, when valid Job data is submitted, then MySQL stores it and the API returns HTTP 201. Search and status parameters return only matching records. Invalid title, description, quantity, or status returns HTTP 400. A MANAGER mutation returns HTTP 403. A Job with an Application returns HTTP 409 on deletion.

Traceability: FR-004, FR-005, US-002, US-003.

## AC-003 Candidate Management

Given an ADMIN or HR session, when valid Candidate data is submitted, then MySQL stores it. Search and source parameters return matching records. Invalid email or source returns HTTP 400. A MANAGER mutation returns HTTP 403. A Candidate with an Application returns HTTP 409 on deletion.

Traceability: FR-006, FR-007, US-004, US-006.

## AC-004 CV Upload

Given a PDF, DOC, or DOCX file within the configured limit, when HR uploads it, then the backend uses a safe randomized filename and stores the filename. PDF and DOCX extraction is attempted and stored in `cv_text`; DOC extraction is not required. Executable or oversized files are rejected.

Traceability: FR-008, US-005, NFR-008.

## AC-005 Application Workflow

Given an existing Candidate and Job, when HR creates an Application, then MySQL stores one unique pair. A duplicate pair returns HTTP 409. Only NEW, SCREENING, INTERVIEW, PASSED, or REJECTED is accepted, and status changes require an authorized human action.

Traceability: FR-009, FR-010, US-007.

## AC-006 Interview and Evaluation

Given an Application, when an authorized user creates or updates an Interview, then only SCHEDULED, COMPLETED, or CANCELLED is accepted. Evaluation scores outside 1 through 5 are rejected, and the average is calculated from the three stored scores.

Traceability: FR-011, FR-012, US-008, US-009.

## AC-007 AI Assistance

Given a valid Application with required data and a configured Gemini key, when an authorized user requests an AI function, then Flask builds the request, calls Gemini, stores the result, and returns it. The result is labelled advisory and does not update application status, rank candidates, or send email.

Traceability: FR-013 to FR-016, US-010, US-011, NFR-009.

## AC-008 Dashboard and Health

Given a connected database, when an authenticated user opens the dashboard, then the four requested counts are shown. When `/api/health` is called, it returns HTTP 200 with database `connected`; connection failure returns HTTP 500 without credentials.

Traceability: FR-017, FR-018, US-012, US-013.

