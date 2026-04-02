"""
yahoo_etf_service.py — Port Python de yahooEtfService.js
Fournit : get_etfs, get_etf_details, get_etf_performance, get_etf_holdings,
          validate_ticker, calc_match
"""
import json
import re
import time
import random
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Optional

import yfinance as yf

_DATA_DIR = Path(__file__).parent.parent / "data"

# Charger tickers et meta depuis les fichiers JSON
try:
    with open(_DATA_DIR / "etf-tickers-available.json") as f:
        TICKERS: list = json.load(f)
    with open(_DATA_DIR / "etf-meta-available.json") as f:
        META: dict = json.load(f)
    print(f"[etf] {len(TICKERS)} ETF chargés depuis etf-tickers-available.json")
except Exception as e:
    print(f"[etf] Erreur chargement données: {e}")
    TICKERS = []
    META = {}

# Cache en mémoire (5 min)
_cache: dict = {}
CACHE_DURATION = 5 * 60  # secondes


def _get_cached(key: str, fn, *args, **kwargs):
    entry = _cache.get(key)
    if entry and (time.time() - entry["ts"]) < CACHE_DURATION:
        return entry["data"]
    data = fn(*args, **kwargs)
    _cache[key] = {"data": data, "ts": time.time()}
    return data


def validate_ticker(ticker: str) -> bool:
    """Valide un ticker boursier (ex: AAPL, CW8.PA)."""
    if not ticker or not isinstance(ticker, str):
        return False
    return bool(re.match(r"^[A-Z0-9]{1,10}(\.[A-Z]{2})?$", ticker))


def _calc_match(ter: float, esg: str) -> int:
    """Calcule un score match (0-100) à partir du TER et ESG."""
    ter_score = max(0, 100 - ter * 50)
    esg_order = ["B", "A", "AA", "AAA"]
    esg_idx = esg_order.index(esg) if esg in esg_order else -1
    esg_score = 60 + esg_idx * 13 if esg_idx >= 0 else 70
    return round(ter_score * 0.4 + esg_score * 0.6)


def _calculate_volatility(historical: list) -> float:
    """Calcule la volatilité annualisée à partir des données historiques."""
    if len(historical) < 2:
        return 0.0
    returns = []
    for i in range(1, len(historical)):
        prev = historical[i - 1].get("close", 0)
        curr = historical[i].get("close", 0)
        if prev and prev != 0:
            returns.append((curr - prev) / prev)
    if not returns:
        return 0.0
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / len(returns)
    return (variance ** 0.5) * (252 ** 0.5) * 100  # Volatilité annualisée


def get_etf_details(ticker: str) -> dict:
    """Récupère les détails complets d'un ETF via yfinance."""
    try:
        ticker_obj = yf.Ticker(ticker)

        # Quote (fast_info + info pour le nom)
        quote = None
        try:
            fi = ticker_obj.fast_info
            info = {}
            try:
                info = ticker_obj.info or {}
            except Exception:
                pass
            quote = {
                "regularMarketPrice": fi.last_price if hasattr(fi, "last_price") else None,
                "previousClose": fi.previous_close if hasattr(fi, "previous_close") else None,
                "regularMarketVolume": fi.three_month_average_volume if hasattr(fi, "three_month_average_volume") else None,
                "longName": info.get("longName") or info.get("shortName") or ticker,
                "shortName": info.get("shortName") or ticker,
                "netExpenseRatio": info.get("annualReportExpenseRatio"),
                "fiftyTwoWeekHigh": fi.fifty_two_week_high if hasattr(fi, "fifty_two_week_high") else None,
                "fiftyTwoWeekLow": fi.fifty_two_week_low if hasattr(fi, "fifty_two_week_low") else None,
            }
        except Exception as e:
            print(f"[getEtfDetails] Quote non disponible pour {ticker}: {e}")

        # Historical (1 an, interval 1j)
        historical = []
        try:
            hist_df = ticker_obj.history(period="1y", interval="1d")
            if not hist_df.empty:
                for idx, row in hist_df.iterrows():
                    historical.append({
                        "date": idx.isoformat() if hasattr(idx, "isoformat") else str(idx),
                        "open": float(row.get("Open", 0) or 0),
                        "high": float(row.get("High", 0) or 0),
                        "low": float(row.get("Low", 0) or 0),
                        "close": float(row.get("Close", 0) or 0),
                        "volume": int(row.get("Volume", 0) or 0),
                        "adjClose": float(row.get("Close", 0) or 0),
                    })
        except Exception as e:
            print(f"[getEtfDetails] Historical non disponible pour {ticker}: {e}")

        # Sustainability/ESG
        esg_score = None
        try:
            sust = ticker_obj.get_sustainability()
            if sust is not None and not sust.empty:
                esg_score = float(sust.loc["totalEsg", "Value"]) if "totalEsg" in sust.index else None
        except Exception:
            pass

        return {
            "quote": quote,
            "historical": historical,
            "esgScore": esg_score,
            "sustainability": None,
        }
    except Exception as e:
        print(f"[getEtfDetails] Erreur pour {ticker}: {e}")
        return {"quote": None, "historical": [], "esgScore": None, "sustainability": None}


