#!/usr/bin/env bash
# Shared helpers for Docker health verification (docs/docker/docker-health-verification-execution-plan.md).
# shellcheck shell=bash
# Intended to be sourced from scripts/docker-health/verify-docker-health.sh

DOCKER_HEALTH_LIB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$DOCKER_HEALTH_LIB_DIR/../.." && pwd)"

# Compose file sets (same -f ordering as the execution plan).
DOCKER_HEALTH_COMPOSE_BASE=(-f docker-compose.yml)
DOCKER_HEALTH_COMPOSE_APPS=(-f docker-compose.yml -f docker-compose.apps.yml)
DOCKER_HEALTH_COMPOSE_OBS=(
  -f docker-compose.yml
  -f docker-compose.apps.yml
  -f docker-compose.observability.yml
)
DOCKER_HEALTH_COMPOSE_BACKUP=(-f docker-compose.yml -f deploy/docker-compose.backup.yml)

DH_VERBOSE="${DH_VERBOSE:-0}"
DH_DRY_RUN="${DH_DRY_RUN:-0}"

dh_ts() {
  date '+%Y-%m-%dT%H:%M:%S%z'
}

dh_log() {
  local level=$1
  shift
  echo "[docker-health][$(dh_ts)][$level] $*"
}

dh_run() {
  if [[ "$DH_DRY_RUN" == 1 ]]; then
    printf '+ '
    local a
    for a in "$@"; do
      printf '%q ' "$a"
    done
    echo
    return 0
  fi
  if [[ "$DH_VERBOSE" == 1 ]]; then
    dh_log "exec" "$*"
  fi
  "$@"
}

dh_require_cmd() {
  local c=$1
  if ! command -v "$c" >/dev/null 2>&1; then
    dh_log "error" "required command not found: $c"
    return 1
  fi
}

dh_compose_v2_ok() {
  local out
  if ! out=$(docker compose version 2>/dev/null); then
    dh_log "error" "docker compose version failed"
    return 1
  fi
  if [[ "$DH_VERBOSE" == 1 ]]; then
    dh_log "info" "$out"
  fi
  if ! echo "$out" | grep -qiE 'docker compose version|compose version'; then
    dh_log "warn" "unexpected docker compose version output; continuing: $out"
  fi
  return 0
}

dh_container_health_status() {
  local cid=$1
  docker inspect -f '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}' "$cid" 2>/dev/null || echo "missing"
}

# Args: name of array variable (without @), service name
# Uses docker compose directly (read-only); not routed through dh_run so dry-run can skip callers.
dh_assert_service_up() {
  local arr_name=$1
  local svc=$2
  local -a args
  eval "args=(\"\${${arr_name}[@]}\")"
  local cid
  cid=$(docker compose "${args[@]}" ps -q "$svc" 2>/dev/null | head -n1 | tr -d '\r')
  if [[ -z "${cid:-}" ]]; then
    dh_log "error" "service not found or not running: $svc"
    return 1
  fi
  local status health
  status=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo "missing")
  if [[ "$status" != "running" ]]; then
    dh_log "error" "service $svc state=$status (expected running)"
    return 1
  fi
  health=$(dh_container_health_status "$cid")
  if [[ "$health" == "none" ]]; then
    dh_log "info" "service $svc running (no container healthcheck defined)"
    return 0
  fi
  if [[ "$health" != "healthy" ]]; then
    dh_log "error" "service $svc health=$health (expected healthy)"
    return 1
  fi
  dh_log "pass" "service $svc running and healthy"
  return 0
}

dh_assert_service_running() {
  local arr_name=$1
  local svc=$2
  local -a args
  eval "args=(\"\${${arr_name}[@]}\")"
  local cid
  cid=$(docker compose "${args[@]}" ps -q "$svc" 2>/dev/null | head -n1 | tr -d '\r')
  if [[ -z "${cid:-}" ]]; then
    dh_log "error" "service not found or not running: $svc"
    return 1
  fi
  local status
  status=$(docker inspect -f '{{.State.Status}}' "$cid" 2>/dev/null || echo "missing")
  if [[ "$status" != "running" ]]; then
    dh_log "error" "service $svc state=$status (expected running)"
    return 1
  fi
  dh_log "pass" "service $svc running"
  return 0
}

dh_network_subnet_ok() {
  local pattern=${1:-agenticverdict}
  local expected_subnet=${2:-172.28.0.0/16}
  local net
  net=$(docker network ls --format '{{.Name}}' | grep -E "$pattern" | head -n1)
  if [[ -z "$net" ]]; then
    dh_log "error" "no docker network matching pattern: $pattern"
    return 1
  fi
  local subnet
  subnet=$(docker network inspect "$net" --format '{{range .IPAM.Config}}{{.Subnet}}{{end}}' 2>/dev/null | head -n1)
  if [[ "$subnet" != "$expected_subnet" ]]; then
    dh_log "error" "network $net subnet=$subnet (expected $expected_subnet)"
    return 1
  fi
  dh_log "pass" "network $net has subnet $expected_subnet"
  return 0
}

dh_volumes_present() {
  local vol_list
  vol_list=$(docker volume ls --format '{{.Name}}')
  echo "$vol_list" | grep -q 'pgdata' || {
    dh_log "error" "expected a volume name containing 'pgdata'"
    return 1
  }
  echo "$vol_list" | grep -q 'redis_data' || {
    dh_log "error" "expected a volume name containing 'redis_data'"
    return 1
  }
  dh_log "pass" "project volumes include pgdata and redis_data"
  return 0
}

dh_worker_logs_sanity() {
  local -a args=("$@")
  local log
  if ! log=$(docker compose "${args[@]}" logs worker --tail 80 2>&1); then
    dh_log "error" "could not read worker logs"
    return 1
  fi
  if echo "$log" | grep -qiE '(FATAL|ECONNREFUSED.*redis|ECONNREFUSED.*5432)'; then
    dh_log "error" "worker logs contain fatal/connection errors; tail:"
    echo "$log" >&2
    return 1
  fi
  dh_log "pass" "worker logs (tail 80) show no obvious fatal DB/Redis errors"
  return 0
}
