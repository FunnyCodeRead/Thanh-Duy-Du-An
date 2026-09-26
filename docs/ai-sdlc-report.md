# AI Augmented SDLC Report

## Current Scope

This report records verified work through requirements preparation for the revised React and Flask REST roadmap. Later architecture and implementation evidence will be added only after the required human gates.

## AI Agent Used

Codex inspected the existing repository, database, tests, course reference, and revised project request. It preserved the working seven-table implementation while preparing traceable requirements.

## Skills Used

- Documents skill to read the supplied course DOCX as reference material.
- Skill Creator to create and validate eight project-level SDLC skills.
- Project `requirements-analysis` workflow to create requirements, stories, criteria, issues, and traceability.

The remaining project skills have been created but have not yet been applied because Human Gate 1 is pending.

## Tools Used

- Read-only DOCX text extraction using the bundled document runtime.
- Shell inspection for repository, Node, Python, MySQL, and test status.
- MySQL connectivity and table validation.
- pytest execution.
- Patch-based project file creation.

## MCP Usage

The Codex workspace dependency loader was used to locate the supported document runtime. No external project service, issue tracker, or Git hosting MCP was used.

## Artifacts Generated

- Eight `.agents/skills/*/SKILL.md` files.
- Customer requirement, requirements, user stories, acceptance criteria, issues, project state, and Human Gate 1 artifacts.
- Task evidence for completed and pending milestones.

## Problems Detected by AI

- The working project uses Jinja while the revised roadmap requires React and REST.
- Candidate email optionality conflicts with the existing `NOT NULL` column semantics.
- AI qualitative fit wording could be confused with prohibited numeric ranking.
- MANAGER evaluation permissions and ADMIN user management scope need confirmation.
- The supplied document renderer could not complete visual rendering because the bundled LibreOffice executable was unavailable; text extraction succeeded.

## Human Corrections

No human corrections have been recorded for the revised requirements yet.

## Human Gates

- Human Gate 1: NEEDS CHANGES pending student requirements review.
- Human Gate 2: not started.
- Human Gate 3: not started.
- Human Gate 4: not started.

## Current Evaluation

The existing M2 application remains operational with 32 passing tests and seven MySQL tables. The revised React REST migration is blocked by the intentionally required Human Gate 1 review.

