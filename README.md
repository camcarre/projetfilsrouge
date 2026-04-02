# 📊 Finance PWA - Visualisation Financière et Recommandations ETF

Une Progressive Web App (PWA) pour visualiser vos finances personnelles, analyser votre portefeuille et recevoir des recommandations personnalisées d'ETF.

**Documentation** : cahier des charges, répartition des tâches, backend, structure → voir le dossier **[docs/](docs/)**.

## Lancer le projet (front + back)

Tout est prêt : le **backend** est dans **`../backend`**, le fichier **`.env`** est configuré pour l’appeler.

### Première fois uniquement

Installer les dépendances du **front** et du **back** :

```bash
cd "/Users/theodelporte/Cours et Projets/Projet Fil Rouge/Filrouge/projetfilsrouge"
npm install

cd "../backend"
npm install
```

### Lancer en une commande

Depuis le dossier **projetfilsrouge** :

```bash
cd "/Users/theodelporte/Cours et Projets/Projet Fil Rouge/Filrouge/projetfilsrouge"
npm run dev:all
```

Ça démarre le **backend** (http://localhost:3000) et le **front** (http://localhost:5173). Ouvre **http://localhost:5173** dans le navigateur.  
**Connexion** et **Portefeuille** sont reliés au backend (auth + actifs) : connecte-toi pour voir et ajouter tes actifs.

### Lancer en deux terminaux (alternative)

**Terminal 1 – Backend :**
```bash
cd "/Users/theodelporte/Cours et Projets/Projet Fil Rouge/Filrouge/backend"
npm run dev
```

**Terminal 2 – Front :**
```bash
cd "/Users/theodelporte/Cours et Projets/Projet Fil Rouge/Filrouge/projetfilsrouge"
npm run dev
```

## 🚀 Fonctionnalités

### 📈 Visualisation Financière
- Tableau de bord interactif avec graphiques
- Analyse de performance du portefeuille
- Répartition géographique et sectorielle
- Corrélation entre actifs

### 🤖 Recommandations ETF
- Moteur de recommandation basé sur votre profil
- Filtres avancés (sectoriels, géographiques, ESG)
- Comparaison côte à côte d'ETF
- Score de correspondance avec votre profil

### 📱 PWA Moderne
- Installation via bouton "Ajouter" du navigateur
- Mode offline complet
- Notifications push
- Synchronisation en arrière-plan

### 🔒 Sécurité
- Authentification via le backend (token Bearer)
- Données sensibles côté serveur
- Conformité RGPD à prévoir

## 🛠️ Stack Technique

### Frontend PWA
- **Framework**: Preact + TypeScript (TSX)
- **UI**: Tailwind CSS
- **PWA**: vite-plugin-pwa, Service Worker
- **Offline**: IndexedDB, Cache API
- **État**: Redux

### Backend – API custom (Express)
- **Serveur**: Express (dossier `../backend`)
- **Auth**: inscription / connexion email, token JWT-like
- **API**: REST (auth + CRUD actifs)
- **Données**: en mémoire (dev) ; à remplacer par une BDD pour la prod

### Sources de données (à intégrer)
- **APIs financières**: Yahoo Finance, Alpha Vantage
- **Données ETF**: Morningstar, TrackInsight
- **ESG**: MSCI, Sustainalytics

## 📋 Prérequis

- Node.js 16+
- Navigateur moderne (Chrome 90+, Firefox 88+, Safari 14+)

## 🏃‍♂️ Démarrage rapide

### 1. Installer les dépendances (front + back)

```bash
cd projetfilsrouge
npm install

cd ../backend
npm install
```

### 2. Configurer l’API

Copier `.env.example` en `.env` dans `projetfilsrouge` (déjà fait si `VITE_API_URL=http://localhost:3000`).

### 3. Lancer le développement

Depuis **projetfilsrouge** :

```bash
npm run dev:all
```

→ Backend sur http://localhost:3000, front sur http://localhost:5173.

### 4. Build production

```bash
npm run build
```

## 👥 Collaboration (Équipe de 2)

### Organisation
- **Phase 1** (6-8 semaines): Frontend PWA ensemble
- **Phase 2** (4-6 semaines): Backend (API custom) – auth, actifs, puis ETF, analytics, recommandations
- **Phase 3** (2-3 semaines): Finalisation
- **Phase 4** (1-2 semaines): Déploiement

### Workflow Git
```bash
# Créer une branche feature
git checkout -b feature/nom-de-la-fonctionnalité

# Commit avec message conventionnel
git commit -m "feat: ajoute graphique de performance"

# Push et créer Pull Request
git push origin feature/nom-de-la-fonctionnalité
```

Voir [GIT_SETUP.md](./GIT_SETUP.md) pour le guide complet de collaboration.

## 📁 Structure du Projet

```
projet-finance-pwa/
├── public/                 # Fichiers statiques
│   ├── manifest.json      # Configuration PWA
│   ├── service-worker.js  # Service Worker
│   └── icons/             # Icônes PWA
├── src/
│   ├── components/        # Composants React/Vue
│   ├── pages/            # Pages de l'application
│   ├── hooks/            # Hooks personnalisés
│   ├── utils/            # Utilitaires
│   ├── services/         # API calls, Supabase
│   ├── store/            # État global
│   └── styles/           # Styles CSS
├── supabase/             # Configuration Supabase
│   ├── functions/        # Edge Functions
│   ├── migrations/       # Migrations DB
│   └── seed/             # Données de test
├── tests/                # Tests unitaires
└── docs/                 # Documentation
```

## 🧪 Tests

### Tests PWA (Lighthouse)
```bash
npm run test:lighthouse
```

### Tests Unitaires
```bash
npm run test
```

### Tests E2E
```bash
npm run test:e2e
```

## 🚀 Déploiement

### Frontend (Netlify/Vercel)
1. Connecter repository GitHub
2. Configurer variables d'environnement
3. Déployer automatiquement sur push main

### Backend (Supabase)
1. Projet déjà créé
2. Migrations automatiques via CI/CD
3. Edge Functions déployés via CLI

## 📊 Performance Objectifs

- **First Contentful Paint**: < 3 secondes
- **Lighthouse Score**: > 90
- **Bundle Size**: < 500KB initial
- **Offline Support**: 100% fonctionnalités essentielles
- **Installation**: < 10 secondes

## 🔧 Scripts NPM

```bash
npm run dev          # Développement
npm run build        # Build production
npm run preview      # Preview production
npm run test         # Tests unitaires
npm run test:lighthouse # Audit PWA
npm run lint         # Linting
npm run format       # Formatage
```

## 📚 Documentation

- [Cahier des Charges](./cahier_des_charges_app_finance.md) - Spécifications complètes
- [Guide Git](./GIT_SETUP.md) - Workflow collaboration
- [API Documentation](./docs/api.md) - Endpoints et modèles
- [PWA Guide](./docs/pwa.md) - Configuration PWA

## 🤝 Contribution

1. Créer une issue pour discuter de la fonctionnalité
2. Créer une branche `feature/description`
3. Développer avec tests
4. Créer Pull Request
5. Code review par l'autre personne
6. Merger après approbation

## 📝 License

Projet académique - License à définir

## 📞 Support

- Créer une issue GitHub
- Discord: [votre-serveur-discord]
- Email: [votre-email]

---

**Développé avec ❤️ par Camille et Théo**