# M3 – APPLICATION WORKFLOW

## API
- `GET /api/applications`
- `GET /api/applications/<id>`
- `POST /api/applications`
- `PUT /api/applications/<id>/status`

## Create Application
Input: `candidate_id, job_id, note`

Initial status: `NEW`

Duplicate `candidate_id + job_id` → HTTP 409.

## Allowed transitions
- NEW → SCREENING
- NEW → REJECTED
- SCREENING → INTERVIEW
- SCREENING → REJECTED
- INTERVIEW → PASSED
- INTERVIEW → REJECTED

PASSED và REJECTED là final. Không backward transition.

## Roles
ADMIN/HR: create + update status.  
MANAGER: read-only.

## React
- ApplicationsPage
- ApplicationCreatePage
- ApplicationDetailPage

Display status progress clearly.

Do not let interview/evaluation/AI automatically change Application status.

## Tests
- duplicate
- valid transitions
- invalid transitions
- role permissions
