# User Guide — AI Recruitment System (M1–M4)

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
- **Interview & Evaluation sections:** Application detail displays the list of scheduled/completed interviews and all evaluations with runtime average scores, along with quick actions to schedule interviews or add evaluations.
- **Role Restrictions:** MANAGER users have read-only access to view application lists and details; mutation buttons and status update dropdowns are hidden and blocked by the backend.

## Interviews

Choose **Phỏng vấn** from the sidebar:
- **Search & Filter:** Search by candidate name, job title, interviewer name, or location. Filter by interview status (`SCHEDULED`, `COMPLETED`, `CANCELLED`).
- **Schedule an Interview:** ADMIN and HR can click **+ Lên lịch phỏng vấn** (or navigate from Application Detail), select an application, pick an interviewer from the staff dropdown, specify date & time, location/meeting link, and notes. Initial status is `SCHEDULED`.
- **Edit Interview:** ADMIN and HR can modify date, location, or notes while the interview is in `SCHEDULED` status.
- **Status Transitions:**
  - `SCHEDULED` -> `COMPLETED`: Accessible by ADMIN, HR, or the assigned interviewer.
  - `SCHEDULED` -> `CANCELLED`: Accessible by ADMIN and HR.
  - Completed or cancelled interviews are final and cannot be reopened.
  - *Completing an interview does NOT automatically change the application status or candidate hiring outcome.*

## Candidate Evaluations

Evaluations are linked to applications:
- **Submit Evaluation:** Accessible from Application Detail or Interview Detail via **+ Thêm đánh giá**. All authenticated roles (`ADMIN`, `HR`, `MANAGER`) can submit evaluations.
- **Scoring Dimensions:** 3 core criteria scored from 1 to 5:
  1. *Chuyên môn* (Technical skill): 1–5
  2. *Giao tiếp* (Communication): 1–5
  3. *Kinh nghiệm* (Experience): 1–5
- **Average Score:** Calculated as runtime arithmetic average `(Chuyên môn + Giao tiếp + Kinh nghiệm) / 3`, rounded to 2 decimal places.
- **Feedback Comment:** Detailed text notes recording observations and assessment.
- **Edit Evaluation:** The original evaluator who submitted the review or an ADMIN can edit their evaluation. Other users are restricted.
- *Evaluation submission does NOT automatically change the application status.*

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


