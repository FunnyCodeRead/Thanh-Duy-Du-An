# REST API Reference — M1/M2

All protected requests use the Flask session cookie. JSON errors have the shape `{"success": false, "message": "..."}`. Mutation endpoints return 400 for invalid input, 401 without a session, 403 without the required role and 409 when a referenced record cannot be deleted.

## Public

| Method | Path | Purpose |
|---|---|---|
| GET | `/api/health` | Check Flask and MySQL connectivity |
| POST | `/api/auth/login` | Create a session from JSON email/password |

## Authenticated

| Method | Path | Roles | Purpose |
|---|---|---|---|
| POST | `/api/auth/logout` | All | Clear session |
| GET | `/api/auth/me` | All | Return public current-user fields |
| GET | `/api/dashboard` | All | Return Job, Candidate, Application and Interview counts |
| GET | `/api/jobs` | ADMIN, HR, MANAGER | List; supports `keyword`, `status` |
| GET | `/api/jobs/{id}` | ADMIN, HR, MANAGER | Job detail |
| POST | `/api/jobs` | ADMIN, HR | Create Job from JSON |
| PUT | `/api/jobs/{id}` | ADMIN, HR | Update Job from JSON |
| DELETE | `/api/jobs/{id}` | ADMIN, HR | Delete unreferenced Job |
| GET | `/api/candidates` | ADMIN, HR, MANAGER | List; supports `keyword`, `source` |
| GET | `/api/candidates/{id}` | ADMIN, HR, MANAGER | Candidate detail |
| POST | `/api/candidates` | ADMIN, HR | Create via multipart form data |
| PUT | `/api/candidates/{id}` | ADMIN, HR | Update via multipart form data |
| DELETE | `/api/candidates/{id}` | ADMIN, HR | Delete unreferenced Candidate |
| GET | `/api/applications` | ADMIN, HR, MANAGER | List; supports `keyword`, `status`, `job_id` |
| GET | `/api/applications/{id}` | ADMIN, HR, MANAGER | Detail with Candidate and Job objects |
| POST | `/api/applications` | ADMIN, HR | Create Application (candidate_id, job_id, note) |
| PUT | `/api/applications/{id}/status` | ADMIN, HR | Update status (transition checked) |
| GET | `/uploads/{filename}` | All | Serve an authenticated CV file |

## Job body

JSON fields: `title`, `description`, `department`, `skills`, `quantity`, `status`. Title and description are required; quantity must be a positive integer; status is `OPEN` or `CLOSED`.

## Candidate form

Multipart fields: `full_name`, `email`, `phone`, `skills`, `experience`, `education`, `source`, optional file field `cv`. Full name is required; source is one of `FACEBOOK`, `LINKEDIN`, `WEBSITE`, `REFERRAL`, `JOB_SITE`, `OTHER`; CV accepts PDF, DOC or DOCX up to 10 MB.

## Application body

### Create Application (`POST /api/applications`)
JSON fields:
- `candidate_id` (integer, required): ID of existing candidate.
- `job_id` (integer, required): ID of existing job.
- `note` (string, optional): Initial recruitment note.

Returns HTTP 201 with created application object on success, HTTP 400 for invalid/missing IDs, HTTP 404 if candidate or job not found, HTTP 409 if application already exists.

### Update Status (`PUT /api/applications/{id}/status`)
JSON fields:
- `status` (string, required): One of `NEW`, `SCREENING`, `INTERVIEW`, `PASSED`, `REJECTED`.

Enforces valid workflow transitions:
- `NEW` -> `SCREENING`, `REJECTED`
- `SCREENING` -> `INTERVIEW`, `REJECTED`
- `INTERVIEW` -> `PASSED`, `REJECTED`
- Final states `PASSED` and `REJECTED` cannot be transitioned.

Returns HTTP 200 on success, HTTP 400 for invalid status or illegal transition, HTTP 403 for MANAGER role, HTTP 404 if application not found.

## Interviews API

### List Interviews (`GET /api/interviews`)
Query parameters:
- `keyword` (optional string): Search by candidate name, job title, interviewer name, or location.
- `status` (optional string): Filter by `SCHEDULED`, `COMPLETED`, `CANCELLED`.
- `application_id` (optional integer): Filter interviews belonging to a specific application.

Requires authenticated session (ADMIN, HR, MANAGER). Returns list of interview records.

### Interviewers List (`GET /api/interviews/interviewers`)
Returns all active staff members available for interview assignment (users with ADMIN, HR, or MANAGER role).

### Get Interview Detail (`GET /api/interviews/{id}`)
Returns full interview record including candidate, job, and interviewer information.

