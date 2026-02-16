# Structure du projet (CDC)

Structure frontend PWA – React + TypeScript (TSX), Redux, Tailwind, Vite.

```
projetfilsrouge/
├── public/                 # Assets statiques
│   ├── favicon.svg
│   └── icons/              # Icônes PWA (192, 512)
├── src/
│   ├── components/         # Composants réutilisables
│   │   ├── layout/         # Layout, header, navigation
│   │   └── ui/             # Design system (Button, Card, etc.)
│   ├── pages/              # Écrans / routes
│   │   ├── Auth/           # Connexion, inscription, profil
│   │   ├── Dashboard/      # Tableau de bord
│   │   ├── Portfolio/      # Gestion du portefeuille
│   │   ├── Analysis/      # Analyse et visualisation
│   │   ├── Etf/            # Recommandations ETF
│   │   └── Education/     # Éducation financière
│   ├── store/              # Redux
│   │   ├── index.ts
│   │   └── slices/         # authSlice, portfolioSlice, …
│   ├── services/           # API, mock (Supabase en Phase 2)
│   │   └── api/
│   ├── hooks/              # useAppDispatch, useAppSelector, custom hooks
│   ├── utils/              # format, calculs, helpers
│   ├── types/              # Types TypeScript (portfolio, user, …)
│   ├── assets/             # Images, polices
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css           # Tailwind
├── index.html
├── package.json
├── vite.config.ts          # Vite + PWA (Workbox)
├── tailwind.config.js
├── tsconfig.json
├── cahier_des_charges_app_finance.md
├── repartition_taches.md
└── README.md
```

## Commandes

- `npm install` – installer les dépendances
- `npm run dev` – lancer le serveur de développement
- `npm run build` – build production (PWA)
- `npm run preview` – prévisualiser le build

## PWA

- Manifest et Service Worker sont gérés par `vite-plugin-pwa` (voir `vite.config.ts`).
- En dev, le SW n’est pas actif ; tester en `npm run build` puis `npm run preview`.
