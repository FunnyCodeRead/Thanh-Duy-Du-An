# AI Recruitment Management System — React + Flask REST

Ứng dụng quản lý tuyển dụng cho phạm vi M1/M2, dùng React + Vite ở frontend, Flask REST API ở backend và MySQL 8. Phần Jinja cũ đã được lưu trong `legacy/` và không còn là giao diện chạy chính. M3 (Application, Interview, Evaluation, Gemini) chưa được triển khai.

## Chức năng hiện có

- Đăng nhập/đăng xuất bằng Flask Session và khôi phục phiên qua `/api/auth/me`.
- Phân quyền `ADMIN`, `HR`, `MANAGER`; backend luôn kiểm tra quyền.
- Dashboard đọc số liệu thật từ MySQL.
- Job CRUD, tìm kiếm, lọc trạng thái và chặn xóa khi đã có Application.
- Candidate CRUD, tìm kiếm, lọc nguồn và chặn xóa khi đã có Application.
- Upload PDF/DOC/DOCX tối đa 10 MB bằng tên UUID; trích xuất text PDF/DOCX.
- React Router, giao diện Bootstrap và Vite proxy `/api`, `/uploads` sang Flask.

## Cấu trúc

```text
backend/       Flask REST API, database, uploads, pytest
frontend/      React + Vite
sql/           schema và dữ liệu mẫu cho đúng 7 bảng
docs/          yêu cầu, kiến trúc, API, kiểm thử, hướng dẫn
legacy/        templates và static Jinja đã ngừng sử dụng
scripts/       script khởi động MySQL local
```

## Yêu cầu

- Python 3.11+
- Node.js 20+
- MySQL Community Server 8+

## 1. MySQL

Trên máy hiện tại MySQL chạy ở user level. Sau khi khởi động lại Windows:

```powershell
powershell -ExecutionPolicy RemoteSigned -File scripts\start_mysql.ps1
```

Khởi tạo lại database khi cần:

```powershell
mysql -u root -p < sql\schema.sql
mysql -u root -p ai_recruitment < sql\sample_data.sql
```

## 2. Backend

```powershell
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
python seed_users.py
python app.py
```

Điền thông tin MySQL và `SECRET_KEY` trong `backend/.env`. API chạy tại <http://127.0.0.1:5000>; health check: <http://127.0.0.1:5000/api/health>.

## 3. Frontend

Mở terminal khác:

```powershell
cd frontend
npm install
npm run dev -- --host 127.0.0.1
```

Mở <http://127.0.0.1:5173>. Vite tự chuyển tiếp request `/api` và `/uploads` đến Flask.

## Tài khoản demo

| Email | Mật khẩu | Role |
|---|---|---|
| `admin@example.com` | `123456` | ADMIN |
| `hr@example.com` | `123456` | HR |
| `manager@example.com` | `123456` | MANAGER |

Các tài khoản này chỉ dành cho môi trường học tập/local.

## Kiểm thử

```powershell
cd backend
pytest -q

cd ..\frontend
npm run lint
npm run build
```

Kết quả xác minh gần nhất: backend `47 passed`, frontend lint sạch và production build thành công. Chi tiết nằm trong `docs/test-report.md`.

## Tài liệu

- `docs/architecture.md` — kiến trúc và traceability.
- `docs/api.md` — hợp đồng REST API.
- `docs/database-design.md` — thiết kế 7 bảng giữ nguyên.
- `docs/test-plan.md`, `docs/test-report.md` — kế hoạch và bằng chứng kiểm thử.
- `docs/user-guide.md` — hướng dẫn sử dụng.
- `docs/ai-sdlc-report.md` — báo cáo AI-Augmented SDLC.
