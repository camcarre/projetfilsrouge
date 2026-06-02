# Backend — Finance PWA (Python/FastAPI)

Backend Python FastAPI + SQLite.

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

## Routes principales

| Méthode | Route | Auth | Description |
|---------|-------|------|-------------|
| POST | `/auth/register` | Non | Inscription |
| POST | `/auth/login` | Non | Connexion |
| GET | `/auth/me` | Bearer | Session courante |
| POST | `/auth/logout` | Bearer | Déconnexion |
| GET | `/health` | Non | Healthcheck |
| GET | `/api/assets` | Bearer | Liste actifs |
| POST | `/api/assets` | Bearer | Créer actif |
| PUT | `/api/assets/:id` | Bearer | Modifier actif |
| DELETE | `/api/assets/:id` | Bearer | Supprimer actif |
| GET | `/api/transactions` | Bearer | Liste transactions |
| POST | `/api/transactions` | Bearer | Créer transaction |
| GET | `/api/etfs` | Non | Liste ETF |
| POST | `/api/etfs/compare` | Non | Comparer ETF |
| GET | `/api/predict/stock?symbol=...` | Non | Prédiction (HF optionnel) |
| GET | `/api/quiz/generate` | Bearer | Quiz (HF optionnel) |

## Variables d'environnement

Fichier `.env` à la racine du projet :
```
VITE_API_URL=http://localhost:3000
HF_API_TOKEN=
```

## DB

SQLite — `backend/data/finance.db`  
Créée automatiquement au démarrage Python.
