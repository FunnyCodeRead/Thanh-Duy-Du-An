import io
from datetime import datetime

import pytest

import app as app_module
import routes.candidate_routes as candidate_routes


@pytest.fixture
def client(tmp_path):
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret", UPLOAD_FOLDER=str(tmp_path))
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role):
    with client.session_transaction() as session:
        session.update(user_id=11, user_name=f"Test {role}", user_email="test@example.com", role=role)


def sample_candidate():
    return {"id": 1, "full_name": "Nguyễn Văn An", "email": "an@example.com", "phone": "0901", "skills": "Python, Flask", "experience": "2 năm", "education": "Đại học", "source": "LINKEDIN", "cv_file": None, "cv_text": "", "created_at": datetime(2026, 9, 26), "application_count": 0}


def valid_form():
    return {"full_name": "Nguyễn Văn An", "email": "an@example.com", "phone": "0901", "skills": "Python, Flask", "experience": "2 năm", "education": "Đại học", "source": "LINKEDIN"}


def test_candidate_list_requires_login(client):
    assert client.get("/api/candidates").status_code == 401


@pytest.mark.parametrize("role", ["ADMIN", "HR", "MANAGER"])
def test_all_roles_can_view_candidates(client, monkeypatch, role):
    login_as(client, role); monkeypatch.setattr(candidate_routes, "get_candidates", lambda keyword, source: [sample_candidate()])
    assert client.get("/api/candidates").status_code == 200


def test_candidate_search_and_filter_are_forwarded(client, monkeypatch):
    login_as(client, "HR"); received = []
    monkeypatch.setattr(candidate_routes, "get_candidates", lambda keyword, source: received.append((keyword, source)) or [])
    assert client.get("/api/candidates?keyword=Python&source=LINKEDIN").status_code == 200
    assert received == [("Python", "LINKEDIN")]


def test_hr_can_create_candidate(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(candidate_routes, "create_candidate", lambda **values: 7); monkeypatch.setattr(candidate_routes, "get_candidate_by_id", lambda candidate_id: {**sample_candidate(), "id": candidate_id})
    response = client.post("/api/candidates", data=valid_form())
    assert response.status_code == 201 and response.get_json()["data"]["id"] == 7


@pytest.mark.parametrize(("change", "message"), [
    ({"full_name": ""}, "Vui lòng nhập họ tên ứng viên."),
    ({"email": "invalid"}, "Email không đúng định dạng."),
    ({"source": "UNKNOWN"}, "Nguồn ứng viên không hợp lệ."),
])
def test_candidate_validation(client, change, message):
    login_as(client, "HR"); form = valid_form(); form.update(change)
    response = client.post("/api/candidates", data=form)
    assert response.status_code == 400 and response.get_json()["message"] == message


def test_doc_upload_is_accepted(client, monkeypatch):
    login_as(client, "HR"); created = []
    monkeypatch.setattr(candidate_routes, "create_candidate", lambda **values: created.append(values) or 2); monkeypatch.setattr(candidate_routes, "get_candidate_by_id", lambda candidate_id: {**sample_candidate(), "id": candidate_id})
    form = valid_form(); form["cv"] = (io.BytesIO(b"legacy doc"), "candidate.doc")
    response = client.post("/api/candidates", data=form, content_type="multipart/form-data")
    assert response.status_code == 201 and created[0]["cv_file"].endswith("_candidate.doc")


def test_executable_upload_is_rejected(client):
    login_as(client, "HR"); form = valid_form(); form["cv"] = (io.BytesIO(b"bad"), "virus.exe")
    assert client.post("/api/candidates", data=form, content_type="multipart/form-data").status_code == 400


def test_filename_without_safe_extension_is_rejected(client):
    login_as(client, "HR"); form = valid_form(); form["cv"] = (io.BytesIO(b"bad"), ".pdf")
    assert client.post("/api/candidates", data=form, content_type="multipart/form-data").status_code == 400


def test_hr_can_update_candidate_without_replacing_cv(client, monkeypatch):
    login_as(client, "HR"); updated = []; existing = {**sample_candidate(), "cv_file": "existing.pdf", "cv_text": "text"}
    monkeypatch.setattr(candidate_routes, "get_candidate_by_id", lambda candidate_id: existing); monkeypatch.setattr(candidate_routes, "update_candidate", lambda candidate_id, **values: updated.append(values))
    assert client.put("/api/candidates/1", data=valid_form()).status_code == 200
    assert updated[0]["cv_file"] == "existing.pdf"


def test_hr_can_delete_unreferenced_candidate(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(candidate_routes, "get_candidate_by_id", lambda candidate_id: sample_candidate()); monkeypatch.setattr(candidate_routes, "delete_candidate", lambda candidate_id: True)
    assert client.delete("/api/candidates/1").status_code == 200


def test_referenced_candidate_returns_conflict(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(candidate_routes, "get_candidate_by_id", lambda candidate_id: sample_candidate()); monkeypatch.setattr(candidate_routes, "delete_candidate", lambda candidate_id: False)
    assert client.delete("/api/candidates/1").status_code == 409


@pytest.mark.parametrize("method,path", [("post", "/api/candidates"), ("put", "/api/candidates/1"), ("delete", "/api/candidates/1")])
def test_manager_cannot_mutate_candidates(client, method, path):
    login_as(client, "MANAGER")
    assert getattr(client, method)(path, data=valid_form()).status_code == 403


def test_cv_route_requires_login(client):
    assert client.get("/uploads/example.pdf").status_code == 401


def test_cv_route_accepts_legacy_uploads_prefix(client, tmp_path):
    login_as(client, "HR")
    (tmp_path / "example.pdf").write_bytes(b"sample")

    response = client.get("/uploads/uploads/example.pdf")

    assert response.status_code == 200
    assert response.data == b"sample"
