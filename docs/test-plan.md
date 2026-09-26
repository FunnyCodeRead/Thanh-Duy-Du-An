# M1/M2 Test Plan

## Objectives

Verify that the React migration preserves authentication, role enforcement, Job and Candidate workflows, MySQL data, CV safety and the fixed seven-table design without implementing M3.

## Automated Scope

- Authentication success/failure, session restore, logout and protected routes.
- ADMIN/HR/MANAGER read and mutation permissions.
- Job CRUD validation, search/filter forwarding and referenced-delete conflict.
- Candidate CRUD validation, search/filter forwarding, CV extension handling, edit preservation, file authorization and legacy path compatibility.
- Flask health and dashboard behavior.
- Frontend static analysis and production compilation.

## Integration Scope

- Real MySQL login and session persistence.
- Real Job and Candidate create/read/update/delete with cleanup.
- Search and filter against inserted records.
- DOCX upload, text extraction and authenticated retrieval.
- Deletion protection for records linked to Applications.
- MANAGER read-only behavior.
- Vite proxy for `/api` and session cookies.

## Manual Browser Scope

- Login redirects to Dashboard.
- Dashboard renders live counts.
- Jobs and Candidates render MySQL rows.
- Role-aware controls appear for HR.
- CV paths are normalized and browser console has no errors.

## Exit Criteria

All pytest tests pass, lint exits zero without warnings, Vite production build succeeds, live API/proxy checks succeed and manual browser checks reveal no blocking defect.
