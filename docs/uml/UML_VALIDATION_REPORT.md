# STARUML UML REDESIGN REPORT

Dự án: Hệ thống quản lý tuyển dụng có tích hợp AI · Ngày: 29/09/2026 · Công cụ: StarUML 7.0.0 (bản chưa đăng ký)

## 1. Source Documents Reviewed

- `docs/bao-cao/BaoCao_MonHoc_Nhom_XX.docx` / `.pdf`: Phần 2 (yêu cầu, quy tắc nghiệp vụ), Phần 3 (SRS, 14 use case), Phần 4 (thiết kế lớp), Phần 6 (screen flow, CSDL).
- `docs/requirements.md`, `docs/architecture.md`, `docs/api.md`, `docs/rag-design.md`, `sql/schema.sql`.

## 2. Source Code Reviewed

- `backend/routes/`: `auth_routes.py`, `job_routes.py`, `candidate_routes.py`, `application_routes.py`, `interview_routes.py`, `evaluation_routes.py`, `ai_routes.py`, `chat_routes.py`; `backend/app.py` (health, dashboard).
- `backend/services/`: `ai_service.py`, `gemini_service.py`.
- `backend/database/db.py` (hàm truy vấn tham số hóa trên 7 bảng).
- `backend/rag/`: `scope_guard.py`, `intent_router.py` (gồm Decision Guard), `rag_service.py`, `retriever.py`, `context_builder.py`, `embedding_service.py`, `vector_store.py`, `document_builder.py`; `backend/scripts/rebuild_rag_index.py`.
- `frontend/src/`: `App.jsx` (routes), `pages/*` (LoginPage, JobsPage, JobFormPage, CandidateFormPage, ApplicationCreatePage, ApplicationDetailPage, InterviewFormPage, InterviewDetailPage, EvaluationFormPage, DashboardPage, AIChatPage), `components/Navbar.jsx` (đăng xuất), `services/api.js`.

## 3. Diagram Inventory

33 sơ đồ UML trong `AI_Recruitment_System.mdj`, xuất ra `docs/uml/export/` (SVG + PNG 2x):

| # | Sơ đồ | Package |
|---|---|---|
| 01 | Use Case tổng quát | 01 Use Case Model |
| 02–29 | Activity + Sequence UC001–UC014 (mỗi UC một sub-package) | 02 Activity Diagrams / 03 Sequence Diagrams |
| 30 | Application State Machine | 04 State Machine |
| 31 | Entity Class Diagram | 05 Domain Model |
| 32 | Controller / Service Class Diagram | 06 Service Model |
| 33 | Component Diagram | 07 Component Model |

## 4. UML Issues Found in Existing Report

| Sơ đồ cũ | Lỗi |
|---|---|
| Use case (Hình 2) | Vẽ bằng matplotlib, không phải model UML; tên hệ thống không đúng chữ hoa theo yêu cầu. |
| Activity (Hình 3–29 lẻ) | Là flowchart Mermaid: nút Bắt đầu/Kết thúc dạng viên thuốc thay vì initial node / activity final; không có swimlane; nhãn "Có/Không" thay vì guard `[...]`; không có merge node khi luồng lỗi quay lại. |
| Sequence (Hình 4–30 chẵn) | Không có activation bar; `alt` không đủ operand ở nhiều chỗ; dùng `MySQL.users`, `MySQL.jobs`… như lifeline riêng; không có stereotype lifeline; UC013 thiếu chi tiết ScopeGuard/IntentRouter/Retriever; UC014 không thể hiện IndexRebuilder. |
| Kiến trúc (Hình 31) | Sơ đồ khối Mermaid, không phải UML Component Diagram. |
| State (Hình 32) | Không có event trên transition, không có final state. |
| Class thực thể (Hình 33) | Cú pháp `+int id` sai UML; kiểu enum ghi dạng chữ (`Role`, `JobStatus`) nhưng không có Enumeration; nhãn quan hệ bằng động từ tiếng Việt thay cho role name. |
| Class dịch vụ (Hình 34) | Mọi quan hệ vẽ bằng mũi tên association liền nét; thiếu stereotype «controller»/«service»; thiếu lớp IndexRebuilder, ContextBuilder, DocumentBuilder, FlaskApp. |

## 5. Use Case Diagram — **PASS**

4 actor ngoài boundary "HỆ THỐNG QUẢN LÝ TUYỂN DỤNG CÓ TÍCH HỢP AI"; 14 use case đúng mã và tên bên trong; association nét liền không mũi tên; ADMIN ──▷ HR (tam giác rỗng phía HR); Google Gemini «external system» chỉ nối UC008, UC009, UC010, UC013; không có include/extend. Association kiểm tra tự động: HR = UC001–UC013, ADMIN = UC014, MANAGER = UC001/002/003/006/007/008/009/011/012/013 (ghi chú: UC002/UC003 chỉ xem; UC006 xem và hoàn thành buổi được giao).

## 6. Activity Diagrams

