from datetime import datetime

import pytest

import app as app_module
import routes.job_routes as job_routes


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role):
    with client.session_transaction() as session:
        session.update(user_id=10, user_name=f"Test {role}", user_email="test@example.com", role=role)


def sample_job():
    return {"id": 1, "title": "Python Developer", "department": "IT", "description": "Build Flask apps", "requirements": "Python", "skills": "Python, Flask", "quantity": 2, "status": "OPEN", "created_at": datetime(2026, 9, 26), "application_count": 0}


def valid_job():
    return {"title": "Python Developer", "department": "IT", "description": "Build Flask apps", "requirements": "Python", "skills": "Python, Flask", "quantity": 2, "status": "OPEN"}


def test_job_list_requires_login(client):
    assert client.get("/api/jobs").status_code == 401


@pytest.mark.parametrize("role", ["ADMIN", "HR", "MANAGER"])
def test_all_roles_can_view_jobs(client, monkeypatch, role):
    login_as(client, role); monkeypatch.setattr(job_routes, "get_jobs", lambda keyword, status: [sample_job()])
    response = client.get("/api/jobs")
    assert response.status_code == 200 and response.get_json()["data"][0]["title"] == "Python Developer"


def test_job_search_and_filter_are_forwarded(client, monkeypatch):
    login_as(client, "HR"); received = []
    monkeypatch.setattr(job_routes, "get_jobs", lambda keyword, status: received.append((keyword, status)) or [])
    assert client.get("/api/jobs?keyword=Python&status=OPEN").status_code == 200
    assert received == [("Python", "OPEN")]


def test_hr_can_create_job(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(job_routes, "create_job", lambda **values: 8); monkeypatch.setattr(job_routes, "get_job_by_id", lambda job_id: {**sample_job(), "id": job_id})
    response = client.post("/api/jobs", json=valid_job())
    assert response.status_code == 201 and response.get_json()["data"]["id"] == 8


@pytest.mark.parametrize(("change", "message"), [
    ({"title": ""}, "Vui lòng nhập tên vị trí."),
    ({"description": ""}, "Vui lòng nhập mô tả công việc."),
    ({"quantity": 0}, "Số lượng phải lớn hơn hoặc bằng 1."),
    ({"status": "DRAFT"}, "Trạng thái vị trí không hợp lệ."),
])
def test_job_validation(client, change, message):
    login_as(client, "HR"); payload = valid_job(); payload.update(change)
    response = client.post("/api/jobs", json=payload)
    assert response.status_code == 400 and response.get_json()["message"] == message


def test_hr_can_update_job(client, monkeypatch):
    login_as(client, "HR"); updated = []
    monkeypatch.setattr(job_routes, "get_job_by_id", lambda job_id: sample_job()); monkeypatch.setattr(job_routes, "update_job", lambda job_id, **values: updated.append((job_id, values)))
    payload = valid_job(); payload["status"] = "CLOSED"
    assert client.put("/api/jobs/1", json=payload).status_code == 200 and updated[0][1]["status"] == "CLOSED"


def test_hr_can_delete_unreferenced_job(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(job_routes, "get_job_by_id", lambda job_id: sample_job()); monkeypatch.setattr(job_routes, "delete_job", lambda job_id: True)
    assert client.delete("/api/jobs/1").status_code == 200


def test_referenced_job_returns_conflict(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(job_routes, "get_job_by_id", lambda job_id: sample_job()); monkeypatch.setattr(job_routes, "delete_job", lambda job_id: False)
    assert client.delete("/api/jobs/1").status_code == 409


@pytest.mark.parametrize("method,path", [("post", "/api/jobs"), ("put", "/api/jobs/1"), ("delete", "/api/jobs/1")])
def test_manager_cannot_mutate_jobs(client, method, path):
    login_as(client, "MANAGER")
    assert getattr(client, method)(path, json=valid_job()).status_code == 403


def test_missing_job_returns_404(client, monkeypatch):
    login_as(client, "HR"); monkeypatch.setattr(job_routes, "get_job_by_id", lambda job_id: None)
    assert client.get("/api/jobs/999").status_code == 404

