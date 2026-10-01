"""
scripts/transfer_data.py
Chuyen NGUYEN du lieu sang may khac (khong qua git):
  - database MySQL (mysqldump)
  - file CV da upload (backend/uploads/)
  - chi muc chatbot (backend/rag/index/: recruitment.faiss, metadata.json, index_info.json)

May cu:  python scripts/transfer_data.py export
         -> data_transfer/ai_recruitment_data_<ngay>_<gio>.zip
May moi: python scripts/transfer_data.py import [duong_dan_file.zip]
         (bo trong -> lay file .zip moi nhat trong data_transfer/)

Thong tin ket noi lay tu backend/.env. Mat khau MySQL duoc truyen qua file tam,
khong hien tren dong lenh. File .zip chua du lieu that: KHONG dua len git.
"""
import argparse
import datetime
import glob
import json
import os
import shutil
import subprocess
import sys
import tempfile
import zipfile

if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
from config import Config  # noqa: E402

OUT_DIR = os.path.join(BASE_DIR, "data_transfer")
INDEX_FILES = ("recruitment.faiss", "metadata.json", "index_info.json")


def find_tool(name):
    """Tim mysql.exe / mysqldump.exe trong PATH hoac thu muc cai dat MySQL mac dinh."""
    found = shutil.which(name)
    if found:
        return found
    for pattern in (r"C:\Program Files\MySQL\MySQL Server *\bin", r"C:\Program Files (x86)\MySQL\MySQL Server *\bin"):
        for d in sorted(glob.glob(pattern), reverse=True):
            exe = os.path.join(d, name + ".exe")
            if os.path.exists(exe):
                return exe
    raise SystemExit(f"[LOI] Khong tim thay {name}. Cai MySQL Server 8.x hoac them thu muc bin cua MySQL vao PATH.")


def client_options():
    """Tao file cau hinh tam chua mat khau de khong lo tren dong lenh."""
    fd, path = tempfile.mkstemp(suffix=".cnf")
    with os.fdopen(fd, "w", encoding="utf-8") as f:
        f.write("[client]\n")
        f.write(f"host={Config.DB_HOST}\nport={Config.DB_PORT}\nuser={Config.DB_USER}\n")
        f.write(f'password="{Config.DB_PASSWORD}"\n')
        f.write("default-character-set=utf8mb4\n")
    return path


def export_data():
    db = Config.DB_NAME
    dump = find_tool("mysqldump")
    os.makedirs(OUT_DIR, exist_ok=True)
    stamp = datetime.datetime.now().strftime("%Y%m%d_%H%M")
    zip_path = os.path.join(OUT_DIR, f"{db}_data_{stamp}.zip")
    cnf = client_options()
    tmp_sql = os.path.join(tempfile.gettempdir(), f"{db}_{stamp}.sql")
    try:
        print(f"[1/3] Xuat database '{db}' bang mysqldump ...")
        with open(tmp_sql, "wb") as out:
            r = subprocess.run([dump, f"--defaults-extra-file={cnf}", "--single-transaction", "--routines", "--triggers",
                                "--no-tablespaces", "--set-gtid-purged=OFF", db], stdout=out, stderr=subprocess.PIPE)
        if r.returncode != 0:
            raise SystemExit("[LOI] mysqldump that bai: " + r.stderr.decode("utf-8", "replace"))
        print(f"      backup.sql: {os.path.getsize(tmp_sql) / 1024:.0f} KB")

        uploads = os.path.join(BASE_DIR, "backend", "uploads")
        index_dir = os.path.join(BASE_DIR, "backend", "rag", "index")
        n_up = n_idx = 0
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
            z.write(tmp_sql, "backup.sql")
            print("[2/3] Dong goi file CV da upload ...")
            if os.path.isdir(uploads):
                for root, _, files in os.walk(uploads):
                    for fn in files:
                        full = os.path.join(root, fn)
                        z.write(full, os.path.join("uploads", os.path.relpath(full, uploads)))
                        n_up += 1
            print("[3/3] Dong goi chi muc chatbot ...")
            for fn in INDEX_FILES:
                full = os.path.join(index_dir, fn)
                if os.path.exists(full):
                    z.write(full, os.path.join("rag_index", fn))
                    n_idx += 1
            manifest = {"database": db, "created_at": datetime.datetime.now().isoformat(timespec="seconds"),
                        "uploads": n_up, "rag_index_files": n_idx}
            z.writestr("manifest.json", json.dumps(manifest, ensure_ascii=False, indent=2))
    finally:
        os.remove(cnf)
        if os.path.exists(tmp_sql):
            os.remove(tmp_sql)
    print(f"[XONG] {zip_path}")
    print(f"       database + {n_up} file CV + {n_idx}/3 file chi muc. Chep file nay sang may moi (USB, Drive...).")
    if n_idx < 3:
        print("[CANH BAO] Chi muc chatbot chua day du; tren may moi hay bam 'Dong bo du lieu' (ADMIN) de tao lai.")


