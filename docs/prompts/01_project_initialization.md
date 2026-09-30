# PROJECT INITIALIZATION PROMPT

Xây dựng đồ án môn học:

**HỆ THỐNG QUẢN LÝ TUYỂN DỤNG CÓ TÍCH HỢP AI**

## Mục tiêu
- Quản lý vị trí tuyển dụng.
- Quản lý ứng viên và CV.
- Quản lý hồ sơ ứng tuyển.
- Theo dõi vòng tuyển dụng.
- Quản lý lịch phỏng vấn.
- Ghi nhận đánh giá ứng viên.
- Tìm kiếm và lọc dữ liệu.
- Dashboard thống kê.
- Tích hợp AI:
  - Tóm tắt CV theo vị trí.
  - Gợi ý câu hỏi phỏng vấn.
  - Soạn email tuyển dụng.
- AI chỉ hỗ trợ, con người quyết định tuyển dụng.

## Kiến trúc bắt buộc
Frontend: React.js + Vite + JavaScript + React Router + Bootstrap + Fetch API  
Backend: Python + Flask REST API  
Database: MySQL  
AI: Google Gemini  
Authentication: Flask Session, không JWT nếu không cần.  
Roles: ADMIN, HR, MANAGER.

Không xây RBAC phức tạp. Dùng `users.role` và kiểm tra quyền ở backend.

## Không dùng
- Next.js
- TypeScript
- Redux
- Microservices
- Redis
- Celery
- GraphQL

## Mục tiêu đồ án
Đồ án sinh viên 7–8 điểm, dễ demo, dễ giải thích, không overengineering.

## Nguyên tắc
- Chức năng ít nhưng chạy chắc.
- AI đơn giản nhưng nhìn thấy rõ.
- Database đơn giản để dễ giải thích.
- Demo được một luồng end-to-end.
