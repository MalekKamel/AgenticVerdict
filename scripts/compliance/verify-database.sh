#!/usr/bin/env bash
# Gap #21 — Postgres readiness and a trivial query (docker-compose.yml stack).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

docker compose -f docker-compose.yml exec -T postgres pg_isready -U postgres -d agenticverdict
docker compose -f docker-compose.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d agenticverdict -c "SELECT 1 AS ok;"

echo "Database checks passed."
