# STATE

## Current Position

Milestone: Features Sprint 2 (v0.5)
Phase: 09 — Monte Carlo + Alertes (backend)
Plan: 09-01 + 09-02 APPLY complete → UNIFY next
Status: PLAN◉ APPLY◉ UNIFY○ — backend Monte Carlo + Alertes livré, 21 tests verts
Next action: /paul:unify (puis frontend phase suivante)
Last activity: 2026-07-02 — APPLY 09-01/09-02 : endpoints montecarlo + alerts, hook get_assets, 6 endpoints restaurés (agent avait écrasé main.py)

Progress:
- Migration Backend: [██████████] 100% ✓
- Phase 04: [██████████] 100% (3/3 plans complets)
- Phase 05: [██████████] 100% ✓ (2/2 plans complets)
- Phase 06: [███████░░░] 60% (06-01 APPLY PASS, UNIFY reste)

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [06-01 loop fermé — Phase 06-01 COMPLETE]
```

## Session Continuity

Last session: 2026-06-02
Stopped at: 06-01 UNIFY complet — Phase 06 E2E Tests loop closed
Next action: /paul:plan (Phase 06-02 ou phase suivante)
Resume file: .paul/phases/06-e2e-tests/06-01-SUMMARY.md

## En attente (phases restantes)

- Phase 01 — Quick Wins UI : nav active, heading scale, dark mode labels, tabular-nums
- Phase 02 — Composants Feedback : Skeleton, Toast, EmptyState, page transition
- Phase 03 — UX Flows : onboarding, sticky filters ETF, cross-links, pull-to-refresh
- Phase 06-02 — CI/CD : GitHub Actions workflow pour E2E tests
- Phase 06-03 — Performance : Lighthouse testing

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
- Predict : GET /api/predict/stock (numpy + HF Router Qwen2.5-72B)
- Quiz : GET /api/quiz/generate (HF Router + fallback statique)

### Git State
Branch: cam (pas de feature branch phase 04)
Fichiers backend non commités : database.py, main.py, requirements.txt, services/
