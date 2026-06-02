# Guide fil rouge Ynov — Finance PWA (projet libre)

> **Usage** : cocher au fur et à mesure. Mettre à jour les statuts après chaque sprint.  
> **Dernière revue repo** : juin 2026 — basé sur Moodle HTML local + `image.png` (grille) + état du code.

---

## 1. Contexte

| Élément | Détail |
|--------|--------|
| **Formation** | IA & Data Bachelor 3 — campus Nantes, promo 2025–2026 |
| **Module Moodle** | `0136` — Suivi du projet fil rouge ([HTML export](../nantesynovcampus2025ynovintelligenceartificielle&databachelor3iadatab3a2526_0136suividuprojetfilroug.html)) |
| **Votre choix** | **Projet libre** — data storytelling **finance** (PWA + pipeline data/ML) |
| **Pas votre sujet** | Sujets **imposés** du catalogue Moodle (Présidentielle 2027, WeatherForYnov, etc.) — sauf si l’encadrant a imposé un pivot |
| **CDC interne** | [`cahier_des_charges_app_finance.md`](cahier_des_charges_app_finance.md) — objectifs produit, pas la grille Ynov |
| **Stack réelle** | Preact + FastAPI + SQLite + yfinance (+ HF optionnel) — voir [`.paul/PROJECT.md`](../.paul/PROJECT.md) |

**Phrase Moodle (texte seul dans l’export HTML)** :  
*« Pour le sujet libre, il doit permettre de valider les compétences présentes dans la grille d'évaluation. Le travail minimum attendu est : »* — le détail est sur les **images** Moodle (voir §2).

- [ ] **Validation encadrant** : email / message écrit confirmant « sujet libre finance » (garder une capture)
- [ ] **Pitch 30 s** rédigé : problème, données, ML, app, valeur utilisateur

---

## 2. Grille compétences Ynov (extrait Moodle)

> Source : OCR de [`image.png`](../image.png) (grille compétences, modifiée le 05/01/2026).  
> Les **sujets imposés** (Présidentielle, météo) ne sont **pas** en texte dans l’HTML export — uniquement en images `image.png` … `image (10).png` sur Moodle. Hypothèses prudentes en **§2 bis**.

### 2.1 Compétences à démontrer

**Analyse et exploration de données / Analyse avancée**

- [ ] Acquérir et structurer des données pertinentes (open data et/ou scraping)
- [ ] Préparer les données (formats, manquants, doublons, aberrants)
- [ ] EDA : synthèse graphique, variables utiles pour la modélisation
- [ ] Appliquer ≥ 1 modèle ML adapté au problème (classification / régression / clustering)
- [ ] Évaluer le modèle (métriques, comparaison, ajustement)
- [ ] Interpréter + data storytelling (graphiques + conclusions synthétiques)

**Maths pour la Data Science**

- [ ] Métriques quantité/qualité des échantillons (descriptif, inférence si pertinent)
- [ ] Indicateurs uni- et multivariés pour préparation et analyses
- [ ] Méthodes vues en cours + recherche de méthodes adaptées au sujet (stats + ML)

**Python avancé**

- [ ] Code structuré et documenté pour chaque étape
- [ ] Librairies data : pandas, scikit-learn, seaborn… (écosystème Python)

**Librairies et outils (Moodle)**

| Outil | Attendu Moodle | Votre projet |
|-------|----------------|--------------|
| Python | Obligatoire | ✅ FastAPI + notebook |
| Jupyter Notebook | Oui | 🟡 `docs/analyse-projet.ipynb` (pipeline, pas EDA complète) |
| pandas / numpy | Oui | ✅ backend |
| scikit-learn | Oui | ❌ pas dans `requirements.txt` |
| statsmodels | Cité (stats/ML) | ✅ analytics (ETS, etc.) |
| matplotlib / seaborn | Viz exploration | ❌ pas dans notebook EDA |
| **Streamlit / Dash / Panel / Bokeh** | Apps data | ❌ PWA Preact à la place |
| Git | Versionning | 🟡 repo Git, pas de CI |
| SQL | Complément | 🟡 SQLite via `database.py` |

### 2 bis. Sujets imposés Moodle (hors projet libre — référence)

> **Non extrait du HTML** — contenu vu sur les visuels Moodle / comparaison antérieure. À **confirmer** avec l’encadrant si le jury compare au catalogue.

| Sujet | Exigences typiques (visuels) | Lien avec finance-pwa |
|-------|------------------------------|------------------------|
| **Présidentielle 2027** | data.gouv + INSEE, EDA électorale, ML scénarios, **Streamlit/Dash**, cartes | ❌ domaine différent |
| **WeatherForYnov** | open data météo, viz climat, prévisions | ❌ domaine différent |

