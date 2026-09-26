# Test Plan — M1/M2/M3

## Objectives

Verify that the system preserves authentication, role enforcement, Job and Candidate workflows, and implements the M3 Application Management workflow (creation, listing, search/filter, detail, status progression, duplicate prevention) on the fixed seven-table MySQL design without implementing M4/M5.

## Automated Scope

- Authentication success/failure, session restore, logout and protected routes.
- ADMIN/HR/MANAGER read and mutation permissions.
- Job CRUD validation, search/filter forwarding and referenced-delete conflict.
- Candidate CRUD validation, search/filter forwarding, CV extension handling, edit preservation, file authorization and legacy path compatibility.
- Application management:
  - TC-APP-01: HR list applications (HTTP 200)
  - TC-APP-02: MANAGER list applications (HTTP 200)
  - TC-APP-03: Unauthenticated list (HTTP 401)
  - TC-APP-04: HR create valid application with default status NEW (HTTP 201)
  - TC-APP-05: Candidate invalid/missing (HTTP 400/404)
  - TC-APP-06: Job invalid/missing (HTTP 400/404)
  - TC-APP-07: Duplicate Candidate + Job prevention (HTTP 409)
  - TC-APP-08: MANAGER create forbidden (HTTP 403)
  - TC-APP-09: HR status transition NEW -> SCREENING (HTTP 200)
  - TC-APP-10: HR status transition SCREENING -> INTERVIEW (HTTP 200)
  - TC-APP-11: Invalid status value rejection (HTTP 400)
  - TC-APP-12: Invalid status transition rejection e.g. NEW -> PASSED (HTTP 400)
  - TC-APP-13: MANAGER update status forbidden (HTTP 403)
  - TC-APP-14: Search and filter parameter forwarding
  - Edge cases: Application detail lookup, missing ID 404, final state transition rejection.
- Flask health and dashboard behavior.
- Frontend static analysis and production compilation.

## Integration Scope

- Real MySQL login and session persistence.
- Real Job and Candidate create/read/update/delete with cleanup.
- Real Application create, duplicate rejection, and status transitions against live MySQL.
- Search and filter against inserted records.
- DOCX upload, text extraction and authenticated retrieval.
- Deletion protection for records linked to Applications.
- MANAGER read-only behavior across Jobs, Candidates, and Applications.
- Vite proxy for `/api` and session cookies.

## Manual Browser Scope

- Login redirects to Dashboard.
- Dashboard renders live counts and clickable cards.
- Applications page lists applications with status badges and filter controls.
- Create Application form links candidates and jobs with duplicate alert handling.
- Detail page displays 3 sections (Candidate info, Job info, Application info) with role-aware status transition controls.
- MANAGER role hides create and status transition controls.
- Browser console has no errors.

## Exit Criteria

All pytest tests pass (70 tests), lint exits zero without warnings, Vite production build succeeds, live MySQL integration suite succeeds, and manual verification confirms the flow.

