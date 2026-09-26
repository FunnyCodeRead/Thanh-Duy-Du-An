from datetime import datetime

import pytest

import app as app_module
import routes.interview_routes as interview_routes


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role, user_id=10):
    with client.session_transaction() as session:
        session.update(user_id=user_id, user_name=f"Test {role}", user_email="test@example.com", role=role)


def sample_interview(interview_id=1, application_id=1, interviewer_id=10, status="SCHEDULED"):
    return {
        "id": interview_id,
        "application_id": application_id,
        "interviewer_id": interviewer_id,
        "interview_date": datetime(2026, 9, 28, 9, 0, 0),
        "location": "Phòng họp 2",
        "status": status,
        "note": "Phỏng vấn chuyên môn",
        "created_at": datetime(2026, 9, 26, 12, 0, 0),
        "candidate": {
            "id": 1,
            "full_name": "Nguyễn Văn A",
            "email": "nguyenvana@example.com",
            "phone": "0901234567",
        },
        "job": {
            "id": 2,
            "title": "Python Developer",
            "department": "IT",
        },
        "interviewer": {
            "id": interviewer_id,
            "full_name": "Manager Demo",
            "role": "MANAGER",
        },
        "application_status": "INTERVIEW",
    }


# TC-INT-01: HR list Interviews -> 200
def test_hr_list_interviews(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interviews", lambda keyword, status, application_id, interviewer_id: [sample_interview()])
    response = client.get("/api/interviews")
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert len(response.get_json()["data"]) == 1
    assert response.get_json()["data"][0]["location"] == "Phòng họp 2"


# TC-INT-02: MANAGER list Interviews -> 200
def test_manager_list_interviews(client, monkeypatch):
    login_as(client, "MANAGER")
    monkeypatch.setattr(interview_routes, "get_interviews", lambda keyword, status, application_id, interviewer_id: [sample_interview()])
    response = client.get("/api/interviews")
    assert response.status_code == 200
    assert response.get_json()["success"] is True


# TC-INT-03: Unauthenticated list -> 401
def test_unauthenticated_interviews_returns_401(client):
    assert client.get("/api/interviews").status_code == 401
    assert client.get("/api/interviews/1").status_code == 401
    assert client.post("/api/interviews", json={}).status_code == 401


# TC-INT-04: HR create valid Interview -> 201, status = SCHEDULED
def test_hr_create_valid_interview(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_application_by_id", lambda aid: {"id": aid, "status": "INTERVIEW"})
    monkeypatch.setattr(interview_routes, "get_user_by_id", lambda uid: {"id": uid, "full_name": "Interviewer Demo"})
    monkeypatch.setattr(interview_routes, "create_interview", lambda application_id, interviewer_id, interview_date, location, note: 10)
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: sample_interview(interview_id=iid))

    payload = {
        "application_id": 1,
        "interviewer_id": 3,
        "interview_date": "2026-09-28 09:00:00",
        "location": "Phòng họp 1",
        "note": "Vòng 1",
    }
    response = client.post("/api/interviews", json=payload)
    assert response.status_code == 201
    assert response.get_json()["success"] is True
    assert response.get_json()["data"]["id"] == 10
    assert response.get_json()["data"]["status"] == "SCHEDULED"


# TC-INT-05: Invalid Application -> 400/404
@pytest.mark.parametrize("aid", [None, 0, -1, 999])
def test_invalid_application_returns_400_or_404(client, monkeypatch, aid):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_application_by_id", lambda _id: None)
    monkeypatch.setattr(interview_routes, "get_user_by_id", lambda _id: {"id": 1})
    payload = {
        "application_id": aid,
        "interviewer_id": 1,
        "interview_date": "2026-09-28 09:00:00",
    }
    response = client.post("/api/interviews", json=payload)
    assert response.status_code in (400, 404)
    assert response.get_json()["success"] is False


# TC-INT-06: Invalid interviewer -> 400/404
@pytest.mark.parametrize("uid", [None, 0, -1, 999])
def test_invalid_interviewer_returns_400_or_404(client, monkeypatch, uid):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_application_by_id", lambda _id: {"id": 1})
    monkeypatch.setattr(interview_routes, "get_user_by_id", lambda _id: None)
    payload = {
        "application_id": 1,
        "interviewer_id": uid,
        "interview_date": "2026-09-28 09:00:00",
    }
    response = client.post("/api/interviews", json=payload)
    assert response.status_code in (400, 404)
    assert response.get_json()["success"] is False


# TC-INT-07: HR update SCHEDULED interview -> 200
def test_hr_update_scheduled_interview(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: sample_interview(interview_id=iid, status="SCHEDULED"))
    monkeypatch.setattr(interview_routes, "get_user_by_id", lambda uid: {"id": uid, "full_name": "Updated Interviewer"})
    updates = []
    monkeypatch.setattr(interview_routes, "update_interview", lambda interview_id, interviewer_id, interview_date, location, note: updates.append((interview_id, location)) or True)

    payload = {
        "interviewer_id": 3,
        "interview_date": "2026-09-29 14:00:00",
        "location": "Phòng họp VIP",
        "note": "Đổi phòng họp",
    }
    response = client.put("/api/interviews/1", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert updates == [(1, "Phòng họp VIP")]


# TC-INT-08: SCHEDULED -> COMPLETED -> 200
def test_transition_scheduled_to_completed(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: sample_interview(interview_id=iid, status="SCHEDULED"))
    status_updates = []
    monkeypatch.setattr(interview_routes, "update_interview_status", lambda iid, status: status_updates.append((iid, status)) or True)

    response = client.put("/api/interviews/1/status", json={"status": "COMPLETED"})
    assert response.status_code == 200
    assert status_updates == [(1, "COMPLETED")]


# TC-INT-09: SCHEDULED -> CANCELLED -> 200
def test_transition_scheduled_to_cancelled(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: sample_interview(interview_id=iid, status="SCHEDULED"))
    status_updates = []
    monkeypatch.setattr(interview_routes, "update_interview_status", lambda iid, status: status_updates.append((iid, status)) or True)

    response = client.put("/api/interviews/1/status", json={"status": "CANCELLED"})
    assert response.status_code == 200
    assert status_updates == [(1, "CANCELLED")]


# TC-INT-10: COMPLETED -> SCHEDULED rejected -> 400
def test_completed_cannot_transition_to_scheduled(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: sample_interview(interview_id=iid, status="COMPLETED"))

    response = client.put("/api/interviews/1/status", json={"status": "SCHEDULED"})
    assert response.status_code == 400
    assert "Không thể chuyển trạng thái" in response.get_json()["message"]


# TC-INT-11: MANAGER cannot create interview -> 403
def test_manager_cannot_create_interview(client):
    login_as(client, "MANAGER")
    payload = {
        "application_id": 1,
        "interviewer_id": 1,
        "interview_date": "2026-09-28 09:00:00",
    }
    response = client.post("/api/interviews", json=payload)
    assert response.status_code == 403
    assert response.get_json()["success"] is False


# TC-INT-12: Search/filter forwarded
def test_interview_search_and_filter_forwarded(client, monkeypatch):
    login_as(client, "HR")
    forwarded = []
    monkeypatch.setattr(interview_routes, "get_interviews", lambda keyword, status, application_id, interviewer_id: forwarded.append((keyword, status, application_id, interviewer_id)) or [])

    response = client.get("/api/interviews?keyword=nguyen&status=SCHEDULED&application_id=5&interviewer_id=2")
    assert response.status_code == 200
    assert forwarded == [("nguyen", "SCHEDULED", 5, 2)]


# Edge cases:
def test_cannot_edit_completed_interview(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: sample_interview(interview_id=iid, status="COMPLETED"))
    response = client.put("/api/interviews/1", json={"location": "Phòng mới"})
    assert response.status_code == 400
    assert "Không thể chỉnh sửa" in response.get_json()["message"]


def test_missing_interview_returns_404(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interview_by_id", lambda iid: None)
    assert client.get("/api/interviews/999").status_code == 404
    assert client.put("/api/interviews/999", json={}).status_code == 404
    assert client.put("/api/interviews/999/status", json={"status": "COMPLETED"}).status_code == 404


def test_interviewers_list_endpoint(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(interview_routes, "get_interviewers", lambda: [{"id": 1, "full_name": "User 1", "role": "HR"}])
    response = client.get("/api/interviews/interviewers")
    assert response.status_code == 200
    assert len(response.get_json()["data"]) == 1
