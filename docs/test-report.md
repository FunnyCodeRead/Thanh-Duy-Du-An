# M1/M2 Test Report

Test date: 26 September 2026

Environment: Windows, Python 3.11, Node/Vite, MySQL Community Server 8.4, database `ai_recruitment`.

## Results

| Check | Result | Evidence |
|---|---|---|
| Backend automated tests | PASS | `47 passed in 3.18s` |
| Frontend lint | PASS | `npm run lint`, exit 0, no warnings |
| Frontend production build | PASS | 39 modules transformed; build completed |
| Flask direct health | PASS | `/api/health`: `ok`, database `connected` |
| Vite proxy health | PASS | `http://127.0.0.1:5173/api/health`: `ok` |
| Session through Vite proxy | PASS | HR login and `/api/auth/me` returned `hr@example.com` |
| Dashboard data | PASS | 3 Jobs and 5 Candidates from live MySQL |
| Real MySQL CRUD | PASS | Temporary Job and Candidate created, updated and removed |
| CV handling | PASS | DOCX upload, text extraction and authenticated access |
| Delete protection | PASS | Linked Job and Candidate returned conflict behavior |
| MANAGER permissions | PASS | Read allowed; Job/Candidate mutations denied |
| Manual React browser check | PASS | Login, Dashboard, Jobs, Candidates rendered; no console errors |

## Defect Found and Corrected

Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend now emits a basename-only URL and the backend accepts both legacy and current representations. A regression test covers this case.

## Database Integrity

The live schema still contains exactly: `users`, `jobs`, `candidates`, `applications`, `interviews`, `evaluations`, `ai_results`. No migration or extra table was introduced.

## Conclusion

M1/M2 React and Flask REST scope meets the technical exit criteria. M3 and formal human gate approvals are not claimed.
