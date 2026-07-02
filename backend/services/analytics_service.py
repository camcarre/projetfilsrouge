"""
analytics_service.py — Indicateurs techniques + métriques de risque
Utilisé par /api/analyze/indicators/{ticker} et /api/analyze/risk/{ticker}
"""
import logging

import numpy as np
import pandas as pd
import yfinance as yf

try:
    import pandas_ta as ta  # type: ignore
    _HAS_PANDAS_TA = True
except ImportError:
    _HAS_PANDAS_TA = False
    logging.warning("pandas_ta non disponible — calcul numpy fallback")

logger = logging.getLogger(__name__)


def _ema(series: np.ndarray, span: int) -> np.ndarray:
    """EMA via numpy (fallback sans pandas)."""
    alpha = 2.0 / (span + 1)
    result = np.empty_like(series, dtype=float)
    result[0] = series[0]
    for i in range(1, len(series)):
        result[i] = alpha * series[i] + (1 - alpha) * result[i - 1]
    return result


def _rsi_numpy(closes: np.ndarray, length: int = 14) -> np.ndarray:
    """RSI via numpy."""
    deltas = np.diff(closes)
    gains = np.where(deltas > 0, deltas, 0.0)
    losses = np.where(deltas < 0, -deltas, 0.0)

    avg_gain = np.zeros(len(closes))
    avg_loss = np.zeros(len(closes))

    if len(gains) < length:
        return np.full(len(closes), np.nan)

    avg_gain[length] = gains[:length].mean()
    avg_loss[length] = losses[:length].mean()

    for i in range(length + 1, len(closes)):
        avg_gain[i] = (avg_gain[i - 1] * (length - 1) + gains[i - 1]) / length
        avg_loss[i] = (avg_loss[i - 1] * (length - 1) + losses[i - 1]) / length

    rs = np.where(avg_loss == 0, np.inf, avg_gain / avg_loss)
    rsi = np.where(avg_loss == 0, 100.0, 100.0 - 100.0 / (1.0 + rs))
    rsi[:length] = np.nan
    return rsi


def get_indicators(ticker: str, period: str = "3mo") -> dict:
    """
    Calcule RSI, MACD et Bandes de Bollinger pour un ticker.
    Retourne un dict avec les séries temporelles tronquées à 100 points.
    """
    df = yf.Ticker(ticker).history(period=period)
    if df is None or len(df) < 20:
        raise ValueError(f"Données insuffisantes pour {ticker} (< 20 points)")

    closes = df["Close"].values.astype(float)
    dates = [str(idx)[:10] for idx in df.index]

    # ── RSI ─────────────────────────────────────────────────────────────────
    if _HAS_PANDAS_TA:
        rsi_series = df.ta.rsi(length=14)
        rsi_vals = rsi_series.values.tolist()
    else:
        rsi_vals = _rsi_numpy(closes, 14).tolist()

    # ── MACD ─────────────────────────────────────────────────────────────────
    if _HAS_PANDAS_TA:
        macd_df = df.ta.macd(fast=12, slow=26, signal=9)
        macd_line = macd_df.iloc[:, 0].values.tolist()
        macd_histogram = macd_df.iloc[:, 1].values.tolist()
        macd_signal = macd_df.iloc[:, 2].values.tolist()
    else:
        ema12 = _ema(closes, 12)
        ema26 = _ema(closes, 26)
        macd_line_arr = ema12 - ema26
        macd_signal_arr = _ema(macd_line_arr, 9)
        macd_histogram_arr = macd_line_arr - macd_signal_arr
        macd_line = macd_line_arr.tolist()
        macd_signal = macd_signal_arr.tolist()
        macd_histogram = macd_histogram_arr.tolist()

    # ── Bollinger Bands ───────────────────────────────────────────────────────
    if _HAS_PANDAS_TA:
        bb_df = df.ta.bbands(length=20, std=2)
        bb_lower = bb_df.iloc[:, 0].values.tolist()
        bb_middle = bb_df.iloc[:, 1].values.tolist()
        bb_upper = bb_df.iloc[:, 2].values.tolist()
    else:
        # SMA20 ± 2*std
        length = 20
        sma = np.array([
            closes[i - length:i].mean() if i >= length else np.nan
            for i in range(1, len(closes) + 1)
        ])
        std = np.array([
            closes[i - length:i].std() if i >= length else np.nan
            for i in range(1, len(closes) + 1)
        ])
        bb_middle = sma.tolist()
        bb_upper = (sma + 2 * std).tolist()
        bb_lower = (sma - 2 * std).tolist()

    def _clean(lst: list) -> list:
        """Remplace NaN/inf par None pour la sérialisation JSON."""
        result = []
        for v in lst:
            try:
                if v is None or (isinstance(v, float) and (np.isnan(v) or np.isinf(v))):
                    result.append(None)
                else:
                    result.append(round(float(v), 4))
            except (TypeError, ValueError):
                result.append(None)
        return result

    # Tronquer à 100 derniers points
    n = min(100, len(dates))
    return {
        "ticker": ticker,
        "period": period,
        "dates": dates[-n:],
        "rsi": _clean(rsi_vals)[-n:],
        "macd_line": _clean(macd_line)[-n:],
        "macd_signal": _clean(macd_signal)[-n:],
        "macd_histogram": _clean(macd_histogram)[-n:],
        "bollinger_upper": _clean(bb_upper)[-n:],
        "bollinger_middle": _clean(bb_middle)[-n:],
        "bollinger_lower": _clean(bb_lower)[-n:],
    }


