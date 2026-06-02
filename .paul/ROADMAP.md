# ROADMAP

## Milestone v0.1 — Polish UX/UI (In progress)

### Phase 01 — Quick Wins UI (Planning)
Corrections visuelles immédiates issues de l'audit UX/UI :
- Navigation active unifiée desktop/mobile (emerald-50/700)
- Heading scale (h1/h2/h3) + DataRow component
- Dark mode labels fix (neutral-400 → neutral-300)
- tabular-nums sur tous les chiffres financiers
Status: Not started

### Phase 02 — Composants Feedback (Done)
- Skeleton loading animé (animate-pulse)
- Toast système minimal (auto-dismiss 2s)
- EmptyState component avec CTA
- Page transition fade-in 150ms sur main
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

## Milestone v0.1 — Polish UX/UI (In progress)

### Phase 03 — UX Flows (Not started)
- Onboarding dashboard non-connecté (welcome card + CTA)
- Sticky filters ETF
- Cross-links contextuels (ETF → Portfolio)
- Breadcrumb Education
- Pull-to-refresh indicateur + bouton refresh
Status: Not started

---

## Milestone v0.2 — Advanced Analytics (In progress)

### Phase 05 — Advanced Analytics (Planning)
Implémentation complète de la page Analysis (indicateurs techniques + prédiction améliorée + métriques de risque) :
- Plan 01 : Backend — analytics_service.py (pandas-ta RSI/MACD/Bollinger + statsmodels ETS/ARIMA + VaR/drawdown) + 3 nouveaux endpoints FastAPI
- Plan 02 : Frontend — connecter les endpoints + implémenter cards Analysis (indicateurs, risque, filtrage période réel)
Status: Planning
Depends on: Phase 04 ✅
