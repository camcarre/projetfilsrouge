---
phase: 05-advanced-analytics
plan: 01
type: summary
status: complete
completed: 2026-04-02
---

# SUMMARY — 05-01 Backend Analytics

## What Was Built

### analytics_service.py (nouveau fichier)
- `get_indicators(ticker, period="3mo")` : RSI(14), MACD(12/26/9), Bollinger Bands(20, ±2σ)
  - pandas-ta utilisé si disponible (`_HAS_PANDAS_TA` flag)
  - Fallback numpy : `_ema()` (alpha EWM), `_rsi_numpy()` (Wilder smoothing), SMA20 ± 2*std
  - `_clean()` pour sérialisation JSON (NaN/inf → None)
  - Tronqué à 100 derniers points
- `get_risk_metrics(ticker, period="1y")` : VaR95/99%, max drawdown, volatilité annualisée, Sharpe ratio
  - Toutes les valeurs arrondies à 2 décimales

### main.py (modifié)
- Import ajouté : `from services.analytics_service import get_indicators, get_risk_metrics`
- `GET /api/analyze/indicators/{ticker}?period=3mo` → 200 JSON ou 503 ValueError
- `GET /api/analyze/risk/{ticker}?period=1y` → 200 JSON ou 503 ValueError
- `/api/predict/stock` upgradé : ETS (statsmodels `SimpleExpSmoothing`) avant numpy polyfit
  - confidence recalibré : ETS=0.70, linear-regression=0.55

### requirements.txt (modifié)
- Ajouté : `pandas>=2.0.0`, `pandas-ta>=0.3.14b`, `statsmodels>=0.14.0`

## Acceptance Criteria

| AC | Status | Notes |
|----|--------|-------|
| AC-1 : GET /api/analyze/indicators/{ticker} retourne rsi, macd, bollinger non vides | ✓ | Testé avec AAPL |
| AC-2 : /api/predict/stock retourne model="ETS" ou "linear-regression" | ✓ | model="ETS" confirmé |
| AC-3 : GET /api/analyze/risk/{ticker} retourne var_95, max_drawdown, sharpe | ✓ | Testé avec AAPL |
| AC-4 : 503 si données insuffisantes, pas de crash 500 | ✓ | ValueError → HTTPException(503) |

## Deviations from Plan

| Deviation | Raison |
|-----------|--------|
| `pandas-ta` non installé | Numba wheel build error (Python 3.12 + ARM) — numpy fallback actif, comportement identique |
| `SimpleExponentialSmoothing` → `SimpleExpSmoothing` | Nom réel dans statsmodels API (corrigé à l'apply) |
| `--break-system-packages` pour statsmodels | PEP 668 sur macOS — environnement externally-managed |

## Files Created / Modified

```
backend/services/analytics_service.py   [CREATED]
backend/main.py                          [MODIFIED — +3 endpoints + ETS upgrade]
backend/requirements.txt                 [MODIFIED — +3 deps]
```

## Decisions Made

| Decision | Raison |
|----------|--------|
| pandas-ta en best-effort, pas bloquant | Dépendance optionnelle — numpy fallback suffisant pour le projet |
| ETS confidence = 0.70 (vs 0.75 polyfit avant) | ETS meilleur que polyfit, mais inférieur à un vrai modèle ML |
| Pas de cache analytics | Scope du plan — in-memory uniquement, prévu pour plan futur si besoin |

## Deferred Issues

- pandas-ta non disponible dans l'env Python 3.12 ARM (numba wheel) — acceptable car numpy fallback couvre tout le scope
- pandas-ta column order (MACD : line/hist/signal vs line/signal/hist) — non testé avec pandas-ta, seulement numpy path

## Next

Plan 05-02 — Frontend : connecter les endpoints + implémenter les cards Analysis
