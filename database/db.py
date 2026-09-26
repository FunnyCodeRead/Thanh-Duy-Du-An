import mysql.connector
from mysql.connector import Error

from config import Config


def get_connection():
    """Mo mot ket noi MySQL moi. Nguoi goi co trach nhiem dong ket noi."""
    return mysql.connector.connect(
        host=Config.DB_HOST,
        port=Config.DB_PORT,
        user=Config.DB_USER,
        password=Config.DB_PASSWORD,
        database=Config.DB_NAME,
    )


def get_user_by_email(email):
    connection = None
    cursor = None

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT id, full_name, email, password_hash, role
            FROM users
            WHERE email = %s
            LIMIT 1
            """,
            (email,),
        )
        return cursor.fetchone()
    except Error as error:
        print(f"Loi khi tim user: {error}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def get_dashboard_counts():
    connection = None
    cursor = None
    queries = {
        "jobs": "SELECT COUNT(*) AS total FROM jobs",
        "candidates": "SELECT COUNT(*) AS total FROM candidates",
        "applications": "SELECT COUNT(*) AS total FROM applications",
        "interviews": "SELECT COUNT(*) AS total FROM interviews",
    }

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        result = {}
        for name, query in queries.items():
            cursor.execute(query)
            result[name] = cursor.fetchone()["total"]
        return result
    except Error as error:
        print(f"Loi khi doc dashboard: {error}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def get_jobs(keyword=None, status=None):
    connection = None
    cursor = None
    query = "SELECT * FROM jobs"
    conditions = []
    params = []

    if keyword:
        search_value = f"%{keyword}%"
        conditions.append("(title LIKE %s OR department LIKE %s OR skills LIKE %s)")
        params.extend([search_value, search_value, search_value])
    if status in ("OPEN", "CLOSED"):
        conditions.append("status = %s")
        params.append(status)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY created_at DESC, id DESC"

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def get_job_by_id(job_id):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT j.*,
                   (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.id) AS application_count
            FROM jobs j
            WHERE j.id = %s
            """,
            (job_id,),
        )
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def create_job(title, department, description, requirements, skills, quantity, status):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO jobs (title, department, description, requirements, skills, quantity, status)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (title, department, description, requirements, skills, quantity, status),
        )
        connection.commit()
        return cursor.lastrowid
    except Error:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def update_job(job_id, title, department, description, requirements, skills, quantity, status):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE jobs
            SET title = %s, department = %s, description = %s, requirements = %s,
                skills = %s, quantity = %s, status = %s
            WHERE id = %s
            """,
            (title, department, description, requirements, skills, quantity, status, job_id),
        )
        connection.commit()
    except Error:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def delete_job(job_id):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM applications WHERE job_id = %s", (job_id,))
        if cursor.fetchone()["total"] > 0:
            return False
        cursor.execute("DELETE FROM jobs WHERE id = %s", (job_id,))
        connection.commit()
        return cursor.rowcount > 0
    except Error:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def get_candidates(keyword=None, source=None):
    connection = None
    cursor = None
    query = "SELECT * FROM candidates"
    conditions = []
    params = []

    if keyword:
        search_value = f"%{keyword}%"
        conditions.append("(full_name LIKE %s OR email LIKE %s OR phone LIKE %s OR skills LIKE %s)")
        params.extend([search_value, search_value, search_value, search_value])
    if source in ("FACEBOOK", "LINKEDIN", "WEBSITE", "REFERRAL", "JOB_SITE", "OTHER"):
        conditions.append("source = %s")
        params.append(source)
    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY created_at DESC, id DESC"

    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, tuple(params))
        return cursor.fetchall()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def get_candidate_by_id(candidate_id):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            """
            SELECT c.*,
                   (SELECT COUNT(*) FROM applications a WHERE a.candidate_id = c.id) AS application_count
            FROM candidates c
            WHERE c.id = %s
            """,
            (candidate_id,),
        )
        return cursor.fetchone()
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def create_candidate(full_name, email, phone, skills, experience, education, source, cv_file, cv_text):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO candidates
                (full_name, email, phone, skills, experience, education, source, cv_file, cv_text)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (full_name, email, phone, skills, experience, education, source, cv_file, cv_text),
        )
        connection.commit()
        return cursor.lastrowid
    except Error:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def update_candidate(candidate_id, full_name, email, phone, skills, experience, education, source, cv_file, cv_text):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE candidates
            SET full_name = %s, email = %s, phone = %s, skills = %s,
                experience = %s, education = %s, source = %s, cv_file = %s, cv_text = %s
            WHERE id = %s
            """,
            (full_name, email, phone, skills, experience, education, source, cv_file, cv_text, candidate_id),
        )
        connection.commit()
    except Error:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def delete_candidate(candidate_id):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute("SELECT COUNT(*) AS total FROM applications WHERE candidate_id = %s", (candidate_id,))
        if cursor.fetchone()["total"] > 0:
            return False
        cursor.execute("DELETE FROM candidates WHERE id = %s", (candidate_id,))
        connection.commit()
        return cursor.rowcount > 0
    except Error:
        if connection:
            connection.rollback()
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()
