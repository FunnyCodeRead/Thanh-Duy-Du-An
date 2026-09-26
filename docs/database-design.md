# Database Design Review

## Decision

No schema change is required for the React migration. The REST API reuses the existing MySQL database and parameterized database functions.

## Entities

The database contains exactly seven tables: `users`, `jobs`, `candidates`, `applications`, `interviews`, `evaluations`, and `ai_results`.

## Relationship Review

- Candidate to Application is one-to-many.
- Job to Application is one-to-many.
- Application to Interview, Evaluation, and AI Result is one-to-many.
- User to Interview and Evaluation is one-to-many.
- `UNIQUE(candidate_id, job_id)` prevents duplicate applications.

## Constraint Review

User role, Job status, Candidate source, Application status, Interview status, and AI result type use constrained values. Evaluation scores include checks from 1 to 5. Candidate deletion cascades to Applications and their dependent records; Job deletion is restricted when Applications exist. M2 APIs additionally block both Job and Candidate deletion when an Application exists.

## Index Review

The schema indexes Job title/status, Candidate name/email/phone, Application job/status, and Interview date. Existing primary, unique, and foreign-key indexes support the current CRUD and search scope.

## Security and API Compatibility

All user-controlled values remain query parameters. Search queries build only fixed SQL condition fragments and parameterize keyword and filter values. REST serialization does not expose password hashes.

## Validation Result

The live database reports seven tables. No additional table, column, or migration is approved for this task.

