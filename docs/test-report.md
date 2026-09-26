# M1–M7 Test Report

Test date: 26 September 2026

Environment: Windows, Python 3.11, Node/Vite, MySQL Community Server 8.4, database `ai_recruitment`.

## Results Summary

| Check | Result | Evidence |
|---|---|---|
| Backend automated tests | PASS | `175 passed in 30.38s` (0 failed) across all test modules (136 baseline + 22 M8 Chat + 17 RAG Hardening tests) |
| Frontend static lint | PASS | `npm run lint` (oxlint), exit 0, 0 warnings, 0 errors across 25 files |
| Frontend production build | PASS | 47 modules transformed; `vite build` completed |
| Flask direct health | PASS | `/api/health`: `ok`, database `connected` |
| Session Cookie Hardening | PASS | `Set-Cookie` header includes `HttpOnly` and `SameSite=Lax` |
| Application API & permissions | PASS | TC-APP-01 through TC-APP-14 verified (HR create/transition, MANAGER 403, 401 unauth) |
| Interview API & transitions | PASS | TC-INT-01 through TC-INT-12 verified (HR create/edit, status transition, reverse rejection 400) |
| Candidate Evaluations API | PASS | TC-EVAL-01 through TC-EVAL-10 verified (1-5 score boundaries, runtime average calculation) |
| AI Assistant API | PASS | TC-AI-01 through TC-AI-16 verified (CV Summary, Interview Questions, Email Draft, AI Results) |
| Recruitment Knowledge Chatbot API | PASS | TC-CHAT-01 through TC-CHAT-22 verified (Scope Guard, Decision Guard, SQL & Vector search, Reindexing RBAC) |
| RAG Hardening & Vietnamese Retrieval | PASS | RAG-HARD-001 through RAG-HARD-017 verified (Cosine L2 norm, Q1-Q6 100% Top-1, paraphrase, no ai_results, no secrets) |
| Status Decoupling Guarantee | PASS | TC-AI-15 confirmed: AI operations never alter application status |
| Minimal AI Bias Check | PASS | Documented in `docs/ai-bias-check.md` with identical qualifications across genders |
| Dashboard Statistics API | PASS | TC-DASH-01 through TC-DASH-11 verified (Summary cards, status distribution, candidate sources, pass rate, hiring time, upcoming interviews) |
| Search & Filter Audit | PASS | TC-SRCH-01 through TC-SRCH-08 verified (Jobs, Candidates, Applications, Interviews combined filters, special characters, empty keywords) |
| Duplicate prevention | PASS | Duplicate candidate_id + job_id returns HTTP 409 and clean message |
| Status transition validation | PASS | Application and Interview workflows strictly enforce allowed transitions |
| Real MySQL integration | PASS | Live creation, detail queries, interview completion, evaluation calculation, dashboard aggregations, and `ai_results` verified |
| MANAGER permissions | PASS | Read allowed for Jobs, Candidates, Applications, Interviews, AI results, and Dashboard; unauthorized mutations denied (HTTP 403) |
| Code Review Report | PASS | Documented in `docs/code-review.md` with traceability and severity findings |
| Security Review Report | PASS | Documented in `docs/security-review.md` covering Auth, SQLi, XSS, CSRF, Uploads, Secrets, RAG Scope |
| Manual React browser check | PASS | Login, Dashboard, Jobs, Candidates, Applications, Interviews, AI Assistant, and AI Chatbot rendered without errors |

## Defects Found and Corrected Across Milestones

