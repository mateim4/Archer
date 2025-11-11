#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR/backend"

echo "[build-backend] Building Rust backend (debug)..."
cargo build
echo "[build-backend] Done: target/debug/backend built."
