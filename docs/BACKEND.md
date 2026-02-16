# Backend – Configuration selon CDC et bonnes pratiques

Le backend du projet est **Supabase** (CDC 4.2.3). Il n’y a pas de serveur Node/Express dans le repo : tout passe par le client Supabase depuis le front.

---

## 1. Référence CDC

- **4.2.3 Backend - Supabase (BaaS)**  
  PostgreSQL, Auth (JWT, OAuth, magic link), API REST, Realtime, Storage, Edge Functions.
- **4.4 Sécurité**  
  TLS/HTTPS (Supabase), Auth + RLS (Row Level Security), clé **anon** uniquement en front (jamais `service_role`).
- **7.2 Phase 2**  
  Création projet Supabase, modélisation BDD + RLS, Auth (providers, policies), migration mock → Supabase, Edge Functions, Storage, Realtime.

---

## 2. Ce qui est en place dans le projet

### 2.1 Configuration et sécurité (bonnes pratiques)

- **`src/config/env.ts`**  
  Validation des variables d’environnement (URL Supabase, clé anon). Une seule source de vérité pour l’env.
- **`.env` / `.env.example`**  
  Seules les variables préfixées `VITE_` sont exposées au client. **Ne jamais** mettre la clé `service_role` en front (CDC 4.4).
- **`.gitignore`**  
  `.env` est ignoré pour ne pas commiter de clés.

### 2.2 Client Supabase

- **`src/services/supabase/client.ts`**  
  Client **singleton** typé avec `Database`, options Auth :
  - `persistSession: true`, `autoRefreshToken: true`, `detectSessionInUrl: true`
  - Stockage session : `localStorage` (clé `finance-pwa-auth`)
  - Prêt pour OAuth (Google, Apple) en configurant les providers dans le dashboard Supabase.

### 2.3 Types base de données (RLS / Phase 2)

- **`src/services/supabase/database.types.ts`**  
  Types TypeScript pour les tables `profiles`, `portfolios`, `assets` (alignés CDC modélisation BDD).  
  À régénérer si besoin avec :  
  `npx supabase gen types typescript --project-id <id> > src/services/supabase/database.types.ts`

### 2.4 Couche services (une seule entrée pour le back)

Toute l’utilisation de Supabase passe par les services, pas par le client brut (sauf cas très spécifique) :

| Service | Rôle (CDC) |
|--------|------------|
| **`authService`** | Auth : email/mot de passe, inscription, OAuth (Google, Apple), session, `onAuthStateChange` |
| **`portfolioService`** | Portefeuille : CRUD actifs, liste (avec totalValue), prêt pour RLS côté Supabase |
| **`storageService`** | Storage : upload exports, URL signée pour téléchargement (rapports) |
| **`edgeFunctionsService`** | Edge Functions : `invoke`, exemple `portfolio-metrics` (perf, volatilité, VaR) |

En **Phase 1** (Supabase non configuré), les services utilisent les **mocks** (`src/services/api/mockApi.ts`) et renvoient des erreurs explicites si on appelle du Supabase-only.

---

## 3. Phase 2 – Checklist CDC 7.2

1. **Créer le projet Supabase**  
   Dashboard → New project → récupérer **URL** et **anon key**.
2. **Copier `.env.example` en `.env`** et remplir `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`.
3. **Modélisation BDD**  
   Créer les tables (`profiles`, `portfolios`, `assets`, etc.) et activer les **politiques RLS** (Row Level Security) pour chaque table.
4. **Auth**  
   Dans Supabase : Auth → Providers → activer Email, Google, Apple ; configurer les redirects (ex. `/auth/callback`).
5. **Storage**  
   Créer un bucket `exports` (ou celui défini dans `storageService`) et les policies associées.
6. **Edge Functions**  
   Déployer les fonctions (ex. `portfolio-metrics`, intégration APIs financières) et les appeler via `edgeFunctionsService`.
7. **Realtime** (optionnel Phase 2)  
   Souscrire aux changements sur les tables nécessaires (cours, alertes) via `supabase.channel()`.

---

## 4. Bonnes pratiques respectées

- **Une seule instance** du client Supabase (singleton).
- **Clé anon uniquement** en front ; pas de `service_role` ni autre secret.
- **Validation de l’env** (URL + clé) avant de créer le client.
- **Typage fort** : client typé avec `Database`, services qui renvoient des types métier (Asset, User).
- **Couche services** : le reste de l’app utilise `authService`, `portfolioService`, etc., pas `supabase` directement.
- **Gestion d’erreurs** : les services renvoient `{ data, error }` ou équivalent, et gèrent le cas « Supabase non configuré ».
