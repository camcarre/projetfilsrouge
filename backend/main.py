"""
main.py — FastAPI app (migration de backend/server.js)
Plan 04-01 : Foundation + Auth routes
Plans suivants : assets, ETF, prediction, quiz
"""
import os
import re
import secrets
import logging
import bcrypt
import uvicorn
import numpy as np
import requests as http_requests
import yfinance as yf
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, Header, HTTPException, Query, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from dotenv import load_dotenv

# Charger .env depuis la racine du projet (un niveau au-dessus de backend/)
_BACKEND_DIR = Path(__file__).parent
_PROJECT_ROOT = _BACKEND_DIR.parent
load_dotenv(_PROJECT_ROOT / ".env")
load_dotenv(_PROJECT_ROOT / ".env.local")
load_dotenv(_BACKEND_DIR / ".env")
load_dotenv(_BACKEND_DIR / ".env.local")

from database import get_db  # noqa: E402 — après load_dotenv
from services.yahoo_etf_service import (  # noqa: E402
    get_etfs,
    get_etf_details,
    get_etf_performance,
    get_etf_holdings,
    validate_ticker,
)
from services.analytics_service import get_indicators, get_risk_metrics, get_correlation_matrix, backtest_forecast  # noqa: E402
from services.alerts_service import evaluate  # noqa: E402
from services.montecarlo_service import simulate_portfolio  # noqa: E402

logger = logging.getLogger(__name__)

app = FastAPI(title="Finance PWA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", status_code=200)
async def health():
    return {"status": "ok"}


# ── Middleware log ────────────────────────────────────────────────────────────
@app.middleware("http")
async def log_requests(request: Request, call_next):
    ts = datetime.utcnow().isoformat(timespec="seconds")
    print(f"[{ts}] {request.method} {request.url.path}")
    return await call_next(request)


# ── Helpers ───────────────────────────────────────────────────────────────────
def random_token() -> str:
    return secrets.token_hex(32)


def get_user_id(authorization: Optional[str] = Header(default=None)) -> Optional[int]:
    """Extrait le user_id depuis le Bearer token — None si invalide."""
    if not authorization or not authorization.startswith("Bearer "):
        return None
    token = authorization[7:]
    db = get_db()
    row = db.execute(
        "SELECT user_id FROM sessions WHERE token = ?", (token,)
    ).fetchone()
    return row["user_id"] if row else None


# ── Pydantic models ───────────────────────────────────────────────────────────
class AuthBody(BaseModel):
    email: str
    password: str


class AssetBody(BaseModel):
    portfolioId: Optional[str] = "default"
    name: str
    symbol: str
    category: str
    quantity: float
    unitPrice: float
    currency: str


class AssetUpdateBody(BaseModel):
    name: Optional[str] = None
    symbol: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[float] = None
    unitPrice: Optional[float] = None
    currency: Optional[str] = None


class TransactionBody(BaseModel):
    symbol: str
    type: str  # "BUY" | "SELL"
    quantity: float
    price: float
    portfolioId: Optional[str] = None
    date: Optional[str] = None


class CompareBody(BaseModel):
    tickers: List[str]


class InvestorProfileBody(BaseModel):
    risk_tolerance: int
    investment_horizon: str
    investment_goal: str
    monthly_investment: float = 0
    esg_preference: bool = False
    knowledge_level: str = "beginner"


class AlertRuleBody(BaseModel):
    scope: str = Field(pattern="^(asset|portfolio)$")
    symbol: Optional[str] = None
    metric: str = Field(pattern="^(day_change|vs_pru)$")
    direction: str = Field(pattern="^(below|above)$")
    threshold: float


# ── Auth routes ───────────────────────────────────────────────────────────────

@app.post("/auth/register", status_code=200)
async def register(body: AuthBody):
    db = get_db()

    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="email et password requis")

    existing = db.execute(
        "SELECT id FROM users WHERE email = ?", (body.email,)
    ).fetchone()
    if existing:
        raise HTTPException(status_code=400, detail="Cet email est déjà utilisé")

    hashed = bcrypt.hashpw(body.password.encode(), bcrypt.gensalt(rounds=10)).decode()

    cur = db.execute(
        "INSERT INTO users (email, password) VALUES (?, ?)",
        (body.email, hashed),
    )
    db.commit()
    user_id = cur.lastrowid

    token = random_token()
    db.execute(
        "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
        (token, user_id),
    )
    db.commit()

    return {"user": {"id": user_id, "email": body.email}, "token": token}


