# STATE

## Current Position

Milestone: v0.5 Features Sprint 2
Phase: 08 Comparateur ETF + VaR UI + Corrélation — Planning
Plan: 08-01 créé, en attente d'approbation
Status: PLAN créé, prêt pour APPLY
Last activity: 2026-07-02 — 08-01-PLAN.md créé (Comparateur ETF multi-courbes, issue #9)

Progress:
- Migration Backend (v0.1): [██████████] 100% ✓
- Phase 04: [██████████] 100% ✓
- Phase 05: [██████████] 100% ✓
- Phase 05-03 (Profil): [██████████] 100% ✓
- Phase 06-01 (Playwright): [██████████] 100% ✓
- Phase 06-02 (CI/CD): [██████████] 100% ✓
- Phase 07-02 (Skeleton/UX): [██████████] 100% ✓
- Phase 08 (Comparateur/VaR/Corrélation): [░░░░░░░░░░] 0% — plan 01/3 créé

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ○        ○     [08-01 plan créé, en attente d'approbation]
```

## Session Continuity

Last session: 2026-07-02
Stopped at: Plan 08-01 créé
Next action: Revue et approbation du plan 08-01, puis /paul:apply .paul/phases/08-etf-comparator/08-01-PLAN.md
Resume file: .paul/phases/08-etf-comparator/08-01-PLAN.md

## Plans créés (prêts à exécuter)

| Plan | Fichier | Issue GitHub | Priorité |
|------|---------|--------------|----------|
| 08-01 | .paul/phases/08-etf-comparator/08-01-PLAN.md | #9 Comparateur ETF | Sprint 2 |

## En attente (phases planifiées dans ROADMAP)

- Phase 06-03 — Lighthouse performance
- Phase 08-02 — VaR + Drawdown + Sharpe UI (#5) — pas encore planifié
- Phase 08-03 — Corrélation entre actifs (#12) — pas encore planifié
- Phase 09 — Monte Carlo + Alertes + Auth refresh (#8, #13, #14)
- Phase 10 — Déploiement production (#6)
- Phase 01 — Quick Wins UI
- Phase 02 — Composants Feedback
- Phase 03 — UX Flows

## Notes

- Issues GitHub #2, #3, #4, #11 restent OPEN alors que le code correspondant est mergé — à fermer manuellement.

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
