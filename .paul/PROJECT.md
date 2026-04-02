# Finance PWA — PROJECT.md

## Description
PWA de visualisation de portefeuille financier et recommandations ETF. Projet académique en binôme (Camille + Théo).

## Stack
- Frontend : Preact + TypeScript + Vite + Tailwind CSS 3
- État : Redux Toolkit
- Charts : Recharts
- Backend : FastAPI (Python) + SQLite (sqlite3 stdlib) — migré depuis Express.js (Phase 04)
- Auth : Bearer token JWT-like (itsdangerous)
- PWA : vite-plugin-pwa
- Data : yfinance (ETF live), numpy (prédiction), HuggingFace Router (Qwen2.5-72B optionnel)

## Contraintes
- Minimalisme strict : palette neutral + emerald + red (3 couleurs max)
- Pas de librairie d'animation lourde (motion, framer-motion)
- Transitions max 300ms
- Touch targets min 44px
- Dark mode obligatoire
- Preact (pas React pur) — vérifier compat avant toute lib externe

## Pages
Dashboard / Portfolio / Analysis / ETF / Education / Settings / Auth

## Valeur
Permettre à un utilisateur de suivre son portefeuille, analyser ses actifs, comparer des ETF et se former — le tout en PWA installable.

## Décisions clés

| Date | Décision | Raison |
|------|----------|--------|
| 2026-04-02 | Palette = neutral + emerald + red uniquement | Minimalisme, audit UX |
| 2026-04-02 | tabular-nums systématique sur chiffres financiers | Lisibilité données |
| 2026-04-02 | portfolio_id=NULL dans transactions Python | PRAGMA foreign_keys=ON actif — 'default' string cassait la FK |
| 2026-04-02 | import requests as http_requests | Éviter conflit de nom avec FastAPI Request |
| 2026-04-02 | Quiz sans HF token → fallback statique (pas 503) | UX non bloquée en dev/prod sans clé IA |

## Requis livrés (Phase 04)

- ✓ Backend FastAPI opérationnel — auth JWT, assets, transactions, portfolio history (Phase 04-01/02)
- ✓ ETF service Python — Yahoo Finance live + filtres zone/ESG/TER + fallback mock (Phase 04-03)
- ✓ Prédiction de cours — numpy regression + HF Router Qwen2.5-72B optionnel (Phase 04-03)
- ✓ Quiz financier — HF Router + fallback statique (Phase 04-03)

---
*Dernière mise à jour : 2026-04-02 après Phase 04*
