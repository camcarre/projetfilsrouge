# STATE

## Current Position

Milestone: Advanced Analytics (v0.2)
Phase: 05 — Advanced Analytics — Planning
Plan: 05-01 APPLY complete
Status: APPLY complet, prêt pour UNIFY
Last activity: 2026-04-02 — 05-01 appliqué (analytics_service + endpoints + ETS)

Progress:
- Migration Backend: [██████████] 100% ✓
- Phase 04: [██████████] 100% (3/3 plans complets)
- Phase 05: [█████░░░░░] 50% (05-01 ✓ loop fermé, 05-02 à appliquer)

## Loop Position

```
PLAN ──▶ APPLY ──▶ UNIFY
  ✓        ✓        ✓     [05-01 loop fermé]
```

## Session Continuity

Last session: 2026-04-02
Stopped at: 05-01 UNIFY complet — 05-02 frontend prêt à appliquer
Next action: /paul:apply .paul/phases/05-advanced-analytics/05-02-PLAN.md
Resume file: .paul/phases/05-advanced-analytics/05-02-PLAN.md

## En attente (phases restantes)

- Phase 01 — Quick Wins UI : nav active, heading scale, dark mode labels, tabular-nums
- Phase 02 — Composants Feedback : Skeleton, Toast, EmptyState, page transition
- Phase 03 — UX Flows : onboarding, sticky filters ETF, cross-links, pull-to-refresh

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
