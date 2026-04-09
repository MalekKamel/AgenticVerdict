#!/usr/bin/env bash
# Restore Postgres from a gzip SQL dump (same format as scripts/backup-postgres.sh).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

BACKUP="${1:?Usage: $0 <path-to-backup.sql.gz>}"

if [[ ! -f "$BACKUP" ]]; then
  echo "Backup file not found: $BACKUP"
  exit 1
fi

SKIP_PROMPT=false
if [[ "${CONFIRM:-}" == "1" || "${CONFIRM:-}" == "YES" ]]; then
  SKIP_PROMPT=true
fi

echo "Restoring into database agenticverdict from $BACKUP (this overwrites current data)."
if [[ "$SKIP_PROMPT" != true ]]; then
  read -r -p "Type YES to continue: " confirm
  if [[ "$confirm" != "YES" ]]; then
    echo "Aborted."
    exit 1
  fi
fi

gunzip -c "$BACKUP" | docker compose -f docker-compose.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d agenticverdict

echo "Restore finished."
