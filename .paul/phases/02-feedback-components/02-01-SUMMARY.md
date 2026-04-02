---
phase: 02-feedback-components
plan: 01
subsystem: ui
tags: [skeleton, empty-state, page-transition, animation, css, preact]

requires:
  - phase: 01-quick-wins-ui
    provides: DataRow, heading scale, emerald nav — base composants UI phase 01

provides:
  - SkeletonText et SkeletonCard (presets réutilisables)
  - EmptyState avec CTA conditionnel
  - PageTransition fade-in 150ms
  - CSS keyframe fadeIn dans index.css

affects: phase-03-ux-flows

tech-stack:
  added: []
  patterns: [CSS-only animation via keyframe, key-remount pattern pour transitions route]

key-files:
  created:
    - src/components/ui/EmptyState.tsx
    - src/components/ui/PageTransition.tsx
  modified:
    - src/components/ui/Skeleton.tsx
    - src/index.css
    - src/App.tsx

key-decisions:
  - "PageTransition via key={location.pathname} sur div wrapper — remontage CSS natif sans librairie"
  - "EmptyState CTA conditionnel via ctaLabel && onCta — pas de bouton si l'un manque"

patterns-established:
  - "Skeleton composable : Skeleton de base + presets SkeletonCard/SkeletonText au-dessus"
  - "Transitions page = CSS keyframe + key remount, jamais de librairie d'animation"

duration: ~15min
started: 2026-04-02T00:00:00Z
completed: 2026-04-02T00:00:00Z
---

# Phase 02 Plan 01 : Feedback Components (Skeleton + EmptyState + PageTransition)

**Skeleton presets, EmptyState avec CTA conditionnel et transition fade-in 150ms intégrés sans dépendance externe.**

## Performance

| Métrique | Valeur |
|----------|--------|
| Duration | ~15min |
| Tasks | 3/3 complétées |
| Fichiers modifiés | 5 |

## Acceptance Criteria Results

| Critère | Statut | Notes |
|---------|--------|-------|
| AC-1 : Skeleton presets | Pass | SkeletonText + SkeletonCard exportés, typés |
| AC-2 : EmptyState fonctionnel | Pass | CTA conditionnel, dark mode, centré |
| AC-3 : Page transition fade-in | Pass | 150ms CSS, key remount, sans librairie |

## Accomplishments

- `SkeletonCard` (4 lignes empilées) et `SkeletonText` (largeur configurable) prêts pour intégration Phase 03
- `EmptyState` centré avec `description` et CTA optionnels — pattern clean pour états vides
- Transitions page via `key={location.pathname}` : chaque navigation remet à zéro l'animation CSS `fadeIn 150ms ease-out`

## Files Created/Modified

| Fichier | Changement | Rôle |
|---------|------------|------|
| `src/components/ui/Skeleton.tsx` | Modifié | Ajout `SkeletonText` + `SkeletonCard` |
| `src/components/ui/EmptyState.tsx` | Créé | Composant état vide avec CTA optionnel |
| `src/components/ui/PageTransition.tsx` | Créé | Wrapper fade-in via `useLocation` + `key` |
| `src/index.css` | Modifié | Keyframe `fadeIn` + classe `.page-enter` |
| `src/App.tsx` | Modifié | Import + wrapper `<PageTransition>` autour de `<Routes>` |

## Decisions Made

| Décision | Raison | Impact |
|----------|--------|--------|
| `key={location.pathname}` pour remontage | Évite librairie d'animation (contrainte PROJECT.md) | CSS natif, 0 dépendance |
| CTA affiché uniquement si `ctaLabel && onCta` | UX : bouton orphelin sans handler = confusion | Comportement safe par défaut |

## Deviations from Plan

Aucune — plan exécuté tel quel.

**Note :** 7 erreurs TS pré-existantes dans `AnalysisPage`, `CombinedChart`, `QuizPage`, `PortfolioPage` — hors scope, non introduites par ce plan.

## Issues Encountered

| Problème | Résolution |
|----------|-----------|
| `npm run build` échoue à cause d'erreurs pré-existantes | Vérifié que 0 erreur sur les nouveaux fichiers via `tsc --noEmit` ciblé |

## Next Phase Readiness

**Prêt :**
- `SkeletonCard` utilisable immédiatement dans DashboardPage, EtfPage, PortfolioPage
- `EmptyState` intégrable partout où une liste peut être vide
- `PageTransition` actif — toutes les navigations ont déjà le fade-in

**Prochaine étape :** Plan 02-02 — Toast system (useToast hook + ToastContainer)

**Blockers :** Aucun

---
*Phase: 02-feedback-components, Plan: 01*
*Completed: 2026-04-02*