**Sujet libre** : même **grille §2.1**, autre thème — votre angle = **marchés / ETF / portefeuille**.

---

## 3. Mapping exigence → preuve → statut → action

Légende : ✅ OK · 🟡 partiel · ❌ manquant

| # | Exigence Ynov | Preuve dans le repo | Statut | Action concrète |
|---|---------------|-------------------|--------|-----------------|
| D1 | Données pertinentes structurées | `yfinance`, JSON ETF, SQLite `backend/data/finance.db` | 🟡 | Documenter sources + limites Yahoo ; 1 jeu CSV exporté pour reproductibilité |
| D2 | Préparation données (nettoyage) | Peu visible côté notebook | ❌ | Section notebook : NA, outliers, normalisation prix |
| E1 | EDA + graphiques | Page Analysis, ETF ; pas notebook seaborn | 🟡 | Notebook : corrélations ETF, volatilité, distributions |
| E2 | Open data | Yahoo (API marché, pas data.gouv) | 🟡 | Argumenter « open» + citer ToS ; ou ajouter 1 dataset Kaggle/HF en annexe |
| ML1 | Modèle ML / stats | ETS/ARIMA, régression, RSI/MACD, HF Qwen (`/api/predict/stock`) | 🟡 | Comparer 2 modèles + métriques (MAE, RMSE) dans notebook |
| ML2 | Évaluation modèle | `analytics_service` risque ; peu de métriques prédiction | 🟡 | Backtest 80/20 sur historique dans notebook |
| V1 | Data storytelling | Dashboard, charts Recharts, page ETF | 🟡 | 3 slides « insight » (1 graph = 1 message) |
| V2 | App interactive type Streamlit/Dash | PWA Preact | 🟡 | Mini `streamlit/` (5 écrans) **ou** défendre PWA comme « interface data » |
| A1 | App produit complète | Auth, Portfolio, ETF, Analysis, Education | ✅ | Finir placeholders Dashboard (§4) |
| DOC1 | Doc reproductible | README, `docs/`, notebook | 🟡 | Aligner README/BACKEND sur FastAPI ; ajouter `.env.example` |
| DOC2 | Notebook Jupyter | `docs/analyse-projet.ipynb` | 🟡 | Enrichir EDA + exécution documentée |
| DEP1 | Déploiement local | `npm run dev:all` | ✅ | 1 page `docs/DEPLOIEMENT.md` (commandes, ports, seed) |
| DEP2 | CI / tests | Aucun workflow `.github/` ; 0 tests | ❌ | Smoke test API + `npm run lint` en CI |
| PWA1 | PWA installable | `vite-plugin-pwa` désactivé par défaut | ❌ | Build avec `VITE_BUILD_PWA=1` + test Lighthouse |
| T1 | Transactions | API `POST/GET /api/transactions` | 🟡 | UI achat/vente dans Portfolio |
| G1 | Git / binôme | Branches, `docs/repartition_taches.md` | 🟡 | Traçabilité commits + revue croisée |

---

## 4. Checklists par domaine

### 4.1 Données

- [ ] Inventaire sources : Yahoo (`yfinance`), SQLite, fichiers `backend/data/*.json`
- [ ] Schéma SQLite documenté (tables users, assets, transactions, history…)
- [ ] Script ou doc « comment regénérer la DB » (`backend/seed.py` si utilisé)
- [ ] Export CSV/Parquet d’un échantillon pour le jury (sans secrets)

### 4.2 EDA

- [ ] Notebook : chargement 3–5 tickers ETF + actif type AAPL
- [ ] Stats descriptives (rendements, vol, skew)
- [ ] Heatmap corrélation
- [ ] 2–3 graphiques seaborn/matplotlib **avec légende métier**
- [ ] Lien explicite notebook → endpoints (`/api/analyze/*`)

### 4.3 ML

- [ ] Définir la **tâche** : régression prix / prévision courte fenêtre
- [ ] Baseline : régression linéaire (déjà dans `main.py`)
- [ ] Modèle 2 : ETS (`statsmodels`) ou scikit-learn (régression)
- [ ] Optionnel : HF Qwen — documenter limites et coût
- [ ] Tableau métriques + choix du modèle retenu pour l’app

### 4.4 Viz & storytelling

- [ ] Fil narratif : « du marché → portefeuille → risque → décision ETF »
- [ ] Supprimer ou isoler les **mock** en démo jury (`MOCK_*` Analysis, ETF fallback)
- [ ] Dashboard : remplacer cartes texte-only (diversification, alertes) par données réelles ou retirer
- [ ] Page Analysis : brancher frontend analytics (phase 05-02 PAUL si pas fait)

### 4.5 App interactive

