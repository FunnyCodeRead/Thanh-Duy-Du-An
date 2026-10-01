"""
scripts/setup_db.py
Tao co so du lieu bang 1 lenh: chay sql/schema.sql roi sql/sample_data.sql,
sau do tao tai khoan demo (admin/hr/manager@example.com, mat khau 123456).

Thong tin ket noi lay tu backend/.env (DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME).

Cach dung:
    python scripts/setup_db.py            # tao/cap nhat (chay lai nhieu lan van an toan)
    python scripts/setup_db.py --reset    # XOA database roi tao lai tu dau (hoi xac nhan)
"""
import argparse
import os
import sys

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))

import mysql.connector  # noqa: E402
from config import Config  # noqa: E402

SQL_FILES = [os.path.join(BASE_DIR, "sql", "schema.sql"), os.path.join(BASE_DIR, "sql", "sample_data.sql")]
DEFAULT_DB = "ai_recruitment"


def split_sql(text):
    """Tach file SQL thanh tung cau lenh; bo qua dau ; nam trong chuoi va dong chu thich --."""
    statements, buf, quote, i = [], [], None, 0
    while i < len(text):
        ch = text[i]
        if quote:
            buf.append(ch)
            if ch == "\\" and i + 1 < len(text):
                buf.append(text[i + 1])
                i += 2
                continue
            if ch == quote:
                quote = None
        elif ch in ("'", '"', "`"):
            quote = ch
            buf.append(ch)
        elif ch == "-" and text[i:i + 2] == "--":
            while i < len(text) and text[i] != "\n":
                i += 1
            continue
        elif ch == ";":
            stmt = "".join(buf).strip()
            if stmt:
                statements.append(stmt)
            buf = []
        else:
            buf.append(ch)
        i += 1
    stmt = "".join(buf).strip()
    if stmt:
        statements.append(stmt)
    return statements


def run_file(cursor, path, db_name):
    with open(path, encoding="utf-8") as f:
        text = f.read()
    if db_name != DEFAULT_DB:
        text = text.replace(DEFAULT_DB, db_name)
    stmts = split_sql(text)
    for stmt in stmts:
        cursor.execute(stmt)
        if cursor.with_rows:
            cursor.fetchall()
    print(f"[OK] {os.path.relpath(path, BASE_DIR)}: {len(stmts)} cau lenh")


def main():
    parser = argparse.ArgumentParser(description="Tao database ai_recruitment tu sql/schema.sql va sql/sample_data.sql")
    parser.add_argument("--reset", action="store_true", help="xoa database roi tao lai tu dau")
    parser.add_argument("--yes", action="store_true", help="khong hoi xac nhan khi --reset")
    args = parser.parse_args()

    db_name = Config.DB_NAME or DEFAULT_DB
    print(f"[INFO] Ket noi MySQL {Config.DB_USER}@{Config.DB_HOST}:{Config.DB_PORT}, database '{db_name}'")
    try:
        conn = mysql.connector.connect(host=Config.DB_HOST, port=Config.DB_PORT, user=Config.DB_USER, password=Config.DB_PASSWORD)
    except mysql.connector.Error as e:
        print(f"[LOI] Khong ket noi duoc MySQL: {e}")
        print("      Kiem tra MySQL da chay chua va thong tin trong backend/.env.")
        return 1

    cursor = conn.cursor()
    if args.reset:
        if not args.yes:
            ans = input(f"Se XOA toan bo database '{db_name}' va du lieu trong do. Go 'yes' de tiep tuc: ")
            if ans.strip().lower() != "yes":
                print("[HUY] Khong thay doi gi.")
                return 1
        cursor.execute(f"DROP DATABASE IF EXISTS `{db_name}`")
        print(f"[OK] Da xoa database '{db_name}'")

    try:
        for path in SQL_FILES:
            run_file(cursor, path, db_name)
        conn.commit()
    except mysql.connector.Error as e:
        conn.rollback()
        print(f"[LOI] Chay SQL that bai: {e}")
        return 1
    finally:
        cursor.close()
        conn.close()

    # Tao/cap nhat tai khoan demo bang hash Werkzeug (dung ham co san cua du an)
    try:
        from seed_users import seed_demo_users
        seed_demo_users()
        print("[OK] Tai khoan demo: admin@example.com / hr@example.com / manager@example.com (mat khau 123456)")
    except Exception as e:  # khong chan viec tao database
        print(f"[CANH BAO] Khong tao duoc tai khoan demo: {e}")

    # Xac nhan so bang
    conn = mysql.connector.connect(host=Config.DB_HOST, port=Config.DB_PORT, user=Config.DB_USER, password=Config.DB_PASSWORD, database=db_name)
    cur = conn.cursor()
    cur.execute("SHOW TABLES")
    tables = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()
    print(f"[XONG] Database '{db_name}' co {len(tables)} bang: {', '.join(tables)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
