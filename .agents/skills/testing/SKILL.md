---
name: testing
description: Derive recruitment-system tests from approved requirements and report real automated and manual execution evidence.
---

# Testing

## Workflow

1. Trace approved requirements to scenarios.
2. Define positive, validation, authorization, and failure test cases.
3. Prefer pytest for backend behavior and mocks for isolated tests.
4. Run focused MySQL integration checks for database behavior.
5. Manually verify critical React flows when implemented.
6. Analyze failures without weakening tests to obtain a pass.
7. Update `docs/test-plan.md` and `docs/test-report.md` with real commands and results.

## Rules

- Never invent execution counts or mark an unexecuted case passed.
- Keep failed, blocked, and not-yet-implemented cases explicit.
- Include authentication, roles, validation, SQL boundaries, and file-upload safety.