- [ ] Parcours démo 15 min scripté (voir §7)
- [ ] Auth + portefeuille + 1 prédiction live + 1 ETF comparé
- [ ] **Option Streamlit** (`apps/streamlit_demo.py`) : courbe, RSI, prédiction — 1 journée si jury exige l’outil Moodle

### 4.6 Documentation

- [ ] README : FastAPI, `pip install`, plus Express obsolète
- [ ] `docs/BACKEND.md` : réécrire pour FastAPI + SQLite
- [ ] `.env.example` à la racine : `VITE_API_URL`, `HF_API_TOKEN`, `VITE_BUILD_PWA`
- [ ] `CLAUDE.md` / PAUL : cohérents avec la stack actuelle

### 4.7 Déploiement

- [ ] Procédure « clone → install → run » testée sur machine vierge
- [ ] Build front + variables d’env documentées
- [ ] (Optionnel) Docker Compose front + back

### 4.8 Tests

- [ ] `pytest` : health + auth + 1 route ETF (smoke)
- [ ] GitHub Actions : lint front + tests back sur PR
- [ ] Checklist manuelle pré-soutenance (§7)

### 4.9 Soutenance

Voir §7.

---

## 5. Plan par phases (reste année scolaire 2025–2026)

> Dates **suggérées** à ajuster avec le calendrier campus. Aujourd’hui : début juin 2026 → mode **sprint soutenance**.

| Phase | Période cible | Objectif | Jalons |
|-------|---------------|----------|--------|
| **0 — Cadrage** | Sem. 1 (fait / rattrapage) | Sujet libre validé par écrit | Mail encadrant archivé |
| **1 — Preuves data** | 1–7 juin | Notebook EDA + métriques ML | Notebook exécutable de A à Z |
| **2 — Dette doc & ops** | 8–14 juin | README, `.env.example`, déploiement, CI smoke | Nouveau clone OK en < 30 min |
| **3 — Produit démo** | 15–21 juin | Transactions UI, Analysis branchée, mocks retirés | Script démo sans bug bloquant |
| **4 — Soutenance** | Dernière semaine juin | Répétition 15 min × 2 | Support slides + backup offline |
| **5 — Bonus** | Été (optionnel) | PWA prod, Streamlit, Supabase prod | Hors note si déjà validé |

---

## 6. Actions priorisées (audit repo)

### P0 — Avant soutenance (bloquant jury / reproductibilité)

- [ ] **Validation écrite** sujet libre finance (encadrant Ynov)
- [ ] **`.env.example`** + corriger README / `docs/BACKEND.md` (Express → **FastAPI**)
- [ ] **Notebook EDA** : pandas + seaborn/matplotlib + métriques ML comparées
- [ ] **Script démo** 15 min testé (compte seed, tickers qui répondent)
- [ ] Retirer dépendance aux **données factices** en démo (`showPreview`, MOCK ETF si API down)

### P1 — Fort impact grille Ynov

- [ ] **UI transactions** (`fetchTransactions` / `addTransaction` déjà dans `portfolioService.ts`)
- [ ] **Finir Analysis frontend** (`.paul/phases/05-advanced-analytics/05-02-PLAN.md`)
- [ ] **Mini Streamlit** (5 écrans) si encadrant insiste sur l’outil Moodle
- [ ] **scikit-learn** : 1 modèle + comparaison dans notebook
- [ ] **Build PWA** : `VITE_BUILD_PWA=1 npm run build` + capture Lighthouse

### P2 — Qualité long terme

- [ ] CI GitHub (lint + pytest smoke)
- [ ] Dashboard : diversification / alertes réelles ou cartes supprimées
- [ ] Déploiement cloud (Vercel + Railway/Fly pour API)
- [ ] Supprimer / documenter branches Supabase mortes dans le front
- [ ] Open data supplémentaire (Kaggle portfolio, HF dataset) pour renforcer D1

---

## 7. Checklist soutenance (≈ 15 min)

### 7.1 Support à préparer

- [ ] Slides (10–12) : contexte, données, EDA, ML, archi, démo, limites, perspectives
- [ ] Notebook exporté HTML ou PDF exécutable
- [ ] Schéma architecture (front / API / SQLite / Yahoo / HF)
- [ ] Backup : vidéo 2 min si réseau HF/Yahoo tombe

### 7.2 Déroulé démo suggéré

| Min | Contenu |
|-----|---------|
| 0–2 | Problème + sujet libre validé + grille compétences |
| 2–5 | Notebook : 1 EDA + 1 comparaison modèles |
| 5–11 | App : login → portefeuille → ETF → Analysis (prédiction + indicateurs) |
| 11–13 | Pipeline technique (données → API → viz) |
| 13–15 | Limites (Yahoo, HF, pas Streamlit) + travaux futurs |