def get_risk_metrics(ticker: str, period: str = "1y") -> dict:
    """
    Calcule VaR 95/99%, drawdown max, volatilité annualisée et Sharpe ratio.
    """
    df = yf.Ticker(ticker).history(period=period)
    if df is None or len(df) < 20:
        raise ValueError(f"Données insuffisantes pour {ticker} (< 20 points)")

    closes = df["Close"].dropna()
    returns = closes.pct_change().dropna()

    if len(returns) < 10:
        raise ValueError(f"Pas assez de rendements calculables pour {ticker}")

    ret_arr = returns.values.astype(float)

    var_95 = round(float(np.percentile(ret_arr, 5)) * 100, 2)
    var_99 = round(float(np.percentile(ret_arr, 1)) * 100, 2)

    cumulative = closes.values / closes.values[0]
    running_max = np.maximum.accumulate(cumulative)
    drawdowns = (cumulative - running_max) / running_max
    max_drawdown = round(float(drawdowns.min()) * 100, 2)

    volatility = round(float(ret_arr.std()) * np.sqrt(252) * 100, 2)

    annual_return = float(ret_arr.mean()) * 252
    annual_std = float(ret_arr.std()) * np.sqrt(252)
    sharpe = round(annual_return / annual_std, 2) if annual_std != 0 else 0.0

    return {
        "ticker": ticker,
        "period": period,
        "var_95": var_95,
        "var_99": var_99,
        "max_drawdown": max_drawdown,
        "volatility": volatility,
        "sharpe_ratio": sharpe,
    }


def get_correlation_matrix(tickers: list[str], period: str = "1y") -> dict:
    """
    Calcule la matrice de corrélation de Pearson entre les rendements
    quotidiens d'au moins 2 tickers.
    """
    closes = yf.download(tickers, period=period, progress=False)["Close"]
    if isinstance(closes, pd.Series):
        closes = closes.to_frame()

    # Écarter les tickers sans données de marché (ex : obligations non cotées sur Yahoo,
    # ticker invalide) : sinon une seule colonne tout-NaN vide le dropna(how="any").
    usable = [t for t in closes.columns if closes[t].notna().sum() >= 11]
    excluded = [str(t) for t in closes.columns if t not in usable]
    closes = closes[usable]
    if closes.shape[1] < 2:
        raise ValueError("Pas assez d'actifs avec des données de marché pour calculer une corrélation")

    returns = closes.pct_change().dropna(how="any")
    if len(returns) < 10:
        raise ValueError("Pas assez de données communes entre les actifs pour calculer une corrélation")

    corr = returns.corr().round(2)
    ordered_tickers = list(corr.columns)

    return {
        "tickers": ordered_tickers,
        "matrix": corr.values.tolist(),
        "period": period,
        "excluded": excluded,
    }


