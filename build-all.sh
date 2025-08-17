#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"$ROOT_DIR/scripts/build-backend.sh"
"$ROOT_DIR/scripts/build-frontend.sh"

echo "[build-all] All builds completed successfully."
