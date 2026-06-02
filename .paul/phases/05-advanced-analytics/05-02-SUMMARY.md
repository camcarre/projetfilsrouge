---
phase: 05-advanced-analytics
plan: 02
subsystem: ui
tags: [analytics, indicators, risk, rsi, macd, bollinger, var, sharpe, recharts, preact]

requires:
  - phase: 05-advanced-analytics-01
    provides: Backend endpoints /api/analyze/indicators + /api/analyze/risk (ETS + analyticsService Python)

provides:
  - analyticsService.ts (frontend) — getIndicators + getRiskMetrics fetch wrappers
  - types/analytics.ts — IndicatorsResponse + RiskMetrics interfaces
  - AnalysisPage.tsx — RSI badge, MACD grid, Bollinger values, VaR/Sharpe risk card, period filter
affects: [phase-06, phase-01-quick-wins-ui, cohesion-design]

tech-stack:
  added: []
  patterns: [Promise.all parallel fetch, tabular-nums financial display, emerald/red conditional coloring]

key-files:
  created: [src/types/analytics.ts, src/services/analyticsService.ts]
  modified: [src/pages/Analysis/AnalysisPage.tsx]

key-decisions:
  - "Bollinger + MACD affichés en tableau numérique (pas graphe) — scope limit plan"
  - "Filtrage période par slice index (22/130/all) — pas de re-fetch backend"
  - "Promise.all pour getIndicators + getRiskMetrics + getStockPrediction en parallèle"

patterns-established:
  - "Service pattern: isCustomApiConfigured() guard + try/catch + { data, error } return"
  - "RSI badge: < 30 emerald (survente), > 70 red (surachat), sinon neutral"
  - "Risk card: colorCls split(' ') pour séparer border-l-* de text-*"

duration: ~20min
started: 2026-04-02T11:35:00Z
completed: 2026-06-02T00:00:00Z
---

# Phase 05 Plan 02: Frontend Analytics Summary

**RSI/MACD/Bollinger + VaR/Sharpe/Drawdown connectés au backend dans AnalysisPage, filtrage période réel opérationnel.**

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
| AC-1: Indicateurs techniques affichés | Pass | RSI badge coloré, grille MACD 3 cols, Bollinger 3 valeurs |
| AC-2: Métriques de risque affichées | Pass | Grille 2×3 VaR95/99, drawdown, volatilité, Sharpe avec coloration |
| AC-3: Filtrage période réel | Pass | filterByPeriod slice 22/130/all — filteredHistorical passé à CombinedChart |
| AC-4: Gestion d'erreur | Pass | Alert variant=error par section, pas de crash |
| AC-5: Pas de régression prédiction | Pass | handlePredict inchangé, Promise.all préserve logique existante |

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
| `src/types/analytics.ts` | Created | IndicatorsResponse + RiskMetrics interfaces (nullable arrays) |
| `src/services/analyticsService.ts` | Created | getIndicators + getRiskMetrics — client API existant, guard isCustomApiConfigured |
| `src/pages/Analysis/AnalysisPage.tsx` | Modified | +indicators/risk state, Promise.all, 2 nouvelles cards, filterByPeriod |

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Bollinger en valeurs numériques, pas graphe | Scope limit plan — graphe complexe déféré | Futur plan peut ajouter graphe Bollinger |
| Filtrage par slice index (pas re-fetch) | Performance — données déjà chargées | MAX_HISTORY = 22/130 jours trading approx |
| colorCls split trick pour border-l vs text | Tailwind ne supporte pas les classes conditionnelles composées | Pattern établi pour risk cards |

## Deviations from Plan

Aucune — plan exécuté tel quel. Les types `(number | null)[]` dans analytics.ts (vs `number[]` dans le plan) reflètent la réalité backend (premiers points RSI/MACD toujours null pendant warm-up).

## Next Phase Readiness

**Ready:**
- AnalysisPage fonctionnelle avec données réelles backend
- Pattern service analytics établi (réutilisable pour Monte Carlo ou autres endpoints)
- Build TypeScript propre, 0 erreur, 0 warning lint

**Concerns:**
- Card "Graphiques interactifs" reste placeholder — pas dans scope 05-02
- Backend Python requis pour les données réelles (fallback = erreur Alert — acceptable)

**Blockers:** Aucun

---
*Phase: 05-advanced-analytics, Plan: 02*
*Completed: 2026-06-02*
