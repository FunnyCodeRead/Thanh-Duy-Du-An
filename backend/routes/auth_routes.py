from functools import wraps

from flask import Blueprint, jsonify, request, session
from mysql.connector import Error
from werkzeug.security import check_password_hash

from database.db import get_user_by_email


auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def api_login_required(view_function):
    @wraps(view_function)
    def wrapped_view(*args, **kwargs):
        if "user_id" not in session:
            return jsonify(success=False, message="Vui lòng đăng nhập."), 401
        return view_function(*args, **kwargs)

    return wrapped_view


def api_role_required(*allowed_roles):
    def decorator(view_function):
        @wraps(view_function)
        def wrapped_view(*args, **kwargs):
            if "user_id" not in session:
                return jsonify(success=False, message="Vui lòng đăng nhập."), 401
            if session.get("role") not in allowed_roles:
                return jsonify(success=False, message="Không có quyền truy cập."), 403
            return view_function(*args, **kwargs)

        return wrapped_view

    return decorator


def session_user():
    user = {
        "id": session["user_id"],
        "full_name": session["user_name"],
        "role": session["role"],
    }
    if session.get("user_email"):
        user["email"] = session["user_email"]
    return user


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email:
        return jsonify(success=False, message="Vui lòng nhập email."), 400
    if not password:
        return jsonify(success=False, message="Vui lòng nhập mật khẩu."), 400

    try:
        user = get_user_by_email(email)
    except Error:
        return jsonify(success=False, message="Không thể kết nối cơ sở dữ liệu."), 500

    if not user or not check_password_hash(user["password_hash"], password):
        return jsonify(success=False, message="Email hoặc mật khẩu không đúng."), 401

    session.clear()
    session["user_id"] = user["id"]
    session["user_name"] = user["full_name"]
    session["user_email"] = user["email"]
    session["role"] = user["role"]
    return jsonify(success=True, user=session_user())


@auth_bp.post("/logout")
def logout():
    session.clear()
    return jsonify(success=True, message="Đăng xuất thành công.")


@auth_bp.get("/me")
@api_login_required
def me():
    return jsonify(success=True, user=session_user())

