# finance-pwa
PWA de visualisation financière et recommandations ETF — Preact + TypeScript + Vite + Tailwind + Redux + Supabase + Express

## Commandes
```
dev:   npm run dev:all       # front (5173) + backend (3000)
front: npm run dev           # front seul
build: npm run build         # tsc + vite build
lint:  npm run lint          # ESLint strict (0 warnings)
```

## Architecture
```
projetfilsrouge/
├── src/
│   ├── components/    # Composants Preact/TSX
│   ├── pages/         # Pages (routing react-router-dom)
│   ├── hooks/         # Hooks personnalisés
│   ├── services/      # Appels API + Supabase
│   ├── store/         # Redux slices (RTK)
│   ├── contexts/      # React contexts
│   ├── types/         # Types TypeScript
│   └── utils/         # Utilitaires
├── backend/
│   ├── server.js      # Express — auth JWT + CRUD actifs
│   ├── services/      # Services backend
│   └── data/          # Données en mémoire (dev)
├── public/            # Manifest PWA, SW, icônes
└── docs/              # Specs, cahier des charges
```

## Stack
- **Frontend** : Preact (compat React), TypeScript, Vite, Tailwind CSS 3, GSAP
- **État** : Redux Toolkit + react-redux
- **Routing** : react-router-dom v6
- **Charts** : Recharts
- **Backend** : Express.js, auth token Bearer
- **BDD** : Supabase (prod) / en mémoire (dev)
- **PWA** : vite-plugin-pwa, Service Worker

## Conventions
- TSX pour tous les composants (Preact compat React)
- Imports absolus depuis `src/`
- Redux pour état global, contexts pour état local/transversal
- Tailwind classes inline, pas de CSS modules
- Nommage : PascalCase composants, camelCase utils/hooks

## Gotchas
- `backend/` est un projet Node séparé avec son propre `package.json` — `npm install` à faire dans les deux
- `.env` à la racine du front (non commité) — voir `.env.example`
- Preact ≠ React : éviter les libs React-only sans vérifier la compat Preact
- Backend en mémoire en dev → les données sont perdues au restart
- `vite.config.ts` et `vite.config.js` coexistent → ne pas supprimer `vite.config.js`

## Workflows
### Ajouter un composant
1. Créer `src/components/NomComposant.tsx`
2. Typer les props avec une interface dans `src/types/` si réutilisable
3. Importer depuis la page concernée

### Ajouter un endpoint backend
1. Modifier `backend/server.js`
2. Documenter dans `docs/`
3. Mettre à jour le service correspondant dans `src/services/`
