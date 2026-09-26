import os
import re
import uuid
from functools import wraps

from docx import Document
from flask import Flask, abort, flash, jsonify, redirect, render_template, request, send_from_directory, session, url_for
from mysql.connector import Error
from pypdf import PdfReader
from werkzeug.security import check_password_hash
from werkzeug.utils import secure_filename

from config import Config
from database.db import (
    create_candidate,
    create_job,
    delete_candidate,
    delete_job,
    get_candidate_by_id,
    get_candidates,
    get_connection,
    get_dashboard_counts,
    get_job_by_id,
    get_jobs,
    get_user_by_email,
    update_candidate,
    update_job,
)


app = Flask(__name__)
app.config.from_object(Config)

JOB_STATUSES = ("OPEN", "CLOSED")
CANDIDATE_SOURCES = ("FACEBOOK", "LINKEDIN", "WEBSITE", "REFERRAL", "JOB_SITE", "OTHER")
ALLOWED_CV_EXTENSIONS = {"pdf", "doc", "docx"}


def allowed_cv_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_CV_EXTENSIONS


def extract_cv_text(file_path, extension):
    """Doc text co ban tu PDF/DOCX. File DOC cu chi duoc luu, khong extract."""
    try:
        if extension == "pdf":
            return "\n".join(page.extract_text() or "" for page in PdfReader(file_path).pages).strip()
        if extension == "docx":
            return "\n".join(paragraph.text for paragraph in Document(file_path).paragraphs).strip()
    except Exception as error:
        print(f"Khong the doc noi dung CV: {error}")
    return ""


def save_cv_file(upload):
    original_name = secure_filename(upload.filename)
    extension = original_name.rsplit(".", 1)[1].lower()
    stored_name = f"{uuid.uuid4().hex}_{original_name}"
    os.makedirs(app.config["UPLOAD_FOLDER"], exist_ok=True)
    file_path = os.path.join(app.config["UPLOAD_FOLDER"], stored_name)
    upload.save(file_path)
    return stored_name, extract_cv_text(file_path, extension)


