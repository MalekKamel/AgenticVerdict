#!/usr/bin/env bash
# Gap #23 — Verify selected Postgres extensions / catalog probes (adjust for your schema).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

echo "=== Extensions (pgcrypto expected for crypto-at-rest patterns) ==="
docker compose -f docker-compose.yml exec -T postgres \
  psql -v ON_ERROR_STOP=1 -U postgres -d agenticverdict -c \
  "SELECT extname, extversion FROM pg_extension ORDER BY extname;"

echo
echo "=== Note on GDPR / retention ==="
echo "data_retention_policies and application-level delete flows must match your"
echo "DPA. Add SQL here once tables exist (e.g. audit logs, PII export/delete)."
