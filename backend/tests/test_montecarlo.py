"""
test_montecarlo.py — Tests unitaires pour simulate_portfolio (sans réseau).

Monkeypatch du module yfinance pour fournir un historique déterministe.
"""
from __future__ import annotations

import math
import sys
import types

import numpy as np
import pandas as pd
import pytest

# Import du module à tester
from services import montecarlo_service as mc


class _FakeTicker:
    """Stub minimal de yfinance.Ticker renvoyant une série Close contrôlée."""

    def __init__(self, symbol: str):
        self.symbol = symbol

    def history(self, period: str = "1y") -> pd.DataFrame:
        # Série déterministe : prix croissant + bruit léger → log returns non dégénérés
        n = 252  # ~1 an de jours de bourse
        rng = np.random.default_rng(seed=hash(self.symbol) & 0xFFFF)
        base = np.linspace(100.0, 110.0, n)
        noise = rng.normal(0, 0.5, n)
        closes = base + noise
        dates = pd.date_range(end=pd.Timestamp.today().normalize(), periods=n, freq="B")
        df = pd.DataFrame({"Close": closes}, index=dates)
        df.index.name = "Date"
        return df


@pytest.fixture(autouse=True)
def patch_yfinance(monkeypatch):
    """Remplace services.montecarlo_service.yf.Ticker par _FakeTicker."""
    # S'assurer qu'un module yfinance est connu (peut déjà l'être)
    if "yfinance" not in sys.modules:
        yf_mod = types.ModuleType("yfinance")
        yf_mod.Ticker = _FakeTicker
        sys.modules["yfinance"] = yf_mod
    monkeypatch.setattr(mc.yf, "Ticker", _FakeTicker)
    yield


def _holdings() -> list[mc.Holding]:
    return [
        {"symbol": "AAPL", "quantity": 10.0, "unit_price": 100.0},
        {"symbol": "MSFT", "quantity": 5.0, "unit_price": 200.0},
    ]


def test_simulate_portfolio_returns_expected_shape():
    result = mc.simulate_portfolio(_holdings(), days=30, simulations=500)

    assert isinstance(result, dict)
    assert result["days"] == 30
    assert result["simulations"] == 500
    assert len(result["steps"]) == 30
    assert "var95" in result and "var95Pct" in result
    assert result["initialValue"] > 0


def test_percentiles_monotonic_per_step():
    """Pour chaque jour, p5 <= p25 <= p50 <= p75 <= p95 et len(steps) == days."""
    result = mc.simulate_portfolio(_holdings(), days=60, simulations=1000)

    assert len(result["steps"]) == 60

    for step in result["steps"]:
        assert step["p5"] <= step["p25"] <= step["p50"] <= step["p75"] <= step["p95"], (
            f"Non-monotone au jour {step['day']}: {step}"
        )
        # Valeurs strictement positives
        assert all(v > 0 for v in (step["p5"], step["p25"], step["p50"], step["p75"], step["p95"]))
        # Pas de NaN
        assert not any(math.isnan(v) for v in (step["p5"], step["p25"], step["p50"], step["p75"], step["p95"]))


def test_empty_portfolio_raises():
    with pytest.raises(ValueError, match="vide"):
        mc.simulate_portfolio([], days=10, simulations=100)


def test_var95_is_non_negative():
    result = mc.simulate_portfolio(_holdings(), days=30, simulations=500)
    assert result["var95"] >= 0.0
    assert 0.0 <= result["var95Pct"] <= 100.0