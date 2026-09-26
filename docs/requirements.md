# Recruitment System Requirements

## Stakeholders and Actors

The student owns implementation and human verification. The lecturer evaluates the system and AI-Augmented SDLC evidence. System actors are ADMIN, HR, and MANAGER. Gemini is an external supporting service, not a decision-making actor.

## Functional Requirements

- **FR-001 Authentication:** The system shall allow an existing user to log in and log out using a Flask session.
- **FR-002 Current user:** The backend shall return the authenticated user's ID, name, email, and role without returning password data.
- **FR-003 Authorization:** The backend shall enforce ADMIN, HR, and MANAGER access rules using `users.role`.
- **FR-004 Job management:** ADMIN and HR shall create, view, update, and delete recruitment positions. MANAGER shall have read-only access.
- **FR-005 Job discovery:** Users with Job access shall search by title, department, or skills and filter by OPEN or CLOSED status.
- **FR-006 Candidate management:** ADMIN and HR shall create, view, update, and delete candidates. MANAGER shall have read-only access.
- **FR-007 Candidate discovery:** Users with Candidate access shall search by name, email, phone, or skills and filter by source.
- **FR-008 CV management:** ADMIN and HR shall upload PDF, DOC, or DOCX CV files. The backend shall store a safe randomized filename and extract text from PDF and DOCX when possible.
- **FR-009 Application management:** ADMIN and HR shall create and view applications that connect one candidate to one job.
- **FR-010 Application status:** Authorized users shall update an application to NEW, SCREENING, INTERVIEW, PASSED, or REJECTED.
- **FR-011 Interview management:** Authorized users shall view, create, update, complete, or cancel interviews.
- **FR-012 Evaluation:** Authorized users shall record technical, communication, and experience scores from 1 to 5 with a comment. Average score shall be calculated at runtime.
- **FR-013 AI CV summary:** Authorized users shall request a CV summary based on stored candidate CV text and job information.
- **FR-014 AI interview questions:** Authorized users shall request approximately five interview questions based on the application context.
- **FR-015 AI email draft:** Authorized users shall request an interview or result email draft. The system shall display the draft but shall not send email.
- **FR-016 AI result history:** The backend shall store generated AI outputs in `ai_results` for the related application.
- **FR-017 Dashboard:** The system shall show Open Jobs, Candidates, Applications, and Upcoming Interviews counts.
- **FR-018 Health check:** The backend shall expose an API health check that reports MySQL connectivity.

## Non Functional Requirements

- **NFR-001 Simplicity:** The implementation shall remain understandable and demonstrable by a student without enterprise patterns.
- **NFR-002 Frontend stack:** The browser interface shall use React, Vite, JavaScript, React Router, Bootstrap, and Fetch API.
- **NFR-003 Backend stack:** The backend shall use Python 3.11 or later, Flask, mysql-connector-python, python-dotenv, Werkzeug, and pytest.
- **NFR-004 Data store:** MySQL shall remain the only application database and shall retain exactly seven approved tables.
- **NFR-005 SQL security:** All user-controlled SQL values shall use parameterized queries.
- **NFR-006 Secret handling:** Database and Gemini credentials shall remain in environment configuration and shall not be exposed to React or committed.
- **NFR-007 Password security:** Passwords shall be stored as Werkzeug hashes and shall never be returned by an API.
- **NFR-008 Upload safety:** CV upload shall allow only PDF, DOC, and DOCX files, use safe randomized names, and enforce a 5 to 10 MB limit.
- **NFR-009 AI safety:** AI output shall be advisory and shall not automatically rank, reject, pass, or hire a candidate.
- **NFR-010 Testability:** Backend behavior shall be covered by pytest, with focused real-MySQL and manual frontend verification.

## Business Rules

- **BR-001:** User roles are limited to ADMIN, HR, and MANAGER.
- **BR-002:** One candidate may have only one application for the same job.
- **BR-003:** A Job or Candidate with an Application cannot be deleted through M2 CRUD.
- **BR-004:** Evaluation scores are integers from 1 through 5.
- **BR-005:** Application status changes are made by an authorized human user.
- **BR-006:** Gemini cannot update application status or make the final recruitment decision.
- **BR-007:** React communicates with Gemini only through Flask endpoints.

## Constraints

Do not add database tables, JWT, RBAC frameworks, Redux, TypeScript, Next.js, microservices, Redis, Celery, RAG, automatic ranking, automatic rejection, or external email/calendar delivery.

## Traceability Summary

| Capability | Requirement IDs | Planned Milestone |
|---|---|---|
| Session authentication | FR-001 to FR-003 | M1 migration |
| Job and Candidate CRUD | FR-004 to FR-008 | M2 |
| Applications | FR-009 to FR-010 | M3 |
| Interviews and evaluations | FR-011 to FR-012 | M4 |
| Gemini assistance | FR-013 to FR-016 | M5 |
| Dashboard and consolidated testing | FR-017 to FR-018 | M6 |

