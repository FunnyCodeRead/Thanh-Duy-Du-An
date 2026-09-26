# AI Recruitment Management System — React + Flask REST + MySQL 8.4

Ứng dụng quản lý tuyển dụng tích hợp trợ lý AI Google Gemini cho phạm vi dự án học phần. Kiến trúc hệ thống bao gồm React 19 + Vite ở frontend, Flask REST API ở backend và MySQL Community Server 8.4. Giao diện Jinja cũ đã được lưu trữ trong `legacy/` và không còn tham gia vào luồng thực thi chính.

---

## 1. Chức năng hệ thống (M1 – M6)

- **Xác thực & Phân quyền (M1):** Đăng nhập/đăng xuất qua Flask Session (`HttpOnly; SameSite=Lax`), khôi phục phiên qua `/api/auth/me`. Phân quyền 3 vai trò: `ADMIN`, `HR`, `MANAGER` được kiểm soát chặt chẽ tại tầng API.
- **Quản lý Vị trí Tuyển dụng (M2):** CRUD vị trí (Job), tìm kiếm theo từ khóa, lọc theo trạng thái (`OPEN`/`CLOSED`), bảo vệ toàn vẹn dữ liệu (chặn xóa vị trí đã có hồ sơ ứng tuyển).
- **Quản lý Ứng viên & CV (M2):** CRUD ứng viên (Candidate), tìm kiếm họ tên/email/kỹ năng, lọc theo nguồn (`FACEBOOK`, `LINKEDIN`, `WEBSITE`, v.v.), upload CV (PDF/DOC/DOCX tối đa 10 MB, lưu tên định danh UUID, chặn path traversal), tự động trích xuất text từ CV PDF và DOCX. Chặn xóa ứng viên đã có hồ sơ ứng tuyển.
- **Quản lý Hồ sơ Ứng tuyển (M3):** Tạo hồ sơ ứng tuyển liên kết ứng viên với vị trí tuyển dụng, chống trùng lặp ứng viên trên cùng một vị trí (HTTP 409). Quản lý vòng đời trạng thái nghiêm ngặt:
  `NEW` → `SCREENING` → `INTERVIEW` → `PASSED` / `REJECTED`.
- **Quản lý Lịch Phỏng vấn (M4):** Lập lịch phỏng vấn, phân công người phỏng vấn từ danh sách người dùng nội bộ, quản lý trạng thái (`SCHEDULED` → `COMPLETED` / `CANCELLED`), chống đảo ngược trạng thái từ hoàn thành/hủy về lại lịch hẹn (HTTP 400). Quản lý quyền: MANAGER chỉ hoàn thành lịch phỏng vấn của chính mình.
- **Đánh giá Ứng viên (M4):** Nhập điểm đánh giá độc lập theo 3 tiêu chí từ 1 đến 5 (Chuyên môn, Giao tiếp, Kinh nghiệm), tự động tính điểm trung bình số học `(t+c+e)/3` làm tròn 2 chữ số thập phân tại runtime. Quyền sửa đánh giá chỉ dành cho chính người đánh giá hoặc ADMIN.
- **Trợ lý AI Google Gemini (M5):**
  1. *AI CV Summary*: Tóm tắt năng lực ứng viên so với bản mô tả công việc (4 phần cấu trúc).
  2. *AI Interview Questions*: Gợi ý 5 câu hỏi phỏng vấn có trọng tâm dựa trên CV và JD.
  3. *AI Email Draft*: Soạn bản thảo thư mời phỏng vấn và thông báo kết quả (Tiếng Việt).
  4. *AI Results History*: Lưu trữ lịch sử sinh nội dung vào bảng `ai_results`.
  *Nguyên tắc an toàn:* AI đóng vai trò hỗ trợ quyết định (decision-support); không bao giờ tự động thay đổi trạng thái hồ sơ, không xếp hạng ứng viên và không gửi email thực tế.
- **Dashboard Thống kê & Tìm kiếm (M6):**
  - Thống kê tổng hợp: Tổng vị trí mở, tổng vị trí, tổng ứng viên, tổng hồ sơ, số lịch phỏng vấn sắp tới.
  - Phân bố trạng thái hồ sơ ứng tuyển (đầy đủ 5 trạng thái).
  - Cơ cấu nguồn ứng viên với thanh tiến trình trực quan.
  - Tỷ lệ tuyển dụng thành công (`PASSED / (PASSED + REJECTED) * 100%`).
  - Danh sách 5 buổi phỏng vấn sắp diễn ra gần nhất.
  - Công bố giới hạn dữ liệu rõ ràng đối với chỉ số Thời gian tuyển dụng (Time-to-Hire) do schema hiện tại chỉ lưu `applied_at` mà không lưu thời điểm hoàn thành.
  - Hệ thống tìm kiếm và bộ lọc kết hợp trên tất cả các danh sách với câu lệnh SQL được tham số hóa toàn diện.

---

## 2. Cấu trúc Dự án

