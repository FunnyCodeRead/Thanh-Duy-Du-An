Bạn là một Software Architect kiêm Database Designer.

Tôi đang làm một dự án môn học có tên:

**AI Recruitment Management System – Hệ thống quản lý tuyển dụng tích hợp AI**

Mục tiêu của dự án chỉ ở mức **7–8 điểm, làm nhanh, dễ hiểu, dễ giải thích khi bảo vệ**, không thiết kế theo hướng enterprise hoặc production phức tạp.

Hãy thực hiện **M0 rút gọn hoàn chỉnh**, tập trung vào:

1. Phân tích nghiệp vụ tối thiểu.
2. Chốt các bảng dữ liệu.
3. Thiết kế ERD.
4. Viết MySQL schema hoàn chỉnh.
5. Thêm dữ liệu mẫu.
6. Kiểm tra tính hợp lý của các quan hệ.

---

# 1. PHẠM VI HỆ THỐNG

Hệ thống cần quản lý:

- Người dùng.
- Vị trí tuyển dụng.
- Ứng viên.
- Hồ sơ ứng tuyển.
- Lịch phỏng vấn.
- Đánh giá ứng viên.
- Kết quả AI.

Không xây:

- RBAC.
- Permission table.
- Audit log.
- Activity log.
- Prompt versioning.
- Workflow engine.
- Microservice.
- Vector Database.
- Redis.
- Celery.
- Elasticsearch.
- AI ranking ứng viên.
- AI tự động loại ứng viên.
- AI tự động quyết định tuyển dụng.

---

# 2. CÔNG NGHỆ

Backend:

Python Flask

Database:

MySQL

Frontend:

HTML + Jinja2 + Bootstrap

AI:

Gemini API

---

# 3. PHÂN QUYỀN ĐƠN GIẢN

Chỉ có 3 loại user:

```text
ADMIN
HR
MANAGER
```

Không xây bảng roles hoặc permissions.

Bảng users chỉ cần trường:

```text
role
```

ADMIN:

- Quản lý tất cả.
- Quản lý user.
- Quản lý vị trí.
- Quản lý ứng viên.

HR:

- Quản lý vị trí tuyển dụng.
- Quản lý ứng viên.
- Hồ sơ ứng tuyển.
- Lịch phỏng vấn.
- Sử dụng AI.

MANAGER:

- Xem ứng viên.
- Xem lịch phỏng vấn.
- Đánh giá ứng viên.
- Xem kết quả AI.

---

# 4. DATABASE CHỈ CÓ 7 BẢNG

Thiết kế đúng 7 bảng sau:

```text
users
jobs
candidates
applications
interviews
evaluations
ai_results
```

Không thêm bảng khác nếu không thực sự cần thiết.

---

# 5. YÊU CẦU CHI TIẾT TỪNG BẢNG

## 5.1. users

Quản lý tài khoản đăng nhập.

Tối thiểu có:

```text
id
full_name
email
password_hash
role
created_at
```

Role:

```text
ADMIN
HR
MANAGER
```

Email phải UNIQUE.

---

## 5.2. jobs

Quản lý vị trí tuyển dụng.

Tối thiểu có:

```text
id
title
department
description
requirements
skills
quantity
status
created_at
```

Status chỉ cần:

```text
OPEN
CLOSED
```

---

## 5.3. candidates

Quản lý ứng viên.

Tối thiểu có:

```text
id
full_name
email
phone
skills
experience
education
source
cv_file
cv_text
created_at
```

Source có thể gồm:

```text
FACEBOOK
LINKEDIN
WEBSITE
REFERRAL
JOB_SITE
OTHER
```

`cv_file` lưu đường dẫn file CV.

`cv_text` lưu nội dung CV đã trích xuất để gửi cho AI.

Không cần bảng candidate_documents riêng.

---

## 5.4. applications

Đây là bảng trung tâm liên kết Candidate và Job.

Tối thiểu có:

```text
id
candidate_id
job_id
status
applied_at
note
```

Status:

```text
NEW
SCREENING
INTERVIEW
PASSED
REJECTED
```

Một ứng viên không được tạo trùng hồ sơ ứng tuyển cho cùng một vị trí.

Cần:

```text
UNIQUE(candidate_id, job_id)
```

---

## 5.5. interviews

Quản lý lịch phỏng vấn.

Tối thiểu có:

```text
id
application_id
interviewer_id
interview_date
location
status
note
created_at
```

