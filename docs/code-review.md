# Code Review Report — AI Recruitment Management System

- **Mục tiêu dự án:** Đồ án môn học (mức 7–8 điểm).
- **Phạm vi thẩm định:** Toàn bộ mã nguồn backend (Flask), frontend (React 19 + Vite), database (MySQL 8.4) và tài liệu từ M1 đến M6.
- **Tiêu chuẩn rà soát:** Tính đúng đắn (correctness), tuân thủ yêu cầu (requirements compliance), tính toàn vẹn tầng kiến trúc, phân quyền vai trò, bảo vệ dữ liệu và chất lượng bộ kiểm thử.

---

## 1. Bảng Tổng hợp Phát hiện Code Review (Findings Table)

| Mã ID | Vị trí / Tệp tin | Mức độ | Mô tả phát hiện | Nguyên nhân & Ảnh hưởng | Trạng thái / Đề xuất xử lý |
|---|---|---|---|---|---|
| **CR-001** | `backend/database/db.py`<br>`get_dashboard_counts()` | **INFO** | Chỉ số Thời gian tuyển dụng (Time-to-Hire) trả về `available: false`. | Schema bảng `applications` chỉ có `applied_at`, không có cột `completed_at` hay `hired_at`. Không tự ý bịa công thức số liệu giả. | **CHẤP NHẬN (Accepted Limitation):** Thiết kế trung thực, minh bạch đúng theo nguyên tắc AI-SDLC. |
| **CR-002** | `backend/config.py`<br>`SESSION_COOKIE_SAMESITE` | **LOW** | Mặc định Flask không gán tường minh `SESSION_COOKIE_SAMESITE = "Lax"`. | Trong môi trường trình duyệt hiện đại, cookie phiên có thể thiếu thuộc tính Lax rõ ràng trên header Set-Cookie. | **ĐÃ KHẮC PHỤC (M7):** Đã bổ sung `SESSION_COOKIE_SAMESITE = "Lax"` và `SESSION_COOKIE_HTTPONLY = True` vào `Config`. |
| **CR-003** | `README.md` | **MEDIUM** | Nội dung README cũ ghi phạm vi dừng ở M1/M2, 47 tests. | Dự án đã hoàn thành M1–M6 với 136 tests nhưng README chưa được đồng bộ hóa. | **ĐÃ KHẮC PHỤC (M7):** Đã cập nhật đầy đủ các tính năng M1–M6, hướng dẫn chạy và bằng chứng 136 tests. |
| **CR-004** | `backend/database/db.py`<br>`get_connection()` | **LOW** | Kết nối MySQL tạo mới trên mỗi hàm nghiệp vụ (không dùng Connection Pool). | Dự án học phần tải nhẹ (vài người dùng đồng thời), tạo kết nối trực tiếp đảm bảo cô lập đơn giản và tự đóng kết nối an toàn. | **CHẤP NHẬN:** Phù hợp hoàn toàn với quy mô 7–8 điểm; không cần thiết lập SQLAlchemy Pool hay Redis/Celery phức tạp. |
| **CR-005** | `frontend/src/pages/`<br>Candidate, Job, Application | **LOW** | Kiểm tra quyền giao diện dựa trên `user.role` từ session. | Giao diện ẩn nút bấm để tối ưu UX, tuy nhiên nếu client cố tình gọi API thì backend có chặn không? Backend luôn có decorator `@api_role_required`. | **ĐÃ XÁC MINH (PASS):** Backend kiểm tra độc lập tại mọi endpoint thay đổi dữ liệu, trả về HTTP 403 chuẩn xác. |
| **CR-006** | `backend/routes/ai_routes.py` | **INFO** | Các cuộc gọi Gemini AI chạy đồng bộ (synchronous). | Nếu máy chủ Google phản hồi chậm (2–3s), request sẽ chờ. Với quy mô đồ án môn học, không cần đưa thêm Celery/RabbitMQ. | **CHẤP NHẬN:** Đã có xử lý timeout, retry 3 lần, fallback model và thông báo lỗi thân thiện cho người dùng. |
| **CR-007** | `backend/routes/candidate_routes.py`<br>`uploaded_cv()` | **INFO** | Xử lý đường dẫn file CV cũ có tiền tố `uploads/`. | Nhằm tương thích ngược với dữ liệu mẫu seed cũ, route dùng `os.path.basename` để bóc tách an toàn tên file. | **ĐÃ XÁC MINH (PASS):** Vừa đảm bảo tương thích ngược, vừa triệt tiêu hoàn toàn nguy cơ Path Traversal. |

---

## 2. Ma trận Truy vết Yêu cầu - Mã nguồn (Requirement-to-Code Traceability)

