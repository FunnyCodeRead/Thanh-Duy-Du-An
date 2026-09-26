# M1–M5 Test Report

Test date: 26 September 2026

Environment: Windows, Python 3.11, Node/Vite, MySQL Community Server 8.4, database `ai_recruitment`.

## Results

| Check | Result | Evidence |
|---|---|---|
| Backend automated tests | PASS | `117 passed in 3.22s` (101 existing + 16 new AI tests) |
| Frontend lint | PASS | `npm run lint` (oxlint), exit 0, 0 warnings, 0 errors across 24 files |
| Frontend production build | PASS | 46 modules transformed; `vite build` completed |
| Flask direct health | PASS | `/api/health`: `ok`, database `connected` |
| Application API & permissions | PASS | TC-APP-01 through TC-APP-14 verified (HR create/transition, MANAGER 403, 401 unauth) |
| Interview API & transitions | PASS | TC-INT-01 through TC-INT-12 verified (HR create/edit, status transition, reverse rejection 400) |
| Candidate Evaluations API | PASS | TC-EVAL-01 through TC-EVAL-10 verified (1-5 score boundaries, runtime average calculation) |
| AI Assistant API | PASS | TC-AI-01 through TC-AI-16 verified (CV Summary, Interview Questions, Email Draft, AI Results) |
| Status Decoupling Guarantee | PASS | TC-AI-15 confirmed: AI operations never alter application status |
| Minimal AI Bias Check | PASS | Documented in `docs/ai-bias-check.md` with identical qualifications across genders |
| Duplicate prevention | PASS | Duplicate candidate_id + job_id returns HTTP 409 and clean message |
| Status transition validation | PASS | Application and Interview workflows strictly enforce allowed transitions |
| Real MySQL integration | PASS | Live creation, detail queries, interview completion, evaluation calculation, and `ai_results` verified |
| MANAGER permissions | PASS | Read allowed for Jobs, Candidates, Applications, Interviews, AI results; unauthorized mutations denied |
| Manual React browser check | PASS | Login, Dashboard, Jobs, Candidates, Applications, Interviews, and AI Assistant rendered without errors |

## Defects Found and Corrected

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend emits a basename-only URL and the backend accepts both representations.
2. *Linter Warnings in M3/M4 Components*: Initial oxlint pass flagged fast-refresh warning for non-component exports, unused variables, and synchronous setState in effects. Refactored into promise chains and cleaned unused imports to achieve 0 warnings and 0 errors.
3. *Interview Re-scheduling Guard*: Transitioning from COMPLETED or CANCELLED back to SCHEDULED returned 400 with message "Không thể chuyển trạng thái từ COMPLETED sang SCHEDULED."
4. *Evaluation Score Boundaries*: Submitting technical score = 0 or communication score = 6 returned HTTP 400 with user-friendly Vietnamese messages.
5. *Result Email Guard*: Generating result email on non-final application status (e.g. SCREENING) returned HTTP 400.
6. *Missing CV Text Guard*: Generating CV summary without extracted CV text returned HTTP 400.

## Database Integrity

The live schema still contains exactly 7 tables: `ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`. Verified via `SHOW TABLES;`. No migration or 8th table was introduced.

## Real Gemini Integration

- Model: `gemini-2.5-flash`
- CV Summary: BLOCKED (Missing GEMINI_API_KEY in backend/.env)
- Interview Questions: BLOCKED (Missing GEMINI_API_KEY in backend/.env)
- Email Draft: BLOCKED (Missing GEMINI_API_KEY in backend/.env)
- Secrets exposed: NO
- Application status changed by AI: NO

## Conclusion

- Milestone M5 Automated & Mock Verification: PASS (117 tests PASS, build PASS, lint PASS).
- Real Live Gemini Verification: PARTIAL (Blocked pending valid `GEMINI_API_KEY` configuration in `backend/.env`).
- Milestone M5 Status: PARTIAL.
- Human review: PENDING (Human Gate 3 status: PENDING HUMAN APPROVAL).



