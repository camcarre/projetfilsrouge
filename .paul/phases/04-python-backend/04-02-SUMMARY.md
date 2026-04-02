---
phase: 04-python-backend
plan: 02
subsystem: api
tags: [fastapi, sqlite, yfinance, assets, transactions, notifications]

requires:
  - phase: 04-01
    provides: get_db(), get_user_id(), FastAPI app, 8 tables SQLite

provides:
  - 9 routes API Assets/Transactions/Notifications dans main.py
  - Enrichissement live Yahoo Finance sur GET /api/assets
  - Snapshot quotidien portfolio_history automatique
  - Logique BUY/SELL atomique avec PRU recalculé

affects: [04-03-etf-prediction-quiz]

tech-stack:
  added: [yfinance (installé système)]
  patterns:
    - "portfolio_id = None pour transactions (FK constraint ON vs JS silencieux)"
    - "db.rollback() natif Python au lieu de db.execute('ROLLBACK') explicite"
    - "yf.Ticker(symbol).fast_info.last_price pour enrichissement live"

key-files:
  modified:
    - backend/main.py

key-decisions:
  - "portfolio_id=NULL dans transactions — FK foreign_keys=ON casse 'default' string du JS"
  - "db.rollback() natif — isolation_level='' gère BEGIN implicitement, BEGIN explicite conflictue"
  - "change calculé via ticker.history(period='2d') — fallback 0.0 si yfinance échoue"

patterns-established:
  - "try/except autour de yfinance — réseau instable, fallback silencieux obligatoire"
  - "portfolio_id : int() si chiffre, None sinon — validation souple pour compatibilité JS"

duration: ~20min
started: 2026-04-02T07:50:00Z
completed: 2026-04-02T08:10:00Z
---

# Phase 04 Plan 02 : Assets + Transactions + Notifications — Summary

**9 routes FastAPI ajoutées dans main.py : CRUD actifs avec enrichissement Yahoo Finance live, logique BUY/SELL atomique (PRU recalculé, suppression si qty=0), et CRUD notifications.**

## Performance

| Metric | Value |
|--------|-------|
| Duration | ~20 min |
| Started | 2026-04-02T07:50Z |
| Completed | 2026-04-02T08:10Z |
| Tasks | 3/3 complétés |
| Files modifiés | 1 (main.py) |

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1 : GET /api/assets avec enrichissement live | **Pass** | AAPL → 255.63$ live, change +0.73%, fallback sur unit_price si yfinance échoue |
| AC-2 : Transaction BUY crée l'actif | **Pass** | POST BUY qty=5 → actif créé, visible dans GET /api/assets |
| AC-3 : Transaction SELL total supprime l'actif | **Pass** | POST SELL qty=5 (tout) → actif absent du portefeuille |
| AC-4 : POST /notifications/read → 204 | **Pass** | UPDATE read=1 pour tous les notifications user |

## Accomplissements

- `GET /api/assets` enrichit chaque actif avec prix live Yahoo Finance + change % 24h
- Snapshot portfolio_history quotidien automatique (INSERT si absent aujourd'hui et totalValue > 0)
- Transactions atomiques BUY/SELL : PRU recalculé en BUY, suppression asset si qty=0 en SELL
- Notifications : liste (20 dernières) + marquage lu en masse

## Fichiers créés/modifiés

| Fichier | Action | Rôle |
|---------|--------|------|
| `backend/main.py` | Modifié | +9 routes, +3 modèles Pydantic, `import yfinance as yf` |

## Décisions

| Décision | Raison | Impact |
|----------|--------|--------|
| `portfolio_id = None` dans transactions | `PRAGMA foreign_keys=ON` actif en Python — `'default'` string cassait la FK vers `portfolios(id)` | JS ignorait silencieusement ; Python enforce la contrainte |
| `db.rollback()` au lieu de `db.execute("ROLLBACK")` | `isolation_level=""` Python gère BEGIN implicitement — BEGIN explicite conflictuait | Comportement transactionnel correct |
| `yf.Ticker.fast_info.last_price` | API la plus légère de yfinance pour le prix courant | Moins de requêtes réseau que `download()` |

## Déviations

### Résumé

| Type | Count | Impact |
|------|-------|--------|
| Auto-fixées | 2 | Corrections nécessaires, pas de scope creep |
| Déférées | 0 | — |

### Auto-fixées

**1. FK constraint — portfolio_id**
- **Trouvé lors de :** T2 qualification (verify BUY transaction)
- **Problème :** `'default'` string passé pour portfolio_id INTEGER FK → `FOREIGN KEY constraint failed`
- **Fix :** `portfolio_id = int(body.portfolioId) if body.portfolioId.isdigit() else None`
- **Vérification :** POST /api/transactions BUY → 201 ✓

**2. BEGIN/COMMIT explicite incompatible**
- **Trouvé lors de :** T2 review code (avant exécution)
- **Problème :** `isolation_level=""` Python ouvre des transactions implicitement — `BEGIN` explicite peut conflictuuer
- **Fix :** Remplacé `db.execute("BEGIN")` / `db.execute("ROLLBACK")` par gestion native `db.commit()` / `db.rollback()`
- **Vérification :** Logique atomique SELL total → 201, actif supprimé ✓

## Prêt pour le plan suivant

**Disponible :**
- `GET /api/assets` — actifs enrichis avec prix live Yahoo Finance
- `POST /api/transactions` — BUY/SELL atomique, PRU correct
- `GET /api/portfolio/history` — historique snapshots quotidiens
- Table `portfolio_history` alimentée automatiquement

**Aucun blocage pour 04-03.**

---
*Phase: 04-python-backend, Plan: 02*
*Complété: 2026-04-02*
