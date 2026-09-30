# DATABASE DESIGN PROMPT

Thiết kế MySQL cho hệ thống tuyển dụng.

## Bắt buộc giữ ĐÚNG 7 bảng
1. `users`
2. `jobs`
3. `candidates`
4. `applications`
5. `interviews`
6. `evaluations`
7. `ai_results`

Không tạo bảng thứ 8 nếu không thật sự bắt buộc.

### users
`id, full_name, email, password_hash, role, created_at`

role: `ADMIN | HR | MANAGER`

### jobs
`id, title, department, description, requirements, skills, quantity, status, created_at`

status: `OPEN | CLOSED`

### candidates
`id, full_name, email, phone, skills, experience, education, source, cv_file, cv_text, created_at`

source: `FACEBOOK | LINKEDIN | WEBSITE | REFERRAL | JOB_SITE | OTHER`

### applications
`id, candidate_id, job_id, status, applied_at, note`

Ràng buộc: `UNIQUE(candidate_id, job_id)`

status: `NEW | SCREENING | INTERVIEW | PASSED | REJECTED`

### interviews
`id, application_id, interviewer_id, interview_date, location, status, note, created_at`

status: `SCHEDULED | COMPLETED | CANCELLED`

### evaluations
`id, application_id, evaluator_id, technical_score, communication_score, experience_score, comment, created_at`

Điểm là số nguyên 1–5. Không lưu `average_score`; tính runtime khi hiển thị.

### ai_results
`id, application_id, type, content, created_at`

type: `CV_SUMMARY | INTERVIEW_QUESTION | EMAIL`

## Quan hệ
- Candidate 1:N Applications
- Job 1:N Applications
- Application 1:N Interviews
- Application 1:N Evaluations
- Application 1:N AIResults
- User 1:N Interviews
- User 1:N Evaluations
