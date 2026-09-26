from datetime import datetime

import pytest

import app as app_module


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role):
    with client.session_transaction() as session:
        session["user_id"] = 10
        session["user_name"] = f"Test {role}"
        session["role"] = role


def sample_job():
    return {
        "id": 1,
        "title": "Python Developer",
        "department": "Engineering",
        "description": "Phát triển ứng dụng Flask",
        "requirements": "Python cơ bản",
        "skills": "Python, Flask",
        "quantity": 2,
        "status": "OPEN",
        "created_at": datetime(2026, 9, 26),
        "application_count": 0,
    }


def valid_job_form():
    return {
        "title": "Python Developer",
        "department": "Engineering",
        "description": "Phát triển ứng dụng Flask",
        "requirements": "Python cơ bản",
        "skills": "Python, Flask",
        "quantity": "2",
        "status": "OPEN",
    }


def test_hr_can_view_job_list(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "get_jobs", lambda keyword, status: [sample_job()])
    response = client.get("/jobs")
    assert response.status_code == 200
    assert "Python Developer" in response.get_data(as_text=True)


def test_manager_can_view_job_list(client, monkeypatch):
    login_as(client, "MANAGER")
    monkeypatch.setattr(app_module, "get_jobs", lambda keyword, status: [])
    assert client.get("/jobs").status_code == 200


def test_hr_can_create_valid_job(client, monkeypatch):
    login_as(client, "HR")
    created = []
    monkeypatch.setattr(app_module, "create_job", lambda *args: created.append(args) or 1)
    response = client.post("/jobs/add", data=valid_job_form())
    assert response.status_code == 302
    assert created[0][0] == "Python Developer"
    assert created[0][5] == 2


def test_job_title_is_required(client, monkeypatch):
    login_as(client, "HR")
    form = valid_job_form()
    form["title"] = ""
    monkeypatch.setattr(app_module, "create_job", lambda *args: pytest.fail("must not create"))
    response = client.post("/jobs/add", data=form)
    assert response.status_code == 200
    assert "Vui lòng nhập tên vị trí" in response.get_data(as_text=True)


def test_job_quantity_must_be_positive(client, monkeypatch):
    login_as(client, "HR")
    form = valid_job_form()
    form["quantity"] = "0"
    monkeypatch.setattr(app_module, "create_job", lambda *args: pytest.fail("must not create"))
    response = client.post("/jobs/add", data=form)
    assert response.status_code == 200
    assert "lớn hơn hoặc bằng 1" in response.get_data(as_text=True)


def test_hr_can_update_job(client, monkeypatch):
    login_as(client, "HR")
    updated = []
    monkeypatch.setattr(app_module, "get_job_by_id", lambda job_id: sample_job())
    monkeypatch.setattr(app_module, "update_job", lambda *args: updated.append(args))
    form = valid_job_form()
    form["status"] = "CLOSED"
    response = client.post("/jobs/1/edit", data=form)
    assert response.status_code == 302
    assert updated[0][0] == 1
    assert updated[0][7] == "CLOSED"


def test_hr_can_delete_job_without_application(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "get_job_by_id", lambda job_id: sample_job())
    monkeypatch.setattr(app_module, "delete_job", lambda job_id: True)
    response = client.post("/jobs/1/delete", follow_redirects=False)
    assert response.status_code == 302


def test_job_with_application_cannot_be_deleted(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(app_module, "get_job_by_id", lambda job_id: sample_job())
    monkeypatch.setattr(app_module, "delete_job", lambda job_id: False)
    response = client.post("/jobs/1/delete", follow_redirects=True)
    assert response.status_code == 200
    assert "Không thể xóa vị trí đã có ứng viên ứng tuyển" in response.get_data(as_text=True)


def test_manager_cannot_create_job(client):
    login_as(client, "MANAGER")
    assert client.get("/jobs/add").status_code == 403


def test_job_search_and_status_filter(client, monkeypatch):
    login_as(client, "HR")
    received = []
    monkeypatch.setattr(app_module, "get_jobs", lambda keyword, status: received.append((keyword, status)) or [])
    response = client.get("/jobs?keyword=Python&status=OPEN")
    assert response.status_code == 200
    assert received == [("Python", "OPEN")]
