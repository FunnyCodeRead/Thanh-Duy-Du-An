# M4 – INTERVIEW AND EVALUATION

## Interview
status:
- SCHEDULED
- COMPLETED
- CANCELLED

Flow:
- SCHEDULED → COMPLETED
- SCHEDULED → CANCELLED

No reverse transition.

ADMIN/HR:
- create
- edit while SCHEDULED
- complete
- cancel

MANAGER:
- view
- complete only assigned interview

## Evaluation
Fields:
- technical_score
- communication_score
- experience_score
- comment

Scores: integer 1–5.

Average: `(technical + communication + experience) / 3`, round 2 decimals.

Do NOT save average in database.

ADMIN can edit all evaluations.  
Evaluator can edit own evaluation.

Do not automatically set PASSED/REJECTED or update `application.status`.

## React
- Interview pages
- Evaluation form
- Application detail integration

Add tests.