### 7.3 Questions jury probables

| Question | Piste de réponse |
|----------|------------------|
| Pourquoi pas Streamlit/Dash ? | Sujet libre + compétences équivalentes via PWA ; Streamlit en annexe si besoin |
| Où est l’open data ? | Yahoo Finance (marchés) ; définir clairement licence / limites |
| Comment évaluez-vous le modèle ? | MAE/RMSE backtest ; ETS vs régression vs HF |
| Différence sujet imposé / votre sujet ? | Même grille, autre domaine ; validation encadrant |
| Reproductibilité ? | `dev:all`, `.env.example`, notebook, seed DB |
| Binôme / Git ? | `docs/repartition_taches.md`, historique PR/commits |
| Éthique / biais ? | Prédictions ≠ conseil financier ; données retardées |
| PWA vs site classique ? | Manifest + SW si `VITE_BUILD_PWA=1` |

### 7.4 Go / No-Go veille de soutenance

- [ ] `npm run dev:all` OK
- [ ] Compte démo avec actifs + historique portefeuille
- [ ] HF : fallback régression si token absent (ne pas bloquer la démo)
- [ ] Pas d’erreur console bloquante sur le parcours démo
- [ ] README à jour lu par quelqu’un d’autre que vous

---

## 8. Risques et mitigations

| Risque | Impact | Mitigation |
|--------|--------|------------|
| Jury attend sujet **Présidentielle / météo** | Élevé | Preuve écrite sujet libre ; slide « grille commune » |
| Exigence **Streamlit** stricte | Modéré–élevé | Mini app `streamlit/` + même données que l’API |
| **README / BACKEND** obsolètes (Express) | Modéré | P0 doc — évite échec reproductibilité |
| **PWA désactivée** (`vite.config.ts`) | Modéré | Build explicite `VITE_BUILD_PWA=1` ou assumer « web app » |
| **Yahoo / HF** indisponibles en démo | Élevé | Fallback régression + mocks désactivés en prod démo |
| **0 tests / CI** | Faible–modéré | Smoke pytest + lint CI |
| Dashboard **placeholders** texte | Faible | Retirer ou connecter vraies données |
| **Transactions** sans UI | Modéré | P1 — montrer flux investisseur complet |
| Notebook = doc pipeline, pas **EDA** | Modéré | P0 enrichissement seaborn/sklearn |
| Doute **open data** Yahoo | Modéré | Argumentation + dataset annexe Kaggle |

---

## 9. Alignement CDC interne finance-pwa

| Bloc CDC (`cahier_des_charges_app_finance.md`) | État | Note Ynov |
|-----------------------------------------------|------|-----------|
| Auth / profil | 🟡 Auth OK, profil investisseur limité | OK technique |
| Dashboard KPI | 🟡 KPI réels, cartes bas = placeholder | P2 |
| Portefeuille / transactions | 🟡 Actifs OK, transactions API sans UI | P1 |
| Analyse risque / prédiction | 🟡 Back OK, front 05-02 | P1 |
| Recommandations ETF | ✅ Filtres + compare | Bon pour storytelling |
| PWA offline / install | ❌ Désactivée par défaut | P1 build |
| Supabase prod | ❌ Non utilisé | Cohérent avec FastAPI local |

---

## 10. Fichiers de référence

| Fichier | Rôle |
|---------|------|
| [`nantesynov…filroug.html`](../nantesynovcampus2025ynovintelligenceartificielle&databachelor3iadatab3a2526_0136suividuprojetfilroug.html) | Export Moodle (texte minimal) |
| [`image.png`](../image.png) | Grille compétences (OCR §2) |
| [`.paul/ROADMAP.md`](../.paul/ROADMAP.md) | Phases produit internes |
| [`.paul/STATE.md`](../.paul/STATE.md) | Position actuelle (analytics 05-02) |
| [`docs/analyse-projet.ipynb`](analyse-projet.ipynb) | Notebook à renforcer |
| [`backend/main.py`](../backend/main.py) | Contrat API réel |

---

## 11. Suivi rapide (tableau de bord perso)

| Domaine | % estimé | Cible soutenance |
|---------|----------|------------------|
| Données + EDA | 45 % | 80 % |
| ML + évaluation | 55 % | 75 % |
| Viz / storytelling | 65 % | 85 % |
| App interactive | 70 % | 90 % |
| Doc + reproductibilité | 40 % | 85 % |
| Déploiement + tests | 25 % | 60 % |
| Alignement grille Ynov | 55 % | 80 % |

**Prochaine action recommandée** : cocher P0 dans l’ordre — validation encadrant → `.env.example` + README → notebook EDA → répétition démo.
