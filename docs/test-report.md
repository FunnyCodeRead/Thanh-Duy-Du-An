# M1/M2/M3 Test Report

Test date: 26 September 2026

Environment: Windows, Python 3.11, Node/Vite, MySQL Community Server 8.4, database `ai_recruitment`.

## Results

| Check | Result | Evidence |
|---|---|---|
| Backend automated tests | PASS | `70 passed in 3.24s` (47 existing + 23 new application tests) |
| Frontend lint | PASS | `npm run lint` (oxlint), exit 0, 0 warnings, 0 errors across 20 files |
| Frontend production build | PASS | 42 modules transformed; `vite build` completed |
| Flask direct health | PASS | `/api/health`: `ok`, database `connected` |
| Application API & permissions | PASS | TC-APP-01 through TC-APP-14 verified (HR create/transition, MANAGER 403, 401 unauth) |
| Duplicate prevention | PASS | Duplicate candidate_id + job_id returns HTTP 409 and clean message |
| Status transition validation | PASS | Valid transitions succeed; invalid jumps (NEW -> PASSED) and final state transitions return HTTP 400 |
| Real MySQL integration | PASS | Live creation, detail JOIN, status progression, duplicate rejection and cleanup verified |
| MANAGER permissions | PASS | Read allowed for Jobs, Candidates, Applications; all mutations denied with HTTP 403 |
| Manual React browser check | PASS | Login, Dashboard, Jobs, Candidates, Applications (list/create/detail) rendered without errors |

## Defects Found and Corrected

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend emits a basename-only URL and the backend accepts both representations.
2. *Linter Warnings in M3 Components*: Initial oxlint pass flagged fast-refresh warning for non-component exports and dependency array warning in `ApplicationDetailPage`. Refactored helpers to local scope and wrapped loader in `useCallback` to achieve 0 warnings and 0 errors.

## Database Integrity

The live schema still contains exactly 7 tables: `ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`. Verified via `SHOW TABLES;`. No migration or 8th table was introduced.

## Conclusion

Milestone M3 technical verification: PASS.
Human review: PENDING (Human Gate 3 will be performed after M3 + M4 completion).

