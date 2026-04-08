#!/usr/bin/env bash
# Gap #21 — Pull newer images and recreate containers (adjust compose files to match your deploy).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

COMPOSE_FILES=(docker-compose.yml)
if [[ -f docker-compose.apps.yml ]]; then
  COMPOSE_FILES+=(docker-compose.apps.yml)
fi

args=()
for f in "${COMPOSE_FILES[@]}"; do
  args+=(-f "$f")
done

echo "Running: docker compose ${args[*]} pull && docker compose ${args[*]} up -d"
docker compose "${args[@]}" pull
docker compose "${args[@]}" up -d

echo "Patch deploy complete."
