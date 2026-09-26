import os
import fitz

upload_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(upload_dir, exist_ok=True)

samples = [
    {
        "file": "an-nguyen.pdf",
        "name": "NGUYEN VAN AN",
        "title": "Python Developer",
        "email": "an.nguyen@example.com",
        "phone": "0901000001",
        "edu": "Dai hoc Cong nghe Thong tin (DHQG TP.HCM)",
        "exp": "2 nam phat trien ung dung web Python/Flask. Thiet ke RESTful API va toi uu co so du lieu MySQL.",
        "skills": "Python, Flask, MySQL, Docker, Git, REST API",
    },
    {
        "file": "binh-tran.pdf",
        "name": "TRAN THI BINH",
        "title": "Marketing Executive",
        "email": "binh.tran@example.com",
        "phone": "0901000002",
        "edu": "Dai hoc Kinh te TP.HCM",
        "exp": "3 nam kinh nghiem digital marketing, lap ke hoach chien dich, sang tao noi dung da kenh va toi uu SEO.",
        "skills": "Content Marketing, SEO, Social Media, Google Analytics, Copywriting",
    },
    {
        "file": "chau-le.pdf",
        "name": "LE MINH CHAU",
        "title": "HR Recruiter",
        "email": "chau.le@example.com",
        "phone": "0901000003",
        "edu": "Dai hoc Lao dong - Xa hoi",
        "exp": "2 nam chuyen trach tuyen dung nhan su linh vuc cong nghe, sang loc ho so va dieu phoi lich phong van.",
        "skills": "Tech Recruitment, Sourcing, Screening, Communication, Employer Branding",
    },
    {
        "file": "dung-pham.pdf",
        "name": "PHAM GIA DUNG",
        "title": "Backend Developer",
        "email": "dung.pham@example.com",
        "phone": "0901000004",
        "edu": "Cao dang Cong nghe Thong tin",
        "exp": "1 nam lap trinh backend voi Python va Django/PostgreSQL, xu ly du lieu va tich hop API doi tac.",
        "skills": "Python, Django, PostgreSQL, Redis, REST API, Linux",
    },
    {
        "file": "ha-vo.pdf",
        "name": "VO THU HA",
        "title": "Junior Web Developer",
        "email": "ha.vo@example.com",
        "phone": "0901000005",
        "edu": "Dai hoc Bach khoa",
        "exp": "Fresher tot nghiep nganh Khoa hoc May tinh. Co nhieu du an ca nhan ve web app Flask va React.",
        "skills": "Flask, JavaScript, React, HTML/CSS, Git, MySQL",
    },
]

def generate():
    for s in samples:
        doc = fitz.open()
        page = doc.new_page(width=595, height=842) # A4 size
        # Header background banner
        rect_header = fitz.Rect(0, 0, 595, 120)
        page.draw_rect(rect_header, color=None, fill=(0.12, 0.22, 0.42))
        page.insert_text((40, 48), s["name"], fontsize=20, color=(1, 1, 1))
        page.insert_text((40, 72), s["title"].upper(), fontsize=12, color=(0.8, 0.88, 1))
        page.insert_text((40, 95), f"Email: {s['email']}   |   Phone: {s['phone']}", fontsize=10, color=(0.9, 0.9, 0.9))

        y = 160
        # Education section
        page.insert_text((40, y), "HOC VAN & TRINH DO", fontsize=13, color=(0.12, 0.22, 0.42))
        page.draw_line((40, y + 5), (555, y + 5), color=(0.8, 0.8, 0.8), width=1)
        y += 28
        page.insert_text((40, y), s["edu"], fontsize=10.5, color=(0.2, 0.2, 0.2))

        y += 50
        # Experience section
        page.insert_text((40, y), "KINH NGHIEM LAM VIEC", fontsize=13, color=(0.12, 0.22, 0.42))
        page.draw_line((40, y + 5), (555, y + 5), color=(0.8, 0.8, 0.8), width=1)
        y += 28
        page.insert_text((40, y), s["exp"], fontsize=10.5, color=(0.2, 0.2, 0.2))

        y += 50
        # Skills section
        page.insert_text((40, y), "KY NANG CHUYEN MON", fontsize=13, color=(0.12, 0.22, 0.42))
        page.draw_line((40, y + 5), (555, y + 5), color=(0.8, 0.8, 0.8), width=1)
        y += 28
        page.insert_text((40, y), s["skills"], fontsize=10.5, color=(0.2, 0.2, 0.2))

        out_path = os.path.join(upload_dir, s["file"])
        doc.save(out_path)
        doc.close()
        print(f"Generated sample CV: {out_path}")

if __name__ == "__main__":
    generate()
