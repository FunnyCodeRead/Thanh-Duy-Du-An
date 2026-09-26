from datetime import datetime

import pytest

import app as app_module
import routes.application_routes as application_routes


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role):
    with client.session_transaction() as session:
        session.update(user_id=10, user_name=f"Test {role}", user_email="test@example.com", role=role)


def sample_application(application_id=1, candidate_id=1, job_id=2, status="NEW"):
    return {
        "id": application_id,
        "candidate_id": candidate_id,
        "candidate_name": "Nguyễn Văn A",
        "candidate_email": "nguyenvana@example.com",
        "job_id": job_id,
        "job_title": "Python Developer",
        "job_department": "IT",
        "status": status,
        "applied_at": datetime(2026, 9, 26, 10, 0, 0),
        "note": "Ứng viên tiềm năng",
        "candidate": {
            "id": candidate_id,
            "full_name": "Nguyễn Văn A",
            "email": "nguyenvana@example.com",
            "phone": "0901234567",
            "skills": "Python, Flask",
            "experience": "2 năm kinh nghiệm",
            "education": "Đại học CNTT",
            "source": "FACEBOOK",
            "cv_file": "candidate_cv.pdf",
        },
        "job": {
            "id": job_id,
            "title": "Python Developer",
            "department": "IT",
            "description": "Lập trình backend",
            "requirements": "Python 3+",
            "skills": "Python, MySQL",
            "status": "OPEN",
        },
    }


# TC-APP-01: HR list applications
def test_hr_list_applications(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_applications", lambda keyword, status, job_id: [sample_application()])
    response = client.get("/api/applications")
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert len(response.get_json()["data"]) == 1
    assert response.get_json()["data"][0]["candidate_name"] == "Nguyễn Văn A"


# TC-APP-02: MANAGER list applications
def test_manager_list_applications(client, monkeypatch):
    login_as(client, "MANAGER")
    monkeypatch.setattr(application_routes, "get_applications", lambda keyword, status, job_id: [sample_application()])
    response = client.get("/api/applications")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


# TC-APP-03: Unauthenticated list
def test_unauthenticated_list_returns_401(client):
    response = client.get("/api/applications")
    assert response.status_code == 401
    assert response.get_json()["success"] is False


# TC-APP-04: HR create valid Application -> 201, status = NEW
def test_hr_create_valid_application(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_candidate_by_id", lambda cid: {"id": cid, "full_name": "Nguyễn Văn A"})
    monkeypatch.setattr(application_routes, "get_job_by_id", lambda jid: {"id": jid, "title": "Python Developer"})
    monkeypatch.setattr(application_routes, "application_exists", lambda cid, jid: False)
    monkeypatch.setattr(application_routes, "create_application", lambda candidate_id, job_id, note: 10)
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid, status="NEW"))

    response = client.post("/api/applications", json={"candidate_id": 1, "job_id": 2, "note": "Hồ sơ mới"})
    assert response.status_code == 201
    json_data = response.get_json()
    assert json_data["success"] is True
    assert json_data["data"]["id"] == 10
    assert json_data["data"]["status"] == "NEW"


# TC-APP-05: Candidate invalid
@pytest.mark.parametrize("cid", [None, 0, -1, 999])
def test_candidate_invalid_returns_400_or_404(client, monkeypatch, cid):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_candidate_by_id", lambda _id: None)
    monkeypatch.setattr(application_routes, "get_job_by_id", lambda _id: {"id": 1})
    payload = {"candidate_id": cid, "job_id": 1}
    response = client.post("/api/applications", json=payload)
    assert response.status_code in (400, 404)
    assert response.get_json()["success"] is False


# TC-APP-06: Job invalid
@pytest.mark.parametrize("jid", [None, 0, -1, 999])
def test_job_invalid_returns_400_or_404(client, monkeypatch, jid):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_candidate_by_id", lambda _id: {"id": 1})
    monkeypatch.setattr(application_routes, "get_job_by_id", lambda _id: None)
    payload = {"candidate_id": 1, "job_id": jid}
    response = client.post("/api/applications", json=payload)
    assert response.status_code in (400, 404)
    assert response.get_json()["success"] is False


