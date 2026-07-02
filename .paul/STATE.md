# STATE

## Current Position

Milestone: v0.5 Features Sprint 2 — Complete
Phase: 08 Comparateur ETF + VaR UI + Corrélation — Complete
Status: UNIFY — phase 08 clôturée
Last activity: 2026-07-02 — 08-01 (bug modale corrigé) + 08-03 (corrélation) codés, testés, commités

Progress:
- Migration Backend (v0.1): [██████████] 100% ✓
- Phase 04: [██████████] 100% ✓
- Phase 05: [██████████] 100% ✓
- Phase 05-03 (Profil): [██████████] 100% ✓
- Phase 06-01 (Playwright): [██████████] 100% ✓
- Phase 06-02 (CI/CD): [██████████] 100% ✓
- Phase 07-02 (Skeleton/UX): [██████████] 100% ✓
- Phase 08 (Comparateur/VaR/Corrélation): [██████████] 100% ✓

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [phase 08 loop fermé — COMPLETE]
```

## Session Continuity

Last session: 2026-07-02
Stopped at: Phase 08 clôturée
Next action: Phase 06-03 (Lighthouse) ou Phase 09 (Monte Carlo + Alertes + Auth refresh)
Resume file: .paul/phases/08-etf-comparator/08-03-PLAN.md

## Plans créés (prêts à exécuter)

Aucun.

## En attente (phases planifiées dans ROADMAP)

- Phase 06-03 — Lighthouse performance
- Phase 09 — Monte Carlo + Alertes + Auth refresh (#8, #13, #14)
- Phase 10 — Déploiement production (#6)
- Phase 01 — Quick Wins UI
- Phase 02 — Composants Feedback
- Phase 03 — UX Flows

## Notes

- Issues GitHub #2, #3, #4, #9, #11, #12 restent OPEN alors que le code correspondant est mergé — à fermer manuellement.
- Incident session du 2026-07-02 : `backend/data/finance.db` supprimé par erreur durant un test manuel (fichier gitignored, non récupérable). La base est repartie vide — utilisateurs/actifs/transactions de dev perdus. Le compte `e2e-test@test.com` utilisé par la suite Playwright a été recréé avec un profil investisseur minimal pour ne pas casser `auth.spec.ts`.

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