### Create Interview (`POST /api/interviews`)
Roles: `ADMIN`, `HR` (MANAGER receives HTTP 403).
JSON fields:
- `application_id` (integer, required): ID of existing application.
- `interviewer_id` (integer, required): ID of staff user.
- `interview_date` (string, required): Interview date and time (ISO or YYYY-MM-DD HH:MM:SS format).
- `location` (string, optional): Meeting room or virtual meeting link.
- `note` (string, optional): Interview focus notes.

Initial status is automatically set to `SCHEDULED`. Returns HTTP 201 on success.

### Update Interview Details (`PUT /api/interviews/{id}`)
Roles: `ADMIN`, `HR`.
Only permissible when interview is in `SCHEDULED` status (HTTP 400 if already `COMPLETED` or `CANCELLED`).
Allows updating `interviewer_id`, `interview_date`, `location`, and `note`.

### Update Interview Status (`PUT /api/interviews/{id}/status`)
JSON fields:
- `status` (string, required): One of `COMPLETED`, `CANCELLED`.

Permissions:
- `ADMIN`, `HR`: Can set `COMPLETED` or `CANCELLED`.
- Assigned interviewer (`session['user_id'] == interviewer_id`): Can set `COMPLETED`.
- Other users receive HTTP 403.

Enforces valid transition from `SCHEDULED` only. Reversing back to `SCHEDULED` returns HTTP 400.

## Evaluations API

### List Application Evaluations (`GET /api/applications/{application_id}/evaluations` or `GET /api/evaluations?application_id={id}`)
Requires authenticated session.
Returns all evaluations submitted for the specified application.
Each evaluation calculates runtime arithmetic average score `average_score = round((technical_score + communication_score + experience_score) / 3.0, 2)`.

### Get Evaluation Detail (`GET /api/evaluations/{id}`)
Returns single evaluation record with evaluator details and runtime average score.

### Create Evaluation (`POST /api/evaluations`)
Roles: All authenticated roles (`ADMIN`, `HR`, `MANAGER`). Evaluator is bound securely to `session['user_id']`.
JSON fields:
- `application_id` (integer, required): ID of existing application.
- `technical_score` (integer, required): Integer from 1 to 5.
- `communication_score` (integer, required): Integer from 1 to 5.
- `experience_score` (integer, required): Integer from 1 to 5.
- `comment` (string, optional): Feedback text.

Scores outside 1-5 return HTTP 400. Returns HTTP 201 on success.
*Note: Submitting an evaluation does NOT automatically alter the application status or trigger hiring decisions.*

### Update Evaluation (`PUT /api/evaluations/{id}`)
Permissions: `ADMIN` or the original evaluator who submitted the review (`evaluator_id == session['user_id']`). Other roles receive HTTP 403.
JSON fields:
- `technical_score` (integer, optional): Integer from 1 to 5.
- `communication_score` (integer, optional): Integer from 1 to 5.
- `experience_score` (integer, optional): Integer from 1 to 5.
- `comment` (string, optional): Updated feedback text.

Returns HTTP 200 on success.

## AI Assistant API (Google Gemini)

### Generate CV Summary (`POST /api/ai/cv-summary`)
Roles: `ADMIN`, `HR`, `MANAGER`. Requires active session.
JSON fields:
- `application_id` (integer, required): ID of existing application.

Validates that application, candidate, and non-empty `cv_text` exist. Sends sanitized job description and CV text to Gemini.
Stores generated summary in `ai_results` with `type = 'CV_SUMMARY'`.
Returns HTTP 200 on success:
```json
{
  "success": true,
  "data": {
    "type": "CV_SUMMARY",
    "content": "..."
  }
}
```
Errors:
- HTTP 400: Missing or invalid `application_id`, or candidate CV text is empty.
- HTTP 401: Unauthenticated request.
- HTTP 404: Application not found.
- HTTP 500: Gemini service or network failure (graceful error message, secrets not exposed).

### Generate Interview Questions (`POST /api/ai/interview-questions`)
Roles: `ADMIN`, `HR`, `MANAGER`. Requires active session.
JSON fields:
- `application_id` (integer, required): ID of existing application.

Requests Gemini to generate 5 targeted interview questions (2 skill, 2 experience, 1 CV clarification).
Stores questions in `ai_results` with `type = 'INTERVIEW_QUESTION'`.
Returns HTTP 200 on success:
```json
{
  "success": true,
  "data": {
    "type": "INTERVIEW_QUESTION",
    "content": "..."
  }
}
```

