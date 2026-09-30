# M5 – GEMINI RECRUITMENT ASSISTANT

Implement EXACTLY 3 AI features:
1. CV SUMMARY
2. INTERVIEW QUESTION GENERATOR
3. EMAIL DRAFT GENERATOR

Use Google Gemini.

Config: `GEMINI_API_KEY` from environment.

Do not hard-code key, log key, or send key to frontend.

Create prompts:
- `backend/prompts/cv_summary.txt`
- `backend/prompts/interview_questions.txt`
- `backend/prompts/email.txt`

## AI rule
Bạn là trợ lý tuyển dụng. Chỉ dựa trên dữ liệu được cung cấp. Không suy diễn thông tin cá nhân. Không đưa quyết định tuyển dụng. Không xếp hạng ứng viên. Không tự thay đổi trạng thái hồ sơ.

## CV SUMMARY
Input:
- CV text
- Job description
- Requirements
- Skills

Output:
1. Tóm tắt kinh nghiệm
2. Kỹ năng liên quan
3. Bằng chứng phù hợp
4. Nội dung cần hỏi thêm

## INTERVIEW QUESTIONS
Generate exactly 5 questions:
- chuyên môn
- kinh nghiệm
- làm rõ CV

## EMAIL
Types:
- INTERVIEW_INVITATION
- RESULT

Only draft. Do not send real email.

Save generated result into `ai_results`.

## Endpoints
- `POST /api/ai/cv-summary`
- `POST /api/ai/interview-questions`
- `POST /api/ai/email`
- `GET /api/applications/<id>/ai-results`

Manager cannot generate email if permission requires ADMIN/HR.

Automated tests must mock Gemini. Then run one manual live Gemini test.
