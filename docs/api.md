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

