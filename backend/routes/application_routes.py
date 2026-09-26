from flask import Blueprint, jsonify, request
from mysql.connector import Error, IntegrityError

from database.db import (
    application_exists,
    create_application,
    get_application_by_id,
    get_applications,
    get_candidate_by_id,
    get_job_by_id,
    update_application_status,
)
from routes.auth_routes import api_role_required


application_bp = Blueprint("applications", __name__, url_prefix="/api/applications")

APPLICATION_STATUSES = ("NEW", "SCREENING", "INTERVIEW", "PASSED", "REJECTED")

ALLOWED_TRANSITIONS = {
    "NEW": ("SCREENING", "REJECTED"),
    "SCREENING": ("INTERVIEW", "REJECTED"),
    "INTERVIEW": ("PASSED", "REJECTED"),
    "PASSED": (),
    "REJECTED": (),
}


@application_bp.get("")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_applications():
    keyword = request.args.get("keyword", "").strip()
    status = request.args.get("status", "").strip().upper()
    job_id = request.args.get("job_id", "").strip()

    selected_status = status if status in APPLICATION_STATUSES else None
    selected_job_id = None
    if job_id:
        try:
            selected_job_id = int(job_id)
        except (ValueError, TypeError):
            selected_job_id = None

    try:
        data = get_applications(keyword=keyword or None, status=selected_status, job_id=selected_job_id)
        return jsonify(success=True, data=data)
    except Error:
        return jsonify(success=False, message="Không thể tải danh sách hồ sơ ứng tuyển."), 500


@application_bp.get("/<int:application_id>")
@api_role_required("ADMIN", "HR", "MANAGER")
def get_application(application_id):
    try:
        application = get_application_by_id(application_id)
    except Error:
        return jsonify(success=False, message="Không thể tải hồ sơ ứng tuyển."), 500

    if not application:
        return jsonify(success=False, message="Không tìm thấy hồ sơ ứng tuyển."), 404

    return jsonify(success=True, data=application)


@application_bp.post("")
@api_role_required("ADMIN", "HR")
def add_application():
    data = request.get_json(silent=True) or {}
    raw_candidate_id = data.get("candidate_id")
    raw_job_id = data.get("job_id")
    note = str(data.get("note", "")).strip()

    if raw_candidate_id is None or raw_job_id is None:
        return jsonify(success=False, message="Vui lòng chọn ứng viên và vị trí tuyển dụng."), 400

    try:
        candidate_id = int(raw_candidate_id)
        job_id = int(raw_job_id)
        if candidate_id <= 0 or job_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Dữ liệu ứng viên hoặc vị trí tuyển dụng không hợp lệ."), 400

    try:
        candidate = get_candidate_by_id(candidate_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra ứng viên."), 500

    if not candidate:
        return jsonify(success=False, message="Không tìm thấy ứng viên."), 404

    try:
        job = get_job_by_id(job_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra vị trí tuyển dụng."), 500

    if not job:
        return jsonify(success=False, message="Không tìm thấy vị trí tuyển dụng."), 404

    try:
        if application_exists(candidate_id, job_id):
            return jsonify(success=False, message="Ứng viên đã có hồ sơ ứng tuyển cho vị trí này."), 409

        application_id = create_application(candidate_id=candidate_id, job_id=job_id, note=note)
        created = get_application_by_id(application_id)
        return jsonify(
            success=True,
            message="Tạo hồ sơ ứng tuyển thành công.",
            data=created or {"id": application_id, "status": "NEW"},
        ), 201
    except IntegrityError:
        return jsonify(success=False, message="Ứng viên đã có hồ sơ ứng tuyển cho vị trí này."), 409
    except Error:
        return jsonify(success=False, message="Không thể tạo hồ sơ ứng tuyển."), 500


@application_bp.put("/<int:application_id>/status")
@api_role_required("ADMIN", "HR")
def edit_application_status(application_id):
    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status", "")).strip().upper()

    if not new_status or new_status not in APPLICATION_STATUSES:
        return jsonify(success=False, message="Trạng thái không hợp lệ."), 400

    try:
        existing = get_application_by_id(application_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra hồ sơ ứng tuyển."), 500

    if not existing:
        return jsonify(success=False, message="Không tìm thấy hồ sơ ứng tuyển."), 404

    current_status = existing["status"]
    allowed = ALLOWED_TRANSITIONS.get(current_status, ())

    if new_status not in allowed:
        return jsonify(
            success=False,
            message=f"Không thể chuyển trạng thái từ {current_status} sang {new_status}.",
        ), 400

    try:
        update_application_status(application_id, new_status)
        updated = get_application_by_id(application_id)
        return jsonify(
            success=True,
            message="Cập nhật trạng thái thành công.",
            data=updated or {"id": application_id, "status": new_status},
        )
    except Error:
        return jsonify(success=False, message="Không thể cập nhật trạng thái hồ sơ ứng tuyển."), 500
