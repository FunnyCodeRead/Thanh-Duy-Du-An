---
name: implementation
description: Implement approved recruitment-system increments in the existing codebase using simple React, Flask REST, and MySQL patterns.
---

# Implementation

## Entry Gate

Read the approved requirements, architecture, database design, and current milestone. Stop if a required human gate is not approved or the specification is materially incomplete.

## Workflow

1. Inspect current code and tests before editing.
2. Map the requested increment to approved requirements and acceptance criteria.
3. Preserve working behavior and the seven-table schema.
4. Implement the smallest complete vertical slice.
5. Validate inputs on the Flask backend and enforce roles there.
6. Use parameterized SQL and environment-based secrets.
7. Run the application, automated tests, and a focused integration check.
8. Review the actual diff and report evidence.

## Boundaries

- Do not implement later milestones, unapproved features, or enterprise abstractions.
- React must call Flask endpoints; it must never access MySQL or Gemini directly.
- Gemini must not change application status or make hiring decisions.

