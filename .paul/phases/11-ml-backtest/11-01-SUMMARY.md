---
phase: 11-ml-backtest
plan: 01
status: PASS
date: 2026-07-02
---

# Résumé d'exécution : ML Backtest (Phase 11-01)

## Objectif
Ajouter un backtest chiffré (évaluation out-of-sample : split train/test rigide, métriques RMSE/MAE/R²) au pipeline de prédiction pour passer la compétence 5 de la grille C → B.

## Tâches accomplies

### Tâche 1 : Fonction backtest_forecast (backend/services/analytics_service.py:225-281)
**Fait** : Refactorisé la fonction existante pour retourner la structure exacte du plan.
- Horizon par défaut : `min(15, max(5, len(prices)//5))`, garde min 20 points train
- Split rigide : `train = prices[:-horizon]`, `test = prices[-horizon:]`
- ETS via statsmodels + fallback polyfit numpy
- Type hints complets : `list[float], int | None → dict`
- Métriques : RMSE, MAE, R² (pas de MAPE/forecast/actual)
- Retour : `{horizon, train_size, test_size, rmse, mae, r2, model}` ✓

**Changements clés** :
- `analytics_service.py:225-281` : refonte complète (signatures, logique, retour)
- Pas de `print()` en prod (logger uniquement)

### Tâche 2 : Branchement dans predict_stock (backend/main.py:41, 991-1011)
**Fait** : Intégré backtest avec try/except et logging.
- Import `backtest_forecast` (ligne 41)
- Calcul dans try/except avant return (lignes 994-1001)
- Logging des erreurs (STD-001) : ValueError (données insuffisantes), Exception (erreurs calc)
- Backtest=None pour modèles LLM (non reproductibles)
- Retour forecast inchangé (AC-3) ✓

**Changements clés** :
- `main.py:41` : import
- `main.py:994-1011` : try/except + branchement

### Tâche 3 : Tests pytest (backend/tests/test_predict_backtest.py:1-106)
**Fait** : Adapté tous les tests à la nouvelle structure.
- 10 tests, tous PASS ✓
- Test structure complète : `{horizon, train_size, test_size, rmse, mae, r2, model}`
- Test linéaire parfaite : r2 ≥ 0.9, rmse/mae < 2
- Test ValueError sur série trop courte
- Test non-finies (NaN/inf)
- Test custom horizon
- Test AC-3 : forecast/predicted_price/history/confidence/model intacts

**Changements clés** :
- `test_predict_backtest.py:16-106` : refonte suite structure

### Tâche 4 : Affichage frontpage (src/types/analytics.ts, src/pages/Analysis/AnalysisPage.tsx)
**Fait** : Affichage carte « Fiabilité du modèle (backtest) » sur page Analyse.
- Type `Backtest` : `{horizon, train_size, test_size, rmse, mae, r2, model}`
- Carte tabular-nums avec palette neutral/emerald/red existante
- État vide discret si backtest absent (LLM ou données insuffisantes)
- Réutilise composants Card/Grid existants (pas nouveau design token)
- Classe `tabular-nums` sur les valeurs numériques
- Suppression anciens composants inutilisés (`BacktestPanel`, `Metric`)

**Changements clés** :
- `analytics.ts:1-20` : remplacement `BacktestResult` → `Backtest`
- `AnalysisPage.tsx:10` : import `Backtest` (au lieu `BacktestResult`)
- `AnalysisPage.tsx:354-408` : nouvelle carte affichage (inline, pas composant séparé)
- `AnalysisPage.tsx:595-645` : suppression composants morts

## Vérifications (STRICTes per plan)

### 1. backtest_forecast (Python)
```
$ cd backend && python3 -c "from services.analytics_service import backtest_forecast; print(backtest_forecast([100+i for i in range(40)]))"
→ {'horizon': 8, 'train_size': 32, 'test_size': 8, 'rmse': 0.0, 'mae': 0.0, 'r2': 1.0, 'model': 'ETS'}
→ r2=1.0 (parfait sur série linéaire) ✓
```

### 2. Tests pytest
```
$ cd backend && python3 -m pytest tests/test_predict_backtest.py -q
→ 10 passed (100%) ✓
```

### 3. Build front
```
$ npm run build
→ tsc -b OK (0 errors)
→ vite build OK → dist/
```

### 4. Lint
```
$ npm run lint
→ eslint src vite.config.ts → 0 warnings ✓
```

## Acceptance Criteria

| AC | Vérif | Status |
|----|-------|--------|
| AC-1 (split train/test rigide) | train = prices[:-K], test = prices[-K:], K jamais en entraînement | ✓ PASS |
| AC-2 (métriques exposées) | prediction.backtest = {horizon, train_size, test_size, rmse, mae, r2, model} | ✓ PASS |
| AC-3 (forecast inchangé) | prediction.{forecast, predicted_price, history, confidence, model} = même structure | ✓ PASS |
| AC-4 (affichage UI) | Carte "Fiabilité du modèle" + RMSE/MAE/R² + état vide si backtest absent | ✓ PASS |
| AC-5 (test auto) | pytest test_predict_backtest.py PASS sur série linéaire + ValueError sur courte | ✓ PASS |

## Décisions

1. **Horizon par défaut** : `min(15, max(5, len//5))` respecte contrainte "min 20 train", adaptatif
2. **Fallback ETS → polyfit** : en cas d'exception statsmodels, pivot numpy linéaire (robustesse)
3. **Affichage frontside** : inline dans Card (pas composant séparé `BacktestPanel`) → simplifie, réutilise existant
4. **Backtest=None pour LLM** : HF model non reproductible (randomness), exclu de backtest
5. **Palette + tokens** : emerald/red existants (R² bon/mauvais), tabular-nums, pas innovation design

## Points d'amélioration futurs (hors-scope)

- Validation croisée k-fold (hors-scope YAGNI pour note)
- Horizon dynamique par symb (lookback historique varie)
- Backtest sur LLM (non reproductible, skippé volontairement)

## Compétence 5 de la grille

**Avant** : C (pas d'évaluation ML, forecast brut)  
**Après** : B (split train/test honnête, 3 métriques exposées + affichées, modèle évalué)  
→ Critère "évaluer compétence ML" satisfait ✓

