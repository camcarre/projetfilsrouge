"""
seed.py — Injecte des données de démo dans le backend FastAPI local.
Usage : python seed.py
Le backend doit tourner sur http://localhost:3000
"""
import requests
import json
from datetime import datetime, timedelta
import random

BASE = "http://localhost:3000"
EMAIL = "demo@finance.app"
PASSWORD = "Demo1234!"

# ── Données ───────────────────────────────────────────────────────────────────

ASSETS = [
    {"name": "Amundi MSCI World (CW8)", "symbol": "CW8.PA", "category": "etf",        "quantity": 15,   "unitPrice": 412.50, "currency": "EUR"},
    {"name": "Lyxor PEA Monde (EWLD)",  "symbol": "EWLD.PA","category": "etf",        "quantity": 30,   "unitPrice": 27.84,  "currency": "EUR"},
    {"name": "SPDR S&P 500 (SPY)",      "symbol": "SPY",    "category": "etf",        "quantity": 5,    "unitPrice": 521.30, "currency": "USD"},
    {"name": "Apple Inc.",              "symbol": "AAPL",   "category": "action",     "quantity": 8,    "unitPrice": 182.40, "currency": "USD"},
    {"name": "NVIDIA Corp.",            "symbol": "NVDA",   "category": "action",     "quantity": 3,    "unitPrice": 875.00, "currency": "USD"},
    {"name": "Microsoft Corp.",         "symbol": "MSFT",   "category": "action",     "quantity": 4,    "unitPrice": 415.20, "currency": "USD"},
    {"name": "Bitcoin",                 "symbol": "BTC-USD","category": "crypto",     "quantity": 0.12, "unitPrice": 67500.00,"currency": "USD"},
    {"name": "Ethereum",                "symbol": "ETH-USD","category": "crypto",     "quantity": 1.5,  "unitPrice": 3200.00, "currency": "USD"},
    {"name": "OAT France 10 ans",       "symbol": "FR10Y",  "category": "obligation", "quantity": 10,   "unitPrice": 98.50,  "currency": "EUR"},
]

TRANSACTIONS = [
    # BUY historiques
    {"symbol": "CW8.PA",  "type": "BUY",  "quantity": 10, "price": 390.00, "daysAgo": 180},
    {"symbol": "CW8.PA",  "type": "BUY",  "quantity": 5,  "price": 405.00, "daysAgo": 60},
    {"symbol": "EWLD.PA", "type": "BUY",  "quantity": 30, "price": 26.50,  "daysAgo": 120},
    {"symbol": "SPY",     "type": "BUY",  "quantity": 5,  "price": 490.00, "daysAgo": 90},
    {"symbol": "AAPL",    "type": "BUY",  "quantity": 10, "price": 175.00, "daysAgo": 200},
    {"symbol": "AAPL",    "type": "SELL", "quantity": 2,  "price": 188.00, "daysAgo": 30},
    {"symbol": "NVDA",    "type": "BUY",  "quantity": 5,  "price": 620.00, "daysAgo": 150},
    {"symbol": "NVDA",    "type": "SELL", "quantity": 2,  "price": 820.00, "daysAgo": 45},
    {"symbol": "MSFT",    "type": "BUY",  "quantity": 4,  "price": 380.00, "daysAgo": 100},
    {"symbol": "BTC-USD", "type": "BUY",  "quantity": 0.12,"price": 58000.0,"daysAgo": 75},
    {"symbol": "ETH-USD", "type": "BUY",  "quantity": 2.0,"price": 2800.0, "daysAgo": 80},
    {"symbol": "ETH-USD", "type": "SELL", "quantity": 0.5,"price": 3100.0, "daysAgo": 20},
    {"symbol": "FR10Y",   "type": "BUY",  "quantity": 10, "price": 99.00,  "daysAgo": 300},
]

# ── Helpers ───────────────────────────────────────────────────────────────────

def ok(label, r):
    if r.status_code in (200, 201, 204):
        print(f"  ✓ {label}")
        return True
    print(f"  ✗ {label} → {r.status_code} {r.text[:120]}")
    return False

# ── 1. Register / Login ───────────────────────────────────────────────────────

print("\n── Auth ──────────────────────────────────────────────────────────")
r = requests.post(f"{BASE}/auth/register", json={"email": EMAIL, "password": PASSWORD})
if r.status_code == 200:
    print(f"  ✓ Compte créé ({EMAIL})")
elif r.status_code == 400:
    print(f"  · Compte existant, on continue")
else:
    print(f"  ✗ Register {r.status_code} {r.text}")

r = requests.post(f"{BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
if not ok("Login", r):
    exit(1)
token = r.json()["token"]
H = {"Authorization": f"Bearer {token}"}

# ── 2. Assets ─────────────────────────────────────────────────────────────────

print("\n── Assets ────────────────────────────────────────────────────────")
for a in ASSETS:
    r = requests.post(f"{BASE}/api/assets", json=a, headers=H)
    ok(f"{a['symbol']} × {a['quantity']}", r)

# ── 3. Transactions ───────────────────────────────────────────────────────────

print("\n── Transactions ──────────────────────────────────────────────────")
for t in TRANSACTIONS:
    payload = {"symbol": t["symbol"], "type": t["type"], "quantity": t["quantity"], "price": t["price"]}
    r = requests.post(f"{BASE}/api/transactions", json=payload, headers=H)
    ok(f"{t['type']} {t['symbol']} × {t['quantity']} @ {t['price']}", r)

# ── 4. Résumé ─────────────────────────────────────────────────────────────────

print("\n── Résumé ────────────────────────────────────────────────────────")
r = requests.get(f"{BASE}/api/assets", headers=H)
data = r.json() if r.ok else []
assets = data if isinstance(data, list) else data.get("assets", [])
total = sum(a.get("quantity", 0) * a.get("unitPrice", a.get("unit_price", 0)) for a in assets if isinstance(a, dict))
print(f"  {len(assets)} actifs — valeur totale estimée : {total:,.0f} €")

r = requests.get(f"{BASE}/api/transactions", headers=H)
txs = r.json() if r.ok else []
print(f"  {len(txs)} transactions enregistrées")

print(f"\n  Email    : {EMAIL}")
print(f"  Password : {PASSWORD}")
print(f"  Token    : {token[:32]}…\n")
