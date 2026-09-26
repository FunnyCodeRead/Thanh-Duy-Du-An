# User Guide — AI Recruitment System (M1–M4)

## Sign in

Open `http://127.0.0.1:5173`, enter a demo account and choose **Đăng nhập**. A valid session opens Dashboard. Use **Đăng xuất** in the top bar to clear the session.

## Dashboard

Dashboard cung cấp bức tranh tổng quan theo thời gian thực từ cơ sở dữ liệu MySQL thật:
- **Thẻ tóm tắt chỉ số chính (Summary Cards):**
  - *Vị trí đang tuyển:* Số lượng vị trí đang ở trạng thái `OPEN` trên tổng số vị trí việc làm.
  - *Tổng ứng viên:* Tổng số hồ sơ ứng viên đang được quản lý trong kho dữ liệu.
  - *Hồ sơ ứng tuyển:* Tổng số lượt nộp hồ sơ vào các vị trí tuyển dụng.
  - *Phỏng vấn sắp tới:* Số lượng các buổi phỏng vấn đã lên lịch (`SCHEDULED`) có thời gian lớn hơn hoặc bằng thời điểm hiện tại.
  - Mỗi thẻ hỗ trợ liên kết nhanh tới màn hình quản lý tương ứng.
- **Phân bố trạng thái hồ sơ:** Hiển thị trực quan số lượng và tỷ lệ % của tất cả 5 trạng thái ứng tuyển (`NEW`, `SCREENING`, `INTERVIEW`, `PASSED`, `REJECTED`).
- **Nguồn ứng viên:** Thống kê số lượng và tỷ lệ % ứng viên đến từ các kênh (`LinkedIn`, `Facebook`, `Website`, `Trang tuyển dụng`, `Giới thiệu nội bộ`, `Khác`) thông qua thanh tiến độ trực quan.
- **Tỷ lệ trúng tuyển (Pass Rate):**
  - Được tính theo công thức chuẩn: `PASSED / (PASSED + REJECTED) * 100%`.
  - Chỉ tính trên các hồ sơ đã có kết quả cuối cùng (`finalized`). Nếu chưa có hồ sơ kết thúc, tỷ lệ hiển thị an toàn là `0%`.
- **Thời gian tuyển dụng (Time-to-Hire) & Giới hạn dữ liệu:**
  - Hệ thống thông báo rõ: *"Chưa đủ dữ liệu để tính chính xác"*.
  - *Giải thích:* Bảng `applications` chỉ lưu mốc thời gian tạo hồ sơ (`applied_at`), không lưu mốc thời gian chuyển sang trạng thái kết thúc (`PASSED`/`REJECTED`). Hệ thống tuân thủ nguyên tắc AI-SDLC không suy đoán hay tính toán số liệu giả mạo.
- **Lịch phỏng vấn sắp tới:** Bảng danh sách tối đa 5 lịch phỏng vấn gần nhất (Ứng viên, Vị trí, Thời gian, Người phỏng vấn, Địa điểm) kèm liên kết xem toàn bộ lịch phỏng vấn.

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

## AI Recruitment Assistant (Google Gemini)

Within the **Application Detail** page (`/applications/:id`), users have access to the **Trợ lý AI** section powered by Google Gemini:

> **Lưu ý quan trọng:** AI chỉ hỗ trợ cung cấp thông tin tham khảo (Decision Support). Quyết định tuyển dụng cuối cùng do người phụ trách thực hiện. Hệ thống không sử dụng AI ranking hay tự động đậu/rớt ứng viên.

### 1. Tóm tắt CV bằng AI (AI CV Summary)
- Nhấn **✨ Tóm tắt CV** để AI phân tích nội dung CV văn bản đối chiếu với yêu cầu công việc.
- Trả về 4 phần thông tin trọng tâm:
  1. Tóm tắt kinh nghiệm chính.
  2. Kỹ năng liên quan đến vị trí.
  3. Bằng chứng phù hợp trích xuất từ CV.
  4. Những nội dung cần hỏi thêm khi phỏng vấn.

### 2. Gợi ý câu hỏi phỏng vấn (AI Interview Questions)
- Nhấn **✨ Gợi ý câu hỏi phỏng vấn** để nhận danh sách đúng 5 câu hỏi phỏng vấn được thiết kế riêng:
  - 2 câu hỏi kỹ năng / chuyên môn.
  - 2 câu hỏi kinh nghiệm thực tế.
  - 1 câu hỏi làm rõ các điểm nổi bật hoặc chưa rõ trong CV.

### 3. Soạn email bằng AI (AI Email Draft)
- Quyền hạn: Chỉ dành cho `ADMIN` và `HR`.
- Lựa chọn loại email:
  - **Mời phỏng vấn (`INTERVIEW_INVITATION`):** Tự động liên kết thời gian, địa điểm từ lịch phỏng vấn đã lên.
  - **Thông báo kết quả (`RESULT`):** Chỉ hoạt động khi hồ sơ đã ở trạng thái kết thúc (`PASSED` hoặc `REJECTED`).
- Nhấn **✨ Soạn email** để sinh tiêu đề và nội dung email mẫu bằng tiếng Việt chuẩn mực, lịch sự. Hỗ trợ nút **Sao chép** để dán vào trình gửi thư của doanh nghiệp (hệ thống không tự động gửi email).

### 4. Lịch sử kết quả AI (AI History)
- Xem lại toàn bộ kết quả đã sinh kèm nhãn phân loại và thời gian tạo. Nhấn **Xem** để mở lại nội dung bất kỳ lúc nào.

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



