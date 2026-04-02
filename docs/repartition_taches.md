# Répartition des tâches – Cam & Théo

Qui fait quoi entre **Cam** et **Théo** sur la PWA de visualisation financière et recommandations ETF.

**Principe :** Les deux touchent à tout (UI, logique, API, données) pour partager les compétences et se couvrir mutuellement.

---

## Phase 1 – Frontend ensemble (6–8 semaines)

Chacun enchaîne des tâches **UI** et **logique / PWA** pour ne pas rester cantonné à un seul bloc.

### Théo – mélange UI + logique

| Tâche | Type | Semaines | Statut |
|-------|------|----------|--------|
| Design system (couleurs, typo, icônes) – avec Cam | UI | 1–2 | [ ] |
| Navigation et structure d’écrans (routes, layout) | UI | 1–2 | [ ] |
| Gestion de l’état global (Redux) | Logique | 1–4 | [ ] |
| Tableau de bord principal (mise en page, indicateurs) | UI | 3–4 | [ ] |
| Mock API et structures de données de test | Logique | 1–2 | [ ] |
| Calculs côté client (P&L, répartition, indicateurs) | Logique | 4–6 | [ ] |
| Mode sombre / clair | UI | 3–4 | [ ] |
| Tests unitaires (logique, stores, utils) | Logique | 3–8 | [ ] |
| Compatibilité navigateurs (Chrome, Firefox, Safari, Edge) | UI | 5–8 | [ ] |
| Optimisation performances web (lazy loading, code splitting) | UI/Perf | 6–8 | [ ] |

---

### Cam – mélange UI + logique

| Tâche | Type | Semaines | Statut |
|-------|------|----------|--------|
| Composants PWA réutilisables (boutons, cartes, formulaires) | UI | 1–2 | [ ] |
| Interface web responsive (mobile first), breakpoints | UI | 1–4 | [ ] |
| Service Worker et stratégie de cache (Workbox) | Logique | 2–4 | [ ] |
| Web App Manifest et installation PWA | Logique | 2–4 | [ ] |
| UI gestion du portefeuille (listes, formulaires) | UI | 3–4 | [ ] |
| Fonctionnalités offline (IndexedDB, Cache API) | Logique | 4–6 | [ ] |
| Logique des graphiques et visualisations (données → composants) | Logique | 3–6 | [ ] |
| UI recommandations ETF avec données mock | UI | 5–6 | [ ] |
| Animations et transitions | UI | 3–6 | [ ] |
| Tests UI, accessibilité (WCAG 2.1) | UI | 5–8 | [ ] |
| Tests PWA et audit Lighthouse | Logique | 6–8 | [ ] |

---

### À faire ensemble (Phase 1)

- [ ] Choix du stack (Preact + TypeScript TSX, lib UI).
- [ ] Architecture frontend (dossiers, conventions, nommage).
- [ ] Design system et composants de base (Théo + Cam).
- [ ] Web App Manifest et config PWA (Théo + Cam).
- [ ] Structures de données mock (format commun portefeuille, ETF, profil).
- [ ] Revues de code croisées et merge des branches.
- [ ] Stratégie de tests (unitaires, E2E, Lighthouse).
- [ ] Documentation technique frontend.

---

## Phase 2 – Backend Supabase (4–6 semaines)

Chacun enchaîne des tâches **infra / API** et **données / intelligence** pour toucher à tout le backend.

### Théo – mélange infra + données

| Tâche | Type | Semaines | Statut |
|-------|------|----------|--------|
| Création projet Supabase et configuration | Infra | 9 | [ ] |
| Modélisation BDD (tables utilisateurs, portefeuilles, actifs) | Infra | 9–10 | [ ] |
| Intégration APIs financières (Yahoo Finance, Alpha Vantage) | Données | 9–10 | [ ] |
| Supabase Auth (email, Google, Apple) | Infra | 9–10 | [ ] |
| Edge Functions pour calculs complexes (perf, risque, VaR) | Données | 10–11 | [ ] |
| Migration des données mock vers Supabase | Infra | 10–11 | [ ] |
| Déploiement frontend (Netlify/Vercel) | Infra | 11–12 | [ ] |
| Realtime subscriptions (cours, alertes) | Données | 11 | [ ] |
| Monitoring, logs, erreurs | Infra | 12 | [ ] |
| Documentation API et déploiement | Infra | 12 | [ ] |

