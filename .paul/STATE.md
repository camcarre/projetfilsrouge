# STATE

## Current Position

Milestone: v0.3 Qualité & Tests
Phase: 06-02 CI/CD GitHub Actions — Planning
Plan: 06-02-PLAN.md créé, en attente d'approbation
Status: PLAN créé, prêt pour APPLY
Last activity: 2026-06-02 — ROADMAP mis à jour, 06-02-PLAN.md + 07-01-PLAN.md créés

Progress:
- Migration Backend (v0.1): [██████████] 100% ✓
- Phase 04: [██████████] 100% ✓
- Phase 05: [██████████] 100% ✓
- Phase 05-03 (Profil): [██████████] 100% ✓
- Phase 06-01 (Playwright): [██████████] 100% ✓
- Phase 06-02 (CI/CD): [██████████] 100% ✓

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [06-02 loop fermé — CI/CD COMPLETE]
```

## Session Continuity

Last session: 2026-06-02
Stopped at: Plans 06-02 + 07-01 créés
Next action: Phase 07-02 Skeleton loaders + états vides, ou merger PR #10 dans main
Resume file: .paul/phases/07-sprint1-features/07-01-SUMMARY.md

## Plans créés (prêts à exécuter)

| Plan | Fichier | Issue GitHub | Priorité |
|------|---------|--------------|----------|
| 06-02 | .paul/phases/06-e2e-tests/06-02-PLAN.md | #11 CI/CD | Sprint 1 immédiat |
| 07-01 | .paul/phases/07-sprint1-features/07-01-PLAN.md | #4 Export CSV | Sprint 1 |

## En attente (phases planifiées dans ROADMAP)

- Phase 06-03 — Lighthouse performance
- Phase 07-02 — Skeleton loaders + états vides (#3)
- Phase 08 — Comparateur ETF + VaR UI + Corrélation (#5, #9, #12)
- Phase 09 — Monte Carlo + Alertes + Auth refresh (#8, #13, #14)
- Phase 10 — Déploiement production (#6)
- Phase 01 — Quick Wins UI
- Phase 02 — Composants Feedback
- Phase 03 — UX Flows

## Decisions

| Date | Decision | Raison |
|------|----------|--------|
| 2026-04-02 | Palette = neutral + emerald + red uniquement | Minimalisme, audit UX |
| 2026-04-02 | Unifier nav active sur emerald-50/700 (desktop = mobile) | Cohérence audit UX |
| 2026-04-02 | tabular-nums systématique sur chiffres financiers | Lisibilité données |
| 2026-04-02 | Backend FastAPI — portfolio_id=NULL pour transactions | PRAGMA foreign_keys=ON actif en Python |
| 2026-04-02 | Quiz sans HF token → fallback statique (pas 503) | UX non bloquée sans clé IA |

## Accumulated Context

### Backend Python (Phase 04) — Disponible
- Auth : POST /auth/register, /auth/login, GET /auth/me, POST /auth/logout
- Assets : GET/POST/PATCH/DELETE /api/assets (enrichis Yahoo Finance live)
- Transactions : POST /api/transactions (BUY/SELL atomique, PRU recalculé)
- Portfolio : GET /api/portfolio/history (snapshots quotidiens)
- Notifications : GET/POST /api/notifications, /api/notifications/read
- ETF : GET /api/etfs, GET /api/etfs/{ticker} + /performance + /holdings + /history, POST /api/etfs/compare
- Predict : GET /api/predict/stock (numpy + ETS Holt trend='add' + HF Router Qwen2.5-72B)
- Quiz : GET /api/quiz/generate (HF Router + fallback statique)
- Profile : GET/POST /api/profile (UPSERT SQLite)
- ETF Recommended : GET /api/etfs/recommended (scoring 100pts)
- Analytics : GET /api/analytics/{ticker} (RSI, MACD, Bollinger, VaR, drawdown, Sharpe)
