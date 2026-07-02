# Points à aborder à l'oral — grille d'évaluation

Basé sur `public/grille evaluation.xlsx` et `EVALUATION.md` (scan détaillé fichier:ligne, mis à jour après le milestone v0.7). Barème : E(0) / D(8) / C(12) / B(15) / A(20).

**App live à montrer en démo** : https://finance.camcamcarre.fr

## 1. Acquérir des données — A-
- Yahoo Finance (`yfinance`) : cours + historique 1 an
- **Cross-check résilience** : fallback Stooq si Yahoo échoue (`yahoo_etf_service.py:83-120`), loggé à chaque tentative
- Ingestion en base SQLite persistante (pas de données fantômes) : `backend/seed.py` (tickers réels CW8.PA, SPY, AAPL, NVDA, BTC-USD…)

## 2. Préparer et nettoyer les données — B
- `dropna()` sur clôtures/rendements, gestion NaN/inf → `null` JSON
- Normalisation tz-aware → naïve avant intersection des séries (`montecarlo_service.py:52-57`)
- Validation d'entrée (regex ticker, payloads Pydantic sur les endpoints POST)

## 3. Explorer et analyser les données — A
- RSI, MACD, Bollinger ; VaR 95/99%, max drawdown, volatilité annualisée, Sharpe
- Matrice de corrélation de Pearson
- **EDA formalisée** dans `docs/analyse-projet.ipynb` : distribution des rendements (histogramme), asymétrie (skew), 3 conclusions chiffrées

## 4. Visualiser les données — A
- Recharts natif : `MultiLineChart` avec tooltip + légende interactive (toggle affichage courbe au clic)
- Heatmap de corrélation accessible : `aria-label` par cellule, `caption`, légende de couleur

## 5. Appliquer une méthode de ML et l'évaluer — B
- Prédiction de cours en cascade : régression OLS → ETS (statsmodels) → LLM (Qwen2.5-72B)
- **Backtest chiffré ajouté** : split train/test rigide, métriques RMSE/MAE/R² exposées et affichées en UI ("Fiabilité du modèle")
- Exemple prod réel : `/api/predict/stock?symbol=AAPL` → horizon 12, train 48, test 12, RMSE 13.05
- Backtest = `None` si modèle LLM utilisé (non reproductible, assumé et documenté)

## 6. Prédire et donner des recommandations — A
- Simulation Monte Carlo GBM : percentiles p5→p95, VaR 95%
- Recommandation ETF : score 0-100 (TER + ESG) filtré par profil investisseur
- **Transparence du scoring** : `match_breakdown` retourné par l'API (risk/horizon/esg/ter/goal), affiché en UI, somme validée == score

## 7. Concevoir et déployer une interface interactive — A
- PWA Preact/TS/Vite/Tailwind, Redux, offline, auth JWT bout-en-bout
- CI GitHub Actions : lint → build → tests backend (pytest) → E2E Playwright
- **Déploiement public réel** : Docker + Traefik sur VPS, TLS Let's Encrypt, https://finance.camcamcarre.fr — vérifié end-to-end (register/login/predict en prod)

## 8. Documenter son projet — A
- `docs/` complet : cahier des charges, API, structure, roadmap, répartition des tâches
- Notebook pipeline + EDA (`analyse-projet.ipynb`)
- 3 niveaux de tests documentés : E2E Playwright (`e2e/E2E-TEST-PLAN.md`), pytest backend, vitest frontend

## Synthèse
Milestone v0.7 clos : comp. 5 (C→B), comp. 7 (B→A, URL live), comp. 1/3/4/6 renforcées vers A. Score visé ≈ 145-150/160 (`.paul/MILESTONES.md`).

## Message à faire passer à l'oral
- Ouvrir sur l'URL live — montrer que ça tourne en prod, pas juste en local.
- Pour la compétence 5, assumer explicitement le choix : pas de backtest sur le modèle LLM (non reproductible), volontaire et documenté — split train/test réel sur les fallbacks statistiques.
- Si le jury pousse sur "et une vraie confusion matrix / cross-validation ?" : assumer que c'est hors-scope volontaire (YAGNI pour la note visée), mentionné comme piste dans `.paul/phases/11-ml-backtest/11-01-SUMMARY.md`.
