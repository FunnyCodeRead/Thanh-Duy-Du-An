"""Document Builder for Recruitment RAG Knowledge Base.

Transforms MySQL records (Jobs, Candidates, Applications, Interviews, Evaluations, AI Results)
into structured text documents with metadata for vector embedding and retrieval.
Enforces strict privacy and security: no password hashes, API keys, or raw secrets.
"""


def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 150) -> list[str]:
    """Chia doan van ban dai thanh cac chunk nho co phan giao nhau (overlap)."""
    if not text or not text.strip():
        return []
    cleaned = text.strip()
    if len(cleaned) <= chunk_size:
        return [cleaned]

    chunks = []
    start = 0
    while start < len(cleaned):
        end = start + chunk_size
        chunk = cleaned[start:end]
        chunks.append(chunk)
        if end >= len(cleaned):
            break
        start += chunk_size - overlap
    return chunks


def build_documents_from_db(data: dict) -> list[dict]:
    """Xay dung danh sach document va metadata tu tap du lieu MySQL da truy van.
    
    Args:
        data: dict chua cac khoa 'jobs', 'candidates', 'applications', 'interviews', 'evaluations', 'ai_results'.
        
    Returns:
        list of dict: each item has 'text' (str) and 'metadata' (dict).
    """
    documents = []

    # 1. Job Documents
    for job in data.get("jobs", []):
        text = (
            f"THỰC THỂ: VỊ TRÍ TUYỂN DỤNG (JOB)\n"
            f"Mã vị trí: {job['id']}\n"
            f"Tên vị trí: {job['title']}\n"
            f"Phòng ban: {job.get('department') or 'Chung'}\n"
            f"Chỉ tiêu tuyển dụng: {job.get('quantity') or 1} người\n"
            f"Trạng thái: {job.get('status') or 'OPEN'}\n"
            f"Mô tả công việc:\n{job.get('description') or 'Chưa cập nhật'}\n"
            f"Yêu cầu tuyển dụng:\n{job.get('requirements') or 'Chưa cập nhật'}\n"
            f"Kỹ năng yêu cầu: {job.get('skills') or 'Chưa cập nhật'}"
        )
        metadata = {
            "entity_type": "job",
            "entity_id": job["id"],
            "job_id": job["id"],
            "candidate_id": None,
            "display_name": job["title"],
            "status": job.get("status"),
        }
        documents.append({"text": text, "metadata": metadata})

    # 2. Candidate Documents & CV Chunks
    for cand in data.get("candidates", []):
        cand_id = cand["id"]
        cand_name = cand["full_name"]

        # Base candidate profile document
        base_text = (
            f"THỰC THỂ: HỒ SƠ ỨNG VIÊN (CANDIDATE)\n"
            f"Mã ứng viên: {cand_id}\n"
            f"Họ tên ứng viên: {cand_name}\n"
            f"Học vấn: {cand.get('education') or 'Chưa cập nhật'}\n"
            f"Kinh nghiệm làm việc: {cand.get('experience') or 'Chưa cập nhật'}\n"
            f"Kỹ năng chuyên môn: {cand.get('skills') or 'Chưa cập nhật'}\n"
            f"Nguồn ứng viên: {cand.get('source') or 'OTHER'}"
        )
        metadata = {
            "entity_type": "candidate",
            "entity_id": cand_id,
            "candidate_id": cand_id,
            "job_id": None,
            "display_name": cand_name,
            "chunk_index": 0,
        }
        documents.append({"text": base_text, "metadata": metadata})

        # CV text chunks if available
        cv_text = cand.get("cv_text")
        if cv_text and cv_text.strip():
            chunks = chunk_text(cv_text, chunk_size=1000, overlap=150)
            for idx, ch in enumerate(chunks, start=1):
                chunk_doc_text = (
                    f"THỰC THỂ: NỘI DUNG CV ỨNG VIÊN (CANDIDATE CV)\n"
                    f"Mã ứng viên: {cand_id}\n"
                    f"Họ tên: {cand_name}\n"
                    f"Phần CV (Đoạn {idx}/{len(chunks)}):\n{ch}"
                )
                chunk_meta = {
                    "entity_type": "candidate",
                    "entity_id": cand_id,
                    "candidate_id": cand_id,
                    "job_id": None,
                    "display_name": f"{cand_name} (CV - Phần {idx})",
                    "chunk_index": idx,
                }
                documents.append({"text": chunk_doc_text, "metadata": chunk_meta})

    # 3. Application Documents
    for app in data.get("applications", []):
        text = (
            f"THỰC THỂ: HỒ SƠ ỨNG TUYỂN (APPLICATION)\n"
            f"Mã hồ sơ: {app['id']}\n"
            f"Ứng viên: {app.get('candidate_name')}\n"
            f"Vị trí ứng tuyển: {app.get('job_title')}\n"
            f"Trạng thái hồ sơ: {app.get('status')}\n"
            f"Ngày nộp: {app.get('applied_at')}\n"
            f"Ghi chú: {app.get('note') or 'Không có'}"
        )
        metadata = {
            "entity_type": "application",
            "entity_id": app["id"],
            "application_id": app["id"],
            "candidate_id": app.get("candidate_id"),
            "job_id": app.get("job_id"),
            "display_name": f"{app.get('candidate_name')} - {app.get('job_title')}",
            "status": app.get("status"),
        }
        documents.append({"text": text, "metadata": metadata})

    # 4. Interview Documents
    for iv in data.get("interviews", []):
        text = (
            f"THỰC THỂ: LỊCH PHỎNG VẤN (INTERVIEW)\n"
            f"Mã phỏng vấn: {iv['id']}\n"
            f"Ứng viên: {iv.get('candidate_name')}\n"
            f"Vị trí: {iv.get('job_title')}\n"
            f"Người phỏng vấn: {iv.get('interviewer_name')}\n"
            f"Thời gian phỏng vấn: {iv.get('interview_date')}\n"
            f"Địa điểm / Hình thức: {iv.get('location') or 'Chưa xác định'}\n"
            f"Trạng thái: {iv.get('status')}\n"
            f"Ghi chú buổi phỏng vấn: {iv.get('note') or 'Không có'}"
        )
        metadata = {
            "entity_type": "interview",
            "entity_id": iv["id"],
            "interview_id": iv["id"],
            "candidate_id": iv.get("candidate_id"),
            "job_id": iv.get("job_id"),
            "display_name": f"PV {iv.get('candidate_name')} - {iv.get('job_title')}",
            "status": iv.get("status"),
        }
        documents.append({"text": text, "metadata": metadata})

    # 5. Evaluation Documents
    for ev in data.get("evaluations", []):
        avg_score = round(
            (ev["technical_score"] + ev["communication_score"] + ev["experience_score"]) / 3.0, 2
        )
        text = (
            f"THỰC THỂ: ĐÁNH GIÁ ỨNG VIÊN (EVALUATION)\n"
            f"Mã đánh giá: {ev['id']}\n"
            f"Ứng viên: {ev.get('candidate_name')}\n"
            f"Vị trí: {ev.get('job_title')}\n"
            f"Người đánh giá: {ev.get('evaluator_name')} ({ev.get('evaluator_role')})\n"
            f"Điểm chuyên môn: {ev['technical_score']}/5\n"
            f"Điểm giao tiếp: {ev['communication_score']}/5\n"
            f"Điểm kinh nghiệm: {ev['experience_score']}/5\n"
            f"Điểm trung bình đã lưu: {avg_score}/5\n"
            f"Nhận xét của người đánh giá: {ev.get('comment') or 'Không có nhận xét'}"
        )
        metadata = {
            "entity_type": "evaluation",
            "entity_id": ev["id"],
            "evaluation_id": ev["id"],
            "candidate_id": ev.get("candidate_id"),
            "job_id": ev.get("job_id"),
            "display_name": f"Đánh giá {ev.get('candidate_name')} - {ev.get('job_title')}",
        }
        documents.append({"text": text, "metadata": metadata})

    # Note: ai_results are deliberately excluded from RAG vector indexing
    # to avoid recursive hallucination and retain only authoritative source data.

    return documents

