"""
main.py — FastAPI app (migration de backend/server.js)
Plan 04-01 : Foundation + Auth routes
Plans suivants : assets, ETF, prediction, quiz
"""
import os
import re
import secrets
import bcrypt
import uvicorn
import numpy as np
import requests as http_requests
import yfinance as yf
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from fastapi import FastAPI, Header, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

# Charger .env depuis la racine du projet (un niveau au-dessus de backend/)
_ROOT = Path(__file__).parent
load_dotenv(_ROOT / ".env")
load_dotenv(_ROOT / ".env.local")

from database import get_db  # noqa: E402 — après load_dotenv
from services.yahoo_etf_service import (  # noqa: E402
    get_etfs,
    get_etf_details,
    get_etf_performance,
    get_etf_holdings,
    validate_ticker,
)

app = FastAPI(title="Finance PWA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


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

    enriched = []
    for a in assets:
        try:
            ticker = yf.Ticker(a["symbol"])
            live_price = ticker.fast_info.last_price or a["unit_price"]
            change = 0.0
            try:
                hist = ticker.history(period="2d")
                if len(hist) >= 2:
                    prev = hist["Close"].iloc[-2]
                    curr = hist["Close"].iloc[-1]
                    change = round((curr - prev) / prev * 100, 2) if prev else 0.0
            except Exception:
                pass
        except Exception:
            live_price = a["unit_price"]
            change = 0.0

        enriched.append({
            "id": a["id"],
            "name": a["name"],
            "symbol": a["symbol"],
            "category": a["category"],
            "quantity": a["quantity"],
            "unitPrice": live_price,
            "originalPrice": a["unit_price"],
            "currency": a["currency"],
            "change": change,
        })

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
                numbers = [float(s) for s in re.split(r"[\s,]+", generated) if s and re.match(r"[\d.]+", s)]
                if numbers:
                    forecast = [round(n, 2) for n in numbers[:15]]
                    model_used = "Qwen/Qwen2.5-72B-Instruct"
                else:
                    raise ValueError("Pas de nombres dans la réponse IA")
            except Exception as hf_err:
                print(f"[predict] Fallback régression: {hf_err}")

        if not forecast:
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

        confidence = 0.6 if model_used != "linear-regression" else 0.75
        return {
            "symbol": symbol,
            "prediction": {
                "current_price": round(current_price, 2),
                "predicted_price": forecast[-1],
                "forecast": forecast,
                "history": [round(p, 2) for p in prices],
                "confidence": confidence,
                "model": model_used,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        print(f"[predict] Erreur: {e}")
        raise HTTPException(status_code=500, detail="Erreur lors de la prédiction")


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
