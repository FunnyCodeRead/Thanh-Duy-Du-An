"""RAG Service for Recruitment Knowledge Chatbot.

Orchestrates the entire query pipeline:
Validation -> Scope Guard -> Decision Guard -> Intent Router -> Retrieval (SQL/Vector) -> Context Builder -> Grounded Gemini Response -> Source Citation.
"""

import logging
import os
try:
    from database.db import (
        count_applications_by_status,
        count_candidates,
        get_candidates_by_application_status,
        get_jobs_by_status,
        get_upcoming_interviews,
    )
    from rag.context_builder import build_context
    from rag.intent_router import route_intent
    from rag.retriever import retrieve
    from rag.scope_guard import check_scope
    from rag.vector_store import is_index_available
    from services.gemini_service import GeminiServiceError, generate_content
except ImportError:
    from backend.database.db import (
        count_applications_by_status,
        count_candidates,
        get_candidates_by_application_status,
        get_jobs_by_status,
        get_upcoming_interviews,
    )
    from backend.rag.context_builder import build_context
    from backend.rag.intent_router import route_intent
    from backend.rag.retriever import retrieve
    from backend.rag.scope_guard import check_scope
    from backend.rag.vector_store import is_index_available
    from backend.services.gemini_service import GeminiServiceError, generate_content

logger = logging.getLogger(__name__)

PROMPT_FILE = os.path.join(os.path.dirname(__file__), "..", "prompts", "recruitment_chat.txt")
NO_CONTEXT_RESPONSE = "Tôi không tìm thấy đủ thông tin trong dữ liệu tuyển dụng hiện có để trả lời câu hỏi này."
INDEX_MISSING_RESPONSE = (
    "Chỉ mục dữ liệu AI chưa được khởi tạo. "
    "Vui lòng yêu cầu quản trị viên cập nhật dữ liệu trợ lý AI."
)

STATUS_VI_NAMES = {
    "NEW": "Mới nhận",
    "SCREENING": "Sàng lọc hồ sơ",
    "INTERVIEW": "Phỏng vấn",
    "PASSED": "Trúng tuyển",
    "REJECTED": "Không đạt",
    "OPEN": "Đang mở tuyển",
    "CLOSED": "Đã đóng tuyển",
}


def _load_prompt_template() -> str:
    """Doc noi dung system prompt cho RAG."""
    if os.path.exists(PROMPT_FILE):
        try:
            with open(PROMPT_FILE, "r", encoding="utf-8") as f:
                return f.read().strip()
        except Exception as e:
            logger.warning("Khong the doc file prompt: %s", e)
    return (
        "Bạn là Trợ lý dữ liệu tuyển dụng. "
        "Hãy trả lời câu hỏi của người dùng CHỈ dựa trên CONTEXT được cung cấp. "
        "Nếu không đủ thông tin, trả lời chính xác: "
        "'Tôi không tìm thấy đủ thông tin trong dữ liệu tuyển dụng hiện có để trả lời câu hỏi này.'"
    )


