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
| GET | `/uploads/{filename}` | All | Serve an authenticated CV file |

## Job body

JSON fields: `title`, `description`, `department`, `skills`, `quantity`, `status`. Title and description are required; quantity must be a positive integer; status is `OPEN` or `CLOSED`.

## Candidate form

Multipart fields: `full_name`, `email`, `phone`, `skills`, `experience`, `education`, `source`, optional file field `cv`. Full name is required; source is one of `FACEBOOK`, `LINKEDIN`, `WEBSITE`, `REFERRAL`, `JOB_SITE`, `OTHER`; CV accepts PDF, DOC or DOCX up to 10 MB.
