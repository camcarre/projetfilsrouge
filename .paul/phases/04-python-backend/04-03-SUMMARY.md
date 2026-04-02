---
phase: 04-python-backend
plan: 03
subsystem: api
tags: [fastapi, yfinance, etf, prediction, quiz, numpy, huggingface]

requires:
  - phase: 04-02
    provides: GET /api/assets, POST /api/transactions, auth routes, SQLite DB

provides:
  - backend/services/yahoo_etf_service.py — service ETF complet (get_etfs, get_etf_details, get_etf_performance, get_etf_holdings, validate_ticker, cache 5 min)
  - 8 routes FastAPI : GET/POST /api/etfs, GET /api/etfs/{ticker} + sous-routes, GET /api/predict/stock, GET /api/quiz/generate

affects: [frontend ETF discovery, frontend quiz page, frontend portfolio charts]

tech-stack:
  added: [numpy (régression linéaire fallback), requests as http_requests]
  patterns:
    - "try/except par ticker dans get_etfs() — yfinance instable, EWZ.PA / MEUH.PA delisted"
    - "import requests as http_requests — éviter conflit avec FastAPI Request"
    - "fallback statique isMock=True si tous les tickers yfinance échouent"
    - "validate_ticker() systématique avant tout appel yfinance"

key-files:
  created:
    - backend/services/yahoo_etf_service.py
  modified:
    - backend/main.py

key-decisions:
  - "Quiz sans HF_API_TOKEN → fallback statique (pas 503) — différence intentionnelle avec JS"
  - "POST /api/etfs/compare défini avant GET /api/etfs/{ticker} — ordre FastAPI"
  - "predict/stock sans auth requise — cohérence avec server.js original"
  - "numpy polyfit + bruit gaussien en fallback prédiction — linéaire mais réaliste visuellement"

patterns-established:
  - "Sous-routes /{ticker}/performance, /{ticker}/holdings, /{ticker}/history définis AVANT /{ticker}"
  - "HF Router via requests.post avec timeout=30 — toujours wrappé en try/except avec fallback"

duration: ~25min
started: 2026-04-02T08:10:00Z
completed: 2026-04-02T08:35:00Z
---

# Phase 04 Plan 03 : ETF Service + Prediction + Quiz — Summary

**Port complet de `yahooEtfService.js` en Python + 8 routes FastAPI : découverte ETF live via yfinance, prédiction de cours (numpy fallback + HF Router), génération de quiz financier.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~25 min |
| Started | 2026-04-02T08:10Z |
| Completed | 2026-04-02T08:35Z |
| Tasks | 3/3 complétés |
| Files modifiés | 2 (yahoo_etf_service.py créé, main.py modifié) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1 : GET /api/etfs retourne une liste d'ETF | **Pass** | 18/20 ETF live (EWZ.PA, MEUH.PA delisted — skippés silencieusement) |
| AC-2 : GET /api/etfs/CW8.PA retourne les détails | **Pass** | quote + historical 1an (252 points) + name depuis yfinance.info |
| AC-3 : GET /api/predict/stock?symbol=AAPL → forecast | **Pass** | numpy polyfit, 30 points, current_price=255.63, model=linear-regression |
| AC-4 : GET /api/quiz/generate (token) → questions | **Pass** | fallback statique 2 questions, isFallback=true (pas de HF_API_TOKEN en dev) |

## Accomplissements

- `yahoo_etf_service.py` : port fidèle de `yahooEtfService.js` — validate_ticker, _calc_match, get_etfs/details/performance/holdings, cache dict 5 min
- 18 ETF chargés live depuis Yahoo Finance (2 delisted ignorés par try/except)
- Prédiction stock fonctionnelle sans HF_API_TOKEN : régression numpy + bruit proportionnel au std résiduel
- Quiz avec fallback statique immédiat si HF_API_TOKEN absent — UX non bloquée
- Ticker invalide → 400 systématique sur toutes les routes ETF

## Fichiers créés/modifiés

| Fichier | Action | Rôle |
|---------|--------|------|
| `backend/services/yahoo_etf_service.py` | Créé | Service ETF complet — 6 fonctions, cache 5 min, filtrage multi-critère |
| `backend/main.py` | Modifié | +8 routes, +imports (numpy, requests as http_requests), +CompareBody model |

## Décisions

| Décision | Raison | Impact |
|----------|--------|--------|
| Quiz fallback statique (pas 503) sans HF token | UX non bloquée — le frontend peut toujours afficher des questions | Différence intentionnelle avec server.js |
| `requests as http_requests` | Éviter conflit de nom avec `from fastapi import Request` | Pattern à suivre dans toutes les routes HF futures |
| Sous-routes `/performance`, `/holdings`, `/history` avant `/{ticker}` | FastAPI capture le premier match — "performance" serait lu comme ticker sinon | Ordre obligatoire |

## Déviations

### Résumé

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixées | 0 | — |
| Déférées | 0 | — |

Aucune déviation — plan exécuté exactement comme spécifié.

## Issues Encountered

| Issue | Resolution |
|-------|------------|
| EWZ.PA et MEUH.PA delisted — `'currentTradingPeriod'` KeyError | Attendu — try/except par ticker dans get_etfs(), continue silencieux. 18/20 ETF retournés. |

## Prêt pour le plan suivant

**Disponible :**
- `GET /api/etfs` — liste live avec filtres zone/secteur/ESG/TER
- `GET /api/etfs/{ticker}` — détails complets : quote, historical 1an, esgScore
- `GET /api/etfs/{ticker}/performance` — perf % + volatilité annualisée
- `GET /api/etfs/{ticker}/history` — données graphique OHLCV
- `POST /api/etfs/compare` — comparaison multi-ETF
- `GET /api/predict/stock` — forecast 30j (numpy fallback, HF si token)
- `GET /api/quiz/generate` — questions IA ou fallback statique

**Aucun blocage pour les phases suivantes.**

---
*Phase: 04-python-backend, Plan: 03*
*Complété: 2026-04-02*
