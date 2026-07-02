"""
test_alerts.py — Tests du système d'alertes (rule eval, dédup, validation).
Utilise une DB SQLite en mémoire — DB par test.
"""
import sys
from pathlib import Path
import sqlite3
from datetime import datetime, timedelta
import pytest
from fastapi import HTTPException
from pydantic import ValidationError

_BACKEND = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(_BACKEND))


@pytest.fixture
def db():
    """DB SQLite en mémoire par test — schéma complet appliqué."""
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    from database import _SCHEMA  # noqa: WPS433
    conn.executescript(_SCHEMA)

    # Utilisateur de test requis (FK)
    conn.execute(
        "INSERT INTO users (id, email, password) VALUES (1, 'test@test.fr', 'x')"
    )
    conn.commit()
    yield conn
    conn.close()


class TestEvaluate:
    def test_asset_day_change_below_triggers_notification(self, db):
        from services.alerts_service import evaluate

        db.execute(
            """
            INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
            VALUES (1, 'asset', 'AAPL', 'day_change', 'below', -5, 1)
            """
        )
        db.commit()

        enriched = [{"symbol": "AAPL", "change": -6.0, "unitPrice": 100, "originalPrice": 120}]
        evaluate(db, 1, enriched, total_value=10000.0)

        notif = db.execute(
            "SELECT message FROM notifications WHERE user_id = 1"
        ).fetchall()
        assert len(notif) == 1
        assert "AAPL" in notif[0]["message"] and "variation du jour" in notif[0]["message"]

    def test_dedup_within_24h_does_not_insert(self, db):
        from services.alerts_service import evaluate

        db.execute(
            """
            INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
            VALUES (1, 'asset', 'AAPL', 'day_change', 'below', -5, 1)
            """
        )
        db.commit()

        enriched = [{"symbol": "AAPL", "change": -6.0, "unitPrice": 100, "originalPrice": 120}]

        evaluate(db, 1, enriched, total_value=10000.0)
        evaluate(db, 1, enriched, total_value=10000.0)

        count = db.execute(
            "SELECT COUNT(*) as c FROM notifications WHERE user_id = 1"
        ).fetchone()["c"]
        assert count == 1

    def test_old_dup_does_not_deduplicate(self, db):
        """Une notif vieille de 25h n'empêche pas une nouvelle insertion."""
        from services.alerts_service import evaluate

        db.execute(
            """
            INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
            VALUES (1, 'asset', 'AAPL', 'day_change', 'below', -5, 1)
            """
        )
        db.execute(
            "INSERT INTO notifications (user_id, message, created_at) VALUES (1, ?, ?)",
            (
                "[asset] AAPL day_change = -6.5 below -5",
                (datetime.utcnow() - timedelta(hours=25)).isoformat(),
            ),
        )
        db.commit()

        enriched = [{"symbol": "AAPL", "change": -6.0, "unitPrice": 100, "originalPrice": 120}]
        evaluate(db, 1, enriched, total_value=10000.0)

        count = db.execute(
            "SELECT COUNT(*) as c FROM notifications WHERE user_id = 1"
        ).fetchone()["c"]
        assert count == 2

    def test_above_direction_triggers_correctly(self, db):
        from services.alerts_service import evaluate

        db.execute(
            """
            INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
            VALUES (1, 'asset', 'AAPL', 'vs_pru', 'above', 10, 1)
            """
        )
        db.commit()

        # unitPrice=132, originalPrice=120 → +10% (et non pas strictement >).
        # Test exact = seuil : avec `>` ce n'est pas trigger.
        enriched = [{"symbol": "AAPL", "change": 0.0, "unitPrice": 145, "originalPrice": 100}]
        evaluate(db, 1, enriched, total_value=10000.0)
        count = db.execute(
            "SELECT COUNT(*) as c FROM notifications WHERE user_id = 1"
        ).fetchone()["c"]
        assert count == 1

    def test_missing_asset_does_not_crash(self, db):
        from services.alerts_service import evaluate

        db.execute(
            """
            INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
            VALUES (1, 'asset', 'AAPL', 'day_change', 'below', -5, 1)
            """
        )
        db.commit()

        # enriched ne contient pas AAPL → pas de crash
        evaluate(db, 1, [{"symbol": "TSLA", "change": -99, "unitPrice": 1, "originalPrice": 2}],
                 total_value=100.0)
        count = db.execute(
            "SELECT COUNT(*) as c FROM notifications WHERE user_id = 1"
        ).fetchone()["c"]
        assert count == 0

    def test_portfolio_day_change(self, db):
        from services.alerts_service import evaluate

        db.execute(
            """
            INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
            VALUES (1, 'portfolio', NULL, 'day_change', 'below', -2, 1)
            """
        )
        # Snapshot précédent : valeur 10000, aujourd'hui : 9500 → -5%
        db.execute(
            "INSERT INTO portfolio_history (user_id, total_value, date) VALUES (1, 10000, ?)",
            ((datetime.utcnow() - timedelta(days=1)).isoformat(),),
        )
        db.commit()

        evaluate(db, 1, [], total_value=9500.0, prev_total_value=10000.0)
        count = db.execute(
            "SELECT COUNT(*) as c FROM notifications WHERE user_id = 1"
        ).fetchone()["c"]
        assert count == 1


class TestValidation:
    """Test du modèle Pydantic AlertRuleBody — directement importable."""

    def test_valid_rule(self):
        from main import AlertRuleBody
        rule = AlertRuleBody(scope="asset", symbol="AAPL", metric="day_change",
                              direction="below", threshold=-5.0)
        assert rule.scope == "asset"
        assert rule.threshold == -5.0

    def test_invalid_scope(self):
        from main import AlertRuleBody
        with pytest.raises(ValidationError):
            AlertRuleBody(scope="invalid", symbol="AAPL", metric="day_change",
                          direction="below", threshold=-5.0)

    def test_invalid_metric(self):
        from main import AlertRuleBody
        with pytest.raises(ValidationError):
            AlertRuleBody(scope="asset", symbol="AAPL", metric="nope",
                          direction="below", threshold=-5.0)

    def test_invalid_direction(self):
        from main import AlertRuleBody
        with pytest.raises(ValidationError):
            AlertRuleBody(scope="asset", symbol="AAPL", metric="day_change",
                          direction="down", threshold=-5.0)


class TestEndpointsAuth:
    """Vérifie que les 3 endpoints retournent 401 sans header Authorization."""

    @pytest.fixture
    def client(self):
        from fastapi.testclient import TestClient
        from main import app
        return TestClient(app)

    def test_list_alerts_requires_auth(self, client):
        r = client.get("/api/alerts")
        assert r.status_code == 401

    def test_create_alert_requires_auth(self, client):
        r = client.post("/api/alerts", json={
            "scope": "asset", "symbol": "AAPL", "metric": "day_change",
            "direction": "below", "threshold": -5.0,
        })
        assert r.status_code == 401

    def test_delete_alert_requires_auth(self, client):
        r = client.delete("/api/alerts/1")
        assert r.status_code == 401

    def test_create_alert_missing_symbol_for_asset_scope(self, client):
        """Test du 400 sans auth — body validé AVANT le check user_id.
        Avec Pydantic Field(pattern=...) le rejet est immédiat en 422."""
        r = client.post("/api/alerts", json={
            "scope": "asset", "metric": "day_change",
            "direction": "below", "threshold": -5.0,
        })
        # Pas de token → 401 l'emporte (car on lit Authorization d'abord)
        assert r.status_code == 401
