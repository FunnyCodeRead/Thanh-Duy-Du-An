from datetime import datetime

from flask import Blueprint, jsonify, request, session
from mysql.connector import Error

from database.db import (
    create_interview,
    get_application_by_id,
    get_interview_by_id,
    get_interviewers,
    get_interviews,
    get_user_by_id,
    update_interview,
    update_interview_status,
)
from routes.auth_routes import api_role_required


interview_bp = Blueprint("interviews", __name__, url_prefix="/api/interviews")

INTERVIEW_STATUSES = ("SCHEDULED", "COMPLETED", "CANCELLED")


def parse_datetime(dt_str):
    if not dt_str:
        return None
    # Normalize ISO string
    s = str(dt_str).strip().replace("T", " ")
    for fmt in ("%Y-%m-%d %H:%M:%S", "%Y-%m-%d %H:%M", "%Y-%m-%d"):
        try:
            return datetime.strptime(s, fmt)
        except ValueError:
            pass
    return None


@interview_bp.get("")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_interviews():
    keyword = request.args.get("keyword", "").strip()
    status = request.args.get("status", "").strip().upper()
    app_id = request.args.get("application_id", "").strip()
    interviewer_id = request.args.get("interviewer_id", "").strip()

    selected_status = status if status in INTERVIEW_STATUSES else None
    selected_app_id = int(app_id) if app_id.isdigit() else None
    selected_interviewer_id = int(interviewer_id) if interviewer_id.isdigit() else None

    try:
        data = get_interviews(
            keyword=keyword or None,
            status=selected_status,
            application_id=selected_app_id,
            interviewer_id=selected_interviewer_id,
        )
        return jsonify(success=True, data=data)
    except Error:
        return jsonify(success=False, message="Không thể tải danh sách phỏng vấn."), 500


@interview_bp.get("/interviewers")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_interviewers():
    try:
        users = get_interviewers()
        return jsonify(success=True, data=users)
    except Error:
        return jsonify(success=False, message="Không thể tải danh sách người phỏng vấn."), 500


@interview_bp.get("/<int:interview_id>")
@api_role_required("ADMIN", "HR", "MANAGER")
def get_interview(interview_id):
    try:
        interview = get_interview_by_id(interview_id)
    except Error:
        return jsonify(success=False, message="Không thể tải thông tin phỏng vấn."), 500

    if not interview:
        return jsonify(success=False, message="Không tìm thấy lịch phỏng vấn."), 404

    return jsonify(success=True, data=interview)


