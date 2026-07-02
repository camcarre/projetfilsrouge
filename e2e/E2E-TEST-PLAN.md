# Plan de test E2E — finance-pwa

> Référence exhaustive des pages, features et endpoints à tester.
> Combine **Playwright** (tests déterministes répétables, `e2e/*.spec.ts`) et **Claude‑in‑Chrome** (exploration visuelle, vérification de rendu réel, cas non scriptés).
>
> **Lancement autonome** : `/goal Exécuter le plan de test E2E (e2e/E2E-TEST-PLAN.md) : Playwright vert sur toutes les specs + passe Claude-in-Chrome sur chaque page, corriger les bugs trouvés, jusqu'à ce que tout soit vert et vérifié visuellement.`

---

## 0. Comment ça se lance

### Outils
| Outil | Rôle | Quand |
|---|---|---|
| **Playwright** (`npm run test:e2e`) | Régression déterministe, CI, parcours scriptés | Toujours en premier — rapide, reproductible |
| **Claude‑in‑Chrome** (MCP) | Rendu visuel réel, cône/graphes, dark mode, responsive, cas exploratoires, bugs subtils | Après Playwright vert, pour ce qu'un assert ne voit pas (visuel, layout, UX) |
| **Vitest** (`npm test`) | Unitaires (format, MultiLineChart) | Complément, pas E2E |

### Pré‑requis serveurs
```
npm run dev:all          # front :5173 (ou 5174/5175 si pris) + backend :3000
cd backend && python seed.py   # compte démo + 9 actifs (~60k€)
```
Compte démo : **demo@finance.app / Demo1234!**
Playwright `baseURL` = `http://localhost:5173` (adapter si le port glisse).

### ⚠️ Pièges d'environnement (vécus — à vérifier avant de conclure à un bug)
1. **Port 3000 en IPv6** : si une autre app node écoute `::1:3000`, `localhost:3000` tape dessus au lieu du backend Python (`127.0.0.1`). Symptôme : login 503/404, "Failed to fetch". Vérifier `lsof -nP -iTCP:3000 -sTCP:LISTEN`.
2. **Claude‑in‑Chrome + inputs contrôlés (Preact)** : `form_input` fixe la valeur DOM mais **ne déclenche pas** `onInput` → l'état Preact reste vide → submit échoue. **Toujours** cliquer le champ puis `type` au clavier (+ `Return` pour submit).
3. **uvicorn `--reload` + SQLite** : un hot‑reload backend peut réinitialiser la base en dev → session invalidée ("Non authentifié"). Re‑seeder et se reconnecter.
4. **Monte Carlo** : nécessite un portefeuille avec ≥2 actifs ayant un historique yfinance commun (réseau requis). Portefeuille vide → 400 attendu.

---

## 1. Inventaire des routes (à couvrir intégralement)

| Route | Page | Auth requise |
|---|---|---|
| `/` | Dashboard | Non (états connecté/déconnecté) |
| `/auth` | Connexion / Inscription | Non |
| `/portfolio` | Portefeuille | Oui (sinon CTA connexion) |
| `/analysis` | Analyse | Non |
| `/etf` | ETF | Non |
| `/settings` | Paramètres | Partiel (alertes/notifs = Oui) |
| `/profile/questionnaire` | Questionnaire profil investisseur | Oui |
| `/profile/edit` | Édition profil | Oui |
| `/education` | Éducation (accueil) | Non |
| `/education/glossary` | Glossaire | Non |
| `/education/quiz` | Quiz | Non |
| `/education/calculators` | Calculateurs | Non |
| `/education/fiscalite` | Fiscalité | Non |
| `/education/guides` | Guides | Non |
| `/education/videos` | Vidéos | Non |
| `/education/lexique` | Lexique | Non |
| `/education/risque` | Risque | Non |
| `/n-importe-quoi` | NotFoundPage (404) | Non |

---

## 2. Endpoints backend (à valider via l'UI et/ou en direct)