Mỗi sơ đồ có đúng 1 initial node, ≥ 1 activity final, action bo góc, decision/merge dạng thoi, mọi luồng ra khỏi decision đều có guard `[...]`, 2–3 activity partition (Người dùng/Hệ thống/Google Gemini), không có flow lơ lửng. Luồng lỗi "thử lại" đi qua merge node rồi quay lại form; luồng lỗi kết thúc có activity final riêng.

| UC | Kết quả | Ghi chú |
|---|---|---|
| UC001 | PASS | 2 merge cho vòng lặp nhập lại; có luồng đăng xuất |
| UC002 | PASS | 3 nhánh Xem / Thêm–Sửa / Xóa; MANAGER chỉ nhánh Xem (ghi chú) |
| UC003 | PASS | Nhánh có/không có CV hợp lại bằng merge; 409 khi xóa |
| UC004 | PASS | 404 / 409 quay lại chọn |
| UC005 | PASS | 403 → 404 → 400; ghi chú bảng chuyển trạng thái |
| UC006 | PASS | Tạo / Sửa (chỉ SCHEDULED) / Hoàn thành–Hủy theo vai trò |
| UC007 | PASS | Điểm 1..5, 404, sửa chỉ người tạo/ADMIN |
| UC008 | PASS | 3 partition; không cập nhật status |
| UC009 | PASS | Như UC008, 5 câu hỏi |
| UC010 | PASS | RESULT yêu cầu PASSED/REJECTED; không gửi SMTP |
| UC011 | PASS | Không gọi Gemini |
| UC012 | PASS | Time-to-hire: action + ghi chú, không decision giả (xem mismatch #6) |
| UC013 | PASS | Scope Guard → Intent Router/Decision Guard → STRUCTURED / HYBRID / SEMANTIC |
| UC014 | PASS | Chỉ ADMIN; không có Gemini |

## 7. Sequence Diagrams

Lifeline có stereotype «actor» / «boundary» / «control» / «service» / «database» / «external» / «file storage», và `type` trỏ tới Actor hoặc Class có sẵn trong model (tái sử dụng element). Message đồng bộ nét liền mũi tên đặc; reply nét đứt; activation bar lồng nhau theo lời gọi; self-message chỉ dùng cho lời gọi nội bộ có thật; `alt`/`opt` có guard trên mọi operand; một lifeline `db : Database` duy nhất.

| UC | Kết quả | Lifeline / message / fragment |
|---|---|---|
| UC001 | PASS | 5 / 15 / alt ×2 |
| UC002 | PASS | 5 / 25 / alt ×3 |
| UC003 | PASS | 5 / 14 / alt, opt |
| UC004 | PASS | 4 / 12 / alt ×2 |
| UC005 | PASS | 4 / 13 / alt ×2 (3 operand) |
| UC006 | PASS | 5 / 26 / opt ×3 (tạo, sửa, hoàn thành–hủy), alt ×3 |
| UC007 | PASS | 4 / 20 / alt ×3 |
| UC008 | PASS | 7 / 20 / alt ×3; có Google Gemini |
| UC009 | PASS | 7 / 20 / alt ×3; có Google Gemini |
| UC010 | PASS | 7 / 23 / opt, alt ×4; có Google Gemini |
| UC011 | PASS | 4 / 10; không có Gemini |
| UC012 | PASS | 4 / 12 / alt; không có Gemini |
| UC013 | PASS | 12 / 32 / alt ×3, opt; không có SQL do LLM sinh (ghi chú) |
| UC014 | PASS | 9 / 21 / alt ×2; không có Gemini |

## 8. State Machine — **PASS**

Initial pseudostate → NEW; NEW →(startScreening) SCREENING; NEW/SCREENING/INTERVIEW →(reject) REJECTED; SCREENING →(moveToInterview) INTERVIEW; INTERVIEW →(pass) PASSED; PASSED, REJECTED → final state; không có transition ngược hay transition tự động từ AI/phỏng vấn/đánh giá (ghi chú trên sơ đồ).

## 9. Entity Class Diagram — **PASS**

7 lớp theo đúng 7 bảng; thuộc tính `-name: Type`; 6 Enumeration (Role, JobStatus, CandidateSource, ApplicationStatus, InterviewStatus, AIResultType) được dùng làm kiểu thuộc tính; operation `+name(param: Type): Return` dạng static (gạch chân) vì là hàm module trong `db.py`; 7 association có multiplicity hai đầu và role name (`applications`, `interviews`, `evaluations`, `aiResults`, `interviewer`/`conductedInterviews`, `evaluator`/`evaluations`); không có Candidate–Job trực tiếp; không aggregation/composition.

## 10. Controller / Service Class Diagram — **PASS**

9 «controller» (gồm FlaskApp cho `app.py`), 11 «service» (gồm IndexRebuilder, ContextBuilder, DocumentBuilder), «database» Database, «external» Google Gemini API, «library» FAISS IndexFlatIP. 28 quan hệ đều là Dependency nét đứt; không có generalization/association/aggregation. Việc dùng decorator phân quyền của AuthController được ghi bằng Note thay cho 8 đường phụ thuộc.

## 11. Component Diagram — **PASS**

React SPA → Flask REST API (HTTP/JSON); Flask chứa 4 component con (Authentication, Recruitment, AI, RAG Chatbot); MySQL 8.4 «database»; CV Upload Storage (artifact); Local Embedding Model; Local Vector Store / FAISS; Google Gemini API «external». Chỉ AI Module và RAG Chatbot Module phụ thuộc Gemini; React không có đường tới Gemini.

## 12. Non-UML Diagrams

- **Functional Decomposition** (Hình 1): giữ là sơ đồ phân cấp chức năng, không đổi.
- **Screen Flow** (Hình 35): giữ là sơ đồ điều hướng màn hình, không gọi là UML.
- **ERD** (Hình 36): giữ ký pháp Crow's Foot (Mermaid erDiagram); không dựng lại trong StarUML và không gọi là UML Class Diagram.

## 13. StarUML Source File

- Path: `docs/uml/AI_Recruitment_System.mdj`
- Openable: **YES** — được dựng bằng chính API của StarUML (`app.factory`) và mở lại được bằng lệnh `staruml image`/`staruml exec` của StarUML 7.0.0 để xuất 33 sơ đồ.
- Editable elements: **YES** — 0 view ảnh nhúng; toàn bộ là model element (Actor, UseCase, Activity/Action/ControlFlow, Interaction/Lifeline/Message/CombinedFragment, StateMachine/State/Transition, Class/Enumeration/Association/Dependency, Component/Artifact).
- Kiểm định tự động (`validate.py` đọc trực tiếp `.mdj`): **49/49 PASS**.

## 14. Export Verification

- SVG: 33 tệp `docs/uml/export/NN_*.svg`, xuất bằng `staruml image -f svg`.
- PNG: 33 tệp `docs/uml/export/NN_*.png`, raster 2x từ SVG (StarUML xuất PNG ở 1x).
- **Hạn chế**: StarUML chưa đăng ký chèn watermark "UNREGISTERED" vào mọi ảnh xuất (SVG và PNG). Không can thiệp cơ chế license. Sau khi nhập license, chạy lại bước xuất để có ảnh sạch.

## 15. Report Replacement

- Updated DOCX: **YES** — `docs/bao-cao/BaoCao_MonHoc_Nhom_XX.docx` (bản UML mới) và PDF `BaoCao_MonHoc_Nhom_XX_UML_FIXED.pdf`.
- Figure captions preserved: **YES** — Hình 2 → Hình 34 giữ số và nội dung; riêng Hình 31 bổ sung "(UML Component Diagram)". Theo yêu cầu của nhóm: toàn bộ báo cáo để trang dọc (không trang ngang) và mọi sơ đồ đã bỏ ô ghi chú (Note) — các ràng buộc trước đây ghi trong Note nay chỉ còn trong phần đặc tả use case và `UML_REPORT_CODE_MISMATCH.md`. Mục lục cập nhật lại trong Word; báo cáo 96 trang. Thành viên: Triệu Thanh Duy (trưởng nhóm), La Công Tuấn, Nguyễn Đức Ngọc Minh.
- Ảnh nhúng trong DOCX là **PNG 2x**. Đã thử nhúng SVG nhưng Word chỉ vẽ khung và watermark, không vẽ nội dung SVG của StarUML, nên không dùng SVG trong Word.
- Bản trước (hình Mermaid) được lưu tại `docs/bao-cao/_old/`.

## 16. Report-Code Mismatches

17 điểm, chi tiết trong `docs/uml/UML_REPORT_CODE_MISMATCH.md`. Quan trọng nhất: không có module DecisionGuard riêng (nằm trong IntentRouter); reindex đi qua `scripts/rebuild_rag_index.py` chứ không qua RAGService; dashboard nằm trong `app.py`; `delete_job` tự kiểm tra hồ sơ liên kết; time-to-hire luôn "chưa đủ dữ liệu".

## 17. Remaining Limitations

1. Watermark "UNREGISTERED" trên mọi ảnh xuất cho tới khi có license StarUML.
2. Sơ đồ lớn (UC013 sequence 12 lifeline, class 32) vẫn có chữ nhỏ khi in trên trang A4 ngang; bản SVG trong DOCX phóng to được.
3. Tham số hàm create/update trong Entity Class Diagram gom thành `data: <Entity>` để sơ đồ đọc được; chữ ký đầy đủ nằm trong `db.py`.
4. Chưa mở `.mdj` bằng giao diện StarUML trước mặt người dùng; việc mở được xác nhận qua CLI của StarUML.

## 18. FINAL STATUS

**STARUML UML REDESIGN: PARTIAL**

Mô hình, ngữ nghĩa UML, đối chiếu code và thay hình trong báo cáo đều đạt; trạng thái chưa là PASS chỉ vì ảnh xuất còn watermark của bản StarUML chưa đăng ký. Sau khi có license và xuất lại ảnh, trạng thái có thể nâng thành PASS.
