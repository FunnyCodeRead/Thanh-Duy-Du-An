"""Intent Router and Decision Guard for Recruitment Knowledge Chatbot.

Classifies user questions into:
- DECISION_REFUSAL: Questions requesting automated hiring decisions or candidate rankings
- STRUCTURED: Count, status, schedule, or list queries solved directly via SQL
- HYBRID: Combination of SQL status/job filter and semantic skill/experience matching
- SEMANTIC: Pure semantic search on skills, CV text, job descriptions, evaluation comments
"""

import re

DECISION_REFUSAL_RESPONSE = (
    "Tôi có thể cung cấp thông tin hồ sơ, kỹ năng, kinh nghiệm "
    "và các đánh giá đã được lưu trong hệ thống, "
    "nhưng quyết định tuyển dụng cần do người phụ trách thực hiện."
)

DECISION_PATTERNS = [
    r"\b(nên\s*tuyển|nen\s*tuyen)\b",
    r"\b(tốt\s*nhất|tot\s*nhat|xếp\s*hạng|xep\s*hang|ranking)\b",
    r"\b(ai\s*hơn\s*ai|ai\s*hon\s*ai|ai\s*giỏi\s*hơn|ai\s*gioi\s*hon)\b",
    r"\b(khả\s*năng\s*đậu|kha\s*nang\s*dau|xác\s*suất\s*trúng\s*tuyển|tỷ\s*lệ\s*trúng\s*tuyển)\b",
    r"\b(nên\s*loại|nen\s*loai|loại\s*bớt|loại\s*ai)\b",
    r"\b(ai\s*có\s*khả\s*năng\s*trúng\s*tuyển\s*cao\s*nhất)\b",
]

# Status keywords mapping to official application & job statuses
STATUS_KEYWORDS = {
    "open": "OPEN",
    "đang tuyển": "OPEN",
    "đang mở tuyển": "OPEN",
    "closed": "CLOSED",
    "đã đóng": "CLOSED",
    "đã đóng tuyển": "CLOSED",
    "new": "NEW",
    "mới nhận": "NEW",
    "mới nộp": "NEW",
    "screening": "SCREENING",
    "sàng lọc": "SCREENING",
    "sàng lọc hồ sơ": "SCREENING",
    "interview": "INTERVIEW",
    "phỏng vấn": "INTERVIEW",
    "đang phỏng vấn": "INTERVIEW",
    "passed": "PASSED",
    "trúng tuyển": "PASSED",
    "đậu": "PASSED",
    "rejected": "REJECTED",
    "không đạt": "REJECTED",
    "bị loại": "REJECTED",
    "từ chối": "REJECTED",
}


def route_intent(question: str) -> dict:
    """Xác định loại ý định và tham số xử lý cho câu hỏi.
    
    Returns:
        dict: {
            "intent": "DECISION_REFUSAL" | "STRUCTURED" | "HYBRID" | "SEMANTIC",
            "subtype": str,
            "filter_status": str | None,
            "filter_job": str | None,
            "refusal_response": str | None
        }
    """
    q = question.lower().strip()

    # 1. Decision Guard check
    for pat in DECISION_PATTERNS:
        if re.search(pat, q, re.IGNORECASE):
            return {
                "intent": "DECISION_REFUSAL",
                "subtype": "hiring_decision",
                "filter_status": None,
                "filter_job": None,
                "refusal_response": DECISION_REFUSAL_RESPONSE,
            }

    # Detect if question mentions a specific application status
    detected_status = None
    for kw, st in STATUS_KEYWORDS.items():
        if re.search(r"\b" + re.escape(kw) + r"\b", q):
            # If "phỏng vấn" is preceded by "lịch", treat as interview schedule rather than application status
            if kw == "phỏng vấn" and "lịch" in q:
                continue
            detected_status = st
            break

    # Detect if question asks for upcoming interviews
    is_upcoming_interviews = bool(
        re.search(r"\b(lịch\s*phỏng\s*vấn|lich\s*phong\s*van|sắp\s*phỏng\s*vấn|buổi\s*phỏng\s*vấn\s*sắp\s*tới)\b", q)
    )

    # Detect if question asks for count or status totals
    is_count = bool(
        re.search(r"\b(bao\s*nhiêu|tổng\s*số|có\s*mấy|mấy\s*ứng\s*viên|mấy\s*hồ\s*sơ|mấy\s*vị\s*trí)\b", q)
    )

    # Detect semantic attributes (skills, experience, CV, comments, matching)
    has_semantic_trigger = bool(
        re.search(
            r"\b(kinh\s*nghiệm|kỹ\s*năng|phù\s*hợp|cv|dự\s*án|nhận\s*xét|đánh\s*giá|từng\s*làm|backend|frontend|flask|python|react|mysql|sql|java|docker|gần\s*với)\b",
            q,
        )
    )

    # 2. Check for HYBRID Intent:
    # A status or job filter is specified AND semantic matching (skills/experience) is requested
    # e.g., "Trong các ứng viên đang INTERVIEW, ai có kinh nghiệm Flask?"
    # e.g., "Trong các ứng viên đã PASSED, ai có kỹ năng Python?"
    if (detected_status or "ứng tuyển" in q) and has_semantic_trigger:
        # Check if it asks for a specific filtered group with semantic criteria
        if any(marker in q for marker in ["trong các", "trong số", "đang", "đã", "ứng tuyển"]):
            return {
                "intent": "HYBRID",
                "subtype": "status_semantic_filter",
                "filter_status": detected_status,
                "filter_job": None,
                "refusal_response": None,
            }

    # 3. Check for STRUCTURED Intent:
    # Upcoming interviews
    if is_upcoming_interviews and not has_semantic_trigger:
        return {
            "intent": "STRUCTURED",
            "subtype": "upcoming_interviews",
            "filter_status": None,
            "filter_job": None,
            "refusal_response": None,
        }

    # Count of candidates
    if is_count and any(term in q for term in ["ứng viên", "ung vien", "candidate"]):
        if not detected_status:
            return {
                "intent": "STRUCTURED",
                "subtype": "count_candidates",
                "filter_status": None,
                "filter_job": None,
                "refusal_response": None,
            }

    # Count or list of applications by status
    # e.g. "Có bao nhiêu hồ sơ đang INTERVIEW?", "Bao nhiêu hồ sơ bị REJECTED?", "Ứng viên nào đã PASSED?"
    if detected_status and (is_count or any(term in q for term in ["hồ sơ", "ai đã", "ứng viên nào", "những ai"])):
        if not has_semantic_trigger:
            return {
                "intent": "STRUCTURED",
                "subtype": "application_status",
                "filter_status": detected_status,
                "filter_job": None,
                "refusal_response": None,
            }

    # Job listing / status
    # e.g. "Những vị trí nào đang tuyển?", "Vị trí nào đang OPEN?", "Các công việc đang mở?"
    if any(term in q for term in ["vị trí", "vi tri", "công việc", "cong viec", "job"]) and (
        "đang tuyển" in q or "open" in q or "đang mở" in q or "tất cả" in q or "danh sách" in q
    ) and not has_semantic_trigger:
        return {
            "intent": "STRUCTURED",
            "subtype": "job_status",
            "filter_status": detected_status or "OPEN",
            "filter_job": None,
            "refusal_response": None,
        }

    # 4. Fallback to SEMANTIC (Search via FAISS vector store)
    return {
        "intent": "SEMANTIC",
        "subtype": "vector_search",
        "filter_status": detected_status,
        "filter_job": None,
        "refusal_response": None,
    }
