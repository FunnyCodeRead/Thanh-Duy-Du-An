# React and Flask REST Architecture

## Scope

This architecture migrates the working M1 and M2 interface from Flask-rendered Jinja pages to a React and Vite frontend. It preserves the Flask session, existing MySQL database, validation rules, role model, and database functions. Applications, interviews, evaluations, and Gemini remain later milestones.

## System Context

```text
Browser
  |
  v
React and Vite frontend
  |
  | HTTP JSON or multipart form data
  v
Flask REST API
  |
  | parameterized SQL
  v
MySQL ai_recruitment

Later milestone only:
Flask AI endpoint -> Gemini API
```

## Components

### React Frontend

React Router owns navigation. `ProtectedRoute` calls `GET /api/auth/me` before rendering protected pages. Layout components show the authenticated user and hide mutation controls from MANAGER. Page components use the shared Fetch API helper and never access database or Gemini credentials.

### Flask REST API

`backend/app.py` initializes Flask, configuration, session support, health and dashboard endpoints, then registers authentication, Job, Candidate, Application, Interview, and Evaluation blueprints. Route modules validate input, enforce roles, call existing database functions, and return consistent JSON.

### Database Layer

`backend/database/db.py` retains explicit mysql-connector operations across exactly 7 tables (`users`, `jobs`, `candidates`, `applications`, `interviews`, `evaluations`, `ai_results`). Each operation opens and closes its own connection and uses parameters for user-controlled values.

### File Storage

Candidate CVs are stored under `backend/uploads` with UUID-prefixed safe filenames. Flask validates extension and request size, extracts PDF or DOCX text when possible, and serves files only to authenticated users.

## Authentication Flow

1. React posts email and password to `/api/auth/login`.
2. Flask verifies the Werkzeug password hash from MySQL.
3. Flask stores public identity and role fields in the signed session cookie.
4. React calls `/api/auth/me` after refresh.
5. Flask returns HTTP 401 when no valid session exists.

## Authorization Boundary

Frontend controls improve usability but are not security controls. Flask permits ADMIN and HR to mutate Jobs, Candidates, Applications, and Interviews. MANAGER has read-only access for Jobs, Candidates, Applications, and Interviews (except marking an assigned interview COMPLETED). For Evaluations, all authenticated roles (`ADMIN`, `HR`, `MANAGER`) may submit evaluations; only the original evaluator or ADMIN may edit an evaluation. Unauthorized API calls return HTTP 403.

## Migration Result

The equivalent React flows passed build, API, session, role, upload, MySQL integration, and manual browser checks. The old templates and static files now live under `legacy/`; they remain only as migration history and are not an active frontend.

## Traceability

| Requirements | React Components | Flask API | Database |
|---|---|---|---|
| FR-001 to FR-003 | LoginPage, ProtectedRoute, Layout | `/api/auth/*` | users |
| FR-004 to FR-005 | JobsPage, JobFormPage, JobDetailPage | `/api/jobs*` | jobs, applications delete check |
| FR-006 to FR-008 | CandidatesPage, CandidateFormPage, CandidateDetailPage | `/api/candidates*`, `/uploads/*` | candidates, applications delete check |
| FR-009 to FR-010 | ApplicationsPage, ApplicationCreatePage, ApplicationDetailPage | `/api/applications*` | applications, candidates, jobs |
| FR-011 | InterviewsPage, InterviewFormPage, InterviewDetailPage | `/api/interviews*` | interviews, applications, users |
| FR-012 | EvaluationFormPage, ApplicationDetailPage, InterviewDetailPage | `/api/evaluations*` | evaluations, applications, users |
| FR-017 | DashboardPage | `/api/dashboard` | aggregate queries |
| FR-018 | Development verification | `/api/health` | connection check |

## Trust Boundaries

Browser input is untrusted. Flask validates it before database or file operations. Uploaded filenames are untrusted and normalized. Environment secrets remain on the backend. Gemini is outside the system boundary and is not connected during this milestone.