# ── Backtest forecast ────────────────────────────────────────────────────────

MIN_BACKTEST_POINTS = 20
HORIZON = 15


def _ets_forecast(values: np.ndarray, horizon: int) -> np.ndarray:
    """Tente un lissage exponentiel (statsmodels), fallback polyfit."""
    try:
        from statsmodels.tsa.holtwinters import ExponentialSmoothing  # noqa: PLC0415

        model = ExponentialSmoothing(
            values, trend="add", initialization_method="estimated"
        ).fit(optimized=True)
        return np.asarray(model.forecast(horizon), dtype=float)
    except Exception as err:  # pragma: no cover - fallback
        logger.warning("ETS indisponible, fallback polyfit: %s", err)
        x = np.arange(len(values))
        slope, intercept = np.polyfit(x, values, 1)
        future_x = np.arange(len(values), len(values) + horizon)
        return slope * future_x + intercept


def backtest_forecast(prices: list[float], horizon: int | None = None) -> dict:
    """
    Backtest d'une prévision ETS/polyfit sur la série `prices`.

    - horizon par défaut = min(15, max(5, len(prices) // 5)), garde au moins 20 points train.
    - Découpe rigide : train = prices[:-K], test = prices[-K:].
    - Tente ETS ; fallback polyfit si ETS échoue.
    - Retourne {horizon, train_size, test_size, rmse, mae, r2, model}.

    Lève ValueError si la série est trop courte (< 20 points minimum).
    """
    if prices is None or len(prices) < MIN_BACKTEST_POINTS:
        raise ValueError(
            f"Série trop courte pour backtest (>= {MIN_BACKTEST_POINTS} requis, "
            f"{0 if prices is None else len(prices)} reçus)"
        )

    arr = np.asarray(prices, dtype=float)
    if not np.all(np.isfinite(arr)):
        raise ValueError("Série contient des valeurs non finies")

    # Calcul horizon : min(15, max(5, len(prices)//5)) en gardant au moins 20 points train
    if horizon is None:
        horizon = min(15, max(5, len(arr) // 5))
        # Garantir min 20 points train : si len(arr) - horizon < 20, augmenter train
        if len(arr) - horizon < MIN_BACKTEST_POINTS:
            horizon = max(5, len(arr) - MIN_BACKTEST_POINTS)

    if horizon < 5 or horizon >= len(arr) - MIN_BACKTEST_POINTS:
        raise ValueError(
            f"Découpage train/test insuffisant : horizon={horizon}, "
            f"len={len(arr)}, besoin min 20 train"
        )

    # Split rigide : train = prices[:-horizon], test = prices[-horizon:]
    train = arr[:-horizon]
    test = arr[-horizon:]

    # Tenter ETS, fallback polyfit
    model_used = "ETS"
    try:
        forecast = _ets_forecast(train, horizon)
    except Exception as err:
        logger.warning("ETS échoué, fallback polyfit: %s", err)
        x = np.arange(len(train))
        slope, intercept = np.polyfit(x, train, 1)
        future_x = np.arange(len(train), len(train) + horizon)
        forecast = slope * future_x + intercept
        model_used = "linear-regression"

    # Métriques out-of-sample
    errors = forecast - test
    mae = float(np.mean(np.abs(errors)))
    rmse = float(np.sqrt(np.mean(errors ** 2)))

    ss_res = float(np.sum(errors ** 2))
    ss_tot = float(np.sum((test - np.mean(test)) ** 2))
    r2 = 1.0 - ss_res / ss_tot if ss_tot > 0 else 0.0

    return {
        "horizon": horizon,
        "train_size": int(len(train)),
        "test_size": int(len(test)),
        "rmse": round(rmse, 4),
        "mae": round(mae, 4),
        "r2": round(r2, 4),
        "model": model_used,
    }