# TC-APP-07: Duplicate Candidate + Job -> 409
def test_duplicate_candidate_job_returns_409(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_candidate_by_id", lambda cid: {"id": cid})
    monkeypatch.setattr(application_routes, "get_job_by_id", lambda jid: {"id": jid})
    monkeypatch.setattr(application_routes, "application_exists", lambda cid, jid: True)

    response = client.post("/api/applications", json={"candidate_id": 1, "job_id": 2})
    assert response.status_code == 409
    assert response.get_json()["success"] is False
    assert "đã có hồ sơ ứng tuyển" in response.get_json()["message"]


# TC-APP-08: MANAGER create -> 403
def test_manager_cannot_create_application(client):
    login_as(client, "MANAGER")
    response = client.post("/api/applications", json={"candidate_id": 1, "job_id": 2})
    assert response.status_code == 403
    assert response.get_json()["success"] is False


# TC-APP-09: HR NEW -> SCREENING
def test_hr_transition_new_to_screening(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid, status="NEW" if aid == 1 else "SCREENING"))
    status_updates = []
    monkeypatch.setattr(application_routes, "update_application_status", lambda aid, status: status_updates.append((aid, status)))

    response = client.put("/api/applications/1/status", json={"status": "SCREENING"})
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert status_updates == [(1, "SCREENING")]


# TC-APP-10: HR SCREENING -> INTERVIEW
def test_hr_transition_screening_to_interview(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid, status="SCREENING"))
    status_updates = []
    monkeypatch.setattr(application_routes, "update_application_status", lambda aid, status: status_updates.append((aid, status)))

    response = client.put("/api/applications/1/status", json={"status": "INTERVIEW"})
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert status_updates == [(1, "INTERVIEW")]


# TC-APP-11: Invalid status -> 400
def test_invalid_status_returns_400(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid, status="NEW"))
    response = client.put("/api/applications/1/status", json={"status": "UNKNOWN_STATUS"})
    assert response.status_code == 400
    assert response.get_json()["success"] is False


# TC-APP-12: Invalid transition (e.g. NEW -> PASSED) -> 400
def test_invalid_transition_returns_400(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid, status="NEW"))
    response = client.put("/api/applications/1/status", json={"status": "PASSED"})
    assert response.status_code == 400
    assert response.get_json()["success"] is False
    assert "Không thể chuyển trạng thái" in response.get_json()["message"]


# TC-APP-13: MANAGER update status -> 403
def test_manager_cannot_update_application_status(client):
    login_as(client, "MANAGER")
    response = client.put("/api/applications/1/status", json={"status": "SCREENING"})
    assert response.status_code == 403
    assert response.get_json()["success"] is False


# TC-APP-14: Search/filter forwarded correctly
def test_application_search_and_filter_forwarded(client, monkeypatch):
    login_as(client, "HR")
    forwarded = []
    monkeypatch.setattr(application_routes, "get_applications", lambda keyword, status, job_id: forwarded.append((keyword, status, job_id)) or [])

    response = client.get("/api/applications?keyword=nguyen&status=INTERVIEW&job_id=3")
    assert response.status_code == 200
    assert forwarded == [("nguyen", "INTERVIEW", 3)]


# Detail view & 404 tests
def test_get_application_detail(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid))
    response = client.get("/api/applications/1")
    assert response.status_code == 200
    assert response.get_json()["data"]["candidate"]["full_name"] == "Nguyễn Văn A"


def test_missing_application_returns_404(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: None)
    assert client.get("/api/applications/999").status_code == 404
    assert client.put("/api/applications/999/status", json={"status": "SCREENING"}).status_code == 404


def test_final_state_cannot_transition(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(application_routes, "get_application_by_id", lambda aid: sample_application(application_id=aid, status="PASSED"))
    response = client.put("/api/applications/1/status", json={"status": "NEW"})
    assert response.status_code == 400
    assert "Không thể chuyển trạng thái" in response.get_json()["message"]
