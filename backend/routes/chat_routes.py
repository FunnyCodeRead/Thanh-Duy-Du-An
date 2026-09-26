"""Chat Routes for Recruitment Knowledge Chatbot (Hybrid RAG).

Endpoints:
- POST /api/chat: Ask question grounded in recruitment knowledge base
- POST /api/chat/reindex: Rebuild FAISS index from MySQL (ADMIN only)
- GET /api/chat/index-info: Get index metadata & build timestamp
"""

from flask import Blueprint, g, jsonify, request
try:
    from rag.rag_service import answer_question
    from rag.vector_store import get_index_info
    from scripts.rebuild_rag_index import rebuild_index
    from routes.auth_routes import api_role_required
except ImportError:
    from backend.rag.rag_service import answer_question
    from backend.rag.vector_store import get_index_info
    from backend.scripts.rebuild_rag_index import rebuild_index
    from backend.routes.auth_routes import api_role_required

chat_bp = Blueprint("chat", __name__, url_prefix="/api/chat")


@chat_bp.post("")
@api_role_required("ADMIN", "HR", "MANAGER")
def ask_chat():
    """Hỏi đáp với Trợ lý tuyển dụng AI dựa trên dữ liệu hệ thống."""
    payload = request.get_json(silent=True) or {}
    message = payload.get("message")

    if not message or not isinstance(message, str) or not message.strip():
        return jsonify(success=False, message="Vui lòng nhập câu hỏi cần tra cứu."), 400

    cleaned_msg = message.strip()
    if len(cleaned_msg) > 1000:
        return jsonify(success=False, message="Câu hỏi quá dài (tối đa 1000 ký tự)."), 400

    current_user = getattr(g, "current_user", None)
    result = answer_question(cleaned_msg, user=current_user)
    return jsonify(success=True, data=result), 200


@chat_bp.post("/reindex")
@api_role_required("ADMIN")
def reindex_chat():
    """Tái tạo chỉ mục vector FAISS từ cơ sở dữ liệu MySQL (Chỉ dành cho ADMIN)."""
    try:
        index_info = rebuild_index()
        return jsonify(
            success=True,
            message="Tái tạo chỉ mục dữ liệu AI thành công.",
            data=index_info,
        ), 200
    except Exception as exc:
        return jsonify(
            success=False,
            message=f"Lỗi khi tái tạo chỉ mục: {str(exc)}",
        ), 500


@chat_bp.get("/index-info")
@api_role_required("ADMIN", "HR", "MANAGER")
def get_chat_index_info():
    """Lấy thông tin trạng thái chỉ mục dữ liệu AI hiện tại."""
    info = get_index_info()
    return jsonify(success=True, data=info), 200