def job_form_values():
    return {
        "title": request.form.get("title", "").strip(),
        "department": request.form.get("department", "").strip(),
        "description": request.form.get("description", "").strip(),
        "requirements": request.form.get("requirements", "").strip(),
        "skills": request.form.get("skills", "").strip(),
        "quantity": request.form.get("quantity", "1").strip(),
        "status": request.form.get("status", "OPEN").strip().upper(),
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


def candidate_form_values():
    return {
        "full_name": request.form.get("full_name", "").strip(),
        "email": request.form.get("email", "").strip().lower(),
        "phone": request.form.get("phone", "").strip(),
        "skills": request.form.get("skills", "").strip(),
        "experience": request.form.get("experience", "").strip(),
        "education": request.form.get("education", "").strip(),
        "source": request.form.get("source", "OTHER").strip().upper(),
    }


def validate_candidate(values):
    errors = []
    if not values["full_name"]:
        errors.append("Vui lòng nhập họ tên ứng viên.")
    if values["email"] and not re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", values["email"]):
        errors.append("Email không đúng định dạng.")
    if values["source"] not in CANDIDATE_SOURCES:
        errors.append("Nguồn ứng viên không hợp lệ.")
    return errors


def login_required(view_function):
    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        if "user_id" not in session:
            flash("Vui lòng đăng nhập để tiếp tục.", "warning")
            return redirect(url_for("login"))
        return view_function(*args, **kwargs)

    return wrapped_view


def role_required(*allowed_roles):
    def decorator(view_function):
        @wraps(view_function)
        def wrapped_view(*args, **kwargs):
            if "user_id" not in session:
                flash("Vui lòng đăng nhập để tiếp tục.", "warning")
                return redirect(url_for("login"))
            if session.get("role") not in allowed_roles:
                flash("Không có quyền truy cập.", "danger")
                abort(403)
            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator


@app.route("/")
def index():
    if "user_id" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if "user_id" in session:
        return redirect(url_for("dashboard"))

    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        if not email:
            flash("Vui lòng nhập email.", "danger")
            return render_template("login.html", email=email)
        if not password:
            flash("Vui lòng nhập mật khẩu.", "danger")
            return render_template("login.html", email=email)

        try:
            user = get_user_by_email(email)
        except Error:
            flash("Không thể kết nối cơ sở dữ liệu. Vui lòng thử lại.", "danger")
            return render_template("login.html", email=email), 503

        if not user or not check_password_hash(user["password_hash"], password):
            flash("Email hoặc mật khẩu không đúng.", "danger")
            return render_template("login.html", email=email)

        session.clear()
        session["user_id"] = user["id"]
        session["user_name"] = user["full_name"]
        session["role"] = user["role"]
        flash("Đăng nhập thành công.", "success")
        return redirect(url_for("dashboard"))

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Đăng xuất thành công.", "success")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    counts = {"jobs": 0, "candidates": 0, "applications": 0, "interviews": 0}
    try:
        counts = get_dashboard_counts()
    except Error:
        # Dashboard van hien thi duoc neu MySQL tam thoi gian doan.
        pass
    return render_template("dashboard.html", counts=counts)


@app.route("/jobs")
@role_required("ADMIN", "HR", "MANAGER")
def jobs():
    keyword = request.args.get("keyword", "").strip()
    status = request.args.get("status", "ALL").strip().upper()
    selected_status = status if status in JOB_STATUSES else None
    try:
        job_list = get_jobs(keyword or None, selected_status)
    except Error:
        flash("Không thể tải danh sách vị trí tuyển dụng.", "danger")
        job_list = []
    return render_template(
        "jobs.html", jobs=job_list, keyword=keyword, selected_status=status, statuses=JOB_STATUSES
    )


@app.route("/jobs/add", methods=["GET", "POST"])
@role_required("ADMIN", "HR")
def add_job():
    job = {"quantity": 1, "status": "OPEN"}
    if request.method == "POST":
        job = job_form_values()
        errors = validate_job(job)
        if errors:
            for message in errors:
                flash(message, "danger")
            return render_template("job_form.html", job=job, statuses=JOB_STATUSES, form_title="Thêm vị trí")
        try:
            create_job(
                job["title"], job["department"], job["description"], job["requirements"],
                job["skills"], job["quantity"], job["status"]
            )
            flash("Thêm vị trí tuyển dụng thành công.", "success")
            return redirect(url_for("jobs"))
        except Error:
            flash("Không thể thêm vị trí tuyển dụng.", "danger")
    return render_template("job_form.html", job=job, statuses=JOB_STATUSES, form_title="Thêm vị trí")


@app.route("/jobs/<int:job_id>")
@role_required("ADMIN", "HR", "MANAGER")
def job_detail(job_id):
    job = get_job_by_id(job_id)
    if not job:
        abort(404)
    return render_template("job_detail.html", job=job)


@app.route("/jobs/<int:job_id>/edit", methods=["GET", "POST"])
@role_required("ADMIN", "HR")
def edit_job(job_id):
    job = get_job_by_id(job_id)
    if not job:
        abort(404)
    if request.method == "POST":
        job = job_form_values()
        job["id"] = job_id
        errors = validate_job(job)
        if errors:
            for message in errors:
                flash(message, "danger")
            return render_template("job_form.html", job=job, statuses=JOB_STATUSES, form_title="Sửa vị trí")
        try:
            update_job(
                job_id, job["title"], job["department"], job["description"], job["requirements"],
                job["skills"], job["quantity"], job["status"]
            )
            flash("Cập nhật vị trí tuyển dụng thành công.", "success")
            return redirect(url_for("jobs"))
        except Error:
            flash("Không thể cập nhật vị trí tuyển dụng.", "danger")
    return render_template("job_form.html", job=job, statuses=JOB_STATUSES, form_title="Sửa vị trí")


@app.route("/jobs/<int:job_id>/delete", methods=["POST"])
@role_required("ADMIN", "HR")
def remove_job(job_id):
    if not get_job_by_id(job_id):
        abort(404)
    try:
        if not delete_job(job_id):
            flash("Không thể xóa vị trí đã có ứng viên ứng tuyển.", "danger")
        else:
            flash("Xóa vị trí tuyển dụng thành công.", "success")
    except Error:
        flash("Không thể xóa vị trí tuyển dụng.", "danger")
    return redirect(url_for("jobs"))


@app.route("/candidates")
@role_required("ADMIN", "HR", "MANAGER")
def candidates():
    keyword = request.args.get("keyword", "").strip()
    source = request.args.get("source", "ALL").strip().upper()
    selected_source = source if source in CANDIDATE_SOURCES else None
    try:
        candidate_list = get_candidates(keyword or None, selected_source)
    except Error:
        flash("Không thể tải danh sách ứng viên.", "danger")
        candidate_list = []
    return render_template(
        "candidates.html", candidates=candidate_list, keyword=keyword,
        selected_source=source, sources=CANDIDATE_SOURCES
    )


@app.route("/candidates/add", methods=["GET", "POST"])
@role_required("ADMIN", "HR")
def add_candidate():
    candidate = {"source": "OTHER"}
    if request.method == "POST":
        candidate = candidate_form_values()
        upload = request.files.get("cv_file")
        errors = validate_candidate(candidate)
        if upload and upload.filename and not allowed_cv_file(upload.filename):
            errors.append("CV chỉ chấp nhận file PDF, DOC hoặc DOCX.")
        if errors:
            for message in errors:
                flash(message, "danger")
            return render_template(
                "candidate_form.html", candidate=candidate, sources=CANDIDATE_SOURCES, form_title="Thêm ứng viên"
            )

        cv_file = None
        cv_text = ""
        try:
            if upload and upload.filename:
                cv_file, cv_text = save_cv_file(upload)
            create_candidate(
                candidate["full_name"], candidate["email"], candidate["phone"], candidate["skills"],
                candidate["experience"], candidate["education"], candidate["source"], cv_file, cv_text
            )
            flash("Thêm ứng viên thành công.", "success")
            return redirect(url_for("candidates"))
        except Error:
            if cv_file:
                saved_path = os.path.join(app.config["UPLOAD_FOLDER"], cv_file)
                if os.path.exists(saved_path):
                    os.remove(saved_path)
            flash("Không thể thêm ứng viên.", "danger")
    return render_template(
        "candidate_form.html", candidate=candidate, sources=CANDIDATE_SOURCES, form_title="Thêm ứng viên"
    )


@app.route("/candidates/<int:candidate_id>")
@role_required("ADMIN", "HR", "MANAGER")
def candidate_detail(candidate_id):
    candidate = get_candidate_by_id(candidate_id)
    if not candidate:
        abort(404)
    return render_template("candidate_detail.html", candidate=candidate)


@app.route("/candidates/<int:candidate_id>/edit", methods=["GET", "POST"])
@role_required("ADMIN", "HR")
def edit_candidate(candidate_id):
    existing_candidate = get_candidate_by_id(candidate_id)
    if not existing_candidate:
        abort(404)
    if request.method == "POST":
        candidate = candidate_form_values()
        candidate["id"] = candidate_id
        upload = request.files.get("cv_file")
        errors = validate_candidate(candidate)
        if upload and upload.filename and not allowed_cv_file(upload.filename):
            errors.append("CV chỉ chấp nhận file PDF, DOC hoặc DOCX.")
        if errors:
            for message in errors:
                flash(message, "danger")
            candidate["cv_file"] = existing_candidate.get("cv_file")
            return render_template(
                "candidate_form.html", candidate=candidate, sources=CANDIDATE_SOURCES, form_title="Sửa ứng viên"
            )

        cv_file = existing_candidate.get("cv_file")
        cv_text = existing_candidate.get("cv_text") or ""
        new_cv_file = None
        try:
            if upload and upload.filename:
                new_cv_file, cv_text = save_cv_file(upload)
                cv_file = new_cv_file
            update_candidate(
                candidate_id, candidate["full_name"], candidate["email"], candidate["phone"],
                candidate["skills"], candidate["experience"], candidate["education"],
                candidate["source"], cv_file, cv_text
            )
            old_cv_file = existing_candidate.get("cv_file")
            if new_cv_file and old_cv_file:
                old_path = os.path.join(app.config["UPLOAD_FOLDER"], os.path.basename(old_cv_file))
                if os.path.exists(old_path):
                    os.remove(old_path)
            flash("Cập nhật ứng viên thành công.", "success")
            return redirect(url_for("candidates"))
        except Error:
            if new_cv_file:
                new_path = os.path.join(app.config["UPLOAD_FOLDER"], new_cv_file)
                if os.path.exists(new_path):
                    os.remove(new_path)
            flash("Không thể cập nhật ứng viên.", "danger")
    return render_template(
        "candidate_form.html", candidate=existing_candidate, sources=CANDIDATE_SOURCES, form_title="Sửa ứng viên"
    )


@app.route("/candidates/<int:candidate_id>/delete", methods=["POST"])
@role_required("ADMIN", "HR")
def remove_candidate(candidate_id):
    candidate = get_candidate_by_id(candidate_id)
    if not candidate:
        abort(404)
    try:
        if not delete_candidate(candidate_id):
            flash("Không thể xóa ứng viên đã có hồ sơ ứng tuyển.", "danger")
        else:
            cv_file = candidate.get("cv_file")
            if cv_file:
                file_path = os.path.join(app.config["UPLOAD_FOLDER"], os.path.basename(cv_file))
                if os.path.exists(file_path):
                    os.remove(file_path)
            flash("Xóa ứng viên thành công.", "success")
    except Error:
        flash("Không thể xóa ứng viên.", "danger")
    return redirect(url_for("candidates"))


@app.route("/uploads/<path:filename>")
@login_required
def uploaded_cv(filename):
    return send_from_directory(app.config["UPLOAD_FOLDER"], filename)


@app.route("/health")
def health():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return jsonify(status="ok", database="connected"), 200
    except Error as error:
        response = {"status": "error", "database": "disconnected"}
        if app.debug:
            response["message"] = str(error)
        return jsonify(response), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.route("/admin-only")
@role_required("ADMIN")
def admin_only():
    return render_template("role_demo.html", title="Khu vực ADMIN")


@app.route("/recruitment-demo")
@role_required("ADMIN", "HR")
def recruitment_demo():
    return render_template("role_demo.html", title="Khu vực tuyển dụng")


@app.errorhandler(403)
def forbidden(_error):
    return render_template("403.html"), 403


@app.errorhandler(404)
def not_found(_error):
    return render_template("404.html"), 404


@app.errorhandler(413)
def file_too_large(_error):
    flash("File CV vượt quá giới hạn 5 MB.", "danger")
    return redirect(request.referrer or url_for("candidates"))


if __name__ == "__main__":
    app.run(debug=app.config.get("DEBUG", False))
