# Bộ prompt tạo lại báo cáo Word

Dùng khi cần dựng lại `docs/bao-cao/BaoCao_MonHoc_Nhom_XX.docx` từ đầu bằng trợ lý AI (Claude Code, mở tại thư mục `c:\Thanh Duy Du An`). Các prompt dưới đây tổng hợp toàn bộ yêu cầu nhóm đã đưa ra trong `01_prompt_goc_cua_nhom.md` cùng các quy tắc kỹ thuật rút ra trong quá trình làm, để lần dựng lại cho ra đúng bản hiện tại.

Gửi lần lượt từng prompt, chờ AI làm xong bước trước rồi mới gửi bước sau. Có thể gộp prompt 1–4 thành một nếu muốn.

---

## Prompt 1 — Đọc tài liệu mẫu và nguồn dữ liệu

```text
Đọc 7 file mẫu báo cáo trong thư mục Google Drive
https://drive.google.com/drive/folders/1pHFaxiQnkmqVniqsSaubFd1j_FPKIJbo
(01 kế hoạch, 02 thu thập yêu cầu, 03 đặc tả SRS, 04 thiết kế hướng đối tượng,
05 kiểm thử chức năng, 06 screen flow & CSDL, 07 hướng dẫn sử dụng).
Nếu công cụ Drive không liệt kê được file con thì lấy danh sách qua
https://drive.google.com/embeddedfolderview?id=1pHFaxiQnkmqVniqsSaubFd1j_FPKIJbo
và tải từng file bằng https://drive.google.com/uc?export=download&id=<id>.

Sau đó đọc toàn bộ tài liệu dự án trong docs/ (requirements.md, user-stories.md,
acceptance-criteria.md, architecture.md, architecture-decisions.md, database-design.md,
api.md, test-plan.md, test-report.md, user-guide.md, ai-sdlc-report.md, rag-design.md),
README.md, sql/schema.sql và mã nguồn backend/ (routes, services, database, rag)
và frontend/src/. Nội dung báo cáo phải khớp với hệ thống đã cài đặt,
không bịa chức năng, API hay bảng dữ liệu không có trong code.
Chưa viết gì, chỉ tóm tắt lại những gì đã đọc.
```

## Prompt 2 — Cấu trúc và nội dung báo cáo

