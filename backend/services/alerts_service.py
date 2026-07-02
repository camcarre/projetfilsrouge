"""
alerts_service.py — Évaluation des règles d'alerte et insertion des notifications.

Stratégie de déduplication :
- Pas de nouvelle colonne sur `notifications` (schéma existant respecté).
- Avant chaque INSERT, on vérifie s'il existe déjà une notification avec exactement
  le même `message` pour ce user créée dans les dernières 24h (>= now-24h).
- C'est simple, robuste, et n'impose aucune migration.

Garanties :
- N'insère QUE si la règle matche (métrique + direction + threshold).
- Ne lève JAMAIS d'exception vers l'appelant : les erreurs partielles
  (asset manquant, métrique None, symbol inconnu, etc.) sont silencieuses
  grâce à des accès .get() et try/except internes.
"""
import sqlite3
from datetime import datetime, timedelta
from typing import Any, Optional


_DEDUP_WINDOW_HOURS = 24


def _message_exists_recently(
    db: sqlite3.Connection,
    user_id: int,
    message: str,
    now: datetime,
) -> bool:
    """Vrai si une notif identique existe dans les 24h glissantes pour ce user."""
    threshold = (now - timedelta(hours=_DEDUP_WINDOW_HOURS)).isoformat()
    row = db.execute(
        """
        SELECT 1 FROM notifications
        WHERE user_id = ? AND message = ? AND created_at >= ?
        LIMIT 1
        """,
        (user_id, message, threshold),
    ).fetchone()
    return row is not None


def _notify(db: sqlite3.Connection, user_id: int, message: str) -> bool:
    """Insère une notif si pas de doublon sous 24h. Retourne True si inséré."""
    now = datetime.utcnow()
    if _message_exists_recently(db, user_id, message, now):
        return False
    db.execute(
        "INSERT INTO notifications (user_id, message) VALUES (?, ?)",
        (user_id, message),
    )
    db.commit()
    return True


def _matches_threshold(value: Optional[float], direction: str, threshold: float) -> bool:
    """Compare une valeur à un seuil selon la direction. None → pas de match."""
    if value is None:
        return False
    if direction == "below":
        return value < threshold
    if direction == "above":
        return value > threshold
    return False


def _evaluate_asset_rules(
    db: sqlite3.Connection,
    user_id: int,
    enriched_assets: list[dict[str, Any]],
) -> None:
    """Évalue les règles `scope = 'asset'` contre la liste enriched."""
    rules = db.execute(
        """
        SELECT * FROM alert_rules
        WHERE user_id = ? AND enabled = 1 AND scope = 'asset'
        """,
        (user_id,),
    ).fetchall()

    by_symbol = {a.get("symbol"): a for a in enriched_assets if a.get("symbol")}

    for rule in rules:
        asset = by_symbol.get(rule["symbol"])
        if not asset:
            continue

        value: Optional[float] = None
        if rule["metric"] == "day_change":
            change = asset.get("change")
            value = float(change) if isinstance(change, (int, float)) else None
        elif rule["metric"] == "vs_pru":
            unit_price = asset.get("unitPrice")
            original = asset.get("originalPrice")
            if (
                isinstance(unit_price, (int, float))
                and isinstance(original, (int, float))
                and original
            ):
                value = round((unit_price - original) / original * 100, 2)

        if value is None:
            continue
        if not _matches_threshold(value, rule["direction"], rule["threshold"]):
            continue

        message = (
            f"[asset] {rule['symbol']} {rule['metric']} = {value} "
            f"{rule['direction']} {rule['threshold']}"
        )
        try:
            _notify(db, user_id, message)
        except Exception as exc:
            print(f"[alerts] notify asset failed: {exc}")


def _evaluate_portfolio_rules(
    db: sqlite3.Connection,
    user_id: int,
    total_value: float,
    prev_total_value: Optional[float],
) -> None:
    """Évalue les règles `scope = 'portfolio'` (variation jour vs snapshot)."""
    rules = db.execute(
        """
        SELECT * FROM alert_rules
        WHERE user_id = ? AND enabled = 1 AND scope = 'portfolio'
        """,
        (user_id,),
    ).fetchall()

    for rule in rules:
        value: Optional[float] = None
        if rule["metric"] == "day_change":
            if prev_total_value is None or prev_total_value == 0:
                continue
            value = round((total_value - prev_total_value) / prev_total_value * 100, 2)
        else:
            # Portfolio supporte uniquement day_change dans ce plan.
            continue

        if value is None:
            continue
        if not _matches_threshold(value, rule["direction"], rule["threshold"]):
            continue

        message = (
            f"[portfolio] day_change = {value} "
            f"{rule['direction']} {rule['threshold']}"
        )
        try:
            _notify(db, user_id, message)
        except Exception as exc:
            print(f"[alerts] notify portfolio failed: {exc}")


def evaluate(
    db: sqlite3.Connection,
    user_id: int,
    enriched_assets: list[dict[str, Any]],
    total_value: float,
    prev_total_value: Optional[float] = None,
) -> None:
    """
    Évalue toutes les règles actives de l'utilisateur et insère les notifications
    correspondantes (avec déduplication 24h par message).

    Ne lève jamais d'exception vers l'appelant.
    """
    try:
        _evaluate_asset_rules(db, user_id, enriched_assets)
    except Exception as exc:
        print(f"[alerts] asset rules evaluation failed: {exc}")

    try:
        _evaluate_portfolio_rules(db, user_id, total_value, prev_total_value)
    except Exception as exc:
        print(f"[alerts] portfolio rules evaluation failed: {exc}")
