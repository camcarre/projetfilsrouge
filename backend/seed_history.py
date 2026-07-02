"""
seed_history.py — Garnit 12 mois d'historique de portefeuille pour le compte démo.

Le endpoint /api/portfolio/history lit la table portfolio_history (un snapshot/jour,
écrit au chargement du portefeuille). Un compte neuf n'a qu'un point → pas de courbe
ni de "Performance 12M" sur le dashboard. Ce script insère ~53 snapshots hebdomadaires
formant une courbe plausible qui finit à la valeur actuelle du portefeuille.

Usage (dans le conteneur backend) : python seed_history.py
"""
import math
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "finance.db"
EMAIL = "demo@finance.app"
WEEKS = 53
START_RATIO = 0.78  # ~ +28 % sur l'année


def main() -> None:
    conn = sqlite3.connect(str(DB_PATH))
    try:
        row = conn.execute("SELECT id FROM users WHERE email = ?", (EMAIL,)).fetchone()
        if not row:
            print(f"✗ Compte {EMAIL} introuvable — lancer seed.py d'abord.")
            return
        user_id = row[0]

        assets = conn.execute(
            "SELECT quantity, unit_price FROM assets WHERE user_id = ?", (user_id,)
        ).fetchall()
        current = sum(q * p for q, p in assets) or 60000.0

        # Repartir de zéro pour ce user (idempotent).
        conn.execute("DELETE FROM portfolio_history WHERE user_id = ?", (user_id,))

        now = datetime.utcnow()
        start = current * START_RATIO
        count = 0
        for i in range(WEEKS + 1):
            day = now - timedelta(days=(WEEKS - i) * 7)
            frac = i / WEEKS
            trend = start + (current - start) * frac
            noise = math.sin(i * 0.7) * current * 0.015  # oscillation légère, déterministe
            value = round(trend + noise, 2)
            conn.execute(
                "INSERT INTO portfolio_history (user_id, total_value, date) VALUES (?, ?, ?)",
                (user_id, value, day.strftime("%Y-%m-%d %H:%M:%S")),
            )
            count += 1
        # Dernier point = valeur réelle actuelle.
        conn.execute(
            "INSERT INTO portfolio_history (user_id, total_value, date) VALUES (?, ?, ?)",
            (user_id, round(current, 2), now.strftime("%Y-%m-%d %H:%M:%S")),
        )
        conn.commit()
        print(f"✓ {count + 1} snapshots insérés pour {EMAIL} — valeur finale {current:,.0f} €")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
