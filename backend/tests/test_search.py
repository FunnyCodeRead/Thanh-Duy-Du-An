import pytest
import app as app_module
from routes import (
    job_routes,
    candidate_routes,
    application_routes,
    interview_routes,
)


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


# TC-SRCH-01: Job combined filter (keyword + status)
def test_job_combined_filter(client, monkeypatch):
    login_as(client)
    captured = {}

    def mock_get_jobs(keyword=None, status=None):
        captured["keyword"] = keyword
        captured["status"] = status
        return [{"id": 1, "title": "Python Dev", "status": "OPEN"}]

    monkeypatch.setattr(job_routes, "get_jobs", mock_get_jobs)
    res = client.get("/api/jobs?keyword=python&status=OPEN")
    assert res.status_code == 200
    assert captured == {"keyword": "python", "status": "OPEN"}


# TC-SRCH-02: Job search special characters
def test_job_search_special_characters(client, monkeypatch):
    login_as(client)
    captured = {}

    def mock_get_jobs(keyword=None, status=None):
        captured["keyword"] = keyword
        return []

    monkeypatch.setattr(job_routes, "get_jobs", mock_get_jobs)
    res = client.get("/api/jobs?keyword=test%25_%27")
    assert res.status_code == 200
    assert captured["keyword"] == "test%_'"
    assert res.get_json()["data"] == []


# TC-SRCH-03: Candidate combined filter (keyword + source)
def test_candidate_combined_filter(client, monkeypatch):
    login_as(client)
    captured = {}

    def mock_get_candidates(keyword=None, source=None):
        captured["keyword"] = keyword
        captured["source"] = source
        return [{"id": 1, "full_name": "Nguyen Van A", "source": "LINKEDIN"}]

    monkeypatch.setattr(candidate_routes, "get_candidates", mock_get_candidates)
    res = client.get("/api/candidates?keyword=nguyen&source=LINKEDIN")
    assert res.status_code == 200
    assert captured == {"keyword": "nguyen", "source": "LINKEDIN"}


# TC-SRCH-04: Candidate search special characters
def test_candidate_search_special_characters(client, monkeypatch):
    login_as(client)
    captured = {}

    def mock_get_candidates(keyword=None, source=None):
        captured["keyword"] = keyword
        return []

    monkeypatch.setattr(candidate_routes, "get_candidates", mock_get_candidates)
    res = client.get("/api/candidates?keyword=%27+OR+1%3D1--")
    assert res.status_code == 200
    assert captured["keyword"] == "' OR 1=1--"


# TC-SRCH-05: Application combined filter (keyword + status + job_id)
def test_application_combined_filter(client, monkeypatch):
    login_as(client)
    captured = {}

    def mock_get_applications(keyword=None, status=None, job_id=None):
        captured["keyword"] = keyword
        captured["status"] = status
        captured["job_id"] = job_id
        return [{"id": 1, "status": "SCREENING"}]

    monkeypatch.setattr(application_routes, "get_applications", mock_get_applications)
    res = client.get("/api/applications?keyword=an&status=SCREENING&job_id=2")
    assert res.status_code == 200
    assert captured == {"keyword": "an", "status": "SCREENING", "job_id": 2}


# TC-SRCH-06: Application search no results returns empty list
def test_application_search_no_results(client, monkeypatch):
    login_as(client)
    monkeypatch.setattr(application_routes, "get_applications", lambda **kwargs: [])
    res = client.get("/api/applications?keyword=nonexistent")
    assert res.status_code == 200
    assert res.get_json()["data"] == []


# TC-SRCH-07: Interview combined filter (keyword + status)
def test_interview_combined_filter(client, monkeypatch):
    login_as(client)
    captured = {}

    def mock_get_interviews(keyword=None, status=None, **kwargs):
        captured["keyword"] = keyword
        captured["status"] = status
        return [{"id": 1, "status": "SCHEDULED"}]

    monkeypatch.setattr(interview_routes, "get_interviews", mock_get_interviews)
    res = client.get("/api/interviews?keyword=dung&status=SCHEDULED")
    assert res.status_code == 200
    assert captured == {"keyword": "dung", "status": "SCHEDULED"}


# TC-SRCH-08: Empty keyword handling across endpoints
def test_empty_keyword_handling(client, monkeypatch):
    login_as(client)
    monkeypatch.setattr(job_routes, "get_jobs", lambda keyword, status, **kwargs: [])
    monkeypatch.setattr(candidate_routes, "get_candidates", lambda keyword, source, **kwargs: [])
    monkeypatch.setattr(application_routes, "get_applications", lambda keyword, status, job_id, **kwargs: [])
    monkeypatch.setattr(interview_routes, "get_interviews", lambda keyword, status, **kwargs: [])

    for url in ("/api/jobs?keyword=", "/api/candidates?keyword=", "/api/applications?keyword=", "/api/interviews?keyword="):
        res = client.get(url)
        assert res.status_code == 200
        assert res.get_json()["success"] is True
