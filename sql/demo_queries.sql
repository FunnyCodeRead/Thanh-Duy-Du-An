USE ai_recruitment;

SELECT * FROM jobs WHERE status = 'OPEN' ORDER BY created_at DESC;
SELECT * FROM candidates ORDER BY created_at DESC;
SELECT * FROM candidates WHERE full_name LIKE '%Nguyễn%';
SELECT * FROM candidates WHERE skills LIKE '%Python%';

SELECT a.*, c.full_name AS candidate_name FROM applications a
JOIN candidates c ON c.id = a.candidate_id WHERE a.job_id = 1;

SELECT * FROM applications WHERE status = 'INTERVIEW';

SELECT i.*, u.full_name AS interviewer_name FROM interviews i
JOIN users u ON u.id = i.interviewer_id WHERE i.application_id = 4;

SELECT c.full_name, e.* FROM evaluations e
JOIN applications a ON a.id = e.application_id
JOIN candidates c ON c.id = a.candidate_id WHERE c.id = 3;

SELECT application_id,
       ROUND((technical_score + communication_score + experience_score) / 3, 2) AS average_score
FROM evaluations;

SELECT * FROM ai_results WHERE application_id = 1 ORDER BY created_at DESC;