```text
Dùng skill docx tạo MỘT file Word gộp duy nhất:
docs/bao-cao/BaoCao_MonHoc_Nhom_XX.docx, gồm theo đúng thứ tự 7 file mẫu:

- Trang bìa, Mục lục (TOC tự động theo Heading 1–3).
- PHẦN 1. KẾ HOẠCH THỰC HIỆN: mục tiêu; bảng kế hoạch 9 tuần
  (27/07/2026 – 27/09/2026) với cột Tuần | Công việc | Thành viên thực hiện | Ghi chú;
  bảng 8 mốc bàn giao M1–M8; quy trình AI-Augmented SDLC và 4 Human Gate.
- PHẦN 2. THU THẬP, LÀM RÕ YÊU CẦU: mô tả bài toán; bảng khoảng 20 câu hỏi – trả lời
  làm rõ yêu cầu; bảng yêu cầu chức năng FR-001…FR-020; bảng yêu cầu phi chức năng;
  bảng quy tắc nghiệp vụ BR-001…BR-010; sơ đồ phân cấp chức năng (7 nhóm, 29 chức năng con).
- PHẦN 3. ĐẶC TẢ YÊU CẦU (SRS) – V1.0: mục đích, phạm vi, thuật ngữ, tài liệu tham khảo;
  sơ đồ use case tổng quát; bảng tác nhân (ADMIN, HR, MANAGER, Google Gemini);
  bảng 14 use case UC001–UC014; điều kiện phụ thuộc; mỗi use case có bảng đặc tả
  (Use case, Mục đích, Mô tả, Tác nhân, Điều kiện trước, Điều kiện sau,
  Luồng sự kiện chính, Luồng sự kiện phụ) + biểu đồ hoạt động + biểu đồ tuần tự;
  phần thông tin hỗ trợ: kiến trúc (component diagram), biểu đồ trạng thái hồ sơ,
  ma trận phân quyền, danh sách REST API.
- PHẦN 4. THIẾT KẾ HƯỚNG ĐỐI TƯỢNG: biểu đồ lớp thực thể, biểu đồ lớp controller/service;
  đặc tả 10 lớp (User, Job, Candidate, Application, Interview, Evaluation, AIResult,
  AIService, GeminiService, RAGService): bảng thuộc tính (Tên, Kiểu, Kích thước, Mô tả)
  và bảng từng phương thức (Tên, Mô tả, Tham số vào, Kết quả ra, Luồng xử lý,
  Điều kiện bắt đầu, Điều kiện kết thúc).
- PHẦN 5. KIỂM THỬ CHỨC NĂNG: phần cứng, phần mềm kiểm thử, chiến lược kiểm thử,
  bảng khoảng 48 test case (Test ID, Chức năng, Mô tả, Điều kiện trước, Dữ liệu Test,
  Kết quả mong muốn, Ghi chú), bảng Test report, bảng tổng hợp kết quả, bảng lỗi đã khắc phục.
- PHẦN 6. SCREEN FLOW & CSDL: sơ đồ screen flow, bảng danh sách màn hình, ERD (Crow's Foot),
  lược đồ quan hệ, cấu trúc 7 bảng, bảng ràng buộc toàn vẹn.
- PHẦN 7. HƯỚNG DẪN SỬ DỤNG: giới thiệu, phần cứng, phần mềm, cài đặt và khởi động,
  tài khoản demo, chức năng chia theo tác nhân (chung, HR, MANAGER, ADMIN) có ảnh chụp
  màn hình thật của ứng dụng, bảng xử lý lỗi thường gặp.
- KẾT LUẬN (kết quả, hạn chế, hướng phát triển) và TÀI LIỆU THAM KHẢO.

Ảnh chụp màn hình: khởi động ứng dụng (start_all.bat, http://127.0.0.1:5173), đăng nhập
admin@example.com / 123456 bằng trình duyệt headless và chụp các trang: login, dashboard,
danh sách/form vị trí, danh sách/form ứng viên, danh sách/chi tiết hồ sơ (cả khu vực
Trợ lý AI), form/chi tiết phỏng vấn, form đánh giá, trang Trợ lý AI. Chỉ xem, không sửa dữ liệu.

Kết quả kiểm thử lấy từ docs/test-report.md; ghi rõ nếu không chạy lại.
```

## Prompt 3 — Thông tin nhóm và trang bìa

```text
Thông tin nhóm:
- Nhóm XX (giữ nguyên "XX" nếu chưa có số nhóm), "Nhóm 3 SV".
- Thành viên: Triệu Thanh Duy (Trưởng nhóm), La Công Tuấn, Nguyễn Đức Ngọc Minh.
- Lớp: ATTT-K23A.
- Trường Đại học Công nghệ Thông tin và Truyền thông – Khoa Công nghệ Thông tin
  (logo ICTU), Thái Nguyên – 2026.
- Tên ứng dụng: Hệ thống quản lý tuyển dụng có tích hợp AI.
- Thời gian thực hiện: Từ 27/07/2026 đến 27/09/2026 (9 tuần).

Trang bìa (có khung viền trang) theo mẫu nhóm đã làm:
TRƯỜNG ĐẠI HỌC CÔNG NGHỆ THÔNG TIN VÀ TRUYỀN THÔNG / KHOA CÔNG NGHỆ THÔNG TIN / logo /
BÁO CÁO (chữ đỏ, cỡ lớn) / MÔN HỌC: ỨNG DỤNG TRÍ TUỆ NHÂN TẠO /
ĐỀ TÀI: HỆ THỐNG QUẢN LÝ TUYỂN DỤNG CÓ TÍCH HỢP AI / GIẢNG VIÊN: /
SINH VIÊN THỰC HIỆN: TRIỆU THANH DUY : ATTT-K23A, LA CÔNG TUẤN : ATTT-K23A,
NGUYỄN ĐỨC NGỌC MINH : ATTT-K23A / THÁI NGUYÊN – 2026.

Mỗi phần 1, 2, 4, 5, 6 mở đầu bằng khối thông tin: "Nhóm XX – Thành viên nhóm
(XX là số thứ tự của nhóm theo từng lớp - Nhóm 3 SV)", danh sách 3 thành viên,
Tên ứng dụng, Thời gian thực hiện.

Phân công trong bảng kế hoạch: tuần 1 Duy; tuần 2 Tuấn, Minh; tuần 3 Duy, Minh;
tuần 4 cả nhóm; tuần 5 Tuấn; tuần 6 Minh; tuần 7 Duy; tuần 8 Duy, Tuấn; tuần 9 cả nhóm.
Người tham gia test: Tuấn (đăng nhập, vị trí, ứng viên), Minh (hồ sơ, phỏng vấn, đánh giá),
Duy (AI, dashboard, chatbot).
```

