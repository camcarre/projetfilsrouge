# 📊 Finance PWA - Visualisation Financière et Recommandations ETF

Une Progressive Web App (PWA) pour visualiser vos finances personnelles, analyser votre portefeuille et recevoir des recommandations personnalisées d'ETF.

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
- Authentification sécurisée via Supabase
- Chiffrement des données sensibles
- Conformité RGPD
- Audit trail complet

## 🛠️ Stack Technique

### Frontend PWA
- **Framework**: React/Vue.js (à décider)
- **UI**: Material-UI/Ant Design
- **PWA**: Workbox, Service Worker
- **Offline**: IndexedDB, Cache API
- **Tests**: Jest, Lighthouse

### Backend - Supabase (BaaS)
- **Database**: PostgreSQL
- **Auth**: Supabase Auth (JWT, OAuth)
- **API**: REST + Realtime subscriptions
- **Edge Functions**: Calculs financiers
- **Storage**: Fichiers et exports

### Sources de Données
- **APIs financières**: Yahoo Finance, Alpha Vantage
- **Données ETF**: Morningstar, TrackInsight
- **ESG**: MSCI, Sustainalytics

## 📋 Prérequis

- Node.js 16+ 
- Navigateur moderne (Chrome 90+, Firefox 88+, Safari 14+)
- Compte Supabase (gratuit pour commencer)
- Compte GitHub (pour collaboration)

## 🏃‍♂️ Démarrage Rapide

### 1. Cloner le Repository
```bash
git clone https://github.com/votre-username/projet-finance-pwa.git
cd projet-finance-pwa
```

### 2. Installer les Dépendances
```bash
npm install
# ou
yarn install
```

### 3. Configuration Supabase
1. Créer un projet sur [Supabase](https://supabase.com)
2. Copier les clés d'API dans `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 4. Lancer le Développement
```bash
npm run dev
# ou
yarn dev
```

### 5. Build Production
```bash
npm run build
# ou
yarn build
```

## 👥 Collaboration (Équipe de 2)

### Organisation
- **Phase 1** (6-8 semaines): Frontend PWA ensemble
  - Camille: UI/UX, responsive design
  - Théo: Service Worker, offline logic
- **Phase 2** (3-4 semaines): Configuration Supabase
  - Ensemble: Database, auth, edge functions
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