import pytest
from werkzeug.security import generate_password_hash

import app as app_module
import routes.auth_routes as auth_routes


@pytest.fixture
def client():
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    with app_module.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def users():
    password_hash = generate_password_hash("123456")
    return {
        "admin@example.com": {"id": 1, "full_name": "Admin Demo", "email": "admin@example.com", "password_hash": password_hash, "role": "ADMIN"},
        "hr@example.com": {"id": 2, "full_name": "HR Demo", "email": "hr@example.com", "password_hash": password_hash, "role": "HR"},
    }


def install_lookup(monkeypatch, users):
    monkeypatch.setattr(auth_routes, "get_user_by_email", lambda email: users.get(email))


def login(client, email="admin@example.com", password="123456"):
    return client.post("/api/auth/login", json={"email": email, "password": password})


def test_me_requires_login(client):
    assert client.get("/api/auth/me").status_code == 401


def test_login_success_creates_session_and_returns_public_user(client, monkeypatch, users):
    install_lookup(monkeypatch, users)
    response = login(client)
    assert response.status_code == 200
    user = response.get_json()["user"]
    assert user == {"id": 1, "full_name": "Admin Demo", "email": "admin@example.com", "role": "ADMIN"}
    assert "password" not in user and "password_hash" not in user
    with client.session_transaction() as session:
        assert session["user_id"] == 1 and session["role"] == "ADMIN"


def test_me_restores_authenticated_user(client, monkeypatch, users):
    install_lookup(monkeypatch, users); login(client, "hr@example.com")
    response = client.get("/api/auth/me")
    assert response.status_code == 200 and response.get_json()["user"]["role"] == "HR"


def test_wrong_password_returns_generic_error(client, monkeypatch, users):
    install_lookup(monkeypatch, users)
    response = login(client, password="wrong")
    assert response.status_code == 401 and response.get_json()["message"] == "Email hoặc mật khẩu không đúng."


def test_unknown_email_returns_generic_error(client, monkeypatch, users):
    install_lookup(monkeypatch, users)
    response = login(client, "unknown@example.com")
    assert response.status_code == 401 and response.get_json()["message"] == "Email hoặc mật khẩu không đúng."


@pytest.mark.parametrize(("payload", "message"), [
    ({"email": "", "password": "123456"}, "Vui lòng nhập email."),
    ({"email": "hr@example.com", "password": ""}, "Vui lòng nhập mật khẩu."),
])
def test_login_required_fields(client, payload, message):
    response = client.post("/api/auth/login", json=payload)
    assert response.status_code == 400 and response.get_json()["message"] == message


def test_logout_clears_session(client, monkeypatch, users):
    install_lookup(monkeypatch, users); login(client)
    assert client.post("/api/auth/logout").status_code == 200
    assert client.get("/api/auth/me").status_code == 401


def test_dashboard_requires_login(client):
    assert client.get("/api/dashboard").status_code == 401


def test_health_is_public(client, monkeypatch):
    class Cursor:
        def execute(self, _query): pass
        def fetchone(self): return (1,)
        def close(self): pass
    class Connection:
        def cursor(self): return Cursor()
        def is_connected(self): return True
        def close(self): pass
    monkeypatch.setattr(app_module, "get_connection", lambda: Connection())
    response = client.get("/api/health")
    assert response.status_code == 200 and response.get_json() == {"status": "ok", "database": "connected"}

