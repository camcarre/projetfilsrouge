# Déploiement — VPS Docker + Traefik

App déployée sur **https://finance.camcamcarre.fr** (VPS multi-apps derrière Traefik, réseau `traefik-public`, TLS `letsencrypt`).

## Architecture
- `finance-front` : build Vite → `nginx:alpine`, sert le SPA. Traefik route `Host(finance.camcamcarre.fr)`.
- `finance-backend` : FastAPI/uvicorn (port 3000). Traefik route `Host(finance.camcamcarre.fr) && PathPrefix(/api)` (priorité > front).
- SQLite persistée sur le volume Docker `finance-db`.

## Variables d'env backend (`backend/.env`, non commité)
| Clé | Rôle |
|-----|------|
| `SECRET_KEY` | signature des tokens auth (obligatoire, aléatoire) |
| `FRONTEND_ORIGIN` | origine CORS autorisée → `https://finance.camcamcarre.fr` |
| `HF_API_TOKEN` | optionnel — prédiction IA HuggingFace (sinon fallback ETS/régression) |

`VITE_API_URL` est injecté au BUILD du front (build-arg dans `docker-compose.prod.yml`), pas au runtime (STD-005).

## Déployer / mettre à jour
```bash
cd /home/ubuntu/finance-pwa
git pull
docker compose -f docker-compose.prod.yml up -d --build
```

## Vérifier
```bash
docker compose -f docker-compose.prod.yml ps
curl https://finance.camcamcarre.fr/api/health
```