## Prompt 4 — Định dạng trình bày

```text
Định dạng Word bắt buộc:
- Khổ A4, TOÀN BỘ trang để DỌC, không có trang ngang nào.
- Lề: trên 2 cm, dưới 2 cm, trái 3 cm, phải 2 cm (vùng chữ rộng 16 cm = 9071 twip).
- Font Times New Roman, chữ thân 13 pt; header chữ nghiêng
  "Hệ thống quản lý tuyển dụng có tích hợp AI – Nhóm XX", số trang ở giữa chân trang.
- Giãn đoạn cho MỌI đoạn văn ngoài bảng (thân bài, tiêu đề, gạch đầu dòng, chú thích hình):
  Spacing Before 6 pt, After 6 pt, Line spacing Multiple 1,3
  (XML: w:before="120" w:after="120" w:line="312" w:lineRule="auto").
- Chữ trong ô bảng 9,5–11 pt, giãn dòng gọn.
- Heading 1 cho PHẦN, Heading 2/3 cho mục con; mỗi PHẦN bắt đầu trang mới.
- Bảng: tổng độ rộng cột đúng 9071 twip (không vượt lề phải), độ rộng cột (gridCol)
  phải khớp độ rộng ô (tcW), đặt bố cục cố định (tblLayout fixed) cho mọi bảng,
  hàng tiêu đề nền xanh nhạt và lặp lại khi bảng sang trang.
  Mã test case (TC-AUTH-01…) dùng gạch nối không ngắt dòng và cột Test ID đủ rộng.
- Chú thích: "Hình N. …" dưới hình, "Bảng N. …" trên bảng, chữ nghiêng, căn giữa;
  giữ đúng số hình: Hình 1 phân cấp chức năng, Hình 2 use case, Hình 3–30 activity/sequence
  UC001–UC014 (lẻ = activity, chẵn = sequence), Hình 31 component, Hình 32 state machine,
  Hình 33 class thực thể, Hình 34 class controller/service, Hình 35 screen flow, Hình 36 ERD,
  sau đó là ảnh chụp màn hình.
- Ảnh sơ đồ nhúng dạng PNG độ phân giải 2x, co vừa bề rộng trang dọc.
  KHÔNG nhúng SVG xuất từ StarUML vì Word chỉ vẽ khung và watermark, không vẽ nội dung.
- Sau khi tạo file, mở bằng Microsoft Word (COM) để cập nhật Mục lục và xuất PDF
  docs/bao-cao/BaoCao_MonHoc_Nhom_XX_UML_FIXED.pdf; nếu Word đang mở file của người dùng
  thì không đóng phiên Word đó.
```

## Prompt 5 — Sơ đồ UML trong StarUML