| Mã Yêu cầu | Mô tả Nghiệp vụ | Giao diện React | Flask REST Route | Hàm Cơ sở Dữ liệu (`db.py`) | Bảng MySQL | Pytest Suite |
|---|---|---|---|---|---|---|
| **FR-001** | Đăng nhập tài khoản, xác thực mật khẩu hash | `LoginPage.jsx` | `POST /api/auth/login` | `get_user_by_email` | `users` | `test_auth.py` |
| **FR-002** | Đăng xuất, hủy phiên làm việc | `Navbar.jsx` | `POST /api/auth/logout` | Session clear | — | `test_auth.py` |
| **FR-003** | Khôi phục phiên, lấy thông tin đăng nhập | `ProtectedRoute.jsx` | `GET /api/auth/me` | Session user | `users` | `test_auth.py` |
| **FR-004** | Danh sách, tìm kiếm, lọc vị trí tuyển dụng | `JobsPage.jsx` | `GET /api/jobs` | `get_jobs` | `jobs` | `test_jobs.py` |
| **FR-005** | Thêm, sửa, xóa vị trí (chặn xóa nếu có hồ sơ) | `JobFormPage.jsx` | `POST, PUT, DELETE /api/jobs/<id>` | `create_job`, `update_job`, `delete_job` | `jobs`, `applications` | `test_jobs.py` |
| **FR-006** | Danh sách, tìm kiếm, lọc nguồn ứng viên | `CandidatesPage.jsx` | `GET /api/candidates` | `get_candidates` | `candidates` | `test_candidates.py` |
| **FR-007** | Thêm, sửa, xóa ứng viên & upload CV UUID | `CandidateFormPage.jsx` | `POST, PUT, DELETE /api/candidates/<id>` | `create_candidate`, `update_candidate`, `delete_candidate` | `candidates`, `applications` | `test_candidates.py` |
| **FR-008** | Tải và xem nội dung file CV ứng viên an toàn | `CandidateDetailPage.jsx` | `GET /uploads/<filename>` | `send_from_directory` | `candidates` | `test_candidates.py` |
| **FR-009** | Tạo hồ sơ ứng tuyển, chống trùng lặp (409) | `ApplicationCreatePage.jsx` | `POST /api/applications` | `create_application`, `application_exists` | `applications` | `test_applications.py` |
| **FR-010** | Quản lý vòng đời trạng thái hồ sơ ứng tuyển | `ApplicationDetailPage.jsx` | `PUT /api/applications/<id>/status` | `update_application_status` | `applications` | `test_applications.py` |
| **FR-011** | Lập lịch phỏng vấn & cập nhật trạng thái | `InterviewsPage.jsx`, `InterviewFormPage.jsx` | `GET, POST, PUT /api/interviews*` | `get_interviews`, `create_interview`, `update_interview_status` | `interviews`, `users` | `test_interviews.py` |
| **FR-012** | Đánh giá ứng viên (3 điểm 1–5, tính điểm TB) | `EvaluationFormPage.jsx` | `GET, POST, PUT /api/evaluations*` | `create_evaluation`, `update_evaluation`, `get_evaluations` | `evaluations`, `users` | `test_evaluations.py` |
| **FR-013** | AI Tóm tắt CV so với yêu cầu vị trí | `ApplicationDetailPage.jsx` | `POST /api/ai/cv-summary` | `create_ai_result` | `ai_results` | `test_ai.py` |
| **FR-014** | AI Gợi ý câu hỏi phỏng vấn theo CV & JD | `ApplicationDetailPage.jsx` | `POST /api/ai/interview-questions` | `create_ai_result` | `ai_results` | `test_ai.py` |
| **FR-015** | AI Soạn bản thảo email mời PV / kết quả | `ApplicationDetailPage.jsx` | `POST /api/ai/email` | `create_ai_result` | `ai_results` | `test_ai.py` |
| **FR-016** | Xem lịch sử kết quả AI sinh ra | `ApplicationDetailPage.jsx` | `GET /api/applications/<id>/ai-results` | `get_ai_results_by_application` | `ai_results` | `test_ai.py` |
| **FR-017** | Dashboard thống kê chỉ số thực tế từ MySQL | `DashboardPage.jsx` | `GET /api/dashboard` | `get_dashboard_counts` | `jobs`, `candidates`, `applications`, `interviews` | `test_dashboard.py` |
| **FR-018** | Tìm kiếm đa điều kiện & ký tự đặc biệt | Search controls trên các trang | Tham số `keyword`, `status`, `source` | Parameterized SQL trong `db.py` | Các bảng tương ứng | `test_search.py` |
| **FR-019** | Kiểm tra trạng thái hoạt động hệ thống | Giao diện kiểm thử | `GET /api/health` | `SELECT 1` | Database connection | `test_auth.py` |

---

## 3. Thẩm định Kiến trúc Đa tầng (Architectural Layer Audit)

