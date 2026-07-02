"""
analytics_service.py — Indicateurs techniques + métriques de risque
Utilisé par /api/analyze/indicators/{ticker} et /api/analyze/risk/{ticker}
"""
import numpy as np
import pandas as pd
import yfinance as yf

try:
    import pandas_ta as ta  # type: ignore
    _HAS_PANDAS_TA = True
except ImportError:
    _HAS_PANDAS_TA = False
    print("[analytics] pandas_ta non disponible — calcul numpy fallback")


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
    returns = closes.pct_change().dropna(how="any")
    if len(returns) < 10:
        raise ValueError("Pas assez de données communes entre les actifs pour calculer une corrélation")

    corr = returns.corr().round(2)
    ordered_tickers = list(corr.columns)

    return {
        "tickers": ordered_tickers,
        "matrix": corr.values.tolist(),
        "period": period,
    }
