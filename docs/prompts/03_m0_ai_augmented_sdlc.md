# M0 – AI AUGMENTED SDLC FOUNDATION

## Mục tiêu
Tạo nền tảng tài liệu và quy trình phát triển dự án.

## Thực hiện
1. Phân tích đề bài.
2. Xác định actors, requirements, business rules, non-functional requirements.
3. Viết SRS.
4. Thiết kế architecture: `React → Flask REST → MySQL` và `Flask → Gemini`.
5. Thiết kế 7-table database.
6. Viết ERD.
7. Viết Use Case.
8. Viết architecture document.
9. Tạo cấu trúc AI-Augmented SDLC:
   - Requirements Skill
   - Architecture Skill
   - Database Skill
   - Implementation Skill
   - Testing Skill
   - Code Review Skill
   - Security Skill
   - Documentation Skill

Tạo thư mục: `.agents/skills/`

Mỗi skill cần:
- mục tiêu
- input
- output
- quy trình
- checkpoint
- human verification

## Human Gate
AI không tự approve.

Mọi Human Gate phải ở một trong các trạng thái:
- PENDING
- READY FOR HUMAN APPROVAL
- NEEDS CHANGES

Không được để AI tự ghi `APPROVED`.
