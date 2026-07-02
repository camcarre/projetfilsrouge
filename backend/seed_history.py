"""
seed_history.py — Garnit 12 mois d'historique de portefeuille pour le compte démo.

Le endpoint /api/portfolio/history lit la table portfolio_history (un snapshot/jour,
écrit au chargement du portefeuille). Un compte neuf n'a qu'un point → pas de courbe
ni de "Performance 12M" sur le dashboard.

Ce script insère 365 snapshots JOURNALIERS suivant une marche aléatoire géométrique
(rendements log ~ Normal), réaliste (irrégulière, pas un sinus), rescalée pour finir
exactement à la valeur actuelle du portefeuille.

Usage (dans le conteneur backend) : python seed_history.py
"""
import math
import random
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path

DB_PATH = Path(__file__).parent / "data" / "finance.db"
EMAIL = "demo@finance.app"
DAYS = 365
ANNUAL_DRIFT = 0.28          # tendance ~ +28 %/an
ANNUAL_VOL = 0.16            # volatilité annualisée réaliste (~16 %)
SEED = 42                    # reproductible


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

        rng = random.Random(SEED)
        mu = ANNUAL_DRIFT / 252.0
        sigma = ANNUAL_VOL / math.sqrt(252.0)

        # Marche aléatoire géométrique : prix relatif cumulé.
        rel = [1.0]
        for _ in range(DAYS):
            shock = rng.gauss(mu, sigma)
            rel.append(rel[-1] * math.exp(shock))
        # Rescale pour finir exactement à la valeur actuelle.
        scale = current / rel[-1]
        path = [round(v * scale, 2) for v in rel]

        conn.execute("DELETE FROM portfolio_history WHERE user_id = ?", (user_id,))
        now = datetime.utcnow()
        for i, value in enumerate(path):
            day = now - timedelta(days=(len(path) - 1 - i))
            conn.execute(
                "INSERT INTO portfolio_history (user_id, total_value, date) VALUES (?, ?, ?)",
                (user_id, value, day.strftime("%Y-%m-%d %H:%M:%S")),
            )
        conn.commit()
        first = path[0]
        perf = (path[-1] - first) / first * 100
        print(f"✓ {len(path)} snapshots journaliers pour {EMAIL} — {first:,.0f} € → {current:,.0f} € ({perf:+.1f} %)")
    finally:
        conn.close()


if __name__ == "__main__":
    main()
