# Grille d'évaluation — Projet Fil Rouge (oral final)

> **Projet** : Camille Douaud — *Système d'aide à la décision pour l'investissement en actions d'entreprises* (`finance-pwa`)
> **But de ce fichier** : scanner tout le projet, compétence par compétence, et prouver chaque acquis avec des preuves `fichier:ligne`. À remplir en `/loop`.
> **Dernier scan** : 2026-07-02 — backend FastAPI/Python + frontend Preact/TS.

## Barème

| Note | Points | Niveau |
|------|--------|--------|
| E | 0 | Non acquis |
| D | 8 | En cours d'acquisition |
| C | 12 | Partiellement acquis |
| B | 15 | Acquis |
| A | 20 | Maîtrisé |

## Instructions pour le scan (`/loop`)

Pour **chaque** compétence ci-dessous :
1. Chercher dans tout le repo les preuves concrètes (code, data, docs, tests).
2. Remplir **Preuves** avec des `fichier:ligne`.
3. Poser un **Niveau visé** (A→E) honnête, justifié en 1 ligne.
4. Lister les **Manques** = ce qu'il reste à faire pour monter d'un cran.
5. Ne rien inventer. « Vide = vraiment vide ». Si une compétence n'est pas couverte, le dire.

---

## 1. Acquérir des données

- **Attendu** : sources de données identifiées, collecte/scraping/API, ingestion.
- **Preuves** :
  - API externe **Yahoo Finance via `yfinance`** : `backend/services/yahoo_etf_service.py:14`, `backend/services/analytics_service.py:7`, `backend/services/montecarlo_service.py:14`, `backend/main.py:13`.
  - Requêtes HTTP directes (`requests`) : `backend/seed.py:6`, `backend/main.py:12` (fallback + seed).
  - Ingestion en BDD SQLite : `backend/database.py` (schéma + connexion), seed d'actifs/transactions réels avec vrais tickers `backend/seed.py:18-43` (CW8.PA, SPY, AAPL, NVDA, BTC-USD…).
  - Endpoints d'exposition/ingestion : `backend/main.py:233` (`GET /api/assets`), `:314` (`POST /api/assets`), `:564` (`POST /api/transactions`), `:709` (`GET /api/etfs`).
  - Cache mémoire des appels Yahoo : `backend/services/yahoo_etf_service.py:38`.
- **Niveau visé** : **B (Acquis, 15)** — vraie API financière externe + ingestion en base persistante, pas de données fantômes.
- **Manques** : automatiser un rafraîchissement planifié (cron/refresh) ; documenter les quotas/limites de l'API Yahoo ; pour viser A, tracer une 2ᵉ source croisée.

## 2. Préparer et nettoyer les données

- **Attendu** : nettoyage, normalisation, gestion des valeurs manquantes, formats.
- **Preuves** :
  - Valeurs manquantes : `dropna()` sur les clôtures et rendements `backend/services/analytics_service.py:145-146,184`, `backend/services/yahoo_etf_service.py:150` ; `np.full(..., np.nan)` pour amorçage `analytics_service.py:37`.
  - Normalisation des dates **tz-aware → naïve** (bug corrigé) : `backend/services/montecarlo_service.py:52-57` (`tz_localize(None)` puis `normalize()`).
  - Conversion de types robuste : `.values.astype(float)` `analytics_service.py:151`.
  - Validation d'entrée aux frontières : regex ticker `backend/services/yahoo_etf_service.py:47-48` ; garde « pas assez de rendements » `analytics_service.py:148-149,185`.
  - Validation de payloads (FastAPI/pydantic) sur les endpoints `POST` (`main.py:314,491,564`).
