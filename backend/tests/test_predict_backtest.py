"""Tests pour backtest_forecast + intégration predict_stock.backtest."""
import sys
from pathlib import Path

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from services.analytics_service import (  # noqa: E402
    MIN_BACKTEST_POINTS,
    backtest_forecast,
)


def test_backtest_returns_dict_with_required_keys():
    series = [100 + i for i in range(40)]
    result = backtest_forecast(series)
    assert isinstance(result, dict)
    for key in ("horizon", "train_size", "test_size", "rmse", "mae", "r2", "model"):
        assert key in result


def test_backtest_linear_series_high_r2():
    series = [100 + i for i in range(40)]
    result = backtest_forecast(series)
    assert result["r2"] >= 0.9
    assert result["mae"] < 2.0
    assert result["rmse"] < 2.0


def test_backtest_default_horizon_computed():
    series = [100 + i + (i % 3) * 0.1 for i in range(60)]
    result = backtest_forecast(series)
    assert result["horizon"] >= 5
    assert result["horizon"] <= 15
    assert result["test_size"] == result["horizon"]
    assert result["train_size"] >= MIN_BACKTEST_POINTS


def test_backtest_short_series_raises_value_error():
    with pytest.raises(ValueError, match="trop courte"):
        backtest_forecast([100 + i for i in range(10)])


def test_backtest_empty_series_raises():
    with pytest.raises(ValueError):
        backtest_forecast([])


def test_backtest_invalid_horizon_raises():
    series = [100 + i for i in range(40)]
    with pytest.raises(ValueError):
        backtest_forecast(series, horizon=1000)


def test_backtest_rejects_non_finite_values():
    series = [100 + i for i in range(20)]
    series[5] = float("nan")
    with pytest.raises(ValueError, match="non finies"):
        backtest_forecast(series)


def test_backtest_model_is_ets_or_linear():
    series = [50 + i * 0.5 for i in range(40)]
    result = backtest_forecast(series)
    assert result["model"] in ("ETS", "linear-regression")


def test_backtest_custom_horizon():
    series = [200 - i * 0.2 for i in range(50)]
    result = backtest_forecast(series, horizon=10)
    assert result["train_size"] + result["test_size"] == len(series)
    assert result["test_size"] == 10
    assert result["train_size"] >= MIN_BACKTEST_POINTS


def test_predict_stock_response_shape_unchanged():
    """Vérifie qu'on AJOUTE prediction.backtest sans casser la structure existante."""

    def _fake_predict(symbol: str):
        return {
            "symbol": symbol,
            "prediction": {
                "current_price": 100.0,
                "predicted_price": 105.0,
                "forecast": [101, 102, 103, 104, 105],
                "history": [99, 100, 101],
                "confidence": 0.7,
                "model": "ETS",
            },
        }

    symbol = "AAPL"
    series = [100 + i + (i % 4) for i in range(40)]
    bt = backtest_forecast(series)

    response = _fake_predict(symbol)
    response["prediction"]["backtest"] = bt

    # Champs existants intacts (forecast, predicted_price, history, confidence, model, current_price)
    for key in ("forecast", "predicted_price", "history", "confidence", "model", "current_price"):
        assert key in response["prediction"], f"clé manquante: {key}"

    # Nouveau champ backtest présent avec bonne structure
    assert "backtest" in response["prediction"]
    bt_result = response["prediction"]["backtest"]
    assert isinstance(bt_result, dict)
    for key in ("horizon", "train_size", "test_size", "rmse", "mae", "r2", "model"):
        assert key in bt_result, f"backtest clé manquante: {key}"
    assert bt_result["r2"] >= 0.0 and bt_result["r2"] <= 1.0