def handle_structured_intent(router_info: dict, question: str) -> dict:
    """Xu ly cac cau hoi co cau truc (STRUCTURED) truc tiep qua MySQL read-only."""
    subtype = router_info.get("subtype")
    status = router_info.get("filter_status")

    # 1. Total Candidates count
    if subtype == "count_candidates":
        total = count_candidates()
        return {
            "answer": f"Hiện tại hệ thống tuyển dụng đang quản lý tổng cộng {total} ứng viên.",
            "retrieval_type": "STRUCTURED",
            "sources": [{"entity_type": "candidate", "entity_id": 0, "display_name": "Cơ sở dữ liệu ứng viên"}],
            "has_context": True,
        }

    # 2. Upcoming Interviews schedule
    if subtype == "upcoming_interviews":
        interviews = get_upcoming_interviews(limit=5)
        if not interviews:
            return {
                "answer": "Hiện tại không có buổi phỏng vấn nào sắp tới đang ở trạng thái đã lên lịch.",
                "retrieval_type": "STRUCTURED",
                "sources": [],
                "has_context": True,
            }

        lines = ["Danh sách các buổi phỏng vấn sắp tới đã được lên lịch trong hệ thống:"]
        sources = []
        for iv in interviews:
            dt_str = iv["interview_date"].strftime("%d/%m/%Y %H:%M") if iv.get("interview_date") else "Chưa rõ"
            loc = iv.get("location") or "Tại công ty"
            lines.append(
                f"• **Ứng viên {iv['candidate_name']}** – Vị trí: *{iv['job_title']}* "
                f"| Thời gian: **{dt_str}** | Phỏng vấn bởi: {iv['interviewer_name']} ({loc})"
            )
            sources.append({
                "entity_type": "interview",
                "entity_id": iv["id"],
                "display_name": f"PV {iv['candidate_name']} - {iv['job_title']}",
            })

        return {
            "answer": "\n".join(lines),
            "retrieval_type": "STRUCTURED",
            "sources": sources,
            "has_context": True,
        }

    # 3. Application status count / list
    if subtype == "application_status" and status:
        status_name = STATUS_VI_NAMES.get(status, status)
        candidates = get_candidates_by_application_status(status)
        count = len(candidates)

        if count == 0:
            return {
                "answer": f"Hiện tại không có hồ sơ ứng tuyển nào đang ở trạng thái {status_name} ({status}).",
                "retrieval_type": "STRUCTURED",
                "sources": [],
                "has_context": True,
            }

        lines = [f"Hiện có **{count} hồ sơ** đang ở trạng thái **{status_name}** ({status}):"]
        sources = []
        for c in candidates:
            lines.append(f"• **{c['full_name']}** – Vị trí: *{c.get('job_title', 'Chưa rõ')}*")
            sources.append({
                "entity_type": "candidate",
                "entity_id": c["id"],
                "display_name": c["full_name"],
            })

        return {
            "answer": "\n".join(lines),
            "retrieval_type": "STRUCTURED",
            "sources": sources,
            "has_context": True,
        }

    # 4. Job status listing (OPEN / CLOSED)
    if subtype == "job_status":
        req_status = status or "OPEN"
        status_name = STATUS_VI_NAMES.get(req_status, req_status)
        jobs = get_jobs_by_status(req_status)

        if not jobs:
            return {
                "answer": f"Hiện tại không có vị trí tuyển dụng nào đang ở trạng thái {status_name}.",
                "retrieval_type": "STRUCTURED",
                "sources": [],
                "has_context": True,
            }

        lines = [f"Danh sách các vị trí tuyển dụng đang ở trạng thái **{status_name}** ({len(jobs)} vị trí):"]
        sources = []
        for j in jobs:
            lines.append(
                f"• **{j['title']}** (Phòng ban: *{j.get('department') or 'Chung'}*, Chỉ tiêu: {j.get('quantity') or 1} người)"
            )
            sources.append({
                "entity_type": "job",
                "entity_id": j["id"],
                "display_name": j["title"],
            })

        return {
            "answer": "\n".join(lines),
            "retrieval_type": "STRUCTURED",
            "sources": sources,
            "has_context": True,
        }

    # Fallback to general count
    total_cand = count_candidates()
    return {
        "answer": f"Hệ thống hiện quản lý {total_cand} ứng viên. Bạn có thể hỏi cụ thể về vị trí, lịch phỏng vấn hoặc trạng thái hồ sơ.",
        "retrieval_type": "STRUCTURED",
        "sources": [],
        "has_context": True,
    }


