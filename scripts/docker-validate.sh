#!/usr/bin/env bash
# Validate Compose files and common merged stacks (exit non-zero on failure).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
ok() {
  if [[ -t 1 ]]; then echo -e "${GREEN}OK${NC}  $*"; else echo "OK   $*"; fi
}
fail() {
  if [[ -t 1 ]]; then echo -e "${RED}FAIL${NC} $*"; else echo "FAIL $*"; fi
}

ERRORS=0

run_config() {
  local label=$1
  shift
  if "$@" >/dev/null 2>&1; then
    ok "$label"
  else
    fail "$label"
    ERRORS=$((ERRORS + 1))
    "$@" 2>&1 | tail -20 || true
  fi
}

# --- Per-file checks (overlays merged with their documented base where required) ---
run_config "docker-compose.yml" docker compose -f docker-compose.yml config
run_config "docker-compose.networks.yml" docker compose -f docker-compose.networks.yml config
run_config "docker-compose.base-images.yml" docker compose -f docker-compose.base-images.yml config
run_config "docker-compose.apps.yml (+ docker-compose.yml for networks/deps)" \
  docker compose -f docker-compose.yml -f docker-compose.apps.yml config
run_config "docker-compose.dev.yml" docker compose -f docker-compose.dev.yml config
run_config "docker-compose.test.yml" docker compose -f docker-compose.test.yml config
run_config "docker-compose.observability.yml" docker compose -f docker-compose.observability.yml config

POSTGRES_PASSWORD=ci_validate_dummy \
  run_config "deploy/docker-compose.production.example.yml (POSTGRES_PASSWORD set)" \
  docker compose -f deploy/docker-compose.production.example.yml config

run_config "deploy/docker-compose.dev.override.yml" docker compose -f deploy/docker-compose.dev.override.yml config
run_config "deploy/docker-compose.backup.yml (+ docker-compose.yml)" \
  docker compose -f docker-compose.yml -f deploy/docker-compose.backup.yml config

POSTGRES_PASSWORD=ci_validate_dummy \
  run_config "deploy/docker-compose.security-linux.override.yml (+ production example)" \
  docker compose -f deploy/docker-compose.production.example.yml -f deploy/docker-compose.security-linux.override.yml config

# --- Merged stacks ---
run_config "merge: dev (yml + apps + dev)" \
  docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml config

run_config "merge: test (yml + apps + test)" \
  docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.test.yml config

POSTGRES_PASSWORD=ci_validate_dummy \
  run_config "merge: production example (standalone deploy/)" \
  docker compose -f deploy/docker-compose.production.example.yml config

run_config "merge: observability (yml + apps + observability)" \
  docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.observability.yml config

run_config "merge: backup overlay (yml + deploy/docker-compose.backup.yml)" \
  docker compose -f docker-compose.yml -f deploy/docker-compose.backup.yml config

if [[ "$ERRORS" -gt 0 ]]; then
  if [[ -t 1 ]]; then echo -e "${RED}docker-validate: ${ERRORS} failure(s)${NC}"; else echo "docker-validate: ${ERRORS} failure(s)"; fi
  exit 1
fi

if [[ -t 1 ]]; then echo -e "${GREEN}All Compose validations passed.${NC}"; else echo "All Compose validations passed."; fi