1. *Legacy CV Path*: Legacy sample rows stored CV names with an `uploads/` prefix, producing `/uploads/uploads/...` links. The frontend emits a basename-only URL and the backend accepts both representations via `os.path.basename`.
2. *Linter Warnings in M3/M4 Components*: Initial oxlint pass flagged fast-refresh warning for non-component exports, unused variables, and synchronous setState in effects. Refactored into promise chains and cleaned unused imports to achieve 0 warnings and 0 errors.
3. *Interview Re-scheduling Guard*: Transitioning from COMPLETED or CANCELLED back to SCHEDULED returned 400 with message "Không thể chuyển trạng thái từ COMPLETED sang SCHEDULED."
4. *Evaluation Score Boundaries*: Submitting technical score = 0 or communication score = 6 returned HTTP 400 with user-friendly Vietnamese messages.
5. *Result Email Guard*: Generating result email on non-final application status (e.g. SCREENING) returned HTTP 400.
6. *Missing CV Text Guard*: Generating CV summary without extracted CV text returned HTTP 400.
7. *Missing cv_text in get_application_by_id*: Fixed query in `db.py` to retrieve `c.cv_text` from candidates for live Gemini processing.
8. *Zero Finalized Applications Division*: Handled `finalized == 0` safely in `pass_rate` calculation to return `0.0%` instead of division-by-zero error.
9. *Empty Application Status Handling*: Ensured all 5 status keys (`NEW`, `SCREENING`, `INTERVIEW`, `PASSED`, `REJECTED`) default to `0` when no database rows exist for that state.
10. *Session Cookie Hardening (M7)*: Added explicit `SESSION_COOKIE_SAMESITE = "Lax"` and `SESSION_COOKIE_HTTPONLY = True` in `Config` to ensure consistent browser CSRF mitigation.
11. *Outdated Documentation (M7)*: Harmonized `README.md`, `docs/project-state.md`, and test reports with completed M1–M6 deliverables.
12. *RAG Normalization Invariant (M8 Hardened)*: Enforced defensive L2 normalization on all document and query embeddings in `embedding_service.py` to guarantee exact cosine similarity via `IndexFlatIP`.
13. *Exclusion of Derivative ai_results (M8 Hardened)*: Purged historical `ai_results` from the vector knowledge base to eliminate recursive hallucination; rebuilt FAISS index with exactly 21 authoritative recruitment documents.

## Database Integrity

The live schema still contains exactly 7 tables: `ai_results`, `applications`, `candidates`, `evaluations`, `interviews`, `jobs`, `users`. Verified via `SHOW TABLES;`. No migration or 8th table was introduced.

## Real Gemini Integration Verification

- Model: `gemini-flash-latest` (với fallback `gemini-3.1-flash-lite`)
- CV Summary: PASS (HTTP 200, nội dung thực 1007 ký tự từ Gemini, lưu bản ghi `CV_SUMMARY` trong `ai_results`, `application.status` không đổi)
- Interview Questions: PASS (HTTP 200, sinh đủ 5 câu hỏi phỏng vấn có cấu trúc, lưu bản ghi `INTERVIEW_QUESTION`, `application.status` không đổi)
- Email Draft: PASS (HTTP 200, sinh Tiêu đề + Nội dung cho thư mời phỏng vấn và thông báo kết quả, lưu bản ghi `EMAIL`, không gửi email thật, `application.status` không đổi)
- Secrets exposed: NO (Không in, không ghi log API key hay bất kỳ secret nào)
- Application status changed by AI: NO (Trạng thái ứng tuyển được giữ nguyên vẹn 100% trước và sau mọi tác vụ AI)

## Data Limitations

- **Time-to-Hire (Hiring Time):** The current MySQL database schema only stores `applied_at` in the `applications` table and does not store a final-status timestamp (`completed_at`, `status_updated_at`, `updated_at`, or `hired_at`). The system strictly adheres to the principle of not fabricating synthetic numbers and returns:
  `{"available": false, "average_days": null, "message": "Chưa đủ dữ liệu thời điểm kết thúc hồ sơ để tính chính xác."}`.

## Conclusion

- Milestone M7 verification: PASS WITH DOCUMENTED LIMITATIONS.
- Automated regression suite: 136 tests PASS, 0 fail.
- Frontend static quality: 0 lint errors/warnings, production build successful.
- Final Human Approval: PENDING STUDENT REVIEW at `docs/human-gate-4.md`.
