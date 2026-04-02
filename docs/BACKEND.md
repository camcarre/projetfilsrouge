# Backend – API custom (Express)

**Le projet utilise le backend custom** (serveur Express dans **`../backend`**), **pas Supabase**.  
Auth et portefeuille (actifs) passent par cette API. Voir le contrat dans **API_BACKEND_CUSTOM.md**.

---

## 1. Ce qui est en place

### 1.1 Backend (dossier `Filrouge/backend/`)

- **Express** + CORS, JSON
- **Auth** : `POST /auth/register`, `POST /auth/login`, `GET /auth/me`, `POST /auth/logout`
- **Actifs** : `GET /api/assets`, `POST /api/assets`, `PUT /api/assets/:id`, `DELETE /api/assets/:id`
- Données en mémoire (dev/démo) ; à remplacer par une base (SQLite, PostgreSQL, etc.) pour la prod

### 1.2 Front

- **`src/config/env.ts`** : `VITE_API_URL` (URL du back, ex. `http://localhost:3000`)
- **`src/services/api/client.ts`** : client HTTP, token Bearer, gestion 401
- **`authService`** et **`portfolioService`** : appels à l’API custom en priorité (voir ci‑dessous)

### 1.3 Lancer back + front

Depuis **`projetfilsrouge`** :

```bash
npm run dev:all
```

→ Backend sur http://localhost:3000, front sur http://localhost:5173.

---

## 2. Priorité des backends côté front

Le code front peut encore contenir des branches **Supabase** (optionnel, non utilisé par défaut) :

- Si **`VITE_API_URL`** est défini et valide → le front utilise **uniquement l’API custom** (auth + actifs).
- Les variables Supabase (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) ne sont **pas** utilisées dans le projet actuel.

Pour toute nouvelle fonctionnalité (ETF, prédictions, analytics), l’implémentation se fera dans **le backend custom** (Express) et/ou des APIs externes, pas via Supabase.

---

## 3. Bonnes pratiques

- **`.env`** : ne commiter que `.env.example` ; mettre `VITE_API_URL` dans `.env` en local.
- **Token** : stocké en localStorage après login/register ; envoyé en `Authorization: Bearer <token>` ; supprimé côté client en cas de 401.
- **Couche services** : l’app utilise `authService`, `portfolioService`, etc., pas le client HTTP directement.

---

## 4. À faire côté backend (hors scope actuel)

Pour coller au CDC (données ETF, prédictions, recommandations) :

- Intégration **APIs financières** (Yahoo Finance, Alpha Vantage, etc.)
- **Données ETF** (catalogue, frais, perfs)
- **Moteur de recommandation** ETF (profil, filtres)
- **Calculs analytiques** (VaR, volatilité, Monte Carlo, etc.)

Tout cela sera implémenté dans le **backend custom** (Express) et éventuellement des services externes, pas avec Supabase.
