# Points à aborder à l'oral — grille d'évaluation

Basé sur `public/grille evaluation.xlsx`. Barème : E(0) / D(8) / C(12) / B(15) / A(20).

## 1. Acquérir des données
- Yahoo Finance (`yfinance`) : cours temps réel + historique 1 an
- Référentiel ETF : `backend/data/etf-tickers-available.json` + `etf-meta-available.json` (TER, ESG, zone, thème)
- API Hugging Face (Qwen2.5-72B) pour prédiction de cours et quiz éducatif

## 2. Préparer et nettoyer les données
- Suppression des NaN, valeurs infinies → `null` pour JSON
- Normalisation des fuseaux horaires avant intersection des séries (actions vs crypto)
- Cache mémoire 5 min pour limiter les appels Yahoo Finance
- Fallback données mockées si Yahoo Finance indisponible

## 3. Explorer et analyser les données
- Indicateurs techniques : RSI, MACD, bandes de Bollinger
- Métriques de risque : VaR 95/99%, max drawdown, volatilité annualisée, Sharpe ratio
- Matrice de corrélation de Pearson entre actifs

## 4. Visualiser les données
- Dashboard Recharts : performance, répartition portefeuille, corrélation
- Pages dédiées : Dashboard, Portfolio, Analysis, ETF, Education

## 5. Appliquer une méthode de ML et l'évaluer
- Prédiction de cours via LLM (Qwen2.5-72B, HF router) sur 15 derniers prix
- Fallback en cascade : ETS (statsmodels) → régression OLS + bruit gaussien
- Score de confiance par méthode (0.6 LLM / 0.7 ETS / 0.55 régression)
- **Faiblesse à assumer** : pas de backtest quantitatif (RMSE/MAE) — heuristique de confiance seulement

## 6. Prédire et donner des recommandations
- Simulation Monte Carlo (GBM) : percentiles p5/p25/p50/p75/p95, VaR 95% du portefeuille
- Score de match ETF 0-100 : 40% TER + 60% ESG, filtré par profil investisseur
- Système d'alertes à seuils sur actifs et portefeuille

## 7. Concevoir et déployer une interface interactive
- PWA Preact + TypeScript + Vite + Tailwind, Redux, offline (Service Worker, Cache API), push notifications
- **Faiblesse à assumer** : pas de déploiement prod (VPS/Docker) — CI limitée à lint/build/tests, déploiement prévu phase 4

## 8. Documenter son projet
- `docs/` : cahier des charges, doc API backend, structure, répartition des tâches
- `docs/analyse-projet.ipynb` : notebook qui réplique et documente le pipeline réel
- `e2e/E2E-TEST-PLAN.md` + specs Playwright par page (auth, dashboard, portfolio, ETF, Monte Carlo...)

## À ne pas oublier
- Nommer les 2 points faibles (axes 5 et 7) avant que le jury les trouve — présenter comme axes d'amélioration identifiés, pas comme oublis.
