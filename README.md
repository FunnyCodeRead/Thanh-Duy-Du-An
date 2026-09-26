# AI Recruitment Management System — M2

Project hiện có nền tảng Flask/MySQL, authentication bằng session và CRUD truyền thống cho vị trí tuyển dụng, ứng viên.

## M2 Features

- Job CRUD, tìm theo tên/phòng ban/kỹ năng và lọc trạng thái.
- Candidate CRUD, tìm theo tên/email/điện thoại/kỹ năng và lọc nguồn.
- Upload CV định dạng PDF, DOC, DOCX; giới hạn 5 MB và đặt tên bằng UUID.
- Trích xuất text từ PDF/DOCX vào `candidates.cv_text`; DOC cũ chỉ được lưu file.
- ADMIN và HR được tạo/sửa/xóa; MANAGER chỉ được xem.
- Không cho xóa Job hoặc Candidate đã có Application.

## Yêu cầu

- Python 3.11+
- MySQL Server 8+

## Cài đặt

```powershell
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
Copy-Item .env.example .env
```

Cập nhật thông tin MySQL và `SECRET_KEY` trong `.env`. Sau đó import schema và dữ liệu mẫu:

```powershell
mysql -u root -p < sql/schema.sql
mysql -u root -p ai_recruitment < sql/sample_data.sql
```

Nếu không import user mẫu, tạo ba user demo bằng Werkzeug sau khi đã import schema:

```powershell
python seed_users.py
```

## Chạy ứng dụng

```powershell
python app.py
```

Mở <http://127.0.0.1:5000>. Kiểm tra MySQL tại <http://127.0.0.1:5000/health>.

Trên máy hiện tại MySQL chạy ở user level vì phiên cài đặt không có quyền Administrator để đăng ký Windows Service. Sau khi khởi động lại Windows, chạy:

```powershell
powershell -ExecutionPolicy RemoteSigned -File scripts\start_mysql.ps1
```

## Tài khoản demo

| Email | Mật khẩu | Role |
|---|---|---|
| `admin@example.com` | `123456` | ADMIN |
| `hr@example.com` | `123456` | HR |
| `manager@example.com` | `123456` | MANAGER |

Chỉ dùng các tài khoản trên cho môi trường học tập/local.

## Routes M1

| Route | Mô tả |
|---|---|
| `/` | Điều hướng theo trạng thái đăng nhập |
| `/login` | Đăng nhập |
| `/logout` | Xóa session và đăng xuất |
| `/dashboard` | Dashboard cần đăng nhập |
| `/health` | Kiểm tra kết nối MySQL |
| `/admin-only` | Demo role ADMIN |
| `/recruitment-demo` | Demo role ADMIN hoặc HR |
| `/jobs` | Danh sách, tìm kiếm và lọc vị trí |
| `/jobs/add` | Thêm vị trí |
| `/candidates` | Danh sách, tìm kiếm và lọc ứng viên |
| `/candidates/add` | Thêm ứng viên và upload CV |

## Kiểm thử

Authentication tests dùng mock cho thao tác database nên không phụ thuộc database production:

```powershell
pytest -q
```

Luồng kết nối dễ giải thích:

```text
.env → config.py → database/db.py:get_connection() → mysql.connector → MySQL
```

Luồng đăng nhập:

```text
Form → POST /login → SELECT user bằng query có parameter
→ check_password_hash() → Flask session → dashboard
```

Phân quyền dùng `users.role`, `session["role"]` và decorator `@role_required(...)`; không dùng RBAC framework vì M1 chỉ có ba role cố định.
