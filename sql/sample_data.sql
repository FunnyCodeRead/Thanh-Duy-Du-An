USE ai_recruitment;

-- Tat ca tai khoan demo dung mat khau: 123456
-- Hash duoc tao boi werkzeug.security.generate_password_hash().
INSERT INTO users (id, full_name, email, password_hash, role) VALUES
(1, 'Quản trị viên', 'admin@example.com', 'scrypt:32768:8:1$M7D2kGkVhYv3x8Av$4a2423faa6db50d88e37d3021c51f38e7d86a0524acb36ef6598128b1281b5a88bc4a74492219545607e0ddfeb1aee055c680015c92e5ee74b2d80afeb40dc9b', 'ADMIN'),
(2, 'Nhân viên HR', 'hr@example.com', 'scrypt:32768:8:1$LkKVthkYLdzkXcSi$51658f6674b00025d0ed2fc367796fe404e6e94b7b54f0f75640f18da2f92048a91a3cfef8742ad63556f2992e8fc33ff5f045e74f8d7b4f12bb4b8176e9f05b', 'HR'),
(3, 'Quản lý tuyển dụng', 'manager@example.com', 'scrypt:32768:8:1$rC1y8tF1KvhtSR5z$2bb13d47fca8a4fcb279a5d1b625f8ca593c41f1fe4f6c4be5a0c46e02545c832e5113e1d52a1845d0d18da7e48250a6a26fd345bc528c3c3c4db918c42ccb78', 'MANAGER')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role);

INSERT INTO jobs (id, title, department, description, requirements, skills, quantity, status) VALUES
(1, 'Python Developer', 'Engineering', 'Phát triển ứng dụng web nội bộ.', 'Có kiến thức Python và cơ sở dữ liệu.', 'Python, Flask, MySQL', 2, 'OPEN'),
(2, 'Marketing Executive', 'Marketing', 'Thực hiện chiến dịch digital marketing.', 'Có kỹ năng viết nội dung và phân tích.', 'Content, SEO, Analytics', 1, 'OPEN'),
(3, 'HR Recruiter', 'Human Resources', 'Tuyển dụng và hỗ trợ hội nhập nhân sự.', 'Giao tiếp tốt, hiểu quy trình tuyển dụng.', 'Recruitment, Communication', 1, 'CLOSED')
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO candidates (id, full_name, email, phone, skills, experience, education, source, cv_file, cv_text) VALUES
(1, 'Nguyễn Văn An', 'an.nguyen@example.com', '0901000001', 'Python, Flask, MySQL', '2 năm phát triển web', 'Đại học CNTT', 'LINKEDIN', 'uploads/an-nguyen.pdf', 'Lập trình viên Python với 2 năm kinh nghiệm Flask.'),
(2, 'Trần Thị Bình', 'binh.tran@example.com', '0901000002', 'SEO, Content', '3 năm digital marketing', 'Đại học Kinh tế', 'FACEBOOK', 'uploads/binh-tran.pdf', 'Chuyên viên marketing có kinh nghiệm SEO và nội dung.'),
(3, 'Lê Minh Châu', 'chau.le@example.com', '0901000003', 'Recruitment, Communication', '2 năm tuyển dụng', 'Đại học Lao động', 'JOB_SITE', 'uploads/chau-le.pdf', 'Chuyên viên tuyển dụng trong lĩnh vực công nghệ.'),
(4, 'Phạm Gia Dũng', 'dung.pham@example.com', '0901000004', 'Python, Django, PostgreSQL', '1 năm backend', 'Cao đẳng CNTT', 'WEBSITE', 'uploads/dung-pham.pdf', 'Backend developer sử dụng Python và SQL.'),
(5, 'Võ Thu Hà', 'ha.vo@example.com', '0901000005', 'Flask, JavaScript, Git', 'Fresher', 'Đại học Bách khoa', 'REFERRAL', 'uploads/ha-vo.pdf', 'Sinh viên mới tốt nghiệp có dự án Flask cá nhân.')
ON DUPLICATE KEY UPDATE full_name = VALUES(full_name);

INSERT INTO applications (id, candidate_id, job_id, status, note) VALUES
(1, 1, 1, 'SCREENING', 'CV phù hợp để sàng lọc.'),
(2, 2, 2, 'NEW', 'Hồ sơ mới nhận.'),
(3, 3, 3, 'PASSED', 'Đã hoàn tất quy trình.'),
(4, 4, 1, 'INTERVIEW', 'Đã hẹn phỏng vấn.'),
(5, 5, 1, 'REJECTED', 'Kinh nghiệm chưa phù hợp.')
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note);

INSERT INTO interviews (id, application_id, interviewer_id, interview_date, location, status, note) VALUES
(1, 4, 3, '2026-10-01 09:00:00', 'Phòng họp A', 'SCHEDULED', 'Phỏng vấn kỹ thuật.'),
(2, 3, 3, '2026-09-20 14:00:00', 'Phòng họp B', 'COMPLETED', 'Ứng viên thể hiện tốt.')
ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note);

INSERT INTO evaluations (id, application_id, evaluator_id, technical_score, communication_score, experience_score, comment) VALUES
(1, 3, 3, 4, 5, 4, 'Giao tiếp tốt và có kinh nghiệm phù hợp.'),
(2, 4, 3, 4, 3, 3, 'Kiến thức kỹ thuật khá, cần cải thiện giao tiếp.')
ON DUPLICATE KEY UPDATE comment = VALUES(comment);

INSERT INTO ai_results (id, application_id, type, content) VALUES
(1, 1, 'CV_SUMMARY', 'Ứng viên có 2 năm kinh nghiệm Python và phù hợp vòng sàng lọc.'),
(2, 4, 'INTERVIEW_QUESTION', 'Hãy mô tả một dự án Flask và cách bạn xử lý lỗi cơ sở dữ liệu.'),
(3, 3, 'EMAIL', 'Tiêu đề: Thông báo kết quả. Nội dung: Chúc mừng bạn đã vượt qua vòng phỏng vấn.')
ON DUPLICATE KEY UPDATE content = VALUES(content);