1. **Tầng Giao diện (Presentation Layer - React 19 + Vite):**
   - Sử dụng React Router v6 điều hướng SPA sạch sẽ.
   - Tách biệt rõ ràng giữa Trang (`pages/`), Thành phần giao diện (`components/`), và Tầng gọi dịch vụ (`services/api.js`).
   - Không chứa bất kỳ câu truy vấn cơ sở dữ liệu hoặc khóa API nhạy cảm nào.
   - Tự động mã hóa an toàn qua JSX, không sử dụng `dangerouslySetInnerHTML`.
2. **Tầng Điều khiển REST API (Routing Layer - Flask Blueprints):**
   - Mỗi phân hệ nghiệp vụ sở hữu một Blueprint riêng biệt (`auth_bp`, `job_bp`, `candidate_bp`, `application_bp`, `interview_bp`, `evaluation_bp`, `ai_bp`).
   - Kiểm tra xác thực bằng decorator `@api_login_required` và phân quyền bằng `@api_role_required("ADMIN", "HR", ...)`.
   - Trả về cấu trúc JSON chuẩn hóa: `{ "success": boolean, "data": ..., "message": ... }`.
3. **Tầng Dịch vụ AI (Domain / Service Layer):**
   - Tách biệt thành 2 tầng: `ai_service.py` phụ trách logic nghiệp vụ, chuẩn bị ngữ cảnh từ database; `gemini_service.py` phụ trách giao tiếp với Google GenAI SDK.
   - Đảm bảo ranh giới cô lập tuyệt đối: Thao tác AI không bao giờ chỉnh sửa trạng thái ứng tuyển hoặc tự động tuyển dụng.
4. **Tầng Truy xuất Dữ liệu (Data Access Layer - `db.py`):**
   - Toàn bộ 100% các câu lệnh truy vấn có nhận tham số đầu vào từ người dùng đều sử dụng cú pháp tham số hóa (`%s`) qua thư viện `mysql-connector-python`.
   - Quản lý tài nguyên chuẩn xác với khối `try ... finally` để luôn đóng `cursor` và `connection`.

---

## 4. Kiểm tra Tính toàn vẹn Cơ sở Dữ liệu (Database Integrity Audit)

Hệ thống cam kết và duy trì **đúng 7 bảng** trong MySQL:
```text
1. users
2. jobs
3. candidates
4. applications
5. interviews
6. evaluations
7. ai_results
```
- **Không có bảng thứ 8:** Đã xác minh trực tiếp bằng lệnh `SHOW TABLES;` trên MySQL Community Server 8.4.
- **Ràng buộc khóa ngoại và toàn vẹn dữ liệu:**
  - `applications`: Khóa ngoại trỏ về `candidates(id)` (ON DELETE CASCADE) và `jobs(id)` (ON DELETE RESTRICT). Ràng buộc UNIQUE `(candidate_id, job_id)` ngăn chặn hồ sơ trùng lặp.
  - `interviews`: Khóa ngoại trỏ về `applications(id)` và `users(id)`.
  - `evaluations`: Khóa ngoại trỏ về `applications(id)` và `users(id)`. Ràng buộc CHECK kiểm soát điểm số 1–5 (`chk_evaluations_technical`, v.v.).
  - `ai_results`: Khóa ngoại trỏ về `applications(id)` (ON DELETE CASCADE).

---

## 5. Thẩm định Cô lập Mã nguồn Cũ (Legacy Isolation Audit)

- Toàn bộ các file HTML Jinja template và static CSS/JS từ giai đoạn ban đầu đã được chuyển vào thư mục `legacy/`.
- `backend/app.py` không đăng ký thư mục templates của Jinja, không gọi `render_template`. Toàn bộ giao tiếp đều qua REST JSON API.
- Không có sự phụ thuộc chéo giữa `frontend/` và `legacy/`.

---

## 6. Giới hạn Dự án được Chấp thuận (Accepted Limitations — Scope 7–8 Điểm)

1. **Thời gian tuyển dụng (Time-to-Hire):** Schema cơ sở dữ liệu chỉ lưu trữ `applied_at` trong bảng `applications`. Do không có cột ghi nhận thời điểm hoàn thành quy trình tuyển dụng, hệ thống thông báo minh bạch dữ liệu chưa đủ để tính toán thay vì tạo số liệu giả lập.
2. **Quản lý Phiên làm việc (Session Management):** Dự án sử dụng Cookie Session có chữ ký số của Flask (`HttpOnly`, `SameSite=Lax`) được lưu trữ tại trình duyệt, phù hợp hoàn hảo với ứng dụng web nguyên khối quy mô vừa và nhỏ.
3. **Cơ chế gọi AI đồng bộ:** Tác vụ gọi Gemini API chạy đồng bộ trong giới hạn timeout có cơ chế tự động thử lại (retry 3 lần) và fallback model.
