# Human Review Summary — AI Recruitment Management System

Tài liệu này tổng hợp toàn bộ các Cổng kiểm soát con người (Human Gates) trong suốt vòng đời phát triển dự án theo phương pháp luận AI-Augmented SDLC.

---

## 1. Bảng Tổng hợp Trạng thái Các Human Gates

| Cổng Kiểm soát | Giai đoạn / Phạm vi | Tài liệu Hồ sơ | Trạng thái Hiện tại | Bằng chứng Kỹ thuật Kèm theo | Hành động Cần thiết của Sinh viên |
|---|---|---|---|---|---|
| **Human Gate 1** | Yêu cầu nghiệp vụ & Giả định ban đầu | `docs/human-gate-1.md` | **NEEDS CHANGES** | 5 quyết định trong `docs/requirements-issues.md` và các giả định được ghi nhận. | Sinh viên kiểm tra các giả định nghiệp vụ và xác nhận quyết định để chuyển sang `APPROVED`. |
| **Human Gate 2** | Chuyển đổi Kiến trúc React REST & M1–M2 | `docs/human-gate-2.md` | **PENDING HUMAN APPROVAL** | 47 backend tests ban đầu PASS, kiểm thử tích hợp MySQL thật, React production build & lint PASS. | Sinh viên đối chiếu kiến trúc React REST thay thế Jinja và chuyển sang `APPROVED`. |
| **Human Gate 3** | Quản lý Hồ sơ, Lịch phỏng vấn & Đánh giá (M3–M4) | `docs/human-gate-3.md` | **PENDING HUMAN APPROVAL** | 101 backend tests PASS, vòng đời trạng thái hồ sơ, thang điểm đánh giá 1–5, tính điểm trung bình số học. | Sinh viên kiểm tra luồng tuyển dụng M3/M4 và chuyển sang `APPROVED`. |
| **Human Gate 4** | Nghiệm thu Toàn diện Hệ thống & Bàn giao (M5–M7) | `docs/human-gate-4.md` | **READY FOR HUMAN APPROVAL** | 136 backend tests PASS, Gemini AI thực tế, Dashboard MySQL thật, Code Review & Security Review hoàn tất. | Sinh viên rà soát toàn bộ dự án, chạy thử các chức năng và ký duyệt nghiệm thu cuối cùng (`APPROVED`). |

---

## 2. Nguyên tắc Tuân thủ Cổng Kiểm soát Con người (Human-in-the-Loop)

1. **Đại lý AI không bao giờ tự phê duyệt:** Mọi Human Gate đều do Sinh viên phụ trách dự án trực tiếp kiểm tra và đổi trạng thái. Đại lý AI chỉ đóng vai trò chuẩn bị đầy đủ bằng chứng, hồ sơ nghiệm thu và đặt trạng thái sẵn sàng (`READY FOR HUMAN APPROVAL` hoặc `PENDING HUMAN APPROVAL`).
2. **Quyền quyết định tối cao của con người:** Trong cả quy trình phát triển phần mềm (SDLC) lẫn quy trình nghiệp vụ tuyển dụng (Recruitment Domain), con người luôn giữ quyền quyết định cuối cùng. Trí tuệ nhân tạo (Gemini AI) chỉ là công cụ tư vấn, hỗ trợ quyết định (decision-support).

---

## 3. Hướng dẫn Sinh viên Nghiệm thu và Ký duyệt

Khi sinh viên tiến hành nghiệm thu dự án:
1. Mở tệp `docs/human-gate-4.md`.
2. Tích chọn đầy đủ các mục trong phần `Checklist for Student Review` sau khi đã đối chiếu mã nguồn và chạy thử nghiệm.
3. Điền nhận xét hoặc chỉnh sửa vào phần `Human corrections:` (nếu có).
4. Thay đổi giá trị dòng `Status:` từ `READY FOR HUMAN APPROVAL` thành `APPROVED`.
