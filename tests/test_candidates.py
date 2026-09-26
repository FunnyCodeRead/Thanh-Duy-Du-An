import io
from datetime import datetime

import pytest

import app as app_module


@pytest.fixture
def client(tmp_path, monkeypatch):
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    monkeypatch.setitem(app_module.app.config, "UPLOAD_FOLDER", str(tmp_path))
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role):
    with client.session_transaction() as session:
        session["user_id"] = 11
        session["user_name"] = f"Test {role}"
        session["role"] = role


def sample_candidate():
    return {
        "id": 1,
        "full_name": "Nguyễn Văn An",
        "email": "an@example.com",
        "phone": "0901000001",
        "skills": "Python, Flask",
        "experience": "2 năm",
        "education": "Đại học",
        "source": "LINKEDIN",
        "cv_file": None,
        "cv_text": "",
        "created_at": datetime(2026, 9, 26),
        "application_count": 0,
    }


def valid_candidate_form():
    return {
        "full_name": "Nguyễn Văn An",
        "email": "an@example.com",
        "phone": "0901000001",
        "skills": "Python, Flask",
        "experience": "2 năm",
        "education": "Đại học",
        "source": "LINKEDIN",
    }


def test_hr_can_view_candidate_list(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "get_candidates", lambda keyword, source: [sample_candidate()])
    response = client.get("/candidates")
    assert response.status_code == 200
    assert "Nguyễn Văn An" in response.get_data(as_text=True)


def test_hr_can_create_candidate(client, monkeypatch):
    login_as(client, "HR")
    created = []
    monkeypatch.setattr(app_module, "create_candidate", lambda *args: created.append(args) or 1)
    response = client.post("/candidates/add", data=valid_candidate_form())
    assert response.status_code == 302
    assert created[0][0] == "Nguyễn Văn An"


def test_candidate_name_is_required(client, monkeypatch):
    login_as(client, "HR")
    form = valid_candidate_form()
    form["full_name"] = ""
    monkeypatch.setattr(app_module, "create_candidate", lambda *args: pytest.fail("must not create"))
    response = client.post("/candidates/add", data=form)
    assert response.status_code == 200
    assert "Vui lòng nhập họ tên ứng viên" in response.get_data(as_text=True)


def test_upload_valid_doc_cv(client, monkeypatch):
    login_as(client, "HR")
    created = []
    monkeypatch.setattr(app_module, "create_candidate", lambda *args: created.append(args) or 1)
    form = valid_candidate_form()
    form["cv_file"] = (io.BytesIO(b"demo cv"), "candidate.doc")
    response = client.post("/candidates/add", data=form, content_type="multipart/form-data")
    assert response.status_code == 302
    assert created[0][7].endswith("_candidate.doc")


def test_upload_executable_is_rejected(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "create_candidate", lambda *args: pytest.fail("must not create"))
    form = valid_candidate_form()
    form["cv_file"] = (io.BytesIO(b"not safe"), "virus.exe")
    response = client.post("/candidates/add", data=form, content_type="multipart/form-data")
    assert response.status_code == 200
    assert "PDF, DOC hoặc DOCX" in response.get_data(as_text=True)


def test_hr_can_update_candidate(client, monkeypatch):
    login_as(client, "HR")
    updated = []
    monkeypatch.setattr(app_module, "get_candidate_by_id", lambda candidate_id: sample_candidate())
    monkeypatch.setattr(app_module, "update_candidate", lambda *args: updated.append(args))
    form = valid_candidate_form()
    form["skills"] = "Python, Flask, MySQL"
    response = client.post("/candidates/1/edit", data=form)
    assert response.status_code == 302
    assert updated[0][4] == "Python, Flask, MySQL"


def test_hr_can_delete_candidate_without_application(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "get_candidate_by_id", lambda candidate_id: sample_candidate())
    monkeypatch.setattr(app_module, "delete_candidate", lambda candidate_id: True)
    response = client.post("/candidates/1/delete")
    assert response.status_code == 302


def test_candidate_with_application_cannot_be_deleted(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "get_candidate_by_id", lambda candidate_id: sample_candidate())
    monkeypatch.setattr(app_module, "delete_candidate", lambda candidate_id: False)
    monkeypatch.setattr(app_module, "get_candidates", lambda keyword, source: [])
    response = client.post("/candidates/1/delete", follow_redirects=True)
    assert response.status_code == 200
    assert "Không thể xóa ứng viên đã có hồ sơ ứng tuyển" in response.get_data(as_text=True)


def test_manager_cannot_edit_candidate(client, monkeypatch):
    login_as(client, "MANAGER")
    assert client.get("/candidates/1/edit").status_code == 403


@pytest.mark.parametrize("keyword", ["Nguyễn", "Python"])
def test_candidate_search_by_name_or_skill(client, monkeypatch, keyword):
    login_as(client, "HR")
    received = []
    monkeypatch.setattr(app_module, "get_candidates", lambda value, source: received.append((value, source)) or [])
    response = client.get(f"/candidates?keyword={keyword}")
    assert response.status_code == 200
    assert received == [(keyword, None)]


def test_candidate_source_filter(client, monkeypatch):
    login_as(client, "HR")
    received = []
    monkeypatch.setattr(app_module, "get_candidates", lambda keyword, source: received.append((keyword, source)) or [])
    response = client.get("/candidates?source=LINKEDIN")
    assert response.status_code == 200
    assert received == [(None, "LINKEDIN")]
