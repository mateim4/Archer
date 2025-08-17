#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/frontend"

echo "[build-frontend] Installing deps if needed..."
if [ ! -d node_modules ]; then
  npm ci
fi

echo "[build-frontend] Type-check and build (vite build)..."
# If the project uses `npm run build`, prefer that; fallback to vite
if npm run -s build; then
  echo "[build-frontend] Build finished via npm script."
else
  npx vite build
  echo "[build-frontend] Build finished via vite."
fi
