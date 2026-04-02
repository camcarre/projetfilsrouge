# Contrat API – Backend du projet (API custom)

**Le backend du projet est cette API custom** (serveur Express dans `../backend`). Pas Supabase.  
Le front appelle cette API dès que `VITE_API_URL` est défini (ex. `http://localhost:3000`). Le serveur doit exposer les endpoints ci‑dessous (REST, JSON).

---

## Base

- **URL de base** : celle que tu mets dans `VITE_API_URL` (sans slash final).
- **Headers** : le front envoie toujours `Content-Type: application/json` et, après connexion, `Authorization: Bearer <token>`.
- **Token** : après `POST /auth/login` ou `POST /auth/register`, le front attend une réponse avec un champ `token` et le stocke (localStorage). Il l’envoie ensuite sur chaque requête protégée.

---

## Auth

### `POST /auth/register`

Inscription.

**Body :** `{ "email": string, "password": string }`

**Réponse attendue (200) :**  
`{ "user": { "id": string, "email": string }, "token": string }`

- Tu peux ajouter `displayName`, `knowledgeLevel` dans `user` si tu les renvoies aussi sur `/auth/me`.

---

### `POST /auth/login`

Connexion.

**Body :** `{ "email": string, "password": string }`

**Réponse attendue (200) :**  
`{ "user": { "id": string, "email": string }, "token": string }`

- En cas d’erreur : status 4xx et optionnellement `{ "message": string }`.

---

### `GET /auth/me`

Session courante (utilisateur connecté).  
Le front envoie `Authorization: Bearer <token>`.

**Réponse attendue (200) :**  
`{ "user": { "id": string, "email": string, "displayName"?: string, "knowledgeLevel"?: "debutant" | "intermediaire" | "avance" } }`

- Si token invalide/expiré : 401. Le front gérera la déconnexion.

---

### `POST /auth/logout`

Déconnexion (optionnel). Le front appelle cet endpoint puis supprime le token côté client.  
Tu peux renvoyer 200 ou 204 sans body.

---

## Portefeuille / Actifs

Les réponses peuvent utiliser **camelCase** (`unitPrice`) ou **snake_case** (`unit_price`) ; le front accepte les deux.

### `GET /api/assets`

Liste des actifs.  
Query optionnelle : `?portfolioId=xxx`

**Réponse attendue (200) :**  
`{ "assets": Asset[], "totalValue"?: number }`

Avec `Asset` du type :  
`{ "id": string, "name": string, "symbol": string, "category": "action" | "obligation" | "etf" | "crypto" | "autre", "quantity": number, "unitPrice" ou "unit_price": number, "currency": string }`

- Si `totalValue` est absent, le front le calcule à partir des `assets`.

---

### `POST /api/assets`

Création d’un actif.

**Body :**  
`{ "portfolioId": string, "name": string, "symbol": string, "category": string, "quantity": number, "unitPrice": number, "currency": string }`

**Réponse attendue (200 ou 201) :**  
`{ "asset": Asset }` (l’actif créé avec son `id`).

---

### `PUT /api/assets/:id`

Mise à jour d’un actif.

**Body :**  
`{ "name": string, "symbol": string, "category": string, "quantity": number, "unitPrice": number, "currency": string }`

**Réponse attendue :** 200 (avec ou sans body) ou 204.

---

### `DELETE /api/assets/:id`

Suppression d’un actif.

**Réponse attendue :** 200 ou 204.

---

## Résumé

| Méthode | Endpoint | Rôle |
|--------|----------|------|
| POST | /auth/register | Inscription |
| POST | /auth/login | Connexion |
| GET | /auth/me | Session (token requis) |
| POST | /auth/logout | Déconnexion (optionnel) |
| GET | /api/assets?portfolioId= | Liste actifs |
| POST | /api/assets | Créer actif |
| PUT | /api/assets/:id | Modifier actif |
| DELETE | /api/assets/:id | Supprimer actif |

Tu peux implémenter ton back (Node/Express, Python, etc.) en respectant ce contrat ; le front est déjà branché dessus dès que `VITE_API_URL` est défini.
