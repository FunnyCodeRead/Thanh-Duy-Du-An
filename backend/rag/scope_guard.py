"""Scope Guard for Recruitment Knowledge Chatbot.

Classifies user questions before retrieval to ensure the chatbot only answers
questions grounded in the recruitment system database.
"""

import re

OUT_OF_SCOPE_RESPONSE = "Tôi chỉ hỗ trợ hỏi đáp dựa trên dữ liệu tuyển dụng hiện có trong hệ thống."
DUMP_REQUEST_RESPONSE = (
    "Tôi có thể hỗ trợ tra cứu thông tin tuyển dụng cụ thể, "
    "nhưng không cung cấp toàn bộ dữ liệu hệ thống trong một lần."
)

# Explicit outside domains: weather, politics, general knowledge, trivia, sports, cooking, etc.
OUTSIDE_PATTERNS = [
    r"\b(thời\s*tiết|nhiệt\s*độ|dự\s*báo\s*thời\s*tiết|trời\s*mưa|nắng)\b",
    r"\b(tổng\s*thống|chủ\s*tịch\s*nước|thủ\s*tướng|chính\s*trị|bầu\s*cử)\b",
    r"\b(thủ\s*đô|dân\s*số|diện\s*tích|quốc\s*gia|đất\s*nước)\b",
    r"\b(bài\s*thơ|làm\s*thơ|kể\s*chuyện|hát|truyện\s*cười)\b",
    r"\b(nấu\s*phở|nấu\s*ăn|công\s*thức\s*món|món\s*ăn|quán\s*ăn)\b",
    r"\b(bóng\s*đá|world\s*cup|champion|thể\s*thao|giải\s*đấu)\b",
    r"\b(giá\s*vàng|chứng\s*khoán|bitcoin|tiền\s*ảo|crypto)\b",
    r"\b(ai\s*tạo\s*ra|ra\s*đời\s*năm|năm\s*nào|lịch\s*sử\s*hình\s*thành)\b",  # General trivia e.g. "Python được tạo ra năm nào"
]

# Sensitive secrets / injection keywords
SECRET_PATTERNS = [
    r"\b(gemini_api_key|api_key|secret_key|db_password|password_hash|mật\s*khẩu|token)\b",
]

# Database dump requests
DUMP_PATTERNS = [
    r"\b(in\s*toàn\s*bộ|dump|xuất\s*toàn\s*bộ|toàn\s*bộ\s*database|toàn\s*bộ\s*dữ\s*liệu)\b",
]

# Domain keywords that indicate recruitment relevance
RECRUITMENT_KEYWORDS = [
    "ứng viên", "ung vien", "candidate",
    "vị trí", "vi tri", "công việc", "cong viec", "job", "tuyển dụng", "tuyen dung",
    "hồ sơ", "ho so", "ứng tuyển", "ung tuyen", "application",
    "phỏng vấn", "phong van", "interview", "lịch", "lich",
    "đánh giá", "danh gia", "điểm", "diem", "nhận xét", "nhan xet", "evaluation",
    "kỹ năng", "ky nang", "skill", "kinh nghiệm", "kinh nghiem", "experience",
    "học vấn", "hoc van", "bằng cấp", "education",
    "cv", "trạng thái", "trang thai", "status",
    "new", "screening", "interview", "passed", "rejected", "open", "closed",
    "nguồn", "nguon", "source", "facebook", "linkedin", "website", "referral",
    "ai", "tóm tắt", "tom tat", "gợi ý", "goi y", "email",
    "bao nhiêu", "bao nhieu", "tổng số", "tong so", "danh sách", "danh sach",
    "python", "flask", "react", "mysql", "javascript", "java", "sql", "node", "docker", "frontend", "backend"
]


def check_scope(question: str) -> dict:
    """Kiểm tra câu hỏi của người dùng có nằm trong phạm vi dữ liệu tuyển dụng hay không.
    
    Returns:
        dict: {
            "in_scope": bool,
            "refusal_reason": "OUT_OF_SCOPE" | "DUMP_REQUEST" | None,
            "response": str | None
        }
    """
    if not question or not question.strip():
        return {
            "in_scope": False,
            "refusal_reason": "OUT_OF_SCOPE",
            "response": OUT_OF_SCOPE_RESPONSE,
        }

    q = question.lower().strip()

    # 1. Check for data dump request
    for pat in DUMP_PATTERNS:
        if re.search(pat, q, re.IGNORECASE):
            return {
                "in_scope": False,
                "refusal_reason": "DUMP_REQUEST",
                "response": DUMP_REQUEST_RESPONSE,
            }

    # 2. Check for secret leak attempts
    for pat in SECRET_PATTERNS:
        if re.search(pat, q, re.IGNORECASE):
            return {
                "in_scope": False,
                "refusal_reason": "OUT_OF_SCOPE",
                "response": OUT_OF_SCOPE_RESPONSE,
            }

    # 3. Check for obvious outside topics (weather, politics, sports, general knowledge trivia)
    for pat in OUTSIDE_PATTERNS:
        if re.search(pat, q, re.IGNORECASE):
            return {
                "in_scope": False,
                "refusal_reason": "OUT_OF_SCOPE",
                "response": OUT_OF_SCOPE_RESPONSE,
            }

    # 4. Check whether question contains any recruitment domain anchor
    has_domain_anchor = any(kw in q for kw in RECRUITMENT_KEYWORDS)
    if not has_domain_anchor:
        # Check if it mentions known candidate or job titles
        # If completely unanchored, reject as out-of-scope
        return {
            "in_scope": False,
            "refusal_reason": "OUT_OF_SCOPE",
            "response": OUT_OF_SCOPE_RESPONSE,
        }

    return {
        "in_scope": True,
        "refusal_reason": None,
        "response": None,
    }
