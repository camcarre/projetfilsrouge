# SUMMARY — Phase 12 : Déploiement public (VPS Docker + Traefik)

**Statut : COMPLETE** — https://finance.camcamcarre.fr en ligne, vérifié end-to-end 2026-07-02.

## Livré
- `backend/Dockerfile` (python:3.11-slim, uvicorn 0.0.0.0:3000).
- `Dockerfile.front` (multi-stage node:22-alpine → nginx:alpine, `VITE_API_URL` baké au build — STD-005).
- `deploy/nginx-spa.conf` (SPA fallback), `deploy/README.md`.
- `docker-compose.prod.yml` : services `finance-backend` + `finance-front` sur réseau `traefik-public` (externe), volume `finance-db` (SQLite persistante), labels Traefik.
- Backend : CORS configurable via `FRONTEND_ORIGIN` (plus de `["*"]` en prod) — main.py.
- `backend/.env` prod sur le VPS (SECRET_KEY généré, non commité).

## Routage Traefik
- `finance-front` : `Host(finance.camcamcarre.fr)` → nginx:80, priority 1.
- `finance-backend` : `Host(finance.camcamcarre.fr) && (PathPrefix(/api) || PathPrefix(/auth) || PathPrefix(/health))` → uvicorn:3000, priority 100.
- TLS `letsencrypt` (cert émis). Redirect web→websecure + middlewares sécu (crowdsec/ratelimit/headers) = globaux à l'entrypoint.

## Vérifs prod (client externe)
- front `/` → 200, `<title>Finance PWA…`
- `/health` → `{"status":"ok"}`, `/api/etfs` → 200
- register → 200 (user créé + token), login → token
- `/api/predict/stock?symbol=AAPL` → backtest live (horizon 12, train 48, test 12, rmse 13.05, r2 réel)

## Corrections en cours de route
1. `VITE_API_URL` = racine du domaine (pas `/api`) car les paths front incluent déjà `/api/*` et `/auth/*`.
2. Router backend élargi à `/auth` et `/health` (pas seulement `/api`).

## Incident (résolu) — crowdsec
Le `docker system prune -f` du nettoyage disque a supprimé le conteneur **crowdsec déjà crashé** (disque plein à 100%). Le bouncer Traefik n'ayant plus de LAPI, TOUT le VPS renvoyait 403 (toutes les apps). Correctif : recréation via `/home/ubuntu/.hermes/projects/crowdsec/docker-compose.yml` (image toujours présente, bouncer réenregistré). Toutes les apps (recettes, qrcode, finance…) de nouveau en 200.
**Leçon** : sur ce VPS, ne jamais `docker system prune` sans vérifier d'abord les conteneurs arrêtés (`docker ps -a`) — un service crashé peut être supprimé.

## Grille
Compétence 7 (interface + déploiement) : **B→A** — URL publique HTTPS live.