def answer_question(question: str, user: dict | None = None, history: list[dict] | None = None) -> dict:
    """Xu ly toan dien cau hoi tuyen dung cua nguoi dung.
    
    Args:
        question: Chuoi cau hoi.
        user: Thong tin nguoi dung da xac thuc (dict).
        history: Danh sach cac luot hoi thoai gan nhat (list of dict).
        
    Returns:
        dict: {
            "answer": str,
            "retrieval_type": "STRUCTURED" | "SEMANTIC" | "HYBRID" | "OUT_OF_SCOPE" | "DECISION_REFUSAL",
            "sources": list[dict],
            "has_context": bool
        }
    """
    # 1. Validation
    if not isinstance(question, str) or not question.strip():
        return {
            "answer": "Vui lòng nhập câu hỏi cần tra cứu.",
            "retrieval_type": "OUT_OF_SCOPE",
            "sources": [],
            "has_context": False,
        }

    q = question.strip()
    if len(q) > 1000:
        return {
            "answer": "Câu hỏi quá dài (tối đa 1000 ký tự). Vui lòng rút ngắn nội dung.",
            "retrieval_type": "OUT_OF_SCOPE",
            "sources": [],
            "has_context": False,
        }

    # 2. Scope Guard
    scope_res = check_scope(q)
    if not scope_res["in_scope"]:
        return {
            "answer": scope_res["response"],
            "retrieval_type": "OUT_OF_SCOPE",
            "sources": [],
            "has_context": False,
        }

    # 3. Decision Guard & Intent Router
    router_info = route_intent(q)
    intent = router_info["intent"]

    if intent == "DECISION_REFUSAL":
        return {
            "answer": router_info["refusal_response"],
            "retrieval_type": "DECISION_REFUSAL",
            "sources": [],
            "has_context": False,
        }

    # 4. Handle STRUCTURED queries directly (no Gemini needed)
    if intent == "STRUCTURED":
        return handle_structured_intent(router_info, q)

    # 5. For SEMANTIC and HYBRID: Vector index is required
    if not is_index_available():
        return {
            "answer": INDEX_MISSING_RESPONSE,
            "retrieval_type": "INDEX_MISSING",
            "sources": [],
            "has_context": False,
        }

    # 6. Retrieve relevant documents
    retrieved_docs = []
    structured_info = None

    if intent == "HYBRID":
        # Extract candidate IDs filtered by MySQL status
        filter_status = router_info.get("filter_status")
        cand_ids = None
        if filter_status:
            candidates = get_candidates_by_application_status(filter_status)
            cand_ids = [c["id"] for c in candidates]
            if not cand_ids:
                status_name = STATUS_VI_NAMES.get(filter_status, filter_status)
                return {
                    "answer": f"Hiện tại không có ứng viên nào đang ở trạng thái {status_name} ({filter_status}) để tìm kiếm.",
                    "retrieval_type": "HYBRID",
                    "sources": [],
                    "has_context": True,
                }
            cand_names = [c["full_name"] for c in candidates]
            status_name = STATUS_VI_NAMES.get(filter_status, filter_status)
            structured_info = f"Ứng viên ở trạng thái {status_name} ({filter_status}): {', '.join(cand_names)}."

        retrieved_docs = retrieve(q, top_k=5, candidate_ids=cand_ids)

    elif intent == "SEMANTIC":
        retrieved_docs = retrieve(q, top_k=5)

    # 7. Check if sufficient context was found
    if not retrieved_docs and not structured_info:
        return {
            "answer": NO_CONTEXT_RESPONSE,
            "retrieval_type": intent,
            "sources": [],
            "has_context": False,
        }

    # 8. Build Grounded Context
    context_text, sources = build_context(retrieved_docs, structured_info=structured_info)

    # 9. Format Conversation History (up to 4 recent turns)
    history_text = ""
    if history and isinstance(history, list):
        recent_turns = []
        for h in history[-4:]:
            if isinstance(h, dict) and h.get("content"):
                role_label = "Người dùng" if h.get("role") == "user" else "Trợ lý AI"
                content_snip = str(h.get("content")).strip()[:300]
                recent_turns.append(f"{role_label}: {content_snip}")
        if recent_turns:
            history_text = "LỊCH SỬ HỘI THOẠI TRƯỚC ĐÓ:\n" + "\n".join(recent_turns) + "\n\n"

    # 10. Format Prompt and Call Gemini
    system_rules = _load_prompt_template()
    prompt = (
        f"{system_rules}\n\n"
        f"{history_text}"
        f"CÂU HỎI:\n{q}\n\n"
        f"LOẠI TRUY XUẤT:\n{intent}\n\n"
        f"CONTEXT TỪ HỆ THỐNG:\n\n{context_text}\n\n"
        f"Hãy trả lời câu hỏi trên CHỈ dựa vào CONTEXT từ hệ thống. "
        f"Tuyệt đối không bịa đặt hoặc sử dụng thông tin bên ngoài."
    )


    try:
        raw_answer = generate_content(prompt)
        return {
            "answer": raw_answer,
            "retrieval_type": intent,
            "sources": sources,
            "has_context": True,
        }
    except GeminiServiceError as g_err:
        logger.error("Loi khi goi Gemini cho RAG chatbot: %s", g_err)
        return {
            "answer": "Không thể kết nối đến trợ lý AI để tổng hợp câu trả lời lúc này. Vui lòng thử lại sau.",
            "retrieval_type": intent,
            "sources": sources,
            "has_context": True,
        }
