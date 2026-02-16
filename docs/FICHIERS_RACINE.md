# Fichiers à la racine – à quoi ils servent

Toute la doc du projet est dans le dossier **docs/** (ce fichier inclus).

## Indispensables (racine – ne pas supprimer)

| Fichier | Rôle |
|--------|------|
| **package.json** | Dépendances et scripts npm (dev, build). |
| **package-lock.json** | Verrouillage des versions (généré par npm). |
| **index.html** | Point d’entrée HTML de l’app. |
| **vite.config.ts** | Config Vite + PWA. |
| **tsconfig.json** | Config TypeScript (app). |
| **tsconfig.node.json** | Config TypeScript (fichiers config type Vite). |
| **tailwind.config.js** | Config Tailwind (couleurs, thème). |
| **postcss.config.js** | PostCSS pour Tailwind. |
| **.env.example** | Modèle pour les variables d’environnement. |
| **.gitignore** | Fichiers/dossiers ignorés par Git. |

Sans eux, le projet ne build pas ou ne tourne pas correctement.

---

## Documentation

| Emplacement | Fichier | Rôle |
|-------------|--------|------|
| **Racine** | README.md | Présentation du projet, commandes, stack. |
| **docs/** | cahier_des_charges_app_finance.md | CDC du projet (référence). |
| **docs/** | repartition_taches.md | Répartition Cam / Théo. |
| **docs/** | BACKEND.md | Explication backend (Supabase + API custom). |
| **docs/** | API_BACKEND_CUSTOM.md | Contrat API si tu fais ton back. |
| **docs/** | STRUCTURE.md | Arborescence du projet. |
| **docs/** | FICHIERS_RACINE.md | Ce fichier – rôle des fichiers à la racine. |

---

## À ignorer / générés

- **README** (sans .md) : doublon de README.md, tu peux le supprimer.
- **\*.tsbuildinfo** : cache TypeScript (déjà dans .gitignore).
- **dist/** : build de production (déjà dans .gitignore).
- **node_modules/** : dépendances (déjà dans .gitignore).

---

## Résumé

- **À la racine** : les 10 fichiers indispensables + **README.md** + dossiers **src/**, **public/**.
- **Dans docs/** : toute la doc projet (CDC, répartition, back, structure).
