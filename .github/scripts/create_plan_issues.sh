#!/usr/bin/env bash
set -euo pipefail

REPO="mateim4/LCMDesigner"
ISSUES_DIR=".github/issues"

if ! command -v gh >/dev/null 2>&1; then
  echo "GitHub CLI (gh) not found. Install: https://cli.github.com/ or sudo apt install gh"
  echo "Manual creation links: https://github.com/${REPO}/issues/new"
  exit 1
fi

if ! gh auth status >/dev/null 2>&1; then
  echo "Please login: gh auth login"
  exit 1
fi

echo "Creating plan issues in ${REPO}..."

create_issue() {
  local file="$1"; shift
  local title
  title=$(sed -n 's/^Title: \(.*\)$/\1/p' "$file" | head -n1)
  if [[ -z "$title" ]]; then
    echo "Skipping $file (no Title: found)"; return
  fi
  echo "-> $title"
  gh issue create \
    --repo "$REPO" \
    --title "$title" \
    --body-file "$file" \
    --label "planning" || true
}

for f in ${ISSUES_DIR}/*.md; do
  create_issue "$f"
done

echo "Done."
