import uuid

from fastapi.testclient import TestClient

from pathlib import Path
import sys

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from main import app  # noqa: E402
from database import get_db  # noqa: E402


def _reset_db():
    db = get_db()
    db.execute("DELETE FROM sessions")
    db.execute("DELETE FROM assets")
    db.execute("DELETE FROM transactions")
    db.execute("DELETE FROM notifications")
    db.execute("DELETE FROM portfolio_history")
    db.execute("DELETE FROM portfolios")
    db.execute("DELETE FROM users")
    db.commit()


def _register(client: TestClient, email: str, password: str) -> str:
    resp = client.post("/auth/register", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token = resp.json()["token"]
    assert isinstance(token, str) and len(token) > 0
    return token


def test_health_ok():
    client = TestClient(app)
    resp = client.get("/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok"}


def test_register_then_login():
    _reset_db()
    client = TestClient(app)

    email = f"test-{uuid.uuid4()}@example.com"
    password = "P@ssw0rd!"

    token_1 = _register(client, email, password)

    resp = client.post("/auth/login", json={"email": email, "password": password})
    assert resp.status_code == 200, resp.text
    token_2 = resp.json()["token"]
    assert token_2 != token_1


def test_assets_empty_list_for_new_user():
    _reset_db()
    client = TestClient(app)

    email = f"test-{uuid.uuid4()}@example.com"
    token = _register(client, email, "P@ssw0rd!")

    resp = client.get("/api/assets", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200, resp.text
    payload = resp.json()
    assert payload["assets"] == []
    assert payload["totalValue"] == 0

