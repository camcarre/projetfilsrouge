# Phase 07-02 — Skeleton ETF + États vides + Welcome card — SUMMARY

## Status
✅ **COMPLETE**

## Résultat

### Modifications appliquées

**`src/pages/Etf/EtfPage.tsx`**

| Avant | Après |
|-------|-------|
| `<Spinner size="md" />` pendant chargement | 4 skeleton cards animate-pulse |
| Texte nu "Aucun ETF ne correspond aux filtres." | Message + bouton "Réinitialiser les filtres" |
| Pas de `resetFilters` | Fonction remet sector/zone/esg/terMax/distribution/searchQuery aux valeurs initiales |

**`src/pages/Dashboard/DashboardPage.tsx`**

| Avant | Après |
|-------|-------|
| Texte "Connectez-vous" inline dans stat card | Card de bienvenue centrée avec CTA `<Button variant="primary">` → `/auth` |

## Acceptance Criteria

| AC | Status |
|----|--------|
| AC-1: Skeleton ETF au chargement | ✅ 4 skeleton rows visibles pendant fetch |
| AC-2: État vide ETF avec CTA reset | ✅ bouton "Réinitialiser les filtres" sur 0 résultats |
| AC-3: Welcome card Dashboard non-connecté | ✅ card visible si `apiConfigured && !user` |

## Vérification

- `npx tsc --noEmit` : 0 erreur (hors format.test.ts pré-existant)
- Spinner supprimé — import retiré

## Next Steps
- Checkpoint human-verify : tester manuellement sur `/etf` et `/`
- Phase 08 : Comparateur ETF + VaR UI + Corrélation (#5, #9, #12)
