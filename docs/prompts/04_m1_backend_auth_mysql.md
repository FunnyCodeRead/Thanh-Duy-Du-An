# M1 – BACKEND FOUNDATION

Implement:
- Flask REST API
- MySQL
- Flask Session authentication

## API
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

## Yêu cầu
- email/password login
- Werkzeug password hash
- `session.clear()` khi login
- HttpOnly cookie
- SameSite=Lax
- role ADMIN/HR/MANAGER

Backend authorization decorator.

ADMIN: full access.  
HR: recruitment operations.  
MANAGER: mostly read-only, interview/evaluation permissions theo requirement.

Tạo health endpoint:
`GET /api/health`

Kiểm tra MySQL connection.

Viết pytest.

Không hard-code secrets. Dùng `.env`.

Không JWT. Không thêm bảng.
