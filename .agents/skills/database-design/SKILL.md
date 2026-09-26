---
name: database-design
description: Review the fixed seven-table MySQL design for the recruitment system against approved requirements without inventing tables.
---

# Database Design

## Inputs

Read approved requirements, architecture, `sql/schema.sql`, and `ERD.md`.

## Workflow

Review entities, relationships, primary and foreign keys, data types, constraints, deletion behavior, indexes, and requirement coverage. Record findings in `docs/database-design.md`.

## Invariants

- Keep exactly `users`, `jobs`, `candidates`, `applications`, `interviews`, `evaluations`, and `ai_results`.
- Do not add roles, permissions, logs, prompt versions, or document tables.
- Preserve parameterized-query compatibility and the unique candidate/job application rule.
- Propose a schema change only for a verified defect and require human approval before applying it.