@interview_bp.post("")
@api_role_required("ADMIN", "HR")
def add_interview():
    data = request.get_json(silent=True) or {}
    raw_app_id = data.get("application_id")
    raw_interviewer_id = data.get("interviewer_id")
    raw_date = data.get("interview_date")
    location = str(data.get("location", "")).strip()
    note = str(data.get("note", "")).strip()

    if raw_app_id is None or raw_interviewer_id is None or not raw_date:
        return jsonify(success=False, message="Vui lòng điền đầy đủ hồ sơ, người phỏng vấn và thời gian."), 400

    try:
        application_id = int(raw_app_id)
        interviewer_id = int(raw_interviewer_id)
        if application_id <= 0 or interviewer_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Mã hồ sơ hoặc người phỏng vấn không hợp lệ."), 400

    dt = parse_datetime(raw_date)
    if not dt:
        return jsonify(success=False, message="Thời gian phỏng vấn không đúng định dạng."), 400

    try:
        application = get_application_by_id(application_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra hồ sơ ứng tuyển."), 500

    if not application:
        return jsonify(success=False, message="Không tìm thấy hồ sơ ứng tuyển."), 404

    try:
        interviewer = get_user_by_id(interviewer_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra người phỏng vấn."), 500

    if not interviewer:
        return jsonify(success=False, message="Không tìm thấy người phỏng vấn."), 404

    try:
        interview_id = create_interview(
            application_id=application_id,
            interviewer_id=interviewer_id,
            interview_date=dt.strftime("%Y-%m-%d %H:%M:%S"),
            location=location,
            note=note,
        )
        created = get_interview_by_id(interview_id)
        return jsonify(
            success=True,
            message="Tạo lịch phỏng vấn thành công.",
            data=created or {"id": interview_id, "status": "SCHEDULED"},
        ), 201
    except Error:
        return jsonify(success=False, message="Không thể tạo lịch phỏng vấn."), 500


@interview_bp.put("/<int:interview_id>")
@api_role_required("ADMIN", "HR")
def edit_interview(interview_id):
    try:
        existing = get_interview_by_id(interview_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra lịch phỏng vấn."), 500

    if not existing:
        return jsonify(success=False, message="Không tìm thấy lịch phỏng vấn."), 404

    if existing["status"] in ("COMPLETED", "CANCELLED"):
        return jsonify(
            success=False,
            message=f"Không thể chỉnh sửa lịch phỏng vấn đã ở trạng thái {existing['status']}.",
        ), 400

    data = request.get_json(silent=True) or {}
    raw_interviewer_id = data.get("interviewer_id", existing["interviewer_id"])
    raw_date = data.get("interview_date", existing["interview_date"])
    location = str(data.get("location", existing.get("location", ""))).strip()
    note = str(data.get("note", existing.get("note", ""))).strip()

    try:
        interviewer_id = int(raw_interviewer_id)
        if interviewer_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Người phỏng vấn không hợp lệ."), 400

    dt = parse_datetime(raw_date)
    if not dt:
        return jsonify(success=False, message="Thời gian phỏng vấn không đúng định dạng."), 400

    try:
        interviewer = get_user_by_id(interviewer_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra người phỏng vấn."), 500

    if not interviewer:
        return jsonify(success=False, message="Không tìm thấy người phỏng vấn."), 404

    try:
        update_interview(
            interview_id=interview_id,
            interviewer_id=interviewer_id,
            interview_date=dt.strftime("%Y-%m-%d %H:%M:%S"),
            location=location,
            note=note,
        )
        updated = get_interview_by_id(interview_id)
        return jsonify(
            success=True,
            message="Cập nhật lịch phỏng vấn thành công.",
            data=updated,
        )
    except Error:
        return jsonify(success=False, message="Không thể cập nhật lịch phỏng vấn."), 500


ALLOWED_INTERVIEW_TRANSITIONS = {
    "SCHEDULED": ("COMPLETED", "CANCELLED"),
    "COMPLETED": (),
    "CANCELLED": (),
}


@interview_bp.put("/<int:interview_id>/status")
@api_role_required("ADMIN", "HR", "MANAGER")
def edit_interview_status(interview_id):
    data = request.get_json(silent=True) or {}
    new_status = str(data.get("status", "")).strip().upper()

    if not new_status or new_status not in INTERVIEW_STATUSES:
        return jsonify(success=False, message="Trạng thái phỏng vấn không hợp lệ."), 400

    try:
        existing = get_interview_by_id(interview_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra lịch phỏng vấn."), 500

    if not existing:
        return jsonify(success=False, message="Không tìm thấy lịch phỏng vấn."), 404

    # Enforce role logic: MANAGER can only complete an interview if they are the interviewer
    current_role = session.get("role")
    current_user_id = session.get("user_id")
    if current_role == "MANAGER":
        if new_status != "COMPLETED" or existing["interviewer_id"] != current_user_id:
            return jsonify(success=False, message="Không có quyền truy cập."), 403

    current_status = existing["status"]
    allowed = ALLOWED_INTERVIEW_TRANSITIONS.get(current_status, ())
    if new_status not in allowed:
        return jsonify(
            success=False,
            message=f"Không thể chuyển trạng thái từ {current_status} sang {new_status}.",
        ), 400

    try:
        update_interview_status(interview_id, new_status)
        updated = get_interview_by_id(interview_id)
        return jsonify(
            success=True,
            message="Cập nhật trạng thái phỏng vấn thành công.",
            data=updated,
        )
    except Error:
        return jsonify(success=False, message="Không thể cập nhật trạng thái phỏng vấn."), 500

