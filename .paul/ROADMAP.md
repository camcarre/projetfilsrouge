# ROADMAP

## Milestone v0.1 — Polish UX/UI (In progress)

### Phase 01 — Quick Wins UI (Not started)
Corrections visuelles immédiates issues de l'audit UX/UI :
- Navigation active unifiée desktop/mobile (emerald-50/700)
- Heading scale (h1/h2/h3) + DataRow component
- Dark mode labels fix (neutral-400 → neutral-300)
- tabular-nums sur tous les chiffres financiers
Status: Not started

### Phase 02 — Composants Feedback (Not started)
- Skeleton loading animé (animate-pulse)
- Toast système minimal (auto-dismiss 2s)
- EmptyState component avec CTA
- Page transition fade-in 150ms sur main
Status: Not started

### Phase 03 — UX Flows (Not started)
- Onboarding dashboard non-connecté (welcome card + CTA)
- Sticky filters ETF
- Cross-links contextuels (ETF → Portfolio)
- Breadcrumb Education
- Pull-to-refresh indicateur + bouton refresh
Status: Not started

### Phase 04 — Migration Backend Python ✅ Complete
Remplacement complet du backend Node/Express par FastAPI :
- Plan 01 : Foundation (app FastAPI, database.py SQLite, auth routes) ✓
- Plan 02 : Assets + Portfolio + Transactions + Notifications ✓
- Plan 03 : Yahoo ETF service + Prediction pipeline (Qwen2.5-72B) + Quiz ✓
Status: Complete
Completed: 2026-04-02
Plans: 3/3

---

## Milestone v0.2 — Advanced Analytics ✅ Complete

### Phase 05 — Advanced Analytics ✅ Complete
Implémentation complète de la page Analysis (indicateurs techniques + prédiction améliorée + métriques de risque) :
- Plan 01 : Backend — analytics_service.py (pandas-ta RSI/MACD/Bollinger + statsmodels ETS/ARIMA + VaR/drawdown) + 3 nouveaux endpoints FastAPI ✓
- Plan 02 : Frontend — connecter les endpoints + implémenter cards Analysis (indicateurs, risque, filtrage période réel) ✓
Status: Complete
Completed: 2026-06-02
Plans: 2/2

### Phase 05-03 — Profil Investisseur ✅ Complete
- Questionnaire 5 étapes + scoring ETF (backend + frontend) ✓
- Page édition profil (/profile/edit) ✓ — PR #10
Status: Complete
Completed: 2026-06-02

---

## Milestone v0.3 — Qualité & Tests (In progress)

### Phase 06 — E2E Tests Playwright (In progress)
Suite de tests end-to-end couvrant les flux critiques :
- Plan 01 : Installation Playwright, config, 4 spec files (auth, dashboard, analysis, portfolio) ✓
- Plan 02 : CI/CD GitHub Actions — lint + build + tests sur chaque PR (issue #11)
Status: In progress
Depends on: Phase 05 ✅

### Phase 06-03 — Performance Lighthouse (Not started)
- Audit Lighthouse > 90 (Performance, PWA, Accessibility)
- Optimisation bundle size < 500KB gzipped
- Lazy loading et code splitting vérifiés
Status: Not started
Depends on: Phase 06 Plan 02

---

## Milestone v0.4 — Features Sprint 1 (Not started)

### Phase 07 — Export CSV + UX Polish (Not started)
Sprint 1 — issues #3 + #4 :
- Plan 01 : Export CSV portfolio côté client (issue #4)
- Plan 02 : Skeleton loaders + états vides (issue #3) — s'appuie sur Phase 02 composants
Status: Not started
Depends on: Phase 02

---

## Milestone v0.5 — Features Sprint 2 (In progress)

### Phase 08 — Comparateur ETF + VaR UI + Corrélation (Planning)
Sprint 2 — issues #5 + #9 + #12 :
- Plan 01 : Comparateur ETF multi-courbes (UI — endpoint /api/etfs/{ticker}/history déjà prêt) — PLAN créé
- Plan 02 : VaR + Drawdown + Sharpe sur page Analyse (UI — backend analytics_service.py déjà prêt) — pas encore planifié
- Plan 03 : Corrélation entre actifs — endpoint backend + matrice UI — pas encore planifié
Status: Planning
Depends on: Phase 05 ✅

### Phase 09 — Monte Carlo + Alertes + Auth Refresh (Not started)
Sprint backlog — issues #8 + #13 + #14 :
- Plan 01 : Simulation Monte Carlo — endpoint /api/portfolio/montecarlo + graphique percentiles
- Plan 02 : Alertes notifications in-app — vérification seuils au refresh portfolio
- Plan 03 : Auth refresh token — expiry detection + redirection propre
Status: Not started

---

## Milestone v0.6 — Production (Not started)

### Phase 10 — Déploiement Production (Not started)
Issue #6 :
- Migration base de données vers Supabase (PostgreSQL)
- Dockerisation backend + labels Atlas VPS
- Variables d'environnement production
- Build frontend + service Nginx
Status: Not started
Depends on: Phase 08, Phase 09
