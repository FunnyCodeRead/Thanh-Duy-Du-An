---
name: security-review
description: Audit the recruitment system's authentication, authorization, SQL, secrets, sessions, uploads, API errors, and later Gemini integration.
---

# Security Review

## Checklist

Review SQL injection, XSS, CSRF exposure, authentication, role authorization, session content, password hashing, environment secrets, file extension and size controls, path handling, input validation, error leakage, dependencies, and Gemini key isolation.

## Output

Create `docs/security-review.md` with evidence, severity, impact, and a scoped remediation. Do not include passwords, hashes, API keys, or uploaded CV contents.

## Rules

- Verify backend authorization independently of hidden frontend controls.
- Confirm all user-controlled SQL values are parameters.
- Confirm React never receives database or Gemini credentials.
- Do not fix findings during the review unless a separate implementation task is approved.

