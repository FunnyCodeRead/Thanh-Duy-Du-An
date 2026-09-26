import logging
from flask import Blueprint, jsonify, request, session

from database.db import get_ai_results_by_application, get_application_by_id
from services.ai_service import (
    generate_email,
    generate_interview_questions,
    summarize_cv,
)
from services.gemini_service import GeminiServiceError

logger = logging.getLogger(__name__)

ai_bp = Blueprint("ai", __name__, url_prefix="/api")


def require_auth():
    """Kiem tra session nguoi dung da dang nhap."""
    if not session.get("user_id"):
        return jsonify(success=False, message="Vui lòng đăng nhập để tiếp tục."), 401
    return None


@ai_bp.route("/ai/cv-summary", methods=["POST"])
def api_cv_summary():
    auth_err = require_auth()
    if auth_err:
        return auth_err

    data = request.get_json(silent=True) or {}
    raw_app_id = data.get("application_id")
    try:
        application_id = int(raw_app_id)
        if application_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Mã hồ sơ ứng tuyển không hợp lệ."), 400

    try:
        result = summarize_cv(application_id)
        return jsonify(success=True, data=result), 200
    except ValueError as ve:
        msg = str(ve)
        status_code = 404 if "Không tìm thấy" in msg else 400
        return jsonify(success=False, message=msg), status_code
    except GeminiServiceError as ge:
        return jsonify(success=False, message=str(ge)), 500
    except Exception as exc:
        logger.error("Loi he thong tai api_cv_summary: %s", exc.__class__.__name__)
        return jsonify(success=False, message="Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau."), 500


@ai_bp.route("/ai/interview-questions", methods=["POST"])
def api_interview_questions():
    auth_err = require_auth()
    if auth_err:
        return auth_err

    data = request.get_json(silent=True) or {}
    raw_app_id = data.get("application_id")
    try:
        application_id = int(raw_app_id)
        if application_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Mã hồ sơ ứng tuyển không hợp lệ."), 400

    try:
        result = generate_interview_questions(application_id)
        return jsonify(success=True, data=result), 200
    except ValueError as ve:
        msg = str(ve)
        status_code = 404 if "Không tìm thấy" in msg else 400
        return jsonify(success=False, message=msg), status_code
    except GeminiServiceError as ge:
        return jsonify(success=False, message=str(ge)), 500
    except Exception as exc:
        logger.error("Loi he thong tai api_interview_questions: %s", exc.__class__.__name__)
        return jsonify(success=False, message="Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau."), 500


@ai_bp.route("/ai/email", methods=["POST"])
def api_email():
    auth_err = require_auth()
    if auth_err:
        return auth_err

    current_role = session.get("role")
    if current_role not in ("ADMIN", "HR"):
        return jsonify(success=False, message="Bạn không có quyền soạn thảo email tuyển dụng."), 403

    data = request.get_json(silent=True) or {}
    raw_app_id = data.get("application_id")
    email_type = data.get("email_type")

    try:
        application_id = int(raw_app_id)
        if application_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Mã hồ sơ ứng tuyển không hợp lệ."), 400

    if not email_type or email_type not in ("INTERVIEW_INVITATION", "RESULT"):
        return jsonify(success=False, message="Loại email không hợp lệ. Chỉ hỗ trợ INTERVIEW_INVITATION hoặc RESULT."), 400

    try:
        result = generate_email(application_id, email_type)
        return jsonify(success=True, data=result), 200
    except ValueError as ve:
        msg = str(ve)
        status_code = 404 if "Không tìm thấy" in msg else 400
        return jsonify(success=False, message=msg), status_code
    except GeminiServiceError as ge:
        return jsonify(success=False, message=str(ge)), 500
    except Exception as exc:
        logger.error("Loi he thong tai api_email: %s", exc.__class__.__name__)
        return jsonify(success=False, message="Không thể sử dụng trợ lý AI lúc này. Vui lòng thử lại sau."), 500


@ai_bp.route("/applications/<int:application_id>/ai-results", methods=["GET"])
def api_list_ai_results(application_id):
    auth_err = require_auth()
    if auth_err:
        return auth_err

    if application_id <= 0:
        return jsonify(success=False, message="Mã hồ sơ không hợp lệ."), 400

    application = get_application_by_id(application_id)
    if not application:
        return jsonify(success=False, message="Không tìm thấy hồ sơ ứng tuyển."), 404

    results = get_ai_results_by_application(application_id)
    return jsonify(success=True, data=results), 200
