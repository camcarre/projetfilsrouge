# Plan 05-01 SUMMARY — Backend: investor_profiles + endpoints

## Complété le
2026-06-02

## Ce qui a été livré

### database.py
- Table `investor_profiles` ajoutée au schéma SQLite
- Champs : `user_id` (UNIQUE FK), `risk_tolerance` (1-5), `investment_horizon`, `investment_goal`, `monthly_investment`, `esg_preference`, `knowledge_level`, `created_at`, `updated_at`
- Migration transparente via `CREATE TABLE IF NOT EXISTS`

### main.py
- `InvestorProfileBody` — Pydantic model
- `GET /api/profile` — retourne le profil ou 404
- `POST /api/profile` — upsert SQLite (`ON CONFLICT DO UPDATE`)
- `GET /api/etfs/recommended` — liste ETFs avec `match_score` calculé, triée par score décroissant
- `_compute_match_score(etf, profile)` — scoring 100pts (risque 30 + horizon 25 + ESG 20 + TER 15 + objectif 10)
- `_ESG_SCORES` — constante module-level

## Corrections simplify appliquées
- `/api/etfs/recommended` déplacé AVANT `/{ticker}` dans l'ordre d'enregistrement FastAPI (bug routing)
- `get_etfs()` retourne une `list` — corrigé `etfs_data.get("etfs", [])` → `get_etfs(filters)` direct
- `isinstance(etf, dict)` par itération supprimé — remplacé par `{**etf}`
- `ESG_SCORES` sorti de la fonction → constante module `_ESG_SCORES`
- SELECT redondant post-INSERT supprimé dans `save_profile`

## Décisions
- UPSERT SQLite natif (`ON CONFLICT(user_id) DO UPDATE`) — pas de read-before-write
- Route `recommended` enregistrée avant `{ticker}` — FastAPI priorité exacte sur paramétrique

## AC validés
- AC-1 : table créée ✓
- AC-2 : GET /api/profile ✓ (404 si absent, 200 sinon)
- AC-3 : POST /api/profile ✓ (upsert)
- AC-4 : GET /api/etfs/recommended ✓ (scores cohérents, 404 sans profil)