- **Niveau visé** : **B (Acquis, 15)** — nettoyage, NaN, tz et validation présents et testés.
- **Manques** : centraliser une couche de nettoyage réutilisable (aujourd'hui dispersée par service) ; documenter la stratégie de gestion des trous de marché (jours fériés).

## 3. Explorer et analyser les données

- **Attendu** : stats descriptives, corrélations, analyse exploratoire.
- **Preuves** :
  - Stats descriptives (moyenne/écart-type glissants) : `backend/services/analytics_service.py:97-101`.
  - Indicateurs techniques **RSI** : `analytics_service.py:37-49` ; endpoint `GET /api/analyze/indicators/{ticker}` `main.py:849`.
  - Métriques de risque : **volatilité annualisée, rendement annualisé, Sharpe, VaR 95/99 %, max drawdown** `analytics_service.py:139-174` ; endpoint `GET /api/analyze/risk/{ticker}` `main.py:863`.
  - **Matrice de corrélation de Pearson** entre rendements : `analytics_service.py:178-191` ; endpoint `GET /api/analyze/correlation` `main.py:877`.
  - Notebook d'analyse exploratoire : `docs/analyse-projet.ipynb` (18k).
- **Niveau visé** : **B (Acquis, 15)** — analyse financière réelle (risque + corrélation + indicateurs), pas de simple affichage.
- **Manques** : formaliser l'EDA du notebook (conclusions écrites) ; ajouter distributions/histogrammes de rendements pour viser A.

## 4. Visualiser les données

- **Attendu** : graphiques pertinents, lisibles, interactifs (charts, heatmap...).
- **Preuves** :
  - Graphe multi-courbes (comparateur ETF) **Recharts** : `src/components/ui/MultiLineChart.tsx:20`, utilisé `src/pages/Etf/EtfPage.tsx:446` ; testé unitairement `src/components/ui/MultiLineChart.test.tsx`.
  - **Heatmap de corrélation** : `src/components/ui/CorrelationHeatmap.tsx:16`, rendu `src/pages/Analysis/AnalysisPage.tsx:510`.
  - Historique de portefeuille formaté pour charts : `src/services/etfHistoryService.ts:47` ; endpoint `GET /api/portfolio/history` `main.py:429`.
  - Bandes de percentiles Monte Carlo (p5→p95) exposées pour tracé : `backend/services/montecarlo_service.py:143`.
  - États de chargement/erreur/vide gérés autour des graphes : `AnalysisPage.tsx:496-510`.
- **Niveau visé** : **B (Acquis, 15)** — plusieurs types de graphes pertinents + états UX, testés.
- **Manques** : tooltips/interactions riches (zoom, légende cliquable) ; accessibilité des couleurs de la heatmap pour viser A.

## 5. Appliquer une méthode de machine learning et l'évaluer

- **Attendu** : modèle ML entraîné, split train/test, métriques d'évaluation.
- **Preuves** :
  - Prévision de cours `GET /api/predict/stock` `backend/main.py:907` avec 3 méthodes en cascade :
    - **Régression linéaire** `np.polyfit` `main.py:973` (+ bruit résiduel calibré `:977`).
    - **Lissage exponentiel ETS** (`statsmodels ExponentialSmoothing`) `main.py:962-966`.
    - Fallback LLM (HuggingFace) `main.py:938`.
  - Simulation stochastique **Monte Carlo GBM** vectorisée : `backend/services/montecarlo_service.py:61-166` (chocs normaux, percentiles, VaR MC) — méthode probabiliste, testée `backend/tests/test_montecarlo.py`.
- **Niveau visé** : **C (Partiellement acquis, 12)** — méthodes statistiques/prédictives réelles (régression, ETS, MC) mais **pas de ML supervisé évalué**.
- **Manques** (bloquant pour B/A) : **aucun split train/test** ni **métrique d'évaluation** (RMSE, MAE, R²) ; pas de validation croisée ni de comparaison de modèles. Ajouter un backtest chiffré du forecast (erreur out-of-sample) fait passer à B.

## 6. Prédire et donner des recommandations à partir de données

- **Attendu** : prédictions, reco actionnables (ex : recommandations ETF/actions).
- **Preuves** :
  - Prédiction de prix (forecast 15-30 pas + `predicted_price`) : `backend/main.py:907,977-988`.
  - **Recommandation d'ETF personnalisée** selon le profil investisseur : `GET /api/etfs/recommended` `main.py:778` — filtres zone/secteur/ESG/TER `:799-807`, **scoring `_compute_match_score`** `:812`, tri décroissant `:815`.
  - Profil investisseur (tolérance risque, horizon, objectif, ESG) : `GET/POST /api/profile` `main.py:1014,1028`, quiz `GET /api/quiz/generate` `main.py:1128`.
  - Score composite ETF (TER + ESG) : `backend/services/yahoo_etf_service.py:57`.
  - Alertes/notifications actionnables : `main.py:473,491,665`.
- **Niveau visé** : **B (Acquis, 15)** — reco personnalisée basée sur profil + scoring + prédiction, actionnable pour l'utilisateur.
- **Manques** : expliquer le poids de chaque critère du score (transparence) ; mesurer la pertinence des reco (feedback/backtest) pour viser A.

## 7. Concevoir et déployer une interface interactive

- **Attendu** : UI fonctionnelle, parcours utilisateur, déploiement, PWA.
- **Preuves** :
  - Routing complet 10 routes : `src/App.tsx:41-50` (Dashboard, Auth, Portfolio, Analysis, ETF, Education, Settings, Profil questionnaire/edit, 404).
  - Pages réelles : `src/pages/{Dashboard,Auth,Portfolio,Analysis,Etf,Education,Profile}`, `SettingsPage.tsx`.
  - Auth JWT/Bearer bout-en-bout : `main.py:141` (register), `:173` (login), `:197` (me), `:221` (logout) + `bcrypt` (requirements).
  - **PWA** : `vite.config.ts:27-52` (`VitePWA`, `registerType:'autoUpdate'`, manifest, workbox) ; icônes `public/icons/`.
  - **CI/CD** GitHub Actions : `.github/workflows/ci.yml` — jobs lint → build → test-backend (pytest) → playwright (build + serveurs + E2E + upload rapport) `ci.yml:10-106`.
  - Robustesse UI : `ErrorBoundary.tsx`, `PageLoadingFallback.tsx`, skeletons.
- **Niveau visé** : **B (Acquis, 15)** — app multi-pages fonctionnelle, auth, PWA, pipeline CI complet.
- **Manques** : **déploiement public réel** (URL en prod) non prouvé dans le repo — le CI build/teste mais ne déploie pas. Ajouter un job deploy (Vercel/Netlify + host backend) fait passer à A.

## 8. Documenter son projet

- **Attendu** : README, specs, cahier des charges, docs techniques, tests documentés.
- **Preuves** :
  - README racine (`README.md`, 6.3k) + `backend/README.md`.
  - Specs & cadrage : `docs/cahier_des_charges_app_finance.md` (12k), `docs/GUIDE-FIL-ROUGE-YNOV.md` (16k), `docs/PROJECT.md`, `docs/ROADMAP.md`, `docs/repartition_taches.md`.
  - Docs techniques : `docs/API_BACKEND_CUSTOM.md`, `docs/BACKEND.md`, `docs/STRUCTURE.md`, `docs/FICHIERS_RACINE.md`, `docs/phases/`.
  - Suivi projet PAUL : `.paul/STATE.md`, `.paul/ROADMAP.md`, phases.
  - Notebook d'analyse : `docs/analyse-projet.ipynb`.
  - **Tests documentés** : plan E2E `e2e/E2E-TEST-PLAN.md` (22k) ; specs Playwright `e2e/*.spec.ts` (auth, dashboard, portfolio, analysis, etf, education, montecarlo, navigation, settings, profile, e2e-flow) ; pytest `backend/tests/{test_api,test_alerts,test_montecarlo}.py` ; unitaires vitest `src/utils/format.test.ts`, `src/components/ui/MultiLineChart.test.tsx`.
- **Niveau visé** : **A (Maîtrisé, 20)** — documentation large (specs, cahier des charges, archi, API, roadmap) + trois niveaux de tests documentés.
- **Manques** : rien de bloquant. Optionnel : diagramme d'architecture visuel + capture des rapports de couverture.

---

## Synthèse

| # | Compétence | Niveau visé | Points |
|---|------------|-------------|--------|
| 1 | Acquérir des données | B | 15 |
| 2 | Préparer et nettoyer | B | 15 |
| 3 | Explorer et analyser | B | 15 |
| 4 | Visualiser | B | 15 |
| 5 | ML + évaluation | C | 12 |
| 6 | Prédire / recommander | B | 15 |
| 7 | Interface interactive | B | 15 |
| 8 | Documenter | A | 20 |
| | **Total / 160** | | **122** |

### Priorité pour gagner des points

1. **Compétence 5 (C→B, +3)** — la plus faible et la plus rentable : ajouter un **backtest chiffré** du forecast (split train/test + RMSE/MAE/R²) sur `GET /api/predict/stock`.
2. **Compétence 7 (B→A, +5)** — ajouter un **job de déploiement** au CI et fournir une **URL publique** (front Vercel/Netlify + backend hébergé).
3. Compétences 1/3/4/6 (B→A, +5 chacune) — croiser une 2ᵉ source, formaliser l'EDA, enrichir l'interactivité des graphes, expliciter le scoring des reco.