def get_etf_performance(ticker: str, period: str = "1y") -> Optional[dict]:
    """Récupère la performance d'un ETF sur une période donnée."""
    period_map = {"1y": "1y", "6m": "6mo", "3m": "3mo", "1m": "1mo"}
    yf_period = period_map.get(period, "1y")
    try:
        hist_df = yf.Ticker(ticker).history(period=yf_period)
        if hist_df is None or len(hist_df) < 2:
            return None
        closes = hist_df["Close"].dropna().tolist()
        if len(closes) < 2:
            return None
        first_price = closes[0]
        last_price = closes[-1]
        performance = ((last_price - first_price) / first_price) * 100
        hist_list = [{"close": c} for c in closes]
        volatility = _calculate_volatility(hist_list)
        return {
            "performance": round(performance, 2),
            "volatility": round(volatility, 2),
        }
    except Exception as e:
        print(f"[getEtfPerformance] Erreur pour {ticker}: {e}")
        return None


def get_etf_holdings(ticker: str) -> Optional[dict]:
    """Récupère les holdings/composition d'un ETF."""
    try:
        ticker_obj = yf.Ticker(ticker)
        holders = ticker_obj.get_institutional_holders()
        if holders is not None and not holders.empty:
            return holders.to_dict(orient="records")
        return None
    except Exception as e:
        print(f"[getEtfHoldings] Erreur pour {ticker}: {e}")
        return None


def get_etfs(filters: dict = {}) -> list:
    """Récupère la liste des ETF avec données Yahoo Finance (ou fallback statique)."""
    if not TICKERS:
        return []

    quotes = []
    has_yahoo_error = False

    def _fetch_one(ticker: str):
        fi = yf.Ticker(ticker).fast_info
        last_price = fi.last_price if hasattr(fi, "last_price") and fi.last_price else None
        if last_price is None:
            return None
        prev_close = fi.previous_close if hasattr(fi, "previous_close") and fi.previous_close else None
        change = (last_price - prev_close) if prev_close else 0.0
        change_pct = (change / prev_close * 100) if prev_close else 0.0
        hi = fi.fifty_two_week_high if hasattr(fi, "fifty_two_week_high") else None
        lo = fi.fifty_two_week_low if hasattr(fi, "fifty_two_week_low") else None
        perf1y = round((hi - lo) / lo * 100, 2) if hi and lo and lo != 0 else 0.0
        volume = int(fi.three_month_average_volume) if hasattr(fi, "three_month_average_volume") and fi.three_month_average_volume else 0
        m = META.get(ticker, {})
        esg = m.get("esg", "A")
        ter = float(m.get("ter", 0.2))
        return {
            "id": ticker,
            "name": m.get("description", ticker),
            "ticker": ticker,
            "lastPrice": round(last_price, 2),
            "volume": volume,
            "change": round(change, 2),
            "changePercent": round(change_pct, 2),
            "ter": round(ter, 2),
            "perf1y": perf1y,
            "esg": esg,
            "match": _calc_match(ter, esg),
            "zone": m.get("zone", "Monde"),
            "theme": m.get("theme", "Diversifié"),
        }

    with ThreadPoolExecutor(max_workers=10) as pool:
        futures = {pool.submit(_fetch_one, t): t for t in TICKERS}
        for future in as_completed(futures):
            ticker = futures[future]
            try:
                result = future.result()
                if result:
                    quotes.append(result)
            except Exception as e:
                print(f"[getEtfs] Erreur pour {ticker}: {e}")

    if not quotes:
        has_yahoo_error = True

    # Fallback statique si Yahoo Finance indisponible
    if has_yahoo_error:
        print("[getEtfs] Fallback statique (Yahoo Finance indisponible)")
        for ticker in TICKERS:
            m = META.get(ticker, {})
            random_change = (random.random() - 0.5) * 2
            random_price = 100 + (random.random() - 0.5) * 20
            esg = m.get("esg", "A")
            quotes.append({
                "id": ticker,
                "name": m.get("description", ticker),
                "ticker": ticker,
                "lastPrice": round(random_price, 2),
                "volume": int(random.random() * 100000),
                "change": round(random_change, 2),
                "changePercent": round(random_change / random_price * 100, 2),
                "ter": 0.2,
                "perf1y": round((random.random() - 0.2) * 20, 2),
                "esg": esg,
                "match": _calc_match(0.2, esg),
                "zone": m.get("zone", "Monde"),
                "theme": m.get("theme", "Diversifié"),
                "isMock": True,
            })

    # Filtrage
    zone_filter = filters.get("zone")
    sector_filter = filters.get("sector")
    esg_filter = filters.get("esg")
    ter_max = filters.get("terMax")
    ESG_ORDER = ["B", "A", "AA", "AAA"]

    def _keep(etf: dict) -> bool:
        if zone_filter and zone_filter != "Toutes" and etf.get("zone") != zone_filter:
            return False
        if sector_filter and sector_filter != "Tous" and etf.get("theme") != sector_filter:
            return False
        if esg_filter and esg_filter != "Tous":
            idx_e = ESG_ORDER.index(etf["esg"]) if etf["esg"] in ESG_ORDER else -1
            idx_s = ESG_ORDER.index(esg_filter) if esg_filter in ESG_ORDER else -1
            if idx_e == -1 or idx_e < idx_s:
                return False
        if ter_max:
            import re as _re
            m = _re.search(r"0[,.](\d+)", ter_max)
            if m:
                max_val = float(f"0.{m.group(1)}")
                if etf.get("ter", 0) > max_val:
                    return False
        return True

    return [e for e in quotes if _keep(e)]
