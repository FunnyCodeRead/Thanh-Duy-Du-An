"""
scripts/init_db.py
Kiem tra va tu dong khoi tao database ai_recruitment cung nguoi dung demo neu chua co.
"""
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

import mysql.connector
from config import Config
from seed_users import seed_demo_users


def init_database():
    try:
        # Step 1: Ket noi MySQL server khong chi dinh db
        conn = mysql.connector.connect(
            host=Config.DB_HOST,
            port=Config.DB_PORT,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
        )
        cursor = conn.cursor()

        # Step 2: Kiem tra database da ton tai chua
        cursor.execute("SHOW DATABASES LIKE %s", (Config.DB_NAME,))
        db_exists = cursor.fetchone()

        if not db_exists:
            print(f"[INIT] Database '{Config.DB_NAME}' chua ton tai. Dang khoi tao tu schema...")
            schema_file = os.path.join(BASE_DIR, "sql", "schema.sql")
            if os.path.exists(schema_file):
                with open(schema_file, "r", encoding="utf-8") as f:
                    sql_content = f.read()

                for statement in sql_content.split(";"):
                    stmt = statement.strip()
                    if stmt:
                        cursor.execute(stmt)
                conn.commit()
                print(f"[INIT] Da tao thanh cong schema database '{Config.DB_NAME}'.")
            else:
                print(f"[WARN] Khong tim thay file schema: {schema_file}")
        else:
            print(f"[INIT] Database '{Config.DB_NAME}' da ton tai san.")

        cursor.close()
        conn.close()

        # Step 3: Kiem tra va tao tai khoan demo neu thieu
        seed_demo_users()
        print("[INIT] Kiem tra du lieu demo hoan tat.")
        return True
    except Exception as e:
        print(f"[ERROR] Khong the khoi tao database: {e}")
        return False


if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
