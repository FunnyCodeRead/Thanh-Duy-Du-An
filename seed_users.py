from mysql.connector import Error
from werkzeug.security import generate_password_hash

from database.db import get_connection


DEMO_USERS = [
    ("Quản trị viên", "admin@example.com", "ADMIN"),
    ("Nhân viên HR", "hr@example.com", "HR"),
    ("Quản lý tuyển dụng", "manager@example.com", "MANAGER"),
]


def seed_demo_users():
    connection = None
    cursor = None
    try:
        connection = get_connection()
        cursor = connection.cursor(dictionary=True)

        for full_name, email, role in DEMO_USERS:
            cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
            if cursor.fetchone():
                print(f"Skipped existing user: {email}")
                continue

            cursor.execute(
                """
                INSERT INTO users (full_name, email, password_hash, role)
                VALUES (%s, %s, %s, %s)
                """,
                (full_name, email, generate_password_hash("123456"), role),
            )
            print(f"Created {role} user: {email}")

        connection.commit()
    except Error as error:
        if connection:
            connection.rollback()
        print(f"Khong the tao user demo: {error}")
        raise
    finally:
        if cursor:
            cursor.close()
        if connection and connection.is_connected():
            connection.close()


if __name__ == "__main__":
    seed_demo_users()

