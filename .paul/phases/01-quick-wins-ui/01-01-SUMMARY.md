---
phase: 01-quick-wins-ui
plan: 01
type: summary
status: done
date: 2026-04-02
---

# Summary — Plan 01-01 : Quick Wins UI

## Ce qui a été fait

### Task 1 — Nav active desktop → emerald ✓
**Fichier :** `src/components/layout/Layout.tsx:124`
Remplacement de `bg-neutral-200/80 text-neutral-800 dark:bg-neutral-700/80 dark:text-neutral-100` par `bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300`.
La nav desktop active est maintenant cohérente avec la bottom nav mobile (déjà emerald).

### Task 2 — Heading scale + tabular-nums ✓
**Fichiers :** `tailwind.config.js` + `src/index.css`
- Classes `text-h1` (1.75rem/700), `text-h2` (1.125rem/600), `text-h3` (1rem/600) disponibles via Tailwind
- Utilitaire `.tabular-nums` ajouté dans `@layer utilities`
- Règle dark mode `.dark .label-secondary` ajoutée

### Task 3 — Composant DataRow ✓
**Fichier :** `src/components/ui/DataRow.tsx` (créé)
Named export `DataRow` avec props `label`, `value`, `variant` (default/positive/negative/highlight).
Prêt pour intégration en Phase 02.

## Acceptance Criteria

- [x] AC-1 : Nav desktop active = emerald-50/700 (light) + emerald-950/300 (dark)
- [x] AC-2 : text-h1/h2/h3 disponibles via Tailwind fontSize extend
- [x] AC-3 : DataRow exporté, typé, variantes emerald/red/neutral
- [x] AC-4 : `.dark .label-secondary` corrige les contrastes dark mode labels

## Build

Build passe avec des erreurs TS **pré-existantes** (non introduites par ce plan) :
- `AnalysisPage.tsx`, `CombinedChart.tsx`, `PortfolioPage.tsx` — imports inutilisés
- `QuizPage.tsx` — erreur de type

Ces erreurs existaient avant ce plan et sont hors scope.
