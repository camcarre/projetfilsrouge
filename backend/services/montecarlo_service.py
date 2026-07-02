"""
montecarlo_service.py — Simulation Monte Carlo (GBM) d'un portefeuille.

Utilisé par GET /api/portfolio/montecarlo.
Retourne les percentiles (p5/p25/p50/p75/p95) de la valeur future du portefeuille
sur un horizon donné, plus la VaR Monte Carlo à 95% (perte potentielle).
"""
from __future__ import annotations

from typing import TypedDict

import numpy as np
import pandas as pd
import yfinance as yf


class Holding(TypedDict):
    symbol: str
    quantity: float
    unit_price: float


class Step(TypedDict):
    day: int
    p5: float
    p25: float
    p50: float
    p75: float
    p95: float


class SimulationResult(TypedDict):
    initialValue: float
    days: int
    simulations: int
    steps: list[Step]
    var95: float
    var95Pct: float


def _load_close_series(symbol: str) -> pd.Series | None:
    """Télécharge l'historique 1y d'un symbole et retourne la série Close (date-indexed)."""
    try:
        df = yf.Ticker(symbol).history(period="1y")
    except Exception:
        return None
    if df is None or df.empty or "Close" not in df.columns:
        return None
    close = df["Close"].dropna()
    if close.empty:
        return None
    # Normaliser l'index en date naive (jours). tz_localize(None) AVANT normalize :
    # sinon crypto (UTC) et actions (tz bourse) ne s'intersectent jamais (dates tz-aware).
    idx = pd.to_datetime(close.index)
    if idx.tz is not None:
        idx = idx.tz_localize(None)
    close.index = idx.normalize()
    return close


def simulate_portfolio(
    holdings: list[Holding],
    days: int,
    simulations: int,
) -> SimulationResult:
    """
    Simule `simulations` trajectoires GBM de la valeur du portefeuille
    sur `days` jours, à partir des rendements log journaliers historiques (1y).

    Lève ValueError si l'historique commun exploitable est insuffisant (< 2 points).
    """
    if not holdings:
        raise ValueError("Portefeuille vide")

    # 1) Charger chaque symbole, aligner sur l'intersection des dates
    series_by_symbol: dict[str, pd.Series] = {}
    for h in holdings:
        symbol = h["symbol"]
        close = _load_close_series(symbol)
        if close is None or len(close) < 2:
            continue
        series_by_symbol[symbol] = close

    if not series_by_symbol:
        raise ValueError("Historique insuffisant pour les symboles du portefeuille")

    # Intersection des dates communes à tous les symboles récupérés
    common_index = series_by_symbol[list(series_by_symbol.keys())[0]].index
    for s in series_by_symbol.values():
        common_index = common_index.intersection(s.index)

    if len(common_index) < 2:
        raise ValueError("Historique insuffisant (intersection de dates trop courte)")

    # 2) Valeur historique du portefeuille = Σ quantity_i × close_i
    holdings_qty = {h["symbol"]: float(h["quantity"]) for h in holdings}
    holdings_unit = {h["symbol"]: float(h["unit_price"]) for h in holdings}

    aligned = pd.DataFrame(
        {sym: s.reindex(common_index) for sym, s in series_by_symbol.items()}
    ).sort_index()

    # Si un symbole du portefeuille n'a pas pu être chargé, on utilise son unit_price
    # (constant) pour ne pas casser l'agrégation.
    for sym in holdings_qty:
        if sym not in aligned.columns:
            last_close = float(holdings_unit.get(sym, 0.0))
            aligned[sym] = last_close

    portfolio_value = sum(
        holdings_qty[sym] * aligned[sym].astype(float) for sym in holdings_qty
    )

    # 3) Rendements log journaliers → mu, sigma
    log_returns = np.log(portfolio_value / portfolio_value.shift(1)).dropna()
    if len(log_returns) < 2:
        raise ValueError("Pas assez de rendements calculables pour le portefeuille")

    mu = float(log_returns.mean())
    sigma = float(log_returns.std(ddof=1))

    # 4) Valeur initiale = dernière valeur historique agrégée (avec fallback unit_price)
    last_closes = {
        sym: (
            float(aligned[sym].dropna().iloc[-1])
            if not aligned[sym].dropna().empty
            else float(holdings_unit.get(sym, 0.0))
        )
        for sym in holdings_qty
    }
    v0 = float(sum(holdings_qty[sym] * last_closes[sym] for sym in holdings_qty))

    if v0 <= 0:
        raise ValueError("Valeur initiale du portefeuille invalide (<= 0)")

    # 5) Simulation vectorisée : matrice (simulations × days) de chocs normaux
    rng = np.random.default_rng()
    shocks = rng.normal(loc=mu, scale=sigma, size=(simulations, days))
    log_paths = np.cumsum(shocks, axis=1)
    paths = v0 * np.exp(log_paths)

    # 6) Percentiles à chaque pas t sur l'axe des simulations
    pct = np.percentile(paths, [5, 25, 50, 75, 95], axis=0)  # shape (5, days)

    steps: list[Step] = []
    for t in range(days):
        steps.append(
            {
                "day": t + 1,
                "p5": float(pct[0, t]),
                "p25": float(pct[1, t]),
                "p50": float(pct[2, t]),
                "p75": float(pct[3, t]),
                "p95": float(pct[4, t]),
            }
        )

    # 7) VaR Monte Carlo 95% : perte au percentile 5% du dernier pas
    final_p5 = float(pct[0, -1])
    var95 = max(0.0, v0 - final_p5)
    var95_pct = (var95 / v0) * 100.0

    return {
        "initialValue": round(v0, 2),
        "days": days,
        "simulations": simulations,
        "steps": steps,
        "var95": round(var95, 2),
        "var95Pct": round(var95_pct, 2),
    }