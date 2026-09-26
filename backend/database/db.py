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


def get_applications(keyword=None, status=None, job_id=None):
    connection = None
    cursor = None
    query = """
        SELECT a.id, a.candidate_id, a.job_id, a.status, a.applied_at, a.note,
               c.full_name AS candidate_name, c.email AS candidate_email,
               j.title AS job_title, j.department AS job_department
        FROM applications a
        JOIN candidates c ON a.candidate_id = c.id
        JOIN jobs j ON a.job_id = j.id
    """
    conditions = []
    params = []

    if keyword:
        search_value = f"%{keyword}%"
        conditions.append("(c.full_name LIKE %s OR c.email LIKE %s OR j.title LIKE %s)")
        params.extend([search_value, search_value, search_value])
    if status in ("NEW", "SCREENING", "INTERVIEW", "PASSED", "REJECTED"):
        conditions.append("a.status = %s")
        params.append(status)
    if job_id is not None:
        try:
            job_id_int = int(job_id)
            conditions.append("a.job_id = %s")
            params.append(job_id_int)
        except (ValueError, TypeError):
            pass

    if conditions:
        query += " WHERE " + " AND ".join(conditions)
    query += " ORDER BY a.applied_at DESC, a.id DESC"

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


def get_application_by_id(application_id):
    connection = None
    cursor = None
    query = """
        SELECT a.id, a.candidate_id, a.job_id, a.status, a.applied_at, a.note,
               c.full_name AS candidate_name, c.email AS candidate_email, c.phone AS candidate_phone,
               c.skills AS candidate_skills, c.experience AS candidate_experience,
               c.education AS candidate_education, c.source AS candidate_source, c.cv_file,
               j.title AS job_title, j.department AS job_department, j.description AS job_description,
               j.requirements AS job_requirements, j.skills AS job_skills, j.status AS job_status
        FROM applications a
        JOIN candidates c ON a.candidate_id = c.id
        JOIN jobs j ON a.job_id = j.id
        WHERE a.id = %s
    """
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(query, (application_id,))
        row = cursor.fetchone()
        if not row:
            return None
        return {
            "id": row["id"],
            "candidate_id": row["candidate_id"],
            "candidate_name": row["candidate_name"],
            "candidate_email": row["candidate_email"],
            "job_id": row["job_id"],
            "job_title": row["job_title"],
            "job_department": row["job_department"],
            "status": row["status"],
            "applied_at": row["applied_at"],
            "note": row["note"] or "",
            "candidate": {
                "id": row["candidate_id"],
                "full_name": row["candidate_name"],
                "email": row["candidate_email"],
                "phone": row["candidate_phone"],
                "skills": row["candidate_skills"],
                "experience": row["candidate_experience"],
                "education": row["candidate_education"],
                "source": row["candidate_source"],
                "cv_file": row["cv_file"],
            },
            "job": {
                "id": row["job_id"],
                "title": row["job_title"],
                "department": row["job_department"],
                "description": row["job_description"],
                "requirements": row["job_requirements"],
                "skills": row["job_skills"],
                "status": row["job_status"],
            },
        }
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def application_exists(candidate_id, job_id):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)
        cursor.execute(
            "SELECT id FROM applications WHERE candidate_id = %s AND job_id = %s LIMIT 1",
            (candidate_id, job_id),
        )
        return cursor.fetchone() is not None
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


def create_application(candidate_id, job_id, note=None):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            INSERT INTO applications (candidate_id, job_id, status, note)
            VALUES (%s, %s, 'NEW', %s)
            """,
            (candidate_id, job_id, note or ""),
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


def update_application_status(application_id, status):
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor()
        cursor.execute(
            """
            UPDATE applications
            SET status = %s
            WHERE id = %s
            """,
            (status, application_id),
        )
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