### Generate Email Draft (`POST /api/ai/email`)
Roles: `ADMIN`, `HR` only. (MANAGER receives HTTP 403 Forbidden).
JSON fields:
- `application_id` (integer, required): ID of existing application.
- `email_type` (string, required): Either `INTERVIEW_INVITATION` or `RESULT`.

Validation:
- For `RESULT`, the application status must be in a final state (`PASSED` or `REJECTED`). Non-final status returns HTTP 400.
Generates an email draft in Vietnamese. Does NOT send actual emails.
Stores draft in `ai_results` with `type = 'EMAIL'`.
Returns HTTP 200 on success:
```json
{
  "success": true,
  "data": {
    "type": "EMAIL",
    "content": "Tiêu đề: ...\n\nNội dung: ..."
  }
}
```

### List AI Results for Application (`GET /api/applications/{application_id}/ai-results`)
Roles: `ADMIN`, `HR`, `MANAGER`. Requires active session.
Returns all historical AI results for the specified application ordered by `created_at DESC`.
Returns HTTP 200 on success with array of records:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "application_id": 5,
      "type": "CV_SUMMARY",
      "content": "...",
      "created_at": "2026-09-26T12:00:00"
    }
  ]
}
```

## Dashboard API — M6

### Recruitment Dashboard Statistics (`GET /api/dashboard`)
Roles: `ADMIN`, `HR`, `MANAGER`. Requires active session.
Returns comprehensive recruitment metrics aggregated directly from the 7-table MySQL database.

Response JSON fields:
- `summary`:
  - `open_jobs` (int): Number of jobs with `status = 'OPEN'`.
  - `total_jobs` (int): Total number of job postings.
  - `total_candidates` (int): Total number of candidate profiles.
  - `total_applications` (int): Total number of applications submitted.
  - `upcoming_interviews` (int): Count of scheduled interviews where `interview_date >= CURRENT_TIMESTAMP`.
- `application_status` (object): Counts for each application status: `NEW`, `SCREENING`, `INTERVIEW`, `PASSED`, `REJECTED`.
- `candidate_sources` (array): Array of `{"source": string, "count": int}` sorted by `count DESC`.
- `pass_rate` (object):
  - `passed` (int): Number of applications with status `PASSED`.
  - `rejected` (int): Number of applications with status `REJECTED`.
  - `finalized` (int): Total finalized applications (`passed + rejected`).
  - `rate` (float): `passed / finalized * 100%` (or `0.0` when `finalized == 0`).
- `hiring_time` (object):
  - `available` (bool): `false` due to schema lacking final status timestamp.
  - `average_days` (null): `null`.
  - `message` (string): User-friendly limitation explanation.
- `upcoming_interviews` (array): Top 5 nearest upcoming interviews with candidate, job, date, interviewer, and location.
- Legacy backward-compatibility fields: `jobs`, `candidates`, `applications`, `interviews`.

## Recruitment Knowledge Chatbot API — M8

### Chat Inquiry (`POST /api/chat`)
Roles: `ADMIN`, `HR`, `MANAGER`. Requires active session.
Processes a recruitment question via Hybrid RAG (Structured SQL or Vector Search + Gemini 2.5 Flash).

Request JSON:
- `message` (string, required): Question text, max 1000 characters.

Response JSON:
```json
{
  "success": true,
  "reply": "Hiện có 2 ứng viên đang ở trạng thái Phỏng vấn...",
  "retrieval_type": "STRUCTURED",
  "sources": [
    {
      "entity_type": "candidate",
      "entity_id": 5,
      "title": "Nguyễn Văn A",
      "url": "/candidates/5"
    }
  ]
}
```

Error responses:
- `400 Bad Request`: When message is empty or exceeds 1,000 characters.
- `401 Unauthorized`: When no valid session is present.

### Rebuild Vector Index (`POST /api/chat/reindex`)
Roles: `ADMIN` only. `HR` and `MANAGER` receive HTTP 403.
Forces rebuilding of the local FAISS index from the 7 MySQL tables.

Response JSON:
```json
{
  "success": true,
  "message": "Rebuilt vector index successfully with 39 documents",
  "document_count": 39,
  "last_updated": "2026-09-26T21:55:00.000000"
}
```

### Vector Index Info (`GET /api/chat/index-info`)
Roles: `ADMIN`, `HR`, `MANAGER`. Requires active session.
Returns metadata regarding the local FAISS index status.

Response JSON:
```json
{
  "success": true,
  "data": {
    "document_count": 39,
    "last_updated": "2026-09-26T21:55:00.000000",
    "embedding_model": "all-MiniLM-L6-v2",
    "dimension": 384,
    "status": "ready"
  }
}
```




