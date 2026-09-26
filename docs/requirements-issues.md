# Requirements Issues

## Ambiguities Requiring Human Decision

1. **Candidate email optionality:** The new requirement says validate email if supplied, while the existing MySQL column is `NOT NULL`. The current implementation stores an empty string when omitted. Confirm whether Candidate email should become mandatory or remain optional without a schema change.
2. **AI fit wording:** The requested CV summary includes “điểm phù hợp với vị trí” but separately forbids numeric ranking such as 90 percent. Confirm that this means a qualitative discussion of fit, not a score.
3. **MANAGER evaluation access:** The role description says MANAGER can perform Evaluation, while the detailed endpoint permissions are not yet specified. Confirm whether both HR and MANAGER may create evaluations.
4. **ADMIN user management:** ADMIN is described as managing all, but user-management screens and APIs are not included in the milestone endpoints. Confirm that account management remains out of current scope.
5. **React migration behavior:** Confirm whether the existing Jinja pages should remain temporarily available during migration or be removed after React M2 is accepted.

## Assumptions Pending Review

- The Vite development proxy is used, so React sends same-origin relative `/api` requests and Flask CORS is not added.
- Existing Jinja routes remain operational until the React replacement passes manual verification.
- Existing MySQL schema and demo accounts remain unchanged.
- Human gates are project evidence and must be completed by the student, not by the AI agent.

## Contradictions

The original project roadmap used Jinja for M2, while the revised roadmap requires React and REST. The migration assumption above preserves working behavior until the revised frontend is verified.

## Data Limitations

- **REQ-ISSUE-06 (Time-to-Hire / Thời gian tuyển dụng):**
  Exact hiring duration cannot be derived from the current database schema because the `applications` table only stores `applied_at` (creation timestamp) and lacks a completion/final-state timestamp (`completed_at`, `status_updated_at`, `updated_at`, or `hired_at`).
  Per the AI-SDLC principle of never inventing or fabricating synthetic data (such as calculating `CURRENT_DATE - applied_at`), the system explicitly reports that data is insufficient to calculate time-to-hire accurately.

