from datetime import datetime

import pytest

import app as app_module
import routes.evaluation_routes as evaluation_routes


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


def login_as(client, role, user_id=10):
    with client.session_transaction() as session:
        session.update(user_id=user_id, user_name=f"Test {role}", user_email="test@example.com", role=role)


def sample_evaluation(eval_id=1, application_id=1, evaluator_id=10, tech=4, comm=5, exp=3):
    avg = round((tech + comm + exp) / 3.0, 2)
    return {
        "id": eval_id,
        "application_id": application_id,
        "evaluator_id": evaluator_id,
        "evaluator_name": "Test Evaluator",
        "evaluator_role": "MANAGER",
        "technical_score": tech,
        "communication_score": comm,
        "experience_score": exp,
        "average_score": avg,
        "comment": "Ứng viên thể hiện tốt",
        "created_at": datetime(2026, 9, 26, 14, 0, 0),
    }


# TC-EVAL-01: Authorized user list Application evaluations
def test_list_application_evaluations(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(evaluation_routes, "get_application_by_id", lambda aid: {"id": aid})
    monkeypatch.setattr(evaluation_routes, "get_application_evaluations", lambda aid: [sample_evaluation()])

    response = client.get("/api/applications/1/evaluations")
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert len(response.get_json()["data"]) == 1
    assert response.get_json()["data"][0]["technical_score"] == 4


# TC-EVAL-02: Create evaluation valid -> 201
def test_create_evaluation_valid(client, monkeypatch):
    login_as(client, "MANAGER", user_id=10)
    monkeypatch.setattr(evaluation_routes, "get_application_by_id", lambda aid: {"id": aid})
    monkeypatch.setattr(evaluation_routes, "create_evaluation", lambda **kwargs: 1)
    monkeypatch.setattr(evaluation_routes, "get_evaluation_by_id", lambda eid: sample_evaluation(eval_id=eid, tech=4, comm=5, exp=3))

    payload = {
        "application_id": 1,
        "technical_score": 4,
        "communication_score": 5,
        "experience_score": 3,
        "comment": "Ứng viên thể hiện tốt",
    }
    response = client.post("/api/evaluations", json=payload)
    assert response.status_code == 201
    assert response.get_json()["success"] is True
    assert response.get_json()["data"]["average_score"] == 4.0


# TC-EVAL-03: Technical score = 0 -> 400
def test_technical_score_zero_returns_400(client):
    login_as(client, "HR")
    payload = {
        "application_id": 1,
        "technical_score": 0,
        "communication_score": 4,
        "experience_score": 4,
    }
    response = client.post("/api/evaluations", json=payload)
    assert response.status_code == 400
    assert "Điểm chuyên môn phải từ 1 đến 5." in response.get_json()["message"]


# TC-EVAL-04: Communication score = 6 -> 400
def test_communication_score_six_returns_400(client):
    login_as(client, "HR")
    payload = {
        "application_id": 1,
        "technical_score": 4,
        "communication_score": 6,
        "experience_score": 4,
    }
    response = client.post("/api/evaluations", json=payload)
    assert response.status_code == 400
    assert "Điểm giao tiếp phải từ 1 đến 5." in response.get_json()["message"]


# TC-EVAL-05: Invalid Application -> 404
def test_invalid_application_returns_404(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(evaluation_routes, "get_application_by_id", lambda aid: None)
    payload = {
        "application_id": 999,
        "technical_score": 4,
        "communication_score": 4,
        "experience_score": 4,
    }
    response = client.post("/api/evaluations", json=payload)
    assert response.status_code == 404
    assert response.get_json()["success"] is False


# TC-EVAL-06: Average score calculated correctly (4, 5, 4 -> 4.33)
def test_average_score_calculated_correctly(client, monkeypatch):
    login_as(client, "HR")
    monkeypatch.setattr(evaluation_routes, "get_application_by_id", lambda aid: {"id": aid})
    monkeypatch.setattr(evaluation_routes, "create_evaluation", lambda **kwargs: 2)
    monkeypatch.setattr(evaluation_routes, "get_evaluation_by_id", lambda eid: sample_evaluation(eval_id=eid, tech=4, comm=5, exp=4))

    payload = {
        "application_id": 1,
        "technical_score": 4,
        "communication_score": 5,
        "experience_score": 4,
    }
    response = client.post("/api/evaluations", json=payload)
    assert response.status_code == 201
    assert response.get_json()["data"]["average_score"] == 4.33


# TC-EVAL-07: Unauthenticated mutation -> 401
def test_unauthenticated_evaluation_returns_401(client):
    assert client.post("/api/evaluations", json={}).status_code == 401
    assert client.put("/api/evaluations/1", json={}).status_code == 401


# TC-EVAL-08: Evaluator updates own evaluation -> 200
def test_evaluator_updates_own_evaluation(client, monkeypatch):
    login_as(client, "MANAGER", user_id=10)
    monkeypatch.setattr(evaluation_routes, "get_evaluation_by_id", lambda eid: sample_evaluation(eval_id=eid, evaluator_id=10, tech=3))
    updates = []
    monkeypatch.setattr(
        evaluation_routes,
        "update_evaluation",
        lambda evaluation_id, technical_score, communication_score, experience_score, comment: updates.append((evaluation_id, technical_score)) or True,
    )

    payload = {
        "technical_score": 5,
        "communication_score": 5,
        "experience_score": 4,
        "comment": "Cập nhật sau phỏng vấn",
    }
    response = client.put("/api/evaluations/1", json=payload)
    assert response.status_code == 200
    assert response.get_json()["success"] is True
    assert updates == [(1, 5)]


# TC-EVAL-09: Another unauthorized user edits evaluation -> 403
def test_unauthorized_user_cannot_edit_other_evaluation(client, monkeypatch):
    login_as(client, "HR", user_id=99)  # Not ADMIN and not the creator (id=10)
    monkeypatch.setattr(evaluation_routes, "get_evaluation_by_id", lambda eid: sample_evaluation(eval_id=eid, evaluator_id=10))

    payload = {
        "technical_score": 5,
        "communication_score": 5,
        "experience_score": 5,
    }
    response = client.put("/api/evaluations/1", json=payload)
    assert response.status_code == 403
    assert response.get_json()["success"] is False


# TC-EVAL-10: Comment saved correctly
def test_comment_saved_correctly(client, monkeypatch):
    login_as(client, "ADMIN", user_id=1)
    monkeypatch.setattr(evaluation_routes, "get_application_by_id", lambda aid: {"id": aid})
    recorded_comment = []
    monkeypatch.setattr(
        evaluation_routes,
        "create_evaluation",
        lambda application_id, evaluator_id, technical_score, communication_score, experience_score, comment: recorded_comment.append(comment) or 5,
    )
    monkeypatch.setattr(evaluation_routes, "get_evaluation_by_id", lambda eid: sample_evaluation(eval_id=eid))

    payload = {
        "application_id": 1,
        "technical_score": 4,
        "communication_score": 4,
        "experience_score": 4,
        "comment": "Nhận xét chi tiết về ứng viên",
    }
    response = client.post("/api/evaluations", json=payload)
    assert response.status_code == 201
    assert recorded_comment == ["Nhận xét chi tiết về ứng viên"]
