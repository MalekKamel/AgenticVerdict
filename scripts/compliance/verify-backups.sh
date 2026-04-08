#!/usr/bin/env bash
# Gap #22 — Ensure recent backup artifacts exist under ./backups
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

MAX_AGE_DAYS="${1:-2}"

if [[ ! -d backups ]]; then
  echo "No backups/ directory. Run scripts/backup-postgres.sh first."
  exit 1
fi

count=$(find backups -maxdepth 1 -name 'backup-*.sql.gz' -mtime "-${MAX_AGE_DAYS}" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$count" -eq 0 ]]; then
  echo "No backup-*.sql.gz newer than ${MAX_AGE_DAYS} day(s) in ./backups"
  exit 1
fi

echo "Found $count recent backup(s) (<= ${MAX_AGE_DAYS} day(s) old):"
find backups -maxdepth 1 -name 'backup-*.sql.gz' -mtime "-${MAX_AGE_DAYS}" -print
