import os
import re
import uuid

from docx import Document
from flask import Blueprint, current_app, jsonify, request, send_from_directory
from mysql.connector import Error
from pypdf import PdfReader
from werkzeug.utils import secure_filename

from database.db import (
    create_candidate,
    delete_candidate,
    get_candidate_by_id,
    get_candidates,
    update_candidate,
)
from routes.auth_routes import api_login_required, api_role_required


candidate_bp = Blueprint("candidates", __name__)
CANDIDATE_SOURCES = ("FACEBOOK", "LINKEDIN", "WEBSITE", "REFERRAL", "JOB_SITE", "OTHER")
ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}


def allowed_cv_file(filename):
    safe_name = secure_filename(filename)
    return "." in safe_name and safe_name.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS


def extract_cv_text(file_path, extension):
    try:
        if extension == "pdf":
            return "\n".join(page.extract_text() or "" for page in PdfReader(file_path).pages).strip()
        if extension == "docx":
            return "\n".join(paragraph.text for paragraph in Document(file_path).paragraphs).strip()
    except Exception as error:
        current_app.logger.warning("Could not extract CV text: %s", error)
    return ""


def save_cv_file(upload):
    original_name = secure_filename(upload.filename)
    extension = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}_{original_name}"
    os.makedirs(current_app.config["UPLOAD_FOLDER"], exist_ok=True)
    file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], stored_name)
    upload.save(file_path)
    return stored_name, extract_cv_text(file_path, extension)


def candidate_values(form):
    return {
        "full_name": str(form.get("full_name", "")).strip(),
        "email": str(form.get("email", "")).strip().lower(),
        "phone": str(form.get("phone", "")).strip(),
        "skills": str(form.get("skills", "")).strip(),
        "experience": str(form.get("experience", "")).strip(),
        "education": str(form.get("education", "")).strip(),
        "source": str(form.get("source", "OTHER")).strip().upper(),
    }


def validate_candidate(values, upload=None):
    errors = []
    if not values["full_name"]:
        errors.append("Vui lòng nhập họ tên ứng viên.")
    if values["email"] and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", values["email"]):
        errors.append("Email không đúng định dạng.")
    if values["source"] not in CANDIDATE_SOURCES:
        errors.append("Nguồn ứng viên không hợp lệ.")
    if upload and upload.filename and not allowed_cv_file(upload.filename):
        errors.append("CV chỉ chấp nhận file PDF, DOC hoặc DOCX.")
    return errors


@candidate_bp.get("/api/candidates")
@api_role_required("ADMIN", "HR", "MANAGER")
def list_candidates():
    keyword = request.args.get("keyword", "").strip()
    source = request.args.get("source", "").strip().upper()
    selected_source = source if source in CANDIDATE_SOURCES else None
    try:
        return jsonify(success=True, data=get_candidates(keyword or None, selected_source))
    except Error:
        return jsonify(success=False, message="Không thể tải danh sách ứng viên."), 500


@candidate_bp.get("/api/candidates/<int:candidate_id>")
@api_role_required("ADMIN", "HR", "MANAGER")
def get_candidate(candidate_id):
    try:
        candidate = get_candidate_by_id(candidate_id)
    except Error:
        return jsonify(success=False, message="Không thể tải ứng viên."), 500
    if not candidate:
        return jsonify(success=False, message="Không tìm thấy ứng viên."), 404
    return jsonify(success=True, data=candidate)


@candidate_bp.post("/api/candidates")
@api_role_required("ADMIN", "HR")
def add_candidate():
    values = candidate_values(request.form)
    upload = request.files.get("cv")
    errors = validate_candidate(values, upload)
    if errors:
        return jsonify(success=False, message=errors[0], errors=errors), 400

    cv_file = None
    cv_text = ""
    try:
        if upload and upload.filename:
            cv_file, cv_text = save_cv_file(upload)
        candidate_id = create_candidate(**values, cv_file=cv_file, cv_text=cv_text)
        return jsonify(success=True, data=get_candidate_by_id(candidate_id)), 201
    except Error:
        if cv_file:
            saved_path = os.path.join(current_app.config["UPLOAD_FOLDER"], cv_file)
            if os.path.exists(saved_path):
                os.remove(saved_path)
        return jsonify(success=False, message="Không thể thêm ứng viên."), 500


@candidate_bp.put("/api/candidates/<int:candidate_id>")
@api_role_required("ADMIN", "HR")
def edit_candidate(candidate_id):
    try:
        existing = get_candidate_by_id(candidate_id)
    except Error:
        return jsonify(success=False, message="Không thể tải ứng viên."), 500
    if not existing:
        return jsonify(success=False, message="Không tìm thấy ứng viên."), 404

    values = candidate_values(request.form)
    upload = request.files.get("cv")
    errors = validate_candidate(values, upload)
    if errors:
        return jsonify(success=False, message=errors[0], errors=errors), 400

    cv_file = existing.get("cv_file")
    cv_text = existing.get("cv_text") or ""
    new_cv_file = None
    try:
        if upload and upload.filename:
            new_cv_file, cv_text = save_cv_file(upload)
            cv_file = new_cv_file
        update_candidate(candidate_id, **values, cv_file=cv_file, cv_text=cv_text)
        old_cv_file = existing.get("cv_file")
        if new_cv_file and old_cv_file:
            old_path = os.path.join(current_app.config["UPLOAD_FOLDER"], os.path.basename(old_cv_file))
            if os.path.exists(old_path):
                os.remove(old_path)
        return jsonify(success=True, data=get_candidate_by_id(candidate_id))
    except Error:
        if new_cv_file:
            new_path = os.path.join(current_app.config["UPLOAD_FOLDER"], new_cv_file)
            if os.path.exists(new_path):
                os.remove(new_path)
        return jsonify(success=False, message="Không thể cập nhật ứng viên."), 500


@candidate_bp.delete("/api/candidates/<int:candidate_id>")
@api_role_required("ADMIN", "HR")
def remove_candidate(candidate_id):
    try:
        candidate = get_candidate_by_id(candidate_id)
    except Error:
        return jsonify(success=False, message="Không thể tải ứng viên."), 500
    if not candidate:
        return jsonify(success=False, message="Không tìm thấy ứng viên."), 404
    try:
        if not delete_candidate(candidate_id):
            return jsonify(success=False, message="Không thể xóa ứng viên đã có hồ sơ ứng tuyển."), 409
        cv_file = candidate.get("cv_file")
        if cv_file:
            file_path = os.path.join(current_app.config["UPLOAD_FOLDER"], os.path.basename(cv_file))
            if os.path.exists(file_path):
                os.remove(file_path)
        return jsonify(success=True, message="Xóa ứng viên thành công.")
    except Error:
        return jsonify(success=False, message="Không thể xóa ứng viên."), 500


@candidate_bp.get("/uploads/<path:filename>")
@api_login_required
def uploaded_cv(filename):
    # Older seed data stored values such as ``uploads/candidate.pdf`` while
    # newly uploaded files store only the generated filename.  Serving the
    # basename keeps both representations compatible and prevents a nested
    # ``/uploads/uploads/...`` path from escaping into the filesystem lookup.
    safe_filename = os.path.basename(filename.replace("\\", "/"))
    return send_from_directory(current_app.config["UPLOAD_FOLDER"], safe_filename)
