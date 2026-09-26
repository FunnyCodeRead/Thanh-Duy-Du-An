from flask import Blueprint, jsonify, request, session
from mysql.connector import Error

from database.db import (
    create_evaluation,
    get_application_by_id,
    get_application_evaluations,
    get_evaluation_by_id,
    get_evaluations,
    update_evaluation,
)
from routes.auth_routes import api_login_required, api_role_required


evaluation_bp = Blueprint("evaluations", __name__)


def validate_score(score_val, field_name):
    try:
        score = int(score_val)
        if score < 1 or score > 5:
            return None, f"Điểm {field_name} phải từ 1 đến 5."
        return score, None
    except (TypeError, ValueError):
        return None, f"Điểm {field_name} phải là số nguyên từ 1 đến 5."


@evaluation_bp.get("/api/evaluations")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_evaluations():
    app_id = request.args.get("application_id", "").strip()
    selected_app_id = int(app_id) if app_id.isdigit() else None
    try:
        data = get_evaluations(application_id=selected_app_id)
        return jsonify(success=True, data=data)
    except Error:
        return jsonify(success=False, message="Không thể tải danh sách đánh giá."), 500


@evaluation_bp.get("/api/evaluations/<int:evaluation_id>")
@api_role_required("ADMIN", "HR", "MANAGER")
def get_evaluation(evaluation_id):
    try:
        evaluation = get_evaluation_by_id(evaluation_id)
    except Error:
        return jsonify(success=False, message="Không thể tải đánh giá."), 500

    if not evaluation:
        return jsonify(success=False, message="Không tìm thấy đánh giá."), 404

    return jsonify(success=True, data=evaluation)


@evaluation_bp.get("/api/applications/<int:application_id>/evaluations")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_application_evaluations(application_id):
    try:
        application = get_application_by_id(application_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra hồ sơ ứng tuyển."), 500

    if not application:
        return jsonify(success=False, message="Không tìm thấy hồ sơ ứng tuyển."), 404

    try:
        data = get_application_evaluations(application_id)
        return jsonify(success=True, data=data)
    except Error:
        return jsonify(success=False, message="Không thể tải đánh giá của hồ sơ."), 500


@evaluation_bp.post("/api/evaluations")
@api_login_required
def add_evaluation():
    data = request.get_json(silent=True) or {}
    raw_app_id = data.get("application_id")
    raw_tech = data.get("technical_score")
    raw_comm = data.get("communication_score")
    raw_exp = data.get("experience_score")
    comment = str(data.get("comment", "")).strip()

    if raw_app_id is None or raw_tech is None or raw_comm is None or raw_exp is None:
        return jsonify(success=False, message="Vui lòng điền đầy đủ hồ sơ và các điểm đánh giá."), 400

    try:
        application_id = int(raw_app_id)
        if application_id <= 0:
            raise ValueError
    except (TypeError, ValueError):
        return jsonify(success=False, message="Mã hồ sơ ứng tuyển không hợp lệ."), 400

    tech_score, err = validate_score(raw_tech, "chuyên môn")
    if err:
        return jsonify(success=False, message=err), 400

    comm_score, err = validate_score(raw_comm, "giao tiếp")
    if err:
        return jsonify(success=False, message=err), 400

    exp_score, err = validate_score(raw_exp, "kinh nghiệm")
    if err:
        return jsonify(success=False, message=err), 400

    try:
        application = get_application_by_id(application_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra hồ sơ ứng tuyển."), 500

    if not application:
        return jsonify(success=False, message="Không tìm thấy hồ sơ ứng tuyển."), 404

    evaluator_id = session.get("user_id")

    try:
        evaluation_id = create_evaluation(
            application_id=application_id,
            evaluator_id=evaluator_id,
            technical_score=tech_score,
            communication_score=comm_score,
            experience_score=exp_score,
            comment=comment,
        )
        created = get_evaluation_by_id(evaluation_id)
        return jsonify(
            success=True,
            message="Đánh giá ứng viên thành công.",
            data=created,
        ), 201
    except Error:
        return jsonify(success=False, message="Không thể tạo đánh giá."), 500


@evaluation_bp.put("/api/evaluations/<int:evaluation_id>")
@api_login_required
def edit_evaluation(evaluation_id):
    try:
        existing = get_evaluation_by_id(evaluation_id)
    except Error:
        return jsonify(success=False, message="Không thể kiểm tra đánh giá."), 500

    if not existing:
        return jsonify(success=False, message="Không tìm thấy đánh giá."), 404

    current_user_id = session.get("user_id")
    current_role = session.get("role")

    # Only ADMIN or the evaluator who created it can edit
    if current_role != "ADMIN" and existing["evaluator_id"] != current_user_id:
        return jsonify(success=False, message="Không có quyền chỉnh sửa đánh giá này."), 403

    data = request.get_json(silent=True) or {}
    raw_tech = data.get("technical_score", existing["technical_score"])
    raw_comm = data.get("communication_score", existing["communication_score"])
    raw_exp = data.get("experience_score", existing["experience_score"])
    comment = str(data.get("comment", existing.get("comment", ""))).strip()

    tech_score, err = validate_score(raw_tech, "chuyên môn")
    if err:
        return jsonify(success=False, message=err), 400

    comm_score, err = validate_score(raw_comm, "giao tiếp")
    if err:
        return jsonify(success=False, message=err), 400

    exp_score, err = validate_score(raw_exp, "kinh nghiệm")
    if err:
        return jsonify(success=False, message=err), 400

    try:
        update_evaluation(
            evaluation_id=evaluation_id,
            technical_score=tech_score,
            communication_score=comm_score,
            experience_score=exp_score,
            comment=comment,
        )
        updated = get_evaluation_by_id(evaluation_id)
        return jsonify(
            success=True,
            message="Cập nhật đánh giá thành công.",
            data=updated,
        )
    except Error:
        return jsonify(success=False, message="Không thể cập nhật đánh giá."), 500
