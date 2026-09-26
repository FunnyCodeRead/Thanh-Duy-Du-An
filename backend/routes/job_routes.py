from flask import Blueprint, jsonify, request
from mysql.connector import Error

from database.db import create_job, delete_job, get_job_by_id, get_jobs, update_job
from routes.auth_routes import api_role_required


job_bp = Blueprint("jobs", __name__, url_prefix="/api/jobs")
JOB_STATUSES = ("OPEN", "CLOSED")


def job_values(data):
    return {
        "title": str(data.get("title", "")).strip(),
        "department": str(data.get("department", "")).strip(),
        "description": str(data.get("description", "")).strip(),
        "requirements": str(data.get("requirements", "")).strip(),
        "skills": str(data.get("skills", "")).strip(),
        "quantity": data.get("quantity", 1),
        "status": str(data.get("status", "OPEN")).strip().upper(),
    }


def validate_job(values):
    errors = []
    if not values["title"]:
        errors.append("Vui lòng nhập tên vị trí.")
    if not values["description"]:
        errors.append("Vui lòng nhập mô tả công việc.")
    try:
        values["quantity"] = int(values["quantity"])
        if values["quantity"] < 1:
            errors.append("Số lượng phải lớn hơn hoặc bằng 1.")
    except (TypeError, ValueError):
        errors.append("Số lượng phải là số nguyên hợp lệ.")
    if values["status"] not in JOB_STATUSES:
        errors.append("Trạng thái vị trí không hợp lệ.")
    return errors


@job_bp.get("")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_jobs():
    keyword = request.args.get("keyword", "").strip()
    status = request.args.get("status", "").strip().upper()
    selected_status = status if status in JOB_STATUSES else None
    try:
        return jsonify(success=True, data=get_jobs(keyword or None, selected_status))
    except Error:
        return jsonify(success=False, message="Không thể tải danh sách vị trí."), 500


@job_bp.get("/<int:job_id>")
@api_role_required("ADMIN", "HR", "MANAGER")
def get_job(job_id):
    try:
        job = get_job_by_id(job_id)
    except Error:
        return jsonify(success=False, message="Không thể tải vị trí."), 500
    if not job:
        return jsonify(success=False, message="Không tìm thấy vị trí."), 404
    return jsonify(success=True, data=job)


@job_bp.post("")
@api_role_required("ADMIN", "HR")
def add_job():
    values = job_values(request.get_json(silent=True) or {})
    errors = validate_job(values)
    if errors:
        return jsonify(success=False, message=errors[0], errors=errors), 400
    try:
        job_id = create_job(**values)
        return jsonify(success=True, data=get_job_by_id(job_id)), 201
    except Error:
        return jsonify(success=False, message="Không thể thêm vị trí."), 500


@job_bp.put("/<int:job_id>")
@api_role_required("ADMIN", "HR")
def edit_job(job_id):
    try:
        existing = get_job_by_id(job_id)
    except Error:
        return jsonify(success=False, message="Không thể tải vị trí."), 500
    if not existing:
        return jsonify(success=False, message="Không tìm thấy vị trí."), 404
    values = job_values(request.get_json(silent=True) or {})
    errors = validate_job(values)
    if errors:
        return jsonify(success=False, message=errors[0], errors=errors), 400
    try:
        update_job(job_id, **values)
        return jsonify(success=True, data=get_job_by_id(job_id))
    except Error:
        return jsonify(success=False, message="Không thể cập nhật vị trí."), 500


@job_bp.delete("/<int:job_id>")
@api_role_required("ADMIN", "HR")
def remove_job(job_id):
    try:
        existing = get_job_by_id(job_id)
    except Error:
        return jsonify(success=False, message="Không thể tải vị trí."), 500
    if not existing:
        return jsonify(success=False, message="Không tìm thấy vị trí."), 404
    try:
        if not delete_job(job_id):
            return jsonify(success=False, message="Không thể xóa vị trí đã có ứng viên ứng tuyển."), 409
        return jsonify(success=True, message="Xóa vị trí thành công.")
    except Error:
        return jsonify(success=False, message="Không thể xóa vị trí."), 500