```text
Tất cả 33 sơ đồ UML (use case, 14 activity, 14 sequence, state machine, 2 class,
component) phải dựng trong StarUML và lưu thành docs/uml/AI_Recruitment_System.mdj
có thể mở/sửa lại, đúng toàn bộ đặc tả trong Prompt 3 của file 01_prompt_goc_cua_nhom.md,
đối chiếu với mã nguồn và ghi khác biệt vào docs/uml/UML_REPORT_CODE_MISMATCH.md.

Bổ sung các yêu cầu của nhóm:
- KHÔNG có ô ghi chú (Note) nào trong bất kỳ sơ đồ nào.
- Sơ đồ use case: không đường nối nào được cắt qua use case khác. Cách làm: mỗi
  association đi xiên tới một điểm sát mép ngoài của ellipse đích rồi mới đi ngang vào
  (HR, ADMIN vào mép trái; MANAGER, Google Gemini vào mép phải); ellipse đủ rộng để
  chữ nằm gọn bên trong. Actor ngoài boundary; ADMIN ──▷ HR (generalization);
  Google Gemini «external system» chỉ nối UC008, UC009, UC010, UC013.
- Activity: initial node, activity final, action bo góc, decision/merge, guard [ ],
  swimlane Người dùng / Hệ thống (/ Google Gemini); luồng lỗi thử lại đi qua merge node.
- Sequence: lifeline có stereotype (actor, boundary, control, service, database, external),
  activation bar, reply nét đứt, alt/opt có guard, một lifeline db duy nhất.
- Class: "-thuộcTính: Kiểu", "+phươngThức(tham số: Kiểu): KiểuTrảVề", 6 Enumeration,
  multiplicity hai đầu; class controller/service chỉ dùng Dependency nét đứt.
- Xuất SVG + PNG 2x vào docs/uml/export/ theo tên 01_use_case_overview …
  33_component_diagram, rồi chèn PNG vào báo cáo theo đúng số hình.
- Chạy kiểm định tự động (docs/uml/tools/validate.py) phải đạt 49/49.

Lưu ý kỹ thuật (xem docs/uml/tools/README.md):
- StarUML cài bằng: winget install --id MKLabs.StarUML -e
- Trong terminal VS Code phải bỏ biến ELECTRON_RUN_AS_NODE trước khi chạy StarUML.exe.
- Dựng model: chép docs/uml/tools/staruml-extension-main.js vào
  %APPDATA%\StarUML\extensions\user\aigen\main.js rồi chạy docs/uml/tools/run.ps1
  với build.js (khoảng 3 phút).
- Bản StarUML chưa đăng ký chèn watermark "UNREGISTERED" vào ảnh; không can thiệp license,
  nhập license rồi xuất lại nếu cần ảnh sạch.
```

## Prompt 6 — Kiểm tra cuối

```text
Kiểm tra lại file Word vừa tạo:
1. Xuất PDF bằng Word và dò mọi trang: không trang ngang, không chữ hay đường kẻ bảng nào
   vượt lề phải (A4 rộng 595,3 pt, lề phải 2 cm = 56,7 pt), trừ khung viền trang bìa.
2. Mọi bảng có tổng gridCol ≤ 9071 twip và tblLayout fixed.
3. Mọi đoạn ngoài bảng có spacing before 120, after 120, line 312.
4. Mục lục đã cập nhật số trang; đủ 36 hình sơ đồ + ảnh chụp màn hình, đủ bảng.
5. Sơ đồ không có ô ghi chú; sơ đồ use case không có đường nối cắt qua use case khác.
6. Kiểm định file XML bằng scripts/office/validate.py của skill docx phải PASSED.
Nếu file Word đã được người dùng tự chỉnh (ví dụ trang bìa), sửa trực tiếp trên file đó
(unzip → sửa word/document.xml → đóng gói lại) thay vì dựng lại từ đầu,
và sao lưu bản trước vào docs/bao-cao/_old/.
```

---

## Phụ lục — Tệp và script đang dùng

| Mục đích | Vị trí |
|---|---|
| Báo cáo Word hiện tại | `docs/bao-cao/BaoCao_MonHoc_Nhom_XX.docx` |
| PDF xuất từ Word | `docs/bao-cao/BaoCao_MonHoc_Nhom_XX_UML_FIXED.pdf` |
| Các bản trước | `docs/bao-cao/_old/` |
| Model StarUML | `docs/uml/AI_Recruitment_System.mdj` |
| Ảnh sơ đồ SVG/PNG | `docs/uml/export/` |
| Script dựng model, xuất ảnh, kiểm định | `docs/uml/tools/` |
| Đối chiếu báo cáo – code | `docs/uml/UML_REPORT_CODE_MISMATCH.md` |
| Báo cáo kiểm định UML | `docs/uml/UML_VALIDATION_REPORT.md` |
| Nhật ký prompt gốc | `docs/prompts/01_prompt_goc_cua_nhom.md` |
