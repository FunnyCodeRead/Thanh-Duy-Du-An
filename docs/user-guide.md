# User Guide — M1/M2

## Sign in

Open `http://127.0.0.1:5173`, enter a demo account and choose **Đăng nhập**. A valid session opens Dashboard. Use **Đăng xuất** in the top bar to clear the session.

## Dashboard

Dashboard displays live counts for Jobs, Candidates, Applications and Interviews. The Job, Candidate, and Application cards can be clicked to navigate directly to their respective management views.

## Applications

Choose **Hồ sơ ứng tuyển** from the sidebar or click the Applications card on Dashboard:
- **Search & Filter:** Search by candidate name, candidate email, or job title. Filter by job position or recruitment status (`NEW`, `SCREENING`, `INTERVIEW`, `PASSED`, `REJECTED`).
- **Create Application:** ADMIN and HR can choose **+ Tạo hồ sơ ứng tuyển**, select an existing candidate, select an existing job, and add an optional recruitment note. Duplicate candidate-job pairs are prevented and display a clear notification. MANAGER users cannot create applications.
- **View Detail:** Click **Chi tiết** on any application to view Candidate Information (including CV link), Job Information, and Application Information.
- **Status Workflow:** ADMIN and HR can progress an application forward through the allowed transitions:
  - `NEW` -> `SCREENING` or `REJECTED`
  - `SCREENING` -> `INTERVIEW` or `REJECTED`
  - `INTERVIEW` -> `PASSED` or `REJECTED`
  - Once marked `PASSED` or `REJECTED`, the application reaches its final state and cannot transition further.
- **Role Restrictions:** MANAGER users have read-only access to view application lists and details; mutation buttons and status update dropdowns are hidden and blocked by the backend.

## Jobs

Choose **Vị trí tuyển dụng** to search by title, department or skills and filter by `OPEN`/`CLOSED`. ADMIN and HR can create, view, edit and delete. MANAGER can only view. A Job already used by an Application cannot be deleted.

## Candidates

Choose **Ứng viên** to search by name, email, phone or skills and filter by source. ADMIN and HR can create, view, edit and delete. MANAGER can only view. A Candidate already used by an Application cannot be deleted.

## CV files

On Candidate create/edit, select a PDF, DOC or DOCX file up to 10 MB. PDF and DOCX text extraction is attempted automatically. Existing CV remains unchanged when editing without choosing a replacement. **Xem CV** requires an active session.

## Common errors

- `401`: sign in again because the session is missing or expired.
- `403`: the current role cannot perform that mutation.
- `409`: the record is referenced by an Application and cannot be deleted, or the candidate already applied for this job.
- Upload rejected: verify the extension and 10 MB size limit.

