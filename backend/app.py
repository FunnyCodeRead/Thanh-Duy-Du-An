from flask import Flask, jsonify
from mysql.connector import Error

from config import Config
from database.db import get_connection, get_dashboard_counts
from routes.auth_routes import auth_bp, api_login_required
from routes.candidate_routes import candidate_bp
from routes.job_routes import job_bp


app = Flask(__name__)
app.config.from_object(Config)

app.register_blueprint(auth_bp)
app.register_blueprint(job_bp)
app.register_blueprint(candidate_bp)


@app.get("/api/health")
def health():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute("SELECT 1")
        cursor.fetchone()
        return jsonify(status="ok", database="connected")
    except Error:
        return jsonify(status="error", database="disconnected"), 500
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


@app.get("/api/dashboard")
@api_login_required
def dashboard():
    try:
        return jsonify(success=True, data=get_dashboard_counts())
    except Error:
        return jsonify(success=False, message="Không thể tải dữ liệu dashboard."), 500


@app.errorhandler(404)
def not_found(_error):
    return jsonify(success=False, message="Không tìm thấy tài nguyên."), 404


@app.errorhandler(413)
def file_too_large(_error):
    return jsonify(success=False, message="File CV vượt quá giới hạn 10 MB."), 413


@app.errorhandler(500)
def internal_error(_error):
    return jsonify(success=False, message="Có lỗi xảy ra trên máy chủ."), 500


if __name__ == "__main__":
    app.run(debug=app.config.get("DEBUG", False))

