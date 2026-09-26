# M1–M4 Test Report

Test date: 26 September 2026

Environment: Windows, Python 3.11, Node/Vite, MySQL Community Server 8.4, database `ai_recruitment`.

## Results

| Check | Result | Evidence |
|---|---|---|
| Backend automated tests | PASS | `101 passed in 3.17s` (70 existing + 31 new interview & evaluation tests) |
| Frontend lint | PASS | `npm run lint` (oxlint), exit 0, 0 warnings, 0 errors across 24 files |
| Frontend production build | PASS | 46 modules transformed; `vite build` completed |
| Flask direct health | PASS | `/api/health`: `ok`, database `connected` |
| Application API & permissions | PASS | TC-APP-01 through TC-APP-14 verified (HR create/transition, MANAGER 403, 401 unauth) |
| Interview API & transitions | PASS | TC-INT-01 through TC-INT-12 verified (HR create/edit, status transition SCHEDULED -> COMPLETED/CANCELLED, reverse transition rejected 400, MANAGER 403) |
| Candidate Evaluations API | PASS | TC-EVAL-01 through TC-EVAL-10 verified (1-5 score boundaries, runtime average calculation, comment persistence, creator/admin edit permissions) |
| Duplicate prevention | PASS | Duplicate candidate_id + job_id returns HTTP 409 and clean message |
| Status transition validation | PASS | Application and Interview workflows strictly enforce allowed transitions |
| Real MySQL integration | PASS | Live creation, detail queries, interview completion, evaluation calculation, and cleanup verified |
| MANAGER permissions | PASS | Read allowed for Jobs, Candidates, Applications, Interviews; all unauthorized mutations denied with HTTP 403 |
| Manual React browser check | PASS | Login, Dashboard, Jobs, Candidates, Applications, and Interviews rendered cleanly without console errors |

## Defects Found and Corrected

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend emits a basename-only URL and the backend accepts both representations.
2. *Linter Warnings in M3/M4 Components*: Initial oxlint pass flagged fast-refresh warning for non-component exports, unused variables, and synchronous setState in effects. Refactored into promise chains and cleaned unused imports to achieve 0 warnings and 0 errors.
3. *Interview Re-scheduling Guard*: Transitioning from COMPLETED or CANCELLED back to SCHEDULED returned 400 with message "Không thể chuyển trạng thái từ COMPLETED sang SCHEDULED."
4. *Evaluation Score Boundaries*: Submitting technical score = 0 or communication score = 6 returned HTTP 400 with user-friendly Vietnamese messages.

## Database Integrity

The live schema still contains exactly 7 tables: `ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`. Verified via `SHOW TABLES;`. No migration or 8th table was introduced.

## Conclusion

Milestone M4 technical verification: PASS.
Human review: PENDING (Human Gate 3 status: PENDING HUMAN APPROVAL).