| Méthode | Endpoint | Rattaché à |
|---|---|---|
| GET | `/health` | smoke |
| POST | `/auth/register` | Auth |
| POST | `/auth/login` | Auth |
| GET | `/auth/me` | session |
| POST | `/auth/logout` | Auth |
| GET/POST | `/api/assets` | Portfolio (POST déclenche aussi l'éval alertes) |
| PUT/DELETE | `/api/assets/{id}` | Portfolio |
| GET | `/api/portfolio/history` | Portfolio (graphe) |
| GET | `/api/portfolio/montecarlo` | Portfolio (cône) |
| GET/POST | `/api/alerts` | Settings (règles) |
| DELETE | `/api/alerts/{id}` | Settings |
| GET/POST | `/api/transactions` | Portfolio |
| GET | `/api/notifications` | Settings (liste) |
| POST | `/api/notifications/read` | Settings (tout lu) |
| GET | `/api/etfs` · `/api/etfs/recommended` | ETF / Dashboard |
| GET | `/api/etfs/{ticker}` `/performance` `/holdings` `/history` | ETF détail |
| POST | `/api/etfs/compare` | ETF comparateur |
| GET | `/api/analyze/indicators/{ticker}` | Analyse (RSI/MACD/Bollinger) |
| GET | `/api/analyze/risk/{ticker}` | Analyse (VaR/Sharpe/drawdown) |
| GET | `/api/analyze/correlation` | Portfolio (heatmap) |
| GET | `/api/predict/stock` | Analyse (prédiction) |
| GET/POST | `/api/profile` | Profil investisseur |
| GET | `/api/quiz/generate` | Éducation quiz |

---

## 3. Matrice pages × features à tester

### 3.1 Auth (`/auth`) — `e2e/auth.spec.ts`
- [ ] Champs email + mot de passe présents et typables
- [ ] Connexion valide (demo) → redirection hors `/auth`, nav passe de "Connexion" à état connecté
- [ ] Connexion invalide → message d'erreur (`role="alert"`), reste sur `/auth`
- [ ] Bascule "Créer un compte" → inscription d'un nouvel email → connecté
- [ ] Inscription email déjà pris → erreur claire
- [ ] Validation front : email malformé, mot de passe vide
- [ ] Déconnexion (logout) → retour état déconnecté, token effacé
- [ ] 401 sur route protégée → redirection/évènement `auth:401`

### 3.2 Dashboard (`/`)
- [ ] **Déconnecté** : "Connectez‑vous", valeur portefeuille "—", CTA "Se connecter"
- [ ] Cartes : Valeur portefeuille, Performance 12M, Nombre d'actifs, ETF recommandés
- [ ] Sélecteur de période (7J / 1M / 3M / 12M / Tout) change l'affichage
- [ ] Graphe évolution portefeuille (connecté, historique ≥2 points)
- [ ] Accès rapides : Portefeuille, Analyse, Recommandations ETF, Éducation (liens fonctionnels)
- [ ] **Connecté** : chiffres réels remplacent les placeholders

### 3.3 Portefeuille (`/portfolio`)
- [ ] Déconnecté → carte "Connectez‑vous", pas de données
- [ ] Connecté : Valeur totale, Répartition par catégorie (%, montants)
- [ ] **Ajouter un actif** : formulaire (nom, symbole, catégorie, quantité, prix), soumission → apparaît dans la liste
- [ ] Recherche/auto‑complétion prix marché à la saisie du symbole
- [ ] **Modifier** un actif → valeurs mises à jour
- [ ] **Supprimer** un actif (⚠️ confirmation — attention aux dialogs en Claude‑Chrome)
- [ ] Tri de la liste : Nom / Symbole / Valeur (asc/desc)
- [ ] **Export CSV** : bouton "Exporter CSV" → fichier téléchargé (⚠️ download = permission)
- [ ] Bouton "Actualiser les cours" → recharge les prix
- [ ] Graphe d'évolution + dernier snapshot
- [ ] **Objectifs** : valeur cible, horizon, DCA mensuel → enregistrer → persistance (localStorage)
- [ ] **Projection Monte Carlo** (feature phase‑09) :
  - [ ] Carte visible si connecté + actifs
  - [ ] Sélecteur horizon 1 mois / 3 mois / 6 mois / 1 an → recharge
  - [ ] **Cône de percentiles** rendu (bandes p5‑95 et p25‑75, médiane, ligne de base) — **vérif visuelle Claude‑Chrome**
  - [ ] Chiffres : Médiane, Pire cas (5%), VaR 95%
  - [ ] Portefeuille vide → message "Ajoutez des actifs", pas de crash
  - [ ] Erreur backend → message propre

### 3.4 Analyse (`/analysis`) — `e2e/analysis.spec.ts`
- [ ] Saisie d'un ticker (action/ETF/crypto/forex) → analyse
- [ ] Indicateurs : RSI, MACD, Bandes de Bollinger (graphes rendus)
- [ ] Métriques de risque : VaR, Sharpe, drawdown, volatilité
- [ ] Prédiction de cours ("Valeur prédite", indicateur modèle IA vs local)
- [ ] Filtrage par période, "Variation (période)"
- [ ] Bouton "Réexécuter"
- [ ] Ticker invalide → erreur gérée
- [ ] Cas crypto (BTC‑USD) et forex — parsing spécifique (cf. fix PR #1)

### 3.5 ETF (`/etf`) — `e2e/etf.spec.ts`
- [ ] Liste des ETF chargée
- [ ] Recherche (nom, ticker, zone, thème)
- [ ] Filtres : Zone géographique, Secteur/Thème, TER maximum, Score ESG minimum, Horizon, Risque
- [ ] Score de match / "Match moyen" / tri prioritaire
- [ ] Ouverture détail ETF → performance, holdings, historique
- [ ] **Comparateur ETF** (phase‑08) : sélection ≥2 ETF → graphe multi‑courbes (⚠️ bug modale historique corrigé — re‑vérifier que la sélection n'est pas bloquée)
- [ ] "Exporter la liste"
- [ ] Fermeture modale ("Fermer")
- [ ] Perf 1 an, distribution

### 3.6 Paramètres (`/settings`)
- [ ] **Apparence** : bascule thème Clair / Sombre → tout le site réagit (**vérif visuelle dark mode Claude‑Chrome**)
- [ ] **Notifications** (prefs localStorage) : toggles email / in‑app / dividendes persistent
- [ ] **Profil investisseur** (si profil existant) : résumé (risque, horizon, objectif, ESG) + bouton "Modifier mon profil" → `/profile/edit`
- [ ] **Règles d'alerte** (phase‑09) :
  - [ ] Liste vide → "Aucune règle"
  - [ ] Créer règle : Cible (actif/portefeuille), Symbole, Métrique (variation jour / plus‑moins‑value), Sens (sous/au‑dessus), Seuil → "Ajouter" → apparaît listée
  - [ ] Validation : seuil non numérique, symbole manquant pour un actif
  - [ ] Supprimer une règle
  - [ ] Déconnecté → "Non authentifié" géré proprement
- [ ] **Notifications récentes** (phase‑09) :
  - [ ] Après refresh portefeuille avec règle déclenchée → notification créée + affichée (point vert, message FR lisible, horodatage)
  - [ ] Dédup 24h : re‑refresh ne duplique pas
  - [ ] "Tout marquer comme lu" → compteur non‑lues à 0

### 3.7 Profil investisseur (`/profile/questionnaire`, `/profile/edit`)
- [ ] Questionnaire 5 étapes : tolérance risque, horizon, objectif, montant mensuel, ESG, niveau de connaissance
- [ ] Navigation étape suivante/précédente, validation par étape
- [ ] Soumission → scoring → recommandations ETF
- [ ] Édition profil → "Profil mis à jour. Redirection..." → persistance (`GET /api/profile` reflète les changements)
- [ ] Accès sans auth → redirection/CTA connexion

### 3.8 Éducation (`/education/*`)
- [ ] Accueil éducation + navigation vers chaque sous‑page
- [ ] Glossaire, Lexique : contenu affiché
- [ ] **Quiz** : génération de questions (`/api/quiz/generate`), réponse, score (fallback statique si pas de clé IA)
- [ ] Calculateurs : saisie → résultat
- [ ] Fiscalité, Guides, Vidéos, Risque : rendu sans erreur
- [ ] Breadcrumb / retour

### 3.9 Transverses
- [ ] **404** : route inconnue → NotFoundPage
- [ ] **Navigation** : barre de nav, item actif surligné (emerald), desktop = mobile
- [ ] **Dark mode** sur toutes les pages (contraste, tabular‑nums sur les chiffres)
- [ ] **Responsive** : mobile (~375px), tablette, desktop (redimensionner la fenêtre Claude‑Chrome)
- [ ] **PWA** : manifest, service worker, installabilité (au moins vérifier chargement SW sans erreur console)
- [ ] **Accessibilité** : labels de formulaires, `role="alert"`, focus, touch targets ≥44px
- [ ] **Console propre** : 0 erreur JS non attendue sur chaque page (lire via `read_console_messages`)
- [ ] **Réseau** : pas de 500 inattendu (`read_network_requests`)

---

## 4. Parcours E2E de bout en bout (scénarios)

> Chaque parcours = un test Playwright + une passe Claude‑Chrome pour le visuel.

1. **Onboarding complet** : inscription → questionnaire profil → recommandations ETF → dashboard peuplé.
2. **Cycle portefeuille** : login → ajouter 2‑3 actifs → voir valeur totale + répartition → graphe → export CSV → supprimer un actif.
3. **Monte Carlo** : login (portefeuille seedé) → /portfolio → cône rendu → changer horizon → lire Médiane/VaR.
4. **Alertes bout en bout** : login → /settings → créer règle "MSFT variation jour sous 100 %" → /portfolio (refresh) → /settings → notification présente → re‑refresh (pas de doublon) → tout marquer lu → supprimer la règle.
5. **Analyse** : /analysis → ticker AAPL → indicateurs + risque + prédiction → ticker BTC‑USD (crypto) → ticker invalide (erreur).
6. **ETF & comparateur** : /etf → filtrer → ouvrir détail → comparer 2 ETF (multi‑courbes) → export.
7. **Éducation & quiz** : /education → quiz → répondre → score.
8. **Thème & responsive** : basculer dark/light, redimensionner mobile/desktop sur 3 pages clés.
9. **Sécurité session** : accès /portfolio sans login → CTA ; logout → état déconnecté.

---

## 5. Cas limites & erreurs à provoquer
- [ ] Backend arrêté → messages "Backend non configuré" / erreurs gérées, pas d'écran blanc
- [ ] Token expiré / 401 → redirection propre
- [ ] Formulaires : champs vides, valeurs négatives, très grandes valeurs, caractères spéciaux (injection CSV : `=`, `+`, `@` en début de champ → doit être neutralisé, cf. correctif export CSV)
- [ ] Ticker inexistant, ETF sans holdings
- [ ] Monte Carlo sur portefeuille 1 actif sans historique → 400 propre
- [ ] Double‑clic / soumissions multiples → pas de doublons
- [ ] Réseau lent (throttling) → skeletons/loaders visibles

---

## 6. Critères de complétion (DONE pour /goal)
1. `npm run lint` → 0 warning · `npx tsc --noEmit` → 0 erreur.
2. `npm test` (vitest) → tout vert.
3. `npm run test:e2e` (Playwright) → **toutes les specs vertes** ; couverture ≥ un test par route du §1 et par parcours du §4.
4. Passe **Claude‑in‑Chrome** effectuée sur **chaque page du §1**, avec pour chacune : screenshot, 0 erreur console inattendue, features clés du §3 exercées.
5. Les 3 features phase‑08/09 **vérifiées visuellement** : cône Monte Carlo, comparateur ETF multi‑courbes, heatmap corrélation.
6. Tout bug trouvé est soit corrigé (cause racine) soit consigné dans un tableau "bugs ouverts" en fin de run, avec `fichier:ligne`.
7. Rapport final : tableau route × [Playwright ✓/✗] × [Claude‑Chrome ✓/✗] × [bugs].

---

## 7. Annexes

### Comptes de test
| Usage | Email | Mot de passe |
|---|---|---|
| Démo seedé (9 actifs) | demo@finance.app | Demo1234! |
| Playwright (auto‑register) | e2e-test@test.com | Test1234! |

### Commandes
```
npm run dev:all                       # serveurs
cd backend && python seed.py          # données démo
npm run test:e2e                      # Playwright (headless)
npm run test:e2e:headed               # Playwright visible
npx playwright show-report            # rapport HTML
npm test                              # vitest
lsof -nP -iTCP:3000 -sTCP:LISTEN      # diagnostiquer le port backend
```

### Specs Playwright existantes (à étendre pour couvrir le §1/§3)
`e2e/auth.spec.ts` · `e2e/dashboard.spec.ts` · `e2e/analysis.spec.ts` · `e2e/portfolio.spec.ts` · `e2e/etf.spec.ts` · `e2e/e2e-flow.spec.ts`
**Manquent** (à créer) : `settings.spec.ts` (alertes + notifications), `montecarlo.spec.ts` (via /portfolio), `profile.spec.ts` (questionnaire + edit), `education.spec.ts` (quiz), `navigation.spec.ts` (404, nav active, dark mode).
Helper login : `e2e/fixtures/auth.ts` (`loginAs`).