---

### Cam – mélange infra + données

| Tâche | Type | Semaines | Statut |
|-------|------|----------|--------|
| RLS (Row Level Security) et politiques | Infra | 9–10 | [ ] |
| Données ETF (structure, mise à jour) | Données | 9–10 | [ ] |
| API REST Supabase (schémas, conventions) | Infra | 10–11 | [ ] |
| Moteur de recommandation ETF (règles, scoring) | Données | 10–12 | [ ] |
| CI/CD (GitHub Actions / GitLab CI) | Infra | 11–12 | [ ] |
| Supabase Storage (exports, rapports) | Données | 11 | [ ] |
| Optimisation requêtes et performances backend | Données | 11–12 | [ ] |
| Tests de charge et scalabilité | Données | 12 | [ ] |
| Documentation données et recommandations | Données | 12 | [ ] |

---

### À faire ensemble (Phase 2)

- [ ] Schéma BDD et contrats API (endpoints, payloads).
- [ ] Connexion frontend ↔ Supabase (remplacement mock).
- [ ] Sécurité (RLS, Auth, bonnes pratiques).
- [ ] Tests d’intégration complets.
- [ ] Performance globale et plan de rollback.

---

## Phase 3 – Finalisation PWA (2–3 semaines)

| Tâche | Responsable | Statut |
|-------|-------------|--------|
| Tests d’intégration Supabase | Cam + Théo | [ ] |
| Optimisation Lighthouse (objectif > 90) | Cam + Théo | [ ] |
| Config production Supabase | Cam + Théo | [ ] |
| Tests de charge | Cam + Théo | [ ] |
| Documentation technique finale | Cam + Théo | [ ] |

---

## Phase 4 – Déploiement et lancement (1–2 semaines)

| Tâche | Responsable | Statut |
|-------|-------------|--------|
| Tests utilisateurs finaux | Cam + Théo | [ ] |
| Optimisation finale PWA | Cam + Théo | [ ] |
| Domaine, SSL, déploiement production | Cam + Théo | [ ] |
| Documentation utilisateur et admin | Cam + Théo (répartir les sections) | [ ] |

---

## Récap : les deux touchent à tout

| Phase | **Théo** | **Cam** |
|-------|----------|---------|
| **Phase 1** | Design system, navigation, état global, tableau de bord, mock data, calculs, perf, tests | Composants, responsive, Service Worker, offline, Manifest, portefeuille UI, graphiques, recommandations UI, accessibilité, Lighthouse |
| **Phase 2** | Projet Supabase, BDD, Auth, APIs financières, Edge Functions, migration, déploiement, Realtime, monitoring | RLS, données ETF, API REST, moteur recommandation ETF, CI/CD, Storage, perf backend, tests de charge |
| **Phases 3–4** | Tout en binôme (tests, config prod, déploiement, doc). | Idem. |

**Idée :** En Phase 1 et 2, chaque tâche a un responsable principal, mais l’autre peut participer (pair programming, revue, dépannage) pour que les deux sachent toucher à tout.

---

## Outils de coordination (rappels du CDC)

- **Git :** GitFlow, branches par feature, revues croisées.
- **Communication :** Slack / Discord / Teams pour les questions quotidiennes.
- **Suivi :** Jira / Trello / Notion pour les tâches et le sprint.
- **Doc :** Notion / Confluence pour l’architecture et les décisions.

**Suggestion :** 1 point sync court par jour (ou 3×/semaine) pour déblocages et répartition des tâches du jour.

---

*Document dérivé du cahier des charges – à mettre à jour au fil des sprints.*
