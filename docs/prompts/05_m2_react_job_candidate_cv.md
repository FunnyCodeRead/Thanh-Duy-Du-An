# M2 – REACT FRONTEND + JOB/CANDIDATE CRUD

## Migration frontend
- React
- Vite
- JavaScript
- React Router
- Bootstrap
- Fetch API

Không dùng Jinja làm frontend chính. Legacy Jinja chuyển vào `legacy/`, không active.

## Pages
- Login
- Dashboard
- Jobs
- Candidates

## Jobs
- list
- create
- edit
- delete
- detail
- search
- filter OPEN/CLOSED

## Candidates
- list
- create
- edit
- delete
- detail
- search
- source filter

## CV
- upload PDF/DOC/DOCX
- max 10MB
- secure filename / UUID
- extract PDF/DOCX text
- lưu `cv_file`
- lưu `cv_text`
- authenticated CV access

MANAGER: read-only.

Không được xóa Job/Candidate đã có Application. Trả HTTP 409.

## Verification
Run:
- pytest
- frontend lint
- frontend build
- real MySQL CRUD
- browser verification
