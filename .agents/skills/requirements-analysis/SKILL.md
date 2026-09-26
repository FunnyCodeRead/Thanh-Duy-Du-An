---
name: requirements-analysis
description: Analyze this recruitment system's source requirements into traceable requirements, user stories, acceptance criteria, assumptions, and open issues without designing or coding.
---

# Requirements Analysis

## Inputs

Read `docs/customer-requirement.md` and any user-approved requirement changes.

## Workflow

1. Identify stakeholders and actors.
2. Record only explicit functional requirements as `FR-###`.
3. Record explicit quality and technology constraints as `NFR-###`.
4. Separate business rules, assumptions, and ambiguities.
5. Create user stories traceable to requirement IDs.
6. Create testable Given When Then acceptance criteria.
7. Update `docs/requirements.md`, `docs/user-stories.md`, `docs/acceptance-criteria.md`, and `docs/requirements-issues.md`.

## Boundaries

- Do not write source code, design architecture, or change the database.
- Do not invent roles, workflows, AI decisions, or business rules.
- Record missing or conflicting information instead of guessing.
- Stop at Human Gate 1 until the student approves the requirements.

## Verification

Confirm every requirement has an ID, every story traces to at least one requirement, every important story has testable criteria, and unresolved issues remain visible.

