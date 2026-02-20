# Backend Finance PWA

API minimal (auth + actifs) conforme au contrat du front. Données en mémoire.

## Lancer

```bash
cd backend
npm install
npm run dev
```

Le serveur écoute sur **http://localhost:3000**.

## Variables d'environnement

- `PORT` : port du serveur (défaut 3000).

## Côté front

Dans le dossier **projetfilsrouge**, crée un fichier `.env` avec :

```
VITE_API_URL=http://localhost:3000
```

Puis lance le front : `npm run dev`. Le front appellera ce backend.