@app.post("/auth/login", status_code=200)
async def login(body: AuthBody):
    db = get_db()

    if not body.email or not body.password:
        raise HTTPException(status_code=400, detail="email et password requis")

    user = db.execute(
        "SELECT * FROM users WHERE email = ?", (body.email,)
    ).fetchone()

    if not user or not bcrypt.checkpw(body.password.encode(), user["password"].encode()):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")

    token = random_token()
    db.execute(
        "INSERT INTO sessions (token, user_id) VALUES (?, ?)",
        (token, user["id"]),
    )
    db.commit()

    return {"user": {"id": user["id"], "email": user["email"]}, "token": token}


@app.get("/auth/me", status_code=200)
async def me(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    user = db.execute(
        "SELECT id, email, display_name, knowledge_level FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    if not user:
        raise HTTPException(status_code=401, detail="Session invalide")

    return {
        "user": {
            "id": user["id"],
            "email": user["email"],
            "displayName": user["display_name"],
            "knowledgeLevel": user["knowledge_level"],
        }
    }


@app.post("/auth/logout", status_code=204)
async def logout(authorization: Optional[str] = Header(default=None)):
    if authorization and authorization.startswith("Bearer "):
        token = authorization[7:]
        db = get_db()
        db.execute("DELETE FROM sessions WHERE token = ?", (token,))
        db.commit()
    return Response(status_code=204)


# ── Assets ────────────────────────────────────────────────────────────────────

@app.get("/api/assets", status_code=200)
async def get_assets(
    portfolioId: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    query = "SELECT * FROM assets WHERE user_id = ?"
    params: list = [user_id]
    if portfolioId:
        query += " AND portfolio_id = ?"
        params.append(portfolioId)
    assets = db.execute(query, params).fetchall()

    def _fetch_price(a):
        try:
            fi = yf.Ticker(a["symbol"]).fast_info
            live_price = fi.last_price if hasattr(fi, "last_price") and fi.last_price else a["unit_price"]
            prev = fi.previous_close if hasattr(fi, "previous_close") and fi.previous_close else None
            change = round((live_price - prev) / prev * 100, 2) if prev else 0.0
        except Exception:
            live_price = a["unit_price"]
            change = 0.0
        return {
            "id": a["id"],
            "name": a["name"],
            "symbol": a["symbol"],
            "category": a["category"],
            "quantity": a["quantity"],
            "unitPrice": live_price,
            "originalPrice": a["unit_price"],
            "currency": a["currency"],
            "change": change,
        }

    enriched = [None] * len(assets)
    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(_fetch_price, a): i for i, a in enumerate(assets)}
        for future in as_completed(futures):
            enriched[futures[future]] = future.result()

    total_value = sum(e["quantity"] * e["unitPrice"] for e in enriched)

    # Snapshot quotidien
    try:
        today = datetime.utcnow().date().isoformat()
        existing = db.execute(
            "SELECT id FROM portfolio_history WHERE user_id = ? AND date >= ?",
            (user_id, today),
        ).fetchone()
        if not existing and total_value > 0:
            db.execute(
                "INSERT INTO portfolio_history (user_id, total_value) VALUES (?, ?)",
                (user_id, total_value),
            )
            db.commit()
    except Exception as e:
        print(f"[history] Erreur snapshot: {e}")

    # Évaluation silencieuse des règles d'alerte (effet de bord — ne casse jamais la réponse).
    try:
        today_iso = datetime.utcnow().date().isoformat()
        prev_row = db.execute(
            """
            SELECT total_value FROM portfolio_history
            WHERE user_id = ? AND date < ?
            ORDER BY date DESC LIMIT 1
            """,
            (user_id, today_iso),
        ).fetchone()
        prev_total_value = float(prev_row["total_value"]) if prev_row else None
        evaluate(db, user_id, enriched, total_value, prev_total_value)
    except Exception as e:
        print(f"[alerts] evaluation failed: {e}")

    return {"assets": enriched, "totalValue": total_value}


@app.post("/api/assets", status_code=201)
async def create_asset(
    body: AssetBody,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    cur = db.execute(
        """
        INSERT INTO assets (user_id, portfolio_id, name, symbol, category, quantity, unit_price, currency)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            body.portfolioId or "default",
            body.name,
            body.symbol,
            body.category,
            body.quantity,
            body.unitPrice,
            body.currency,
        ),
    )
    db.commit()
    return {
        "asset": {
            "id": cur.lastrowid,
            "name": body.name,
            "symbol": body.symbol,
            "category": body.category,
            "quantity": body.quantity,
            "unitPrice": body.unitPrice,
            "currency": body.currency,
        }
    }


@app.put("/api/assets/{asset_id}", status_code=200)
async def update_asset(
    asset_id: int,
    body: AssetUpdateBody,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    asset = db.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    if not asset:
        raise HTTPException(status_code=404, detail="Actif introuvable")
    if asset["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    updates = []
    params = []
    if body.name is not None:
        updates.append("name = ?"); params.append(body.name)
    if body.symbol is not None:
        updates.append("symbol = ?"); params.append(body.symbol)
    if body.category is not None:
        updates.append("category = ?"); params.append(body.category)
    if body.quantity is not None:
        updates.append("quantity = ?"); params.append(body.quantity)
    if body.unitPrice is not None:
        updates.append("unit_price = ?"); params.append(body.unitPrice)
    if body.currency is not None:
        updates.append("currency = ?"); params.append(body.currency)

    if updates:
        params.append(asset_id)
        db.execute(
            f"UPDATE assets SET {', '.join(updates)}, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
            params,
        )
        db.commit()

    updated = db.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    return {
        "asset": {
            "id": updated["id"],
            "name": updated["name"],
            "symbol": updated["symbol"],
            "category": updated["category"],
            "quantity": updated["quantity"],
            "unitPrice": updated["unit_price"],
            "currency": updated["currency"],
        }
    }


@app.delete("/api/assets/{asset_id}", status_code=204)
async def delete_asset(
    asset_id: int,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    asset = db.execute("SELECT * FROM assets WHERE id = ?", (asset_id,)).fetchone()
    if not asset:
        raise HTTPException(status_code=404, detail="Actif introuvable")
    if asset["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    db.execute("DELETE FROM assets WHERE id = ?", (asset_id,))
    db.commit()
    return Response(status_code=204)


@app.get("/api/portfolio/history", status_code=200)
async def portfolio_history(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rows = db.execute(
        "SELECT total_value as totalValue, date FROM portfolio_history WHERE user_id = ? ORDER BY date ASC",
        (user_id,),
    ).fetchall()
    return {"history": [dict(r) for r in rows]}


@app.get("/api/portfolio/montecarlo", status_code=200)
async def portfolio_montecarlo(
    days: int = Query(30, ge=1, le=365),
    simulations: int = Query(1000, ge=100, le=5000),
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rows = db.execute(
        "SELECT symbol, quantity, unit_price FROM assets WHERE user_id = ?",
        (user_id,),
    ).fetchall()
    if not rows:
        raise HTTPException(status_code=400, detail="Portefeuille vide")

    holdings = [
        {"symbol": r["symbol"], "quantity": r["quantity"], "unit_price": r["unit_price"]}
        for r in rows
    ]
    try:
        return simulate_portfolio(holdings, days, simulations)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ── Alert rules ───────────────────────────────────────────────────────────────

@app.get("/api/alerts", status_code=200)
async def list_alerts(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rows = db.execute(
        """
        SELECT id, scope, symbol, metric, direction, threshold, enabled
        FROM alert_rules WHERE user_id = ?
        ORDER BY id DESC
        """,
        (user_id,),
    ).fetchall()
    return {"rules": [dict(r) for r in rows]}


@app.post("/api/alerts", status_code=201)
async def create_alert(
    body: AlertRuleBody,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    if body.scope == "asset" and not body.symbol:
        raise HTTPException(status_code=400, detail="symbol requis pour scope=asset")

    db = get_db()
    cur = db.execute(
        """
        INSERT INTO alert_rules (user_id, scope, symbol, metric, direction, threshold, enabled)
        VALUES (?, ?, ?, ?, ?, ?, 1)
        """,
        (user_id, body.scope, body.symbol, body.metric, body.direction, body.threshold),
    )
    db.commit()
    return {
        "rule": {
            "id": cur.lastrowid,
            "scope": body.scope,
            "symbol": body.symbol,
            "metric": body.metric,
            "direction": body.direction,
            "threshold": body.threshold,
            "enabled": True,
        }
    }


@app.delete("/api/alerts/{rule_id}", status_code=204)
async def delete_alert(
    rule_id: int,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rule = db.execute("SELECT * FROM alert_rules WHERE id = ?", (rule_id,)).fetchone()
    if not rule:
        raise HTTPException(status_code=404, detail="Règle introuvable")
    if rule["user_id"] != user_id:
        raise HTTPException(status_code=403, detail="Accès refusé")

    db.execute("DELETE FROM alert_rules WHERE id = ?", (rule_id,))
    db.commit()
    return Response(status_code=204)


# ── Transactions ──────────────────────────────────────────────────────────────

@app.get("/api/transactions", status_code=200)
async def get_transactions(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rows = db.execute(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
        (user_id,),
    ).fetchall()
    return {"transactions": [dict(r) for r in rows]}




@app.post("/api/transactions", status_code=201)
async def create_transaction(
    body: TransactionBody,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    transaction_id = None
    try:
        # portfolio_id : NULL si pas de portfolio réel (FK vers portfolios(id))
        portfolio_id = int(body.portfolioId) if body.portfolioId and body.portfolioId.isdigit() else None

        # 1. Enregistrer la transaction
        cur = db.execute(
            """
            INSERT INTO transactions (user_id, portfolio_id, symbol, type, quantity, price, date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                portfolio_id,
                body.symbol,
                body.type,
                body.quantity,
                body.price,
                body.date or datetime.utcnow().isoformat(),
            ),
        )
        transaction_id = cur.lastrowid

        # 2. Mettre à jour l'actif
        existing = db.execute(
            "SELECT id, quantity, unit_price FROM assets WHERE user_id = ? AND symbol = ?",
            (user_id, body.symbol),
        ).fetchone()

        if existing:
            if body.type == "BUY":
                total_cost = (existing["quantity"] * existing["unit_price"]) + (body.quantity * body.price)
                new_qty = existing["quantity"] + body.quantity
                new_pru = total_cost / new_qty
                db.execute(
                    "UPDATE assets SET quantity = ?, unit_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                    (new_qty, new_pru, existing["id"]),
                )
            elif body.type == "SELL":
                new_qty = existing["quantity"] - body.quantity
                if new_qty < 0:
                    db.rollback()
                    raise HTTPException(status_code=400, detail="Quantité insuffisante")
                if new_qty == 0:
                    db.execute("DELETE FROM assets WHERE id = ?", (existing["id"],))
                else:
                    db.execute(
                        "UPDATE assets SET quantity = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
                        (new_qty, existing["id"]),
                    )
        elif body.type == "BUY":
            db.execute(
                """
                INSERT INTO assets (user_id, portfolio_id, name, symbol, category, quantity, unit_price)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    user_id,
                    portfolio_id,
                    body.symbol,
                    body.symbol,
                    "action",
                    body.quantity,
                    body.price,
                ),
            )

        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

    return {"id": transaction_id, "message": "Transaction enregistrée"}


# ── Notifications ─────────────────────────────────────────────────────────────

@app.post("/api/notifications/read", status_code=204)
async def notifications_read(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    db.execute("UPDATE notifications SET read = 1 WHERE user_id = ?", (user_id,))
    db.commit()
    return Response(status_code=204)


@app.get("/api/notifications", status_code=200)
async def get_notifications(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rows = db.execute(
        "SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20",
        (user_id,),
    ).fetchall()
    return {"notifications": [dict(r) for r in rows]}


# ── ETF ───────────────────────────────────────────────────────────────────────

@app.post("/api/etfs/compare", status_code=200)
async def etfs_compare(body: CompareBody):
    if not body.tickers or len(body.tickers) < 2:
        raise HTTPException(status_code=400, detail="Au moins 2 tickers requis")
    for t in body.tickers:
        if not validate_ticker(t):
            raise HTTPException(status_code=400, detail=f"Ticker invalide: {t}")

    comparisons = []
    all_etfs = get_etfs({})
    for ticker in body.tickers:
        try:
            etf = next((e for e in all_etfs if e["ticker"] == ticker), None)
            if not etf:
                continue
            perf = get_etf_performance(ticker)
            details = get_etf_details(ticker)
            comparisons.append({
                **etf,
                "performance": perf["performance"] if perf else 0,
                "volatility": perf["volatility"] if perf else 0,
                "esgScore": details.get("esgScore") or 0,
            })
        except Exception as e:
            print(f"[compare] Erreur pour {ticker}: {e}")
    return {"comparisons": comparisons}


@app.get("/api/etfs", status_code=200)
async def get_etfs_route(
    zone: Optional[str] = None,
    sector: Optional[str] = None,
    esg: Optional[str] = None,
    terMax: Optional[str] = None,
):
    filters = {k: v for k, v in {"zone": zone, "sector": sector, "esg": esg, "terMax": terMax}.items() if v}
    try:
        etfs = get_etfs(filters)
        return {"etfs": etfs}
    except Exception as e:
        print(f"[etfs] Erreur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement des ETF")


@app.get("/api/etfs/{ticker}/performance", status_code=200)
async def etf_performance(ticker: str, period: Optional[str] = "1y"):
    if not validate_ticker(ticker):
        raise HTTPException(status_code=400, detail="Ticker invalide")
    try:
        performance = get_etf_performance(ticker, period)
        return {"performance": performance}
    except Exception as e:
        print(f"[etfs:performance] Erreur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement de la performance")


@app.get("/api/etfs/{ticker}/holdings", status_code=200)
async def etf_holdings(ticker: str):
    if not validate_ticker(ticker):
        raise HTTPException(status_code=400, detail="Ticker invalide")
    try:
        holdings = get_etf_holdings(ticker)
        return {"holdings": holdings}
    except Exception as e:
        print(f"[etfs:holdings] Erreur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement des holdings")


@app.get("/api/etfs/{ticker}/history", status_code=200)
async def etf_history(ticker: str, period: Optional[str] = "3mo"):
    if not validate_ticker(ticker):
        raise HTTPException(status_code=400, detail="Ticker invalide")
    try:
        details = get_etf_details(ticker)
        if not details.get("historical"):
            raise HTTPException(status_code=404, detail="Données historiques non disponibles")
        chart_data = [
            {
                "date": item["date"][:10] if len(item["date"]) > 10 else item["date"],
                "value": round(item["close"], 2),
                "volume": item["volume"],
                "open": round(item["open"], 2),
                "high": round(item["high"], 2),
                "low": round(item["low"], 2),
            }
            for item in details["historical"]
            if item.get("close")
        ]
        chart_data.sort(key=lambda x: x["date"])
        return {"ticker": ticker, "data": chart_data, "period": period, "count": len(chart_data)}
    except HTTPException:
        raise
    except Exception as e:
        print(f"[etfs:history] Erreur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement des données historiques")


@app.get("/api/etfs/recommended", status_code=200)
async def get_recommended_etfs(
    zone: Optional[str] = None,
    sector: Optional[str] = None,
    esg: Optional[str] = None,
    terMax: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")
    db = get_db()
    profile_row = db.execute(
        "SELECT * FROM investor_profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    if not profile_row:
        raise HTTPException(status_code=404, detail={"error": "profile_required"})
    profile = dict(profile_row)

    filters = {}
    if zone:
        filters["zone"] = zone
    if sector:
        filters["sector"] = sector
    if esg:
        filters["esg"] = esg
    if terMax:
        filters["terMax"] = terMax

    etf_list = get_etfs(filters)

    scored = []
    for etf in etf_list:
        etf_dict = {**etf}
        etf_dict["match_score"] = _compute_match_score(etf_dict, profile)
        etf_dict["match_breakdown"] = _compute_match_breakdown(etf_dict, profile)
        scored.append(etf_dict)

    scored.sort(key=lambda e: e["match_score"], reverse=True)

    return {
        "etfs": scored,
        "profile_used": {
            "risk_tolerance": profile["risk_tolerance"],
            "investment_horizon": profile["investment_horizon"],
            "investment_goal": profile["investment_goal"],
            "esg_preference": bool(profile["esg_preference"]),
        },
    }


@app.get("/api/etfs/{ticker}", status_code=200)
async def etf_details(ticker: str):
    if not validate_ticker(ticker):
        raise HTTPException(status_code=400, detail="Ticker invalide")
    try:
        details = get_etf_details(ticker)
        q = details.get("quote") or {}
        simplified = {
            **details,
            "price": q.get("regularMarketPrice") or 0,
            "name": q.get("longName") or q.get("shortName") or ticker,
            "ticker": ticker,
        }
        return {"details": simplified}
    except Exception as e:
        print(f"[etfs:details] Erreur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors du chargement des détails ETF")


# ── Analytics ────────────────────────────────────────────────────────────────

@app.get("/api/analyze/indicators/{ticker}", status_code=200)
async def analyze_indicators(ticker: str, period: Optional[str] = "3mo"):
    if not validate_ticker(ticker):
        raise HTTPException(status_code=400, detail="Ticker invalide")
    try:
        result = get_indicators(ticker, period or "3mo")
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[analyze:indicators] Erreur {ticker}: {e}")
        raise HTTPException(status_code=503, detail="Données indisponibles pour ce ticker")


@app.get("/api/analyze/risk/{ticker}", status_code=200)
async def analyze_risk(ticker: str, period: Optional[str] = "1y"):
    if not validate_ticker(ticker):
        raise HTTPException(status_code=400, detail="Ticker invalide")
    try:
        result = get_risk_metrics(ticker, period or "1y")
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[analyze:risk] Erreur {ticker}: {e}")
        raise HTTPException(status_code=503, detail="Données indisponibles pour ce ticker")


@app.get("/api/analyze/correlation", status_code=200)
async def analyze_correlation(
    period: Optional[str] = "1y",
    authorization: Optional[str] = Header(default=None),
):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    db = get_db()
    rows = db.execute(
        "SELECT DISTINCT symbol FROM assets WHERE user_id = ?", (user_id,)
    ).fetchall()
    tickers = [r["symbol"] for r in rows]

    if len(tickers) < 2:
        raise HTTPException(status_code=400, detail="Au moins 2 actifs distincts requis pour calculer une corrélation")

    try:
        result = get_correlation_matrix(tickers, period or "1y")
        return result
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        print(f"[analyze:correlation] Erreur: {e}")
        raise HTTPException(status_code=503, detail="Données indisponibles pour calculer la corrélation")


# ── Prediction ────────────────────────────────────────────────────────────────

@app.get("/api/predict/stock", status_code=200)
async def predict_stock(
    symbol: Optional[str] = None,
    authorization: Optional[str] = Header(default=None),
):
    if not symbol:
        raise HTTPException(status_code=400, detail="Symbole requis")

    try:
        hist_df = yf.Ticker(symbol).history(period="3mo")
        if hist_df is None or hist_df.empty:
            raise HTTPException(status_code=404, detail="Pas assez de données historiques pour ce symbole")

        prices = hist_df["Close"].dropna().tolist()
        if len(prices) < 30:
            raise HTTPException(status_code=404, detail="Pas assez de données historiques pour ce symbole")

        prices = prices[-60:]  # 60 derniers points max
        current_price = prices[-1]
        forecast = []
        model_used = "linear-regression"

        hf_token = os.environ.get("HF_API_TOKEN")
        if hf_token:
            try:
                last_prices = ", ".join(str(round(p)) for p in prices[-15:])
                prompt = (
                    f"The stock prices for the last 15 days are: {last_prices}. "
                    "Predict the next 15 prices as a simple comma-separated list of numbers only "
                    "(e.g. 170, 172, 175, 178, 180...)."
                )
                resp = http_requests.post(
                    "https://router.huggingface.co/v1/chat/completions",
                    headers={"Content-Type": "application/json", "Authorization": f"Bearer {hf_token}"},
                    json={
                        "model": "Qwen/Qwen2.5-72B-Instruct",
                        "messages": [
                            {"role": "system", "content": "You are a financial forecasting assistant. Always respond only with a list of 15 comma-separated numbers."},
                            {"role": "user", "content": prompt},
                        ],
                        "max_tokens": 100,
                    },
                    timeout=30,
                )
                if not resp.ok:
                    raise ValueError(f"HF Router Error {resp.status_code}")
                generated = resp.json()["choices"][0]["message"]["content"]
                raw = re.findall(r"-?\d[\d,]*(?:\.\d+)?", generated)
                numbers = [float(tok.replace(",", "")) for tok in raw]
                plausible = [n for n in numbers if 0.2 * current_price <= n <= 5 * current_price]
                if len(plausible) >= 5:
                    forecast = [round(n, 2) for n in plausible[:15]]
                    model_used = "Qwen/Qwen2.5-72B-Instruct"
                else:
                    raise ValueError("Prédiction IA hors plage plausible")
            except Exception as hf_err:
                print(f"[predict] Fallback régression: {hf_err}")

        if not forecast:
            # Essai statsmodels ETS (lissage exponentiel)
            try:
                from statsmodels.tsa.holtwinters import ExponentialSmoothing  # noqa: PLC0415
                ets_model = ExponentialSmoothing(
                    np.array(prices, dtype=float), trend='add', initialization_method="estimated"
                ).fit(optimized=True)
                forecast = [round(float(v), 2) for v in ets_model.forecast(30)]
                model_used = "ETS"
            except Exception as ets_err:
                print(f"[predict] Fallback numpy (ETS échoué: {ets_err})")
                # Régression linéaire numpy
                x = np.arange(len(prices))
                y = np.array(prices)
                slope, intercept = np.polyfit(x, y, 1)
                residuals = y - (slope * x + intercept)
                std_dev = float(np.std(residuals))
                n = len(prices)
                forecast = [
                    round(float(slope * (n + i) + intercept) + np.random.uniform(-1, 1) * std_dev * 0.75, 2)
                    for i in range(30)
                ]

        confidence = 0.6 if model_used == "Qwen/Qwen2.5-72B-Instruct" else (0.70 if model_used == "ETS" else 0.55)

        # Backtest (seulement sur modèle déterministe, pas LLM)
        backtest = None
        if model_used != "Qwen/Qwen2.5-72B-Instruct":
            try:
                backtest = backtest_forecast([float(p) for p in prices])
            except ValueError as e:
                logger.warning("[predict:backtest] Données insuffisantes: %s", e)
            except Exception as e:
                logger.error("[predict:backtest] Erreur calcul: %s", e)

        return {
            "symbol": symbol,
            "prediction": {
                "current_price": round(current_price, 2),
                "predicted_price": forecast[-1],
                "forecast": forecast,
                "history": [round(p, 2) for p in prices],
                "confidence": confidence,
                "model": model_used,
                "backtest": backtest,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("predict failed: %s", e)
        raise HTTPException(status_code=500, detail="Erreur lors de la prédiction")


# ── Profil investisseur ───────────────────────────────────────────────────────

VALID_HORIZONS = {"short", "medium", "long"}
VALID_GOALS = {"growth", "income", "preservation"}
VALID_LEVELS = {"beginner", "intermediate", "advanced"}


@app.get("/api/profile", status_code=200)
async def get_profile(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")
    db = get_db()
    row = db.execute(
        "SELECT * FROM investor_profiles WHERE user_id = ?", (user_id,)
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail={"error": "profile_not_found"})
    return dict(row)


@app.post("/api/profile", status_code=200)
async def save_profile(body: InvestorProfileBody, authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")
    if body.risk_tolerance not in range(1, 6):
        raise HTTPException(status_code=400, detail="risk_tolerance doit être entre 1 et 5")
    if body.investment_horizon not in VALID_HORIZONS:
        raise HTTPException(status_code=400, detail=f"investment_horizon invalide: {VALID_HORIZONS}")
    if body.investment_goal not in VALID_GOALS:
        raise HTTPException(status_code=400, detail=f"investment_goal invalide: {VALID_GOALS}")
    if body.knowledge_level not in VALID_LEVELS:
        raise HTTPException(status_code=400, detail=f"knowledge_level invalide: {VALID_LEVELS}")
    db = get_db()
    db.execute(
        """
        INSERT INTO investor_profiles
            (user_id, risk_tolerance, investment_horizon, investment_goal, monthly_investment, esg_preference, knowledge_level, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
            risk_tolerance = excluded.risk_tolerance,
            investment_horizon = excluded.investment_horizon,
            investment_goal = excluded.investment_goal,
            monthly_investment = excluded.monthly_investment,
            esg_preference = excluded.esg_preference,
            knowledge_level = excluded.knowledge_level,
            updated_at = CURRENT_TIMESTAMP
        """,
        (user_id, body.risk_tolerance, body.investment_horizon, body.investment_goal,
         body.monthly_investment, int(body.esg_preference), body.knowledge_level),
    )
    db.commit()
    return {
        "user_id": user_id,
        "risk_tolerance": body.risk_tolerance,
        "investment_horizon": body.investment_horizon,
        "investment_goal": body.investment_goal,
        "monthly_investment": body.monthly_investment,
        "esg_preference": int(body.esg_preference),
        "knowledge_level": body.knowledge_level,
    }


_ESG_SCORES = {"AAA": 20, "AA": 16, "A": 12, "B": 6}


def _compute_match_score(etf: dict, profile: dict) -> float:
    score = 0.0

    # Score risque (30 pts) — risque 1-5 : 1=très prudent, 5=très dynamique
    # ETF avec perf1y élevée et positive = plus risqué → convient aux profils dynamiques
    risk = profile["risk_tolerance"]
    perf = etf.get("perf1y", 0) or 0
    if risk >= 4:
        score += 30 if perf >= 10 else (20 if perf >= 0 else 10)
    elif risk == 3:
        score += 30 if 0 <= perf <= 15 else 15
    else:
        score += 30 if perf < 10 else (15 if perf >= 0 else 25)

    # Score horizon (25 pts)
    horizon = profile["investment_horizon"]
    ter = etf.get("ter", 0.5) or 0.5
    if horizon == "long":
        score += 25 if perf >= 8 else (15 if perf >= 0 else 5)
    elif horizon == "medium":
        score += 25 if 4 <= perf <= 15 else 12
    else:
        score += 25 if ter <= 0.2 else (15 if ter <= 0.3 else 5)

    # Score ESG (20 pts)
    esg_pref = bool(profile.get("esg_preference", 0))
    etf_esg = etf.get("esg", "B") or "B"
    if esg_pref:
        score += _ESG_SCORES.get(etf_esg, 6)
    else:
        score += 20

    # Score TER (15 pts)
    if ter <= 0.15:
        score += 15
    elif ter <= 0.25:
        score += 10
    elif ter <= 0.35:
        score += 5

    # Score objectif (10 pts)
    goal = profile["investment_goal"]
    if goal == "growth":
        score += 10 if perf >= 10 else (5 if perf >= 0 else 0)
    elif goal == "income":
        score += _ESG_SCORES.get(etf_esg, 6) // 2
    else:
        score += 10 if ter <= 0.2 else (5 if ter <= 0.3 else 0)

    return round(min(score, 100.0), 1)


def _compute_match_breakdown(etf: dict, profile: dict) -> dict:
    """Détail par composante du score de correspondance (somme == match_score)."""
    risk_score = 0.0
    horizon_score = 0.0
    esg_score = 0.0
    ter_score = 0.0
    goal_score = 0.0

    risk = profile["risk_tolerance"]
    perf = etf.get("perf1y", 0) or 0
    if risk >= 4:
        risk_score = 30 if perf >= 10 else (20 if perf >= 0 else 10)
    elif risk == 3:
        risk_score = 30 if 0 <= perf <= 15 else 15
    else:
        risk_score = 30 if perf < 10 else (15 if perf >= 0 else 25)

    horizon = profile["investment_horizon"]
    ter = etf.get("ter", 0.5) or 0.5
    if horizon == "long":
        horizon_score = 25 if perf >= 8 else (15 if perf >= 0 else 5)
    elif horizon == "medium":
        horizon_score = 25 if 4 <= perf <= 15 else 12
    else:
        horizon_score = 25 if ter <= 0.2 else (15 if ter <= 0.3 else 5)

    esg_pref = bool(profile.get("esg_preference", 0))
    etf_esg = etf.get("esg", "B") or "B"
    if esg_pref:
        esg_score = _ESG_SCORES.get(etf_esg, 6)
    else:
        esg_score = 20

    if ter <= 0.15:
        ter_score = 15
    elif ter <= 0.25:
        ter_score = 10
    elif ter <= 0.35:
        ter_score = 5

    goal = profile["investment_goal"]
    if goal == "growth":
        goal_score = 10 if perf >= 10 else (5 if perf >= 0 else 0)
    elif goal == "income":
        goal_score = _ESG_SCORES.get(etf_esg, 6) // 2
    else:
        goal_score = 10 if ter <= 0.2 else (5 if ter <= 0.3 else 0)

    return {
        "risk": risk_score,
        "horizon": horizon_score,
        "esg": esg_score,
        "ter": ter_score,
        "goal": goal_score,
    }


# ── Quiz ──────────────────────────────────────────────────────────────────────

@app.get("/api/quiz/generate", status_code=200)
async def quiz_generate(authorization: Optional[str] = Header(default=None)):
    user_id = get_user_id(authorization)
    if not user_id:
        raise HTTPException(status_code=401, detail="Non authentifié")

    fallback = [
        {"q": "Que signifie TER ?", "options": ["Total Expense Ratio", "Taux d'épargne réel", "Titre émis"], "correct": 0},
        {"q": "Qu'est-ce que le DCA ?", "options": ["Un ETF", "Investir régulièrement", "Un indice"], "correct": 1},
    ]

    hf_token = os.environ.get("HF_API_TOKEN")
    if not hf_token:
        return {"questions": fallback, "isFallback": True}

    try:
        prompt = (
            "Génère 5 questions de quiz sur la finance (investissement, bourse, crypto, fiscalité française). "
            "Pour chaque question, donne 3 options et l'index de la bonne réponse (0, 1 ou 2). "
            "Réponds uniquement au format JSON strict, sans texte avant ou après, comme ceci :\n"
            '[{"q": "Ma question ?", "options": ["Rép A", "Rép B", "Rép C"], "correct": 0}, ...]'
        )
        resp = http_requests.post(
            "https://router.huggingface.co/v1/chat/completions",
            headers={"Content-Type": "application/json", "Authorization": f"Bearer {hf_token}"},
            json={
                "model": "Qwen/Qwen2.5-72B-Instruct",
                "messages": [
                    {"role": "system", "content": "Tu es un expert en éducation financière. Tu réponds uniquement en JSON valide."},
                    {"role": "user", "content": prompt},
                ],
                "max_tokens": 1000,
                "temperature": 0.7,
            },
            timeout=30,
        )
        if not resp.ok:
            raise ValueError(f"Erreur HF {resp.status_code}")
        content = resp.json()["choices"][0]["message"]["content"] or "[]"
        json_str = re.sub(r"```json|```", "", content).strip()
        questions = __import__("json").loads(json_str)
        return {"questions": questions}
    except Exception as e:
        print(f"[quiz:generate] Fallback: {e}")
        return {"questions": fallback, "isFallback": True}


# ── Démarrage ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=3000, reload=True)
