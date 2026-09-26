# User Guide — M1/M2

## Sign in

Open `http://127.0.0.1:5173`, enter a demo account and choose **Đăng nhập**. A valid session opens Dashboard. Use **Đăng xuất** in the top bar to clear the session.

## Dashboard

Dashboard displays live counts for Jobs, Candidates, Applications and Interviews. Application and Interview management remain later milestones.

## Jobs

Choose **Vị trí tuyển dụng** to search by title, department or skills and filter by `OPEN`/`CLOSED`. ADMIN and HR can create, view, edit and delete. MANAGER can only view. A Job already used by an Application cannot be deleted.

## Candidates

Choose **Ứng viên** to search by name, email, phone or skills and filter by source. ADMIN and HR can create, view, edit and delete. MANAGER can only view. A Candidate already used by an Application cannot be deleted.

## CV files

On Candidate create/edit, select a PDF, DOC or DOCX file up to 10 MB. PDF and DOCX text extraction is attempted automatically. Existing CV remains unchanged when editing without choosing a replacement. **Xem CV** requires an active session.

## Common errors

- `401`: sign in again because the session is missing or expired.
- `403`: the current role cannot perform that mutation.
- `409`: the record is referenced by an Application and cannot be deleted.
- Upload rejected: verify the extension and 10 MB size limit.