`interviewer_id` tham chiếu `users`.

Status:

```text
SCHEDULED
COMPLETED
CANCELLED
```

---

## 5.6. evaluations

Quản lý đánh giá sau phỏng vấn.

Tối thiểu có:

```text
id
application_id
evaluator_id
technical_score
communication_score
experience_score
comment
created_at
```

Điểm từ:

```text
1 đến 5
```

Không tạo bảng evaluation_criteria riêng.

Hệ thống có thể tự tính:

```text
average_score =
(technical_score + communication_score + experience_score) / 3
```

Không cần lưu `average_score` nếu có thể tính khi query.

---

## 5.7. ai_results

Lưu kết quả AI.

Tối thiểu có:

```text
id
application_id
type
content
created_at
```

Type:

```text
CV_SUMMARY
INTERVIEW_QUESTION
EMAIL
```

AI chỉ hỗ trợ.

Không lưu điểm phù hợp hoặc quyết định tuyển dụng.

---

# 6. QUAN HỆ DATABASE

Thiết kế quan hệ như sau:

```text
Candidate
   |
   | 1
   |
   | N
Application
   |
   | N
   |
   | 1
Job
```

Một Candidate có thể ứng tuyển nhiều Job.

Một Job có nhiều Application.

Một Application có thể có nhiều Interview.

Một Application có thể có nhiều Evaluation.

Một Application có thể có nhiều AI Result.

User có thể là interviewer.

User có thể là evaluator.

---

# 7. ERD

Hãy tạo ERD bằng Mermaid.

ERD phải thể hiện:

```text
USERS
JOBS
CANDIDATES
APPLICATIONS
INTERVIEWS
EVALUATIONS
AI_RESULTS
```

Quan hệ mong muốn:

```text
CANDIDATES 1 --- N APPLICATIONS

JOBS 1 --- N APPLICATIONS

APPLICATIONS 1 --- N INTERVIEWS

APPLICATIONS 1 --- N EVALUATIONS

APPLICATIONS 1 --- N AI_RESULTS

USERS 1 --- N INTERVIEWS

USERS 1 --- N EVALUATIONS
```

Không cần liên kết user với jobs nếu không cần thiết.

Ưu tiên ERD đơn giản.

---

# 8. YÊU CẦU MYSQL SCHEMA

Viết file:

```text
schema.sql
```

Schema phải:

- Tạo database.
- Sử dụng UTF8MB4.
- Tạo đúng 7 bảng.
- Có PRIMARY KEY.
- Có FOREIGN KEY.
- Có UNIQUE hợp lý.
- Có INDEX cho trường thường tìm kiếm.
- Có CHECK cho điểm 1–5 nếu MySQL hỗ trợ.
- Có ON DELETE hợp lý.
- Không over-engineering.

Tên database:

```text
ai_recruitment
```

Dùng:

```sql
CREATE DATABASE IF NOT EXISTS ai_recruitment
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

# 9. QUY TẮC FOREIGN KEY

Áp dụng đơn giản:

Candidate bị xóa:

Có thể xóa Applications liên quan bằng CASCADE.

Application bị xóa:

Xóa Interviews, Evaluations và AI Results liên quan.

User không nên bị CASCADE delete khỏi Interview/Evaluation.

Job có Application:

Không nên xóa vật lý dễ dàng.

Có thể dùng RESTRICT.

Ưu tiên giải pháp dễ hiểu khi bảo vệ.

---

# 10. INDEX

Chỉ thêm index thực sự cần:

Candidate:

```text
full_name
email
phone
```

Job:

```text
title
status
```

Application:

```text
candidate_id
job_id
status
```

Interview:

```text
interview_date
```

Không tạo quá nhiều index.

---

# 11. DỮ LIỆU MẪU

Sau phần schema, tạo file:

```text
sample_data.sql
```

Tạo tối thiểu:

### Users

3 tài khoản:

```text
1 ADMIN
1 HR
1 MANAGER
```

Password không cần là password thật nếu chỉ phục vụ SQL demo.

Có thể sử dụng placeholder password hash.

---

### Jobs

Ít nhất 3 vị trí:

```text
Python Developer

Marketing Executive

