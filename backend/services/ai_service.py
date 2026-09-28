import os
from database.db import (
    create_ai_result,
    get_application_by_id,
    get_interviews_by_application,
)
from services import gemini_service

PROMPTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "prompts")


def _read_prompt_template(filename: str) -> str:
    path = os.path.join(PROMPTS_DIR, filename)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    return ""


def summarize_cv(application_id: int) -> dict:
    """Tao tom tat CV dua tren yeu cau cong viec va noi dung CV cua ung vien."""
    application = get_application_by_id(application_id)
    if not application:
        raise ValueError("Không tìm thấy hồ sơ ứng tuyển.")

    candidate = application.get("candidate") or {}
    job = application.get("job") or {}

    cv_text = (candidate.get("cv_text") or "").strip()
    if not cv_text:
        raise ValueError("Hồ sơ chưa có văn bản nội dung CV để phân tích.")

    template = _read_prompt_template("cv_summary.txt")
    prompt = template.format(
        job_title=job.get("title", ""),
        job_description=job.get("description", ""),
        job_requirements=job.get("requirements", ""),
        job_skills=job.get("skills", ""),
        cv_text=cv_text,
    )

    content = gemini_service.generate_content(prompt)
    create_ai_result(application_id, "CV_SUMMARY", content)

    return {
        "type": "CV_SUMMARY",
        "content": content,
    }


def generate_interview_questions(application_id: int) -> dict:
    """Goi y 5 cau hoi phong van dua tren yeu cau cong viec va CV ung vien."""
    application = get_application_by_id(application_id)
    if not application:
        raise ValueError("Không tìm thấy hồ sơ ứng tuyển.")

    candidate = application.get("candidate") or {}
    job = application.get("job") or {}

    cv_text = (candidate.get("cv_text") or "").strip()
    if not cv_text:
        raise ValueError("Hồ sơ chưa có văn bản nội dung CV để gợi ý câu hỏi.")

    template = _read_prompt_template("interview_questions.txt")
    prompt = template.format(
        job_title=job.get("title", ""),
        job_description=job.get("description", ""),
        job_requirements=job.get("requirements", ""),
        job_skills=job.get("skills", ""),
        cv_text=cv_text,
    )

    content = gemini_service.generate_content(prompt)
    create_ai_result(application_id, "INTERVIEW_QUESTION", content)

    return {
        "type": "INTERVIEW_QUESTION",
        "content": content,
    }


def generate_email(application_id: int, email_type: str) -> dict:
    """Soan ban thao email moi phong van hoac thong bao ket qua tuyen dung."""
    if email_type not in ("INTERVIEW_INVITATION", "RESULT"):
        raise ValueError("Loại email không hợp lệ. Chỉ hỗ trợ INTERVIEW_INVITATION hoặc RESULT.")

    application = get_application_by_id(application_id)
    if not application:
        raise ValueError("Không tìm thấy hồ sơ ứng tuyển.")

    candidate = application.get("candidate") or {}
    job = application.get("job") or {}
    status = application.get("status", "")

    full_template = _read_prompt_template("email.txt")

    if email_type == "INTERVIEW_INVITATION":
        # Lay thong tin buoi phong van gan nhat neu co
        interviews = get_interviews_by_application(application_id)
        active_interview = None
        for iv in interviews:
            if iv.get("status") == "SCHEDULED":
                active_interview = iv
                break
        if not active_interview and interviews:
            active_interview = interviews[0]

        iv_date = active_interview.get("interview_date") if active_interview else "Sẽ trao đổi và sắp xếp phù hợp"
        iv_location = active_interview.get("location") if active_interview else "Văn phòng công ty hoặc Google Meet"

        invitation_section = full_template
        if "[INTERVIEW_INVITATION]" in full_template:
            invitation_section = full_template.split("[RESULT]")[0].replace("[INTERVIEW_INVITATION]", "").strip()

        prompt = invitation_section.format(
            candidate_name=candidate.get("full_name", "Ứng viên"),
            job_title=job.get("title", ""),
            interview_date=str(iv_date),
            location=iv_location,
        )

    else:  # email_type == "RESULT"
        if status not in ("PASSED", "REJECTED"):
            raise ValueError("Chỉ có thể tạo email kết quả khi hồ sơ ở trạng thái PASSED hoặc REJECTED.")

        result_section = full_template
        if "[RESULT]" in full_template:
            result_section = full_template.split("[RESULT]")[1].strip()

        status_text = "Trúng tuyển" if status == "PASSED" else "Từ chối"
        prompt = result_section.format(
            candidate_name=candidate.get("full_name", "Ứng viên"),
            job_title=job.get("title", ""),
            application_status=status_text,
        )

    content = gemini_service.generate_content(prompt)
    create_ai_result(application_id, "EMAIL", content)

    return {
        "type": "EMAIL",
        "content": content,
    }
