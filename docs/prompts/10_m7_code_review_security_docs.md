# M7 – FINAL REVIEW

Do not add new features.

## Review
- AUTHENTICATION
- AUTHORIZATION
- SESSION
- SQL INJECTION
- XSS
- FILE UPLOAD
- PATH TRAVERSAL
- SECRETS
- GEMINI
- AI SAFETY
- CSRF
- ERROR HANDLING

Check:
- Werkzeug password hashing
- `session.clear()`
- HttpOnly cookie
- SameSite=Lax
- backend role checks
- parameterized SQL
- no `dangerouslySetInnerHTML`
- secure file upload
- `.env` ignored
- Gemini key backend only

Do not claim:
- 100% secure
- absolute security
- triệt tiêu hoàn toàn

Use measured language.

CSRF: document current mitigations, but state explicit CSRF token is not implemented if true.

Review all requirements FR/NFR.

Run:
- pytest
- lint
- build
- MySQL schema verification

Check `SHOW TABLES;` → exactly 7 tables.

Create:
- `docs/code-review.md`
- `docs/security-review.md`
- `docs/human-review-summary.md`
- `docs/ai-tasks/M7-task.md`

Human Gates: do not auto approve.

Final: `PASS WITH DOCUMENTED LIMITATIONS` if technical verification passes.
