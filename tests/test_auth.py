import pytest
from werkzeug.security import generate_password_hash

import app as app_module


@pytest.fixture
def client(monkeypatch):
    app_module.app.config.update(TESTING=True, SECRET_KEY="test-secret")
    monkeypatch.setattr(
        app_module,
        "get_dashboard_counts",
        lambda: {"jobs": 3, "candidates": 5, "applications": 5, "interviews": 2},
    )
    with app_module.app.test_client() as test_client:
        yield test_client


@pytest.fixture
def users():
    password_hash = generate_password_hash("123456")
    return {
        "admin@example.com": {
            "id": 1,
            "full_name": "Quản trị viên",
            "email": "admin@example.com",
            "password_hash": password_hash,
            "role": "ADMIN",
        },
        "hr@example.com": {
            "id": 2,
            "full_name": "Nhân viên HR",
            "email": "hr@example.com",
            "password_hash": password_hash,
            "role": "HR",
        },
    }


def install_fake_user_lookup(monkeypatch, users):
    monkeypatch.setattr(app_module, "get_user_by_email", lambda email: users.get(email))


def login(client, email="admin@example.com", password="123456"):
    return client.post("/login", data={"email": email, "password": password})


def test_dashboard_requires_login(client):
    response = client.get("/dashboard")
    assert response.status_code == 302
    assert "/login" in response.headers["Location"]


def test_login_success_creates_session(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    response = login(client)
    assert response.status_code == 302
    assert "/dashboard" in response.headers["Location"]
    with client.session_transaction() as session:
        assert session["user_id"] == 1
        assert session["user_name"] == "Quản trị viên"
        assert session["role"] == "ADMIN"
        assert "password" not in session
        assert "password_hash" not in session


def test_login_wrong_password(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    response = login(client, password="wrong-password")
    assert response.status_code == 200
    assert "Email hoặc mật khẩu không đúng" in response.get_data(as_text=True)


def test_login_unknown_email_uses_generic_message(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    response = login(client, email="unknown@example.com")
    assert response.status_code == 200
    assert "Email hoặc mật khẩu không đúng" in response.get_data(as_text=True)


@pytest.mark.parametrize(
    ("data", "message"),
    [
        ({"email": "", "password": "123456"}, "Vui lòng nhập email."),
        ({"email": "admin@example.com", "password": ""}, "Vui lòng nhập mật khẩu."),
    ],
)
def test_login_validates_required_fields(client, data, message):
    response = client.post("/login", data=data)
    assert response.status_code == 200
    assert message in response.get_data(as_text=True)


def test_logout_clears_session(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    login(client)
    response = client.get("/logout")
    assert response.status_code == 302
    assert "/login" in response.headers["Location"]
    with client.session_transaction() as session:
        assert "user_id" not in session
        assert "role" not in session


def test_hr_cannot_access_admin_route(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    login(client, email="hr@example.com")
    response = client.get("/admin-only")
    assert response.status_code == 403
    assert "không có quyền truy cập" in response.get_data(as_text=True)


def test_admin_can_access_admin_route(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    login(client)
    response = client.get("/admin-only")
    assert response.status_code == 200
    assert "Khu vực ADMIN" in response.get_data(as_text=True)


def test_hr_can_access_recruitment_route(client, monkeypatch, users):
    install_fake_user_lookup(monkeypatch, users)
    login(client, email="hr@example.com")
    response = client.get("/recruitment-demo")
    assert response.status_code == 200