def import_data(zip_path, assume_yes, root):
    if not zip_path:
        cands = sorted(glob.glob(os.path.join(OUT_DIR, "*.zip")), key=os.path.getmtime)
        if not cands:
            raise SystemExit(f"[LOI] Khong co file .zip nao trong {OUT_DIR}. Truyen duong dan file .zip vao lenh.")
        zip_path = cands[-1]
    if not os.path.exists(zip_path):
        raise SystemExit(f"[LOI] Khong tim thay {zip_path}")
    db = Config.DB_NAME
    with zipfile.ZipFile(zip_path) as z:
        manifest = json.loads(z.read("manifest.json")) if "manifest.json" in z.namelist() else {}
        print(f"[INFO] Goi du lieu: {zip_path}")
        print(f"       tao luc {manifest.get('created_at', '?')}, {manifest.get('uploads', '?')} file CV, "
              f"{manifest.get('rag_index_files', '?')} file chi muc")
        if not assume_yes:
            ans = input(f"Se THAY THE toan bo du lieu trong database '{db}', file CV va chi muc chatbot tren may nay. Go 'yes' de tiep tuc: ")
            if ans.strip().lower() != "yes":
                raise SystemExit("[HUY] Khong thay doi gi.")
        tmp = tempfile.mkdtemp()
        try:
            z.extractall(tmp)
            mysql = find_tool("mysql")
            cnf = client_options()
            try:
                print(f"[1/3] Nap database '{db}' ...")
                r = subprocess.run([mysql, f"--defaults-extra-file={cnf}", "-e",
                                    f"CREATE DATABASE IF NOT EXISTS `{db}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"],
                                   stderr=subprocess.PIPE)
                if r.returncode != 0:
                    raise SystemExit("[LOI] Khong tao duoc database: " + r.stderr.decode("utf-8", "replace"))
                with open(os.path.join(tmp, "backup.sql"), "rb") as f:
                    r = subprocess.run([mysql, f"--defaults-extra-file={cnf}", db], stdin=f, stderr=subprocess.PIPE)
                if r.returncode != 0:
                    raise SystemExit("[LOI] Nap backup.sql that bai: " + r.stderr.decode("utf-8", "replace"))
            finally:
                os.remove(cnf)

            print("[2/3] Chep file CV vao backend/uploads ...")
            n_up = 0
            src_up = os.path.join(tmp, "uploads")
            dst_up = os.path.join(root, "backend", "uploads")
            if os.path.isdir(src_up):
                for r_, _, files in os.walk(src_up):
                    for fn in files:
                        s = os.path.join(r_, fn)
                        d = os.path.join(dst_up, os.path.relpath(s, src_up))
                        os.makedirs(os.path.dirname(d), exist_ok=True)
                        shutil.copy2(s, d)
                        n_up += 1

            print("[3/3] Chep chi muc chatbot vao backend/rag/index ...")
            n_idx = 0
            dst_idx = os.path.join(root, "backend", "rag", "index")
            os.makedirs(dst_idx, exist_ok=True)
            for fn in INDEX_FILES:
                s = os.path.join(tmp, "rag_index", fn)
                if os.path.exists(s):
                    shutil.copy2(s, os.path.join(dst_idx, fn))
                    n_idx += 1
        finally:
            shutil.rmtree(tmp, ignore_errors=True)
    print(f"[XONG] Da nap database '{db}', {n_up} file CV, {n_idx}/3 file chi muc chatbot.")


def main():
    p = argparse.ArgumentParser(description="Xuat/nhap nguyen du lieu AI Recruitment giua cac may")
    sub = p.add_subparsers(dest="cmd", required=True)
    sub.add_parser("export", help="dong goi database + CV + chi muc chatbot thanh file .zip")
    imp = sub.add_parser("import", help="nap lai tu file .zip")
    imp.add_argument("zip", nargs="?", help="duong dan file .zip (mac dinh: file moi nhat trong data_transfer/)")
    imp.add_argument("--yes", action="store_true", help="khong hoi xac nhan")
    imp.add_argument("--root", default=BASE_DIR, help=argparse.SUPPRESS)
    a = p.parse_args()
    if a.cmd == "export":
        export_data()
    else:
        import_data(a.zip, a.yes, a.root)


if __name__ == "__main__":
    main()
