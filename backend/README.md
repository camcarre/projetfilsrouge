# Backend — Finance PWA (Python/FastAPI)

Migration du backend Node/Express vers Python FastAPI.  
Le fichier `server.js` est conservé pour rollback.

## Démarrage Python

```bash
# Install (depuis le dossier backend/)
cd backend
pip install -r requirements.txt

# Dev avec reload automatique
uvicorn main:app --reload --port 3000

# Ou via python directement
python main.py
```

## Démarrage Node (rollback)

```bash
cd backend
npm install
npm run dev
```

## Routes disponibles (plan 04-01)

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | Non | Inscription |
| POST | `/auth/login` | Non | Connexion |
| GET | `/auth/me` | Bearer | Session courante |
| POST | `/auth/logout` | Bearer | Déconnexion |

Routes à venir (plans 04-02 / 04-03) :
- `/api/assets` — CRUD actifs + prix Yahoo Finance
- `/api/etfs` — ETF Yahoo Finance
- `/api/predict/stock` — Prédiction Qwen/Qwen2.5-72B-Instruct
- `/api/quiz/generate` — Quiz IA

## Variables d'environnement

Fichier `.env` à la racine du projet :
```
HF_API_TOKEN=hf_...
PORT=3000
VITE_API_URL=http://localhost:3000
```

## DB

SQLite — `backend/data/finance.db`  
Créée automatiquement au démarrage Python.
