import pytest
from mysql.connector import Error

import app as app_module
from database import db as db_module


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role="HR", user_id=2):
    with client.session_transaction() as sess:
        sess["user_id"] = user_id
        sess["role"] = role
        sess["user"] = {"id": user_id, "email": f"{role.lower()}@example.com", "role": role}


def sample_dashboard_data():
    return {
        "jobs": 5,
        "candidates": 10,
        "applications": 8,
        "interviews": 4,
        "summary": {
            "open_jobs": 3,
            "total_jobs": 5,
            "total_candidates": 10,
            "total_applications": 8,
            "upcoming_interviews": 2,
        },
        "application_status": {
            "NEW": 2,
            "SCREENING": 2,
            "INTERVIEW": 1,
            "PASSED": 2,
            "REJECTED": 1,
        },
        "candidate_sources": [
            {"source": "LINKEDIN", "count": 4},
            {"source": "FACEBOOK", "count": 3},
            {"source": "WEBSITE", "count": 2},
            {"source": "REFERRAL", "count": 1},
        ],
        "pass_rate": {
            "passed": 2,
            "rejected": 1,
            "finalized": 3,
            "rate": 66.67,
        },
        "hiring_time": {
            "available": False,
            "average_days": None,
            "message": "Chưa đủ dữ liệu thời điểm kết thúc hồ sơ để tính chính xác.",
        },
        "upcoming_interviews": [
            {
                "id": 1,
                "candidate_name": "Nguyen Van A",
                "job_title": "Python Developer",
                "interviewer_name": "Manager B",
                "interview_date": "2026-10-01 09:00:00",
                "location": "Phòng A",
            }
        ],
    }


# TC-DASH-01: Authenticated HR gets Dashboard
def test_hr_access_dashboard(client, monkeypatch):
    login_as(client, role="HR", user_id=2)
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    data = res.get_json()
    assert data["success"] is True
    assert "summary" in data["data"]
    assert "application_status" in data["data"]


# TC-DASH-02: MANAGER gets Dashboard
def test_manager_access_dashboard(client, monkeypatch):
    login_as(client, role="MANAGER", user_id=3)
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    assert res.status_code == 200
    assert res.get_json()["success"] is True


# TC-DASH-03: Unauthenticated access returns 401
def test_unauthenticated_dashboard(client):
    res = client.get("/api/dashboard")
    assert res.status_code == 401


# TC-DASH-04: Summary counts are correct
def test_dashboard_summary_counts(client, monkeypatch):
    login_as(client, role="HR")
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    summary = res.get_json()["data"]["summary"]
    assert summary["open_jobs"] == 3
    assert summary["total_jobs"] == 5
    assert summary["total_candidates"] == 10
    assert summary["total_applications"] == 8
    assert summary["upcoming_interviews"] == 2


# TC-DASH-05: Application status grouping contains all 5 keys
def test_dashboard_application_status_grouping(client, monkeypatch):
    login_as(client, role="HR")
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    app_status = res.get_json()["data"]["application_status"]
    for status_key in ("NEW", "SCREENING", "INTERVIEW", "PASSED", "REJECTED"):
        assert status_key in app_status
        assert isinstance(app_status[status_key], int)


# TC-DASH-06: Candidate source grouping contains valid sources
def test_dashboard_candidate_sources_grouping(client, monkeypatch):
    login_as(client, role="HR")
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    sources = res.get_json()["data"]["candidate_sources"]
    assert len(sources) == 4
    assert sources[0]["source"] == "LINKEDIN"
    assert sources[0]["count"] == 4


# TC-DASH-07: Pass rate calculation formula is accurate
def test_dashboard_pass_rate_calculation(client, monkeypatch):
    login_as(client, role="HR")
    data = sample_dashboard_data()
    data["pass_rate"] = {"passed": 3, "rejected": 1, "finalized": 4, "rate": 75.0}
    monkeypatch.setattr(app_module, "get_dashboard_counts", lambda: data)
    res = client.get("/api/dashboard")
    pass_rate = res.get_json()["data"]["pass_rate"]
    assert pass_rate["passed"] == 3
    assert pass_rate["rejected"] == 1
    assert pass_rate["finalized"] == 4
    assert pass_rate["rate"] == 75.0


# TC-DASH-08: No finalized applications handled safely without division by zero
def test_dashboard_pass_rate_zero_finalized(client, monkeypatch):
    login_as(client, role="HR")
    data = sample_dashboard_data()
    data["pass_rate"] = {"passed": 0, "rejected": 0, "finalized": 0, "rate": 0.0}
    monkeypatch.setattr(app_module, "get_dashboard_counts", lambda: data)
    res = client.get("/api/dashboard")
    pass_rate = res.get_json()["data"]["pass_rate"]
    assert pass_rate["finalized"] == 0
    assert pass_rate["rate"] == 0.0


# TC-DASH-09: Upcoming interview list is properly formatted
def test_dashboard_upcoming_interviews(client, monkeypatch):
    login_as(client, role="HR")
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    upcoming = res.get_json()["data"]["upcoming_interviews"]
    assert len(upcoming) == 1
    item = upcoming[0]
    assert item["candidate_name"] == "Nguyen Van A"
    assert item["job_title"] == "Python Developer"
    assert "interview_date" in item
    assert "interviewer_name" in item


# TC-DASH-10: Hiring-time data limitation handling
def test_dashboard_hiring_time_limitation_handling(client, monkeypatch):
    login_as(client, role="HR")
    monkeypatch.setattr(app_module, "get_dashboard_counts", sample_dashboard_data)
    res = client.get("/api/dashboard")
    hiring_time = res.get_json()["data"]["hiring_time"]
    assert hiring_time["available"] is False
    assert hiring_time["average_days"] is None
    assert "Chưa đủ dữ liệu" in hiring_time["message"]


# TC-DASH-11: Database failure returns 500 error
def test_dashboard_db_error_returns_500(client, monkeypatch):
    login_as(client, role="HR")

    def raise_error():
        raise Error("MySQL error")

    monkeypatch.setattr(app_module, "get_dashboard_counts", raise_error)
    res = client.get("/api/dashboard")
    assert res.status_code == 500
    assert res.get_json()["success"] is False