HR Recruiter
```

---

### Candidates

Ít nhất 5 ứng viên.

Có skills, experience và source khác nhau.

---

### Applications

Ít nhất 5 application với nhiều trạng thái:

```text
NEW
SCREENING
INTERVIEW
PASSED
REJECTED
```

---

### Interviews

Ít nhất 2 lịch.

---

### Evaluations

Ít nhất 2 đánh giá.

---

### AI Results

Ít nhất:

```text
1 CV_SUMMARY

1 INTERVIEW_QUESTION

1 EMAIL
```

Nội dung có thể là demo.

---

# 12. BUSINESS RULES

Hãy chốt các rule đơn giản sau:

BR-001:

Email user là duy nhất.

BR-002:

Một Candidate chỉ có một Application cho cùng một Job.

BR-003:

Application bắt buộc phải liên kết với Candidate và Job.

BR-004:

Interview phải thuộc một Application.

BR-005:

Evaluation phải thuộc một Application.

BR-006:

Điểm Evaluation chỉ từ 1 đến 5.

BR-007:

AI Result phải thuộc một Application.

BR-008:

AI không tự thay đổi trạng thái Application.

BR-009:

AI không tự quyết định PASSED hoặc REJECTED.

BR-010:

Trạng thái ứng viên do HR/Admin cập nhật thủ công.

---

# 13. LUỒNG NGHIỆP VỤ

Tạo flow đơn giản:

```text
Create Job
↓
Create Candidate
↓
Create Application
↓
NEW
↓
SCREENING
↓
AI CV Summary
↓
INTERVIEW
↓
Create Interview
↓
AI Interview Questions
↓
Evaluation
↓
PASSED / REJECTED
↓
AI Email
```

---

# 14. CÁC QUERY DEMO

Viết thêm 8–10 query SQL mẫu để phục vụ demo:

1. Lấy toàn bộ job đang OPEN.
2. Lấy toàn bộ candidate.
3. Tìm candidate theo tên.
4. Tìm candidate theo skill.
5. Lấy applications theo job.
6. Lấy applications theo status.
7. Lấy lịch phỏng vấn của application.
8. Lấy evaluation của candidate.
9. Tính average score.
10. Lấy các AI Result của application.

Các query phải dễ hiểu.

---

# 15. KIỂM TRA SCHEMA

Sau khi thiết kế xong, hãy tự review:

- Có đúng 7 bảng không?
- Có bảng thừa không?
- Có quan hệ thiếu không?
- Có FOREIGN KEY sai không?
- Có CASCADE nguy hiểm không?
- Có dữ liệu nào bị lặp không?
- Có bảng nào khó giải thích cho sinh viên không?
- Có thể triển khai CRUD Flask dễ dàng không?

Nếu có thiết kế quá phức tạp, hãy đơn giản hóa.

---

# 16. OUTPUT FORMAT

Trả kết quả đúng thứ tự:

## PHẦN 1 – M0 Summary

Tóm tắt phạm vi và quyết định thiết kế.

## PHẦN 2 – Entity List

Giải thích ngắn 7 bảng.

## PHẦN 3 – Relationship

Giải thích quan hệ giữa các bảng.

## PHẦN 4 – ERD Mermaid

Code Mermaid hoàn chỉnh.

## PHẦN 5 – schema.sql

Một code block SQL hoàn chỉnh, chạy được từ đầu đến cuối.

## PHẦN 6 – sample_data.sql

Một code block SQL hoàn chỉnh.

## PHẦN 7 – Query Demo

8–10 câu query.

## PHẦN 8 – Business Rules

Danh sách BR-001 → BR-010.

## PHẦN 9 – M0 Validation

Checklist PASS/FAIL.

## PHẦN 10 – Final Verdict

Kết luận:

```text
M0 STATUS: PASS / NOT PASS
```

Nếu PASS, ghi:

```text
Database schema ready for M1 Flask implementation.
```

---

# 17. QUY TẮC QUAN TRỌNG

Không tự mở rộng scope.

Không xây kiến trúc enterprise.

Không thêm nhiều bảng.

Không tự thêm RBAC.

Không thêm Audit Log.

Không thêm Prompt Governance.

Không thêm Vector Database.

Không thêm AI Ranking.

Không thêm workflow phức tạp.

Ưu tiên:

```text
Đơn giản
Dễ code
Dễ demo
Dễ giải thích
Đúng yêu cầu môn học
```

Kết quả cuối cùng phải phù hợp với một project môn học hướng tới khoảng 7–8 điểm, không phải đồ án tốt nghiệp hoặc sản phẩm production.