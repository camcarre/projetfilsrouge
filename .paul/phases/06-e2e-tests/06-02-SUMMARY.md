# Phase 06-02 — CI/CD GitHub Actions — SUMMARY

## Status
✅ **COMPLETE**

## Résultat

Workflow CI/CD refactorisé et enrichi dans `.github/workflows/ci.yml`.

### Jobs créés

| Job | Dépendances | Description |
|-----|-------------|-------------|
| `lint` | — | ESLint 0 warnings (npm run lint) |
| `build` | lint | tsc -b + vite build |
| `test-backend` | lint | pytest -q sur backend Python 3.11 |
| `playwright` | build + test-backend | E2E Chromium + upload rapport |

### Décisions techniques loggées

1. **`continue-on-error: true` sur playwright** — intentionnel : le backend peut échouer en CI sans `.env` (SECRET_KEY injectée via env var, mais les données Yahoo Finance peuvent timeout). Ne bloque pas le merge.
2. **`VITE_API_URL=http://localhost:3000`** au build Playwright — active `isCustomApiConfigured()` pour que les tests testent le vrai backend et non le mode démo.
3. **`/api/etfs` pour wait-on** — plus léger que `/docs` (Swagger UI), endpoint disponible sans auth.
4. **Suppression `pip install --upgrade pip`** — redondant avec le cache pip de `actions/setup-python@v5`.

## Fichiers modifiés

- `.github/workflows/ci.yml` — workflow refactorisé (1 job → 4 jobs)

## Acceptance Criteria

| AC | Status |
|----|--------|
| AC-1: Pipeline déclenché sur PR | ✅ trigger `pull_request` + `push` |
| AC-2: Job lint | ✅ job lint avec npm run lint |
| AC-3: Job build | ✅ job build avec tsc + vite |
| AC-4: Job Playwright | ✅ job playwright avec upload artifact |

## Next Steps

- Phase 06-03 : Audit Lighthouse performance
- Phase 07-01 : Export CSV portfolio (plan prêt)