```text
ai-recruitment/
├── backend/                  # Flask REST API, Business Logic, Tests
│   ├── app.py                # Điểm khởi động ứng dụng Flask & route handlers
│   ├── config.py             # Cấu hình môi trường & session cookies
│   ├── database/             # Kết nối MySQL & hàm truy vấn dữ liệu (db.py)
│   ├── prompts/              # Prompt templates cho Google Gemini AI
│   ├── routes/               # Blueprints REST API (auth, jobs, candidates, applications, interviews, evaluations, ai)
│   ├── services/             # AI service & Gemini API client
│   ├── tests/                # Bộ kiểm thử tự động pytest (136 tests)
│   ├── uploads/              # Thư mục lưu trữ CV upload (UUID-named)
│   └── requirements.txt      # Thư viện phụ thuộc Python
├── frontend/                 # Giao diện người dùng React 19 + Vite + Bootstrap
│   ├── src/
│   │   ├── pages/            # Dashboard, Jobs, Candidates, Applications, Interviews, Login
│   │   ├── components/       # Layout, Navbar, ProtectedRoute, FilterBar, AI Modals
│   │   └── services/         # API client module giao tiếp Flask
│   ├── package.json          # Thư viện phụ thuộc Node.js & scripts
│   └── vite.config.js        # Cấu hình Vite & proxy /api, /uploads
├── sql/                      # Cơ sở dữ liệu MySQL
│   ├── schema.sql            # Định nghĩa 7 bảng dữ liệu chuẩn hóa
│   └── sample_data.sql       # Dữ liệu khởi tạo mẫu
├── docs/                     # Tài liệu thiết kế, API, kiểm thử, AI-SDLC và Human Gates
├── legacy/                   # Mã nguồn Jinja template cũ (lưu trữ đối chiếu)
└── scripts/                  # Script khởi động môi trường local
```

---

## 3. Cơ sở dữ liệu: Đúng 7 Bảng

Hệ thống duy trì nghiêm ngặt **đúng 7 bảng** trong MySQL:
1. `users`: Tài khoản người dùng nội bộ (`ADMIN`, `HR`, `MANAGER`).
2. `jobs`: Vị trí tuyển dụng và yêu cầu công việc.
3. `candidates`: Hồ sơ ứng viên và nội dung CV trích xuất.
4. `applications`: Hồ sơ ứng tuyển kết nối Candidate và Job, quản lý trạng thái.
5. `interviews`: Lịch phỏng vấn và trạng thái buổi phỏng vấn.
6. `evaluations`: Điểm đánh giá (1–5) và nhận xét của người phỏng vấn.
7. `ai_results`: Lịch sử lưu trữ các nội dung do Gemini AI sinh ra.

---

## 4. Hướng dẫn Cài đặt & Khởi chạy

### Yêu cầu tiên quyết
- Python 3.11+
- Node.js 20+
- MySQL Community Server 8.0+

### Bước 1: Khởi động MySQL & Nạp Dữ liệu
```powershell
# Khởi động dịch vụ MySQL (nếu cần)
powershell -ExecutionPolicy RemoteSigned -File scripts\start_mysql.ps1

# Tạo database và nạp schema + dữ liệu mẫu
mysql -u root -p < sql\schema.sql
mysql -u root -p ai_recruitment < sql\sample_data.sql
```

### Bước 2: Cài đặt và Chạy Backend (Flask)
```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt

# Cấu hình file .env từ .env.example
Copy-Item .env.example .env
# Chỉnh sửa backend/.env: điền mật khẩu MySQL và GEMINI_API_KEY (nếu dùng AI)

# Khởi tạo tài khoản người dùng ban đầu
python seed_users.py

# Chạy Flask REST server
python app.py
```
API chạy tại: `http://127.0.0.1:5000`  
Health check: `http://127.0.0.1:5000/api/health`

### Bước 3: Cài đặt và Chạy Frontend (React)
Mở một cửa sổ dòng lệnh riêng:
```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```
Giao diện chạy tại: `http://127.0.0.1:5173` (hoặc `http://localhost:5173`). Vite tự động chuyển tiếp request `/api` và `/uploads` tới Flask.

---

## 5. Tài khoản Demo

| Email | Mật khẩu | Vai trò | Quyền hạn |
|---|---|---|---|
| `admin@example.com` | `123456` | ADMIN | Toàn quyền quản trị hệ thống, sửa mọi đánh giá, tạo/sửa mọi module |
| `hr@example.com` | `123456` | HR | Toàn quyền tuyển dụng (Job, Candidate, Application, Interview, AI, Đánh giá) |
| `manager@example.com` | `123456` | MANAGER | Xem Dashboard/Job/Candidate/Application/AI; chỉ cập nhật phỏng vấn được gán; đánh giá ứng viên |

*Lưu ý: Mật khẩu `123456` chỉ phục vụ mục đích demo học tập trong môi trường cục bộ.*

---

## 6. Kiểm thử Tự động & Chất lượng Mã nguồn

```powershell
# Chạy toàn bộ 136 bài kiểm thử tự động backend
cd backend
pytest -v

# Kiểm tra chất lượng mã nguồn frontend (oxlint)
cd ..\frontend
npm run lint

# Build frontend production bundle
npm run build
```

**Kết quả kiểm tra hiện tại:**
- Backend automated tests: **136 passed, 0 failed** trong ~3.5s.
- Frontend static lint: **0 warnings, 0 errors** trên 24 tệp.
- Frontend production build: **46 modules transformed thành công**.
- Database verification: **Đúng 7 bảng trong MySQL 8.4**.
