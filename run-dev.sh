#!/usr/bin/env bash
set -euo pipefail

# Lancer le front + back (Vite + Express) comme la commande `npm run dev:all`.
# Usage:
#   chmod +x run-dev.sh
#   ./run-dev.sh

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJ_DIR="$ROOT_DIR/projetfilsrouge"

if [ ! -d "$PROJ_DIR" ]; then
  echo "Erreur: dossier 'projetfilsrouge' introuvable dans: $ROOT_DIR" >&2
  exit 1
fi

cd "$PROJ_DIR"

echo "Démarrage de l'app (backend + front)..."
echo "Backend:  http://localhost:3000"
echo "Front:    http://localhost:5173"

npm run dev:all

