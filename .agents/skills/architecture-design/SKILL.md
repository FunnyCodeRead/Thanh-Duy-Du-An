---
name: architecture-design
description: Design the recruitment system architecture from student-approved requirements and preserve requirement-to-component traceability.
---

# Architecture Design

## Entry Gate

Read `docs/human-gate-1.md`. Stop unless its status is `APPROVED` by the student.

## Inputs

Read the approved requirements, user stories, acceptance criteria, and existing implementation constraints.

## Workflow

1. Identify the simplest architecture supporting the approved requirements.
2. Define responsibilities and dependencies for React, Flask REST API, MySQL, and the later Gemini service.
3. Document request, authentication, upload, and AI data flows.
4. Identify trust boundaries and external systems.
5. Record decisions and rationale as ADRs.
6. Trace each major functional requirement to components and data.
7. Create `docs/architecture.md` and `docs/architecture-decisions.md`.

## Boundaries

- Do not alter approved requirements or write implementation code.
- Do not introduce microservices, RBAC, JWT, Redux, or other unapproved technology.
- Preserve the fixed seven-table database.
- Stop at Human Gate 2 before implementation.

