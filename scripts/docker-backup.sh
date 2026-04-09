#!/usr/bin/env bash
# Backup Postgres (required) and optionally Redis from the base docker-compose.yml stack.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

COMPOSE=(docker compose -f docker-compose.yml)

pg_ids="$("${COMPOSE[@]}" ps postgres --status running -q 2>/dev/null || true)"
if [[ -z "${pg_ids}" ]]; then
  echo "Postgres must be running (docker compose -f docker-compose.yml): service postgres not in running state."
  exit 1
fi

mkdir -p backups
TS="$(date +%Y%m%d-%H%M%S)"
SQL_GZ="${ROOT_DIR}/backups/backup-${TS}.sql.gz"

"${COMPOSE[@]}" exec -T postgres pg_dump -U postgres agenticverdict | gzip >"$SQL_GZ"
echo "Postgres backup: $SQL_GZ"

redis_ids="$("${COMPOSE[@]}" ps redis --status running -q 2>/dev/null || true)"
if [[ -n "${redis_ids}" ]]; then
  RDB="${ROOT_DIR}/backups/backup-${TS}-redis.rdb"
  "${COMPOSE[@]}" exec -T redis redis-cli SAVE >/dev/null
  sleep 1
  redis_cid="$("${COMPOSE[@]}" ps -q redis)"
  docker cp "${redis_cid}:/data/dump.rdb" "$RDB"
  echo "Redis backup:    $RDB"
else
  echo "Redis not running; skipping Redis backup."
fi
