#!/usr/bin/env bash
# One-off manual backup: run from a clean shell when the stack in docker-compose.yml is up;
# writes a timestamped gzip SQL dump under ./backups (host), using pg_dump inside the postgres container.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p backups
docker compose -f docker-compose.yml exec -T postgres pg_dump -U postgres agenticverdict \
  | gzip > "./backups/backup-$(date +%Y%m%d-%H%M%S).sql.gz"
