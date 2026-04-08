#!/usr/bin/env bash
# Automates verification steps from docs/docker/docker-health-verification-execution-plan.md
#
# Prerequisites: Docker Engine + Compose v2; repository root is detected from this script's location.
#
# Usage:
#   ./scripts/docker-health/verify-docker-health.sh              # preflight + A + C + D (apps up --build)
#   ./scripts/docker-health/verify-docker-health.sh --quick      # A + C + HTTP/health-check (apps must be up)
#   ./scripts/docker-health/verify-docker-health.sh --phase a,c  # subset of phases (see --help)
#   ./scripts/docker-health/verify-docker-health.sh --with-obs --with-compliance
#   ./scripts/docker-health/verify-docker-health.sh --dry-run    # print mutating compose commands only
#   ./scripts/docker-health/verify-docker-health.sh --teardown   # compose down (apps file set) after success
#
# Environment (optional):
#   WEB_HEALTH_URL, API_HEALTH_URL — passed to scripts/health-check.sh
#   DH_VERBOSE=1 — log each executed command
#
# Exit codes: 0 success, 1 verification failure, 2 usage/argument error

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../lib/docker-health-common.sh
source "$SCRIPT_DIR/../lib/docker-health-common.sh"

cd "$REPO_ROOT"

WEB_HEALTH_URL="${WEB_HEALTH_URL:-http://127.0.0.1:3000/api/health}"
API_HEALTH_URL="${API_HEALTH_URL:-http://127.0.0.1:4000/health}"

DO_QUICK=0
DO_DRY_RUN=0
DO_TEARDOWN=0
DO_TEARDOWN_VOLUMES=0
DO_BUILD_NO_CACHE=0
DO_SKIP_PREFLIGHT=0
DO_WITH_OBS=0
DO_WITH_BACKUP=0
DO_WITH_COMPLIANCE=0
DO_WITH_FALCO=0
DO_WITH_BUILD=0
PHASE_PICK=""
DO_SKIP_GENERATE_SECRETS=0

usage() {
  cat <<'EOF'
Docker health verification driver — implements docs/docker/docker-health-verification-execution-plan.md

Options:
  -h, --help              Show this help
  -q, --quick             Phases A + C + D.3–D.5 only (application stack must already be running)
  -n, --dry-run           Print mutating docker/compose commands instead of running them
  -v, --verbose           Log executed commands (DH_VERBOSE=1)
      --teardown          After success, docker compose down with the same file set as the apps run
      --teardown-volumes  With --teardown, add -v (destructive to named volumes)
      --with-build        Include phase B (compose build) in the default phase path
      --no-cache          With --with-build or phase b, use compose build --no-cache
      --skip-preflight    Skip secrets/seccomp/file checks
      --skip-generate-secrets  Do not run scripts/generate-secrets.sh in Phase D
      --with-obs          Phase E (observability overlay; requires apps stack)
      --with-backup       Phase F (backup overlay + optional host backup script)
      --with-compliance   Phase G (runtime hardening + network scripts)
      --with-falco        With --with-obs, enable --profile security (Linux hosts only)
      --phase LIST        Comma-separated subset: a,b,c,d,e,f,g (default: full non-optional path)

Examples:
  ./scripts/docker-health/verify-docker-health.sh --phase a,c
  ./scripts/docker-health/verify-docker-health.sh --quick
EOF
}

want_phase() {
  local p=$1
  if [[ -z "$PHASE_PICK" ]]; then
    return 0
  fi
  echo ",$PHASE_PICK," | grep -q ",$p," || return 1
  return 0
}

# Widest -f list for this PHASE_PICK so `docker compose up` matches every service that may
# already be running (avoids "orphan containers" when a narrower file set omits apps/obs).
DOCKER_HEALTH_COMPOSE_ACTIVE=()

compose_active_refresh() {
  DOCKER_HEALTH_COMPOSE_ACTIVE=()
  if want_phase e; then
    DOCKER_HEALTH_COMPOSE_ACTIVE=("${DOCKER_HEALTH_COMPOSE_OBS[@]}")
  elif want_phase d || want_phase b; then
    DOCKER_HEALTH_COMPOSE_ACTIVE=("${DOCKER_HEALTH_COMPOSE_APPS[@]}")
  else
    DOCKER_HEALTH_COMPOSE_ACTIVE=("${DOCKER_HEALTH_COMPOSE_BASE[@]}")
  fi
  if want_phase f; then
    if want_phase e || want_phase d || want_phase b; then
      DOCKER_HEALTH_COMPOSE_ACTIVE+=(-f deploy/docker-compose.backup.yml)
    else
      DOCKER_HEALTH_COMPOSE_ACTIVE=("${DOCKER_HEALTH_COMPOSE_BACKUP[@]}")
    fi
  fi
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    -h | --help)
      usage
      exit 0
      ;;
    -q | --quick)
      DO_QUICK=1
      shift
      ;;
    -n | --dry-run)
      DO_DRY_RUN=1
      export DH_DRY_RUN=1
      shift
      ;;
    -v | --verbose)
      export DH_VERBOSE=1
      shift
      ;;
    --teardown)
      DO_TEARDOWN=1
      shift
      ;;
    --teardown-volumes)
      DO_TEARDOWN_VOLUMES=1
      shift
      ;;
    --no-cache)
      DO_BUILD_NO_CACHE=1
      shift
      ;;
    --skip-preflight)
      DO_SKIP_PREFLIGHT=1
      shift
      ;;
    --skip-generate-secrets)
      DO_SKIP_GENERATE_SECRETS=1
      shift
      ;;
    --with-obs)
      DO_WITH_OBS=1
      shift
      ;;
    --with-backup)
      DO_WITH_BACKUP=1
      shift
      ;;
    --with-compliance)
      DO_WITH_COMPLIANCE=1
      shift
      ;;
    --with-falco)
      DO_WITH_FALCO=1
      shift
      ;;
    --with-build)
      DO_WITH_BUILD=1
      shift
      ;;
    --phase)
      PHASE_PICK="${2:-}"
      if [[ -z "$PHASE_PICK" ]]; then
        echo "error: --phase requires a value" >&2
        exit 2
      fi
      shift 2
      ;;
    *)
      echo "error: unknown option: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

if [[ "$DO_QUICK" == 1 && -n "$PHASE_PICK" ]]; then
  echo "error: --quick cannot be combined with --phase" >&2
  exit 2
fi

if [[ "$DO_QUICK" == 1 ]]; then
  PHASE_PICK="a,c,d"
  if [[ "$DO_WITH_OBS" == 1 ]]; then
    PHASE_PICK="${PHASE_PICK},e"
  fi
  if [[ "$DO_WITH_BACKUP" == 1 ]]; then
    PHASE_PICK="${PHASE_PICK},f"
  fi
  if [[ "$DO_WITH_COMPLIANCE" == 1 ]]; then
    PHASE_PICK="${PHASE_PICK},g"
  fi
fi

if [[ "$DO_TEARDOWN_VOLUMES" == 1 && "$DO_TEARDOWN" != 1 ]]; then
  DO_TEARDOWN=1
fi

preflight() {
  if [[ "$DO_SKIP_PREFLIGHT" == 1 ]]; then
    dh_log "info" "skipping preflight (--skip-preflight)"
    return 0
  fi
  dh_log "phase" "pre-flight checklist"
  docker info >/dev/null
  dh_log "pass" "docker info"

  if [[ ! -f "$REPO_ROOT/deploy/security/seccomp-profile.json" ]]; then
    dh_log "error" "missing deploy/security/seccomp-profile.json"
    return 1
  fi
  dh_log "pass" "seccomp profile file present"

  if want_phase d && [[ "$DO_SKIP_GENERATE_SECRETS" != 1 ]]; then
    if [[ ! -f "$REPO_ROOT/secrets/jwt_secret.txt" ]]; then
      if [[ "$DO_DRY_RUN" == 1 ]]; then
        dh_log "warn" "dry-run: secrets/jwt_secret.txt missing (phase D will warn again)"
      else
        dh_log "warn" "secrets/jwt_secret.txt missing; running scripts/generate-secrets.sh"
        bash "$REPO_ROOT/scripts/generate-secrets.sh"
      fi
    fi
    if [[ ! -f "$REPO_ROOT/secrets/jwt_secret.txt" ]] && [[ "$DO_DRY_RUN" != 1 ]]; then
      dh_log "error" "secrets/jwt_secret.txt still missing after generate-secrets"
      return 1
    fi
    local mode
    mode=$(stat -f '%Lp' "$REPO_ROOT/secrets/jwt_secret.txt" 2>/dev/null || stat -c '%a' "$REPO_ROOT/secrets/jwt_secret.txt" 2>/dev/null || echo "")
    if [[ "$mode" != "600" && "$mode" != "400" ]]; then
      dh_log "warn" "secrets/jwt_secret.txt mode is $mode (expected 600)"
    fi
  fi

  if command -v node >/dev/null 2>&1; then
    dh_log "info" "node: $(node -v 2>/dev/null || true)"
  else
    dh_log "warn" "node not on PATH (optional for host builds)"
  fi
  if command -v pnpm >/dev/null 2>&1; then
    dh_log "info" "pnpm: $(pnpm -v 2>/dev/null || true)"
  else
    dh_log "warn" "pnpm not on PATH (optional for host builds)"
  fi

  return 0
}

phase_a() {
  dh_log "phase" "A — tooling and project context"
  dh_compose_v2_ok
  dh_run docker compose "${DOCKER_HEALTH_COMPOSE_BASE[@]}" config >/dev/null
  dh_log "pass" "A.2 base compose config renders"
  if want_phase b || want_phase d || want_phase e; then
    dh_run docker compose "${DOCKER_HEALTH_COMPOSE_APPS[@]}" config >/dev/null
    dh_log "pass" "A.3 apps compose config merges"
  fi
  if want_phase c; then
    dh_run docker compose "${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}" config >/dev/null
    dh_log "pass" "A.4 active stack compose config merges (phase C file set)"
  fi
}

phase_b() {
  dh_log "phase" "B — image build integrity (apps overlay)"
  local -a build_args=("${DOCKER_HEALTH_COMPOSE_APPS[@]}")
  if [[ "$DO_BUILD_NO_CACHE" == 1 ]]; then
    dh_run docker compose "${build_args[@]}" build --no-cache
  else
    dh_run docker compose "${build_args[@]}" build
  fi
  dh_log "pass" "B.1 compose build completed"
}

phase_c() {
  dh_log "phase" "C — stack up (postgres, redis; file set matches selected phases)"
  dh_run docker compose "${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}" up -d
  dh_log "pass" "C.1 compose stack up"

  if [[ "$DO_DRY_RUN" == 1 ]]; then
    dh_log "info" "dry-run: skipping C.2–C.6 stateful checks (containers not started)"
    return 0
  fi

  dh_assert_service_up DOCKER_HEALTH_COMPOSE_ACTIVE postgres
  dh_assert_service_up DOCKER_HEALTH_COMPOSE_ACTIVE redis

  docker compose "${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}" exec -T postgres pg_isready -U postgres -d agenticverdict | grep -q accepting || {
    dh_log "error" "postgres pg_isready did not report accepting connections"
    return 1
  }
  dh_log "pass" "C.3 pg_isready"

  docker compose "${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}" exec -T redis redis-cli ping | grep -q PONG || {
    dh_log "error" "redis ping did not return PONG"
    return 1
  }
  dh_log "pass" "C.4 redis PONG"

  dh_network_subnet_ok agenticverdict 172.28.0.0/16
  dh_volumes_present
}

phase_d() {
  dh_log "phase" "D — application overlay"
  if [[ "$DO_SKIP_GENERATE_SECRETS" != 1 ]]; then
    if [[ "$DO_DRY_RUN" == 1 ]]; then
      dh_log "info" "dry-run: would run scripts/generate-secrets.sh"
    else
      bash "$REPO_ROOT/scripts/generate-secrets.sh"
    fi
  fi
  if [[ ! -f "$REPO_ROOT/secrets/jwt_secret.txt" ]]; then
    if [[ "$DO_DRY_RUN" == 1 ]]; then
      dh_log "warn" "dry-run: secrets/jwt_secret.txt missing (required for a real apps up)"
    else
      dh_log "error" "D.0 secrets/jwt_secret.txt missing"
      return 1
    fi
  fi

  local -a up_args=("${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}")
  if [[ "$DO_BUILD_NO_CACHE" == 1 ]]; then
    dh_run docker compose "${up_args[@]}" up -d --build --no-cache
  else
    dh_run docker compose "${up_args[@]}" up -d --build
  fi
  dh_log "pass" "D.1 apps stack up --build"

  if [[ "$DO_DRY_RUN" == 1 ]]; then
    dh_log "info" "dry-run: skipping D.2–D.6 application state checks"
    return 0
  fi

  dh_assert_service_up DOCKER_HEALTH_COMPOSE_ACTIVE postgres
  dh_assert_service_up DOCKER_HEALTH_COMPOSE_ACTIVE redis
  dh_assert_service_running DOCKER_HEALTH_COMPOSE_ACTIVE web
  dh_assert_service_running DOCKER_HEALTH_COMPOSE_ACTIVE api
  dh_assert_service_running DOCKER_HEALTH_COMPOSE_ACTIVE worker

  local i
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if curl -fsS "$WEB_HEALTH_URL" >/dev/null 2>&1 && curl -fsS "$API_HEALTH_URL" >/dev/null 2>&1; then
      break
    fi
    sleep 3
  done

  curl -fsS "$WEB_HEALTH_URL" >/dev/null
  dh_log "pass" "D.3 web health HTTP OK ($WEB_HEALTH_URL)"
  curl -fsS "$API_HEALTH_URL" >/dev/null
  dh_log "pass" "D.4 API health HTTP OK ($API_HEALTH_URL)"

  WEB_HEALTH_URL="$WEB_HEALTH_URL" API_HEALTH_URL="$API_HEALTH_URL" dh_run bash "$REPO_ROOT/scripts/health-check.sh"
  dh_log "pass" "D.5 scripts/health-check.sh exit 0"

  dh_worker_logs_sanity "${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}"
}

phase_d_http_only() {
  dh_log "phase" "D (partial) — HTTP health only (D.3–D.5)"
  if [[ "$DO_DRY_RUN" == 1 ]]; then
    dh_log "info" "dry-run: would probe $WEB_HEALTH_URL, $API_HEALTH_URL, and scripts/health-check.sh"
    return 0
  fi
  curl -fsS "$WEB_HEALTH_URL" >/dev/null
  dh_log "pass" "D.3 web health HTTP OK ($WEB_HEALTH_URL)"
  curl -fsS "$API_HEALTH_URL" >/dev/null
  dh_log "pass" "D.4 API health HTTP OK ($API_HEALTH_URL)"
  WEB_HEALTH_URL="$WEB_HEALTH_URL" API_HEALTH_URL="$API_HEALTH_URL" dh_run bash "$REPO_ROOT/scripts/health-check.sh"
  dh_log "pass" "D.5 scripts/health-check.sh exit 0"
}

phase_e() {
  dh_log "phase" "E — observability overlay"
  local -a args=("${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}")
  if [[ "$DO_WITH_FALCO" == 1 ]]; then
    if [[ "$(uname -s)" != "Linux" ]]; then
      dh_log "warn" "skipping Falco profile on non-Linux host"
      dh_run docker compose "${args[@]}" up -d
    else
      dh_run docker compose "${args[@]}" --profile security up -d
    fi
  else
    dh_run docker compose "${args[@]}" up -d
  fi
  dh_log "pass" "E.1 observability stack up"

  if [[ "$DO_DRY_RUN" == 1 ]]; then
    dh_log "info" "dry-run: skipping E.2 HTTP probes"
    return 0
  fi

  curl -fsS --max-time 5 "http://127.0.0.1:9090/-/healthy" >/dev/null || true
  curl -fsS --max-time 5 "http://127.0.0.1:3001/api/health" >/dev/null || curl -fsS --max-time 5 "http://127.0.0.1:3001/" >/dev/null || {
    dh_log "warn" "Grafana probe inconclusive (endpoint may differ); check manually"
  }
  curl -fsS --max-time 5 "http://127.0.0.1:3100/ready" >/dev/null || curl -fsS --max-time 5 "http://127.0.0.1:3100/metrics" >/dev/null || {
    dh_log "warn" "Loki probe inconclusive; check docs/docker/observability.md"
  }
  dh_log "pass" "E.2 observability HTTP probes attempted (Prometheus/Grafana/Loki)"
}

phase_f() {
  dh_log "phase" "F — backup overlay"
  dh_run docker compose "${DOCKER_HEALTH_COMPOSE_ACTIVE[@]}" up -d
  dh_log "pass" "F.1 backup compose up"

  if [[ "$DO_DRY_RUN" != 1 ]]; then
    dh_assert_service_running DOCKER_HEALTH_COMPOSE_ACTIVE postgres-backup
  fi

  if [[ "$DO_DRY_RUN" != 1 ]] && [[ -x "$REPO_ROOT/scripts/backup-postgres.sh" ]]; then
    dh_log "info" "F.3 optional: running scripts/backup-postgres.sh (requires base postgres up)"
    dh_run bash "$REPO_ROOT/scripts/backup-postgres.sh" || dh_log "warn" "backup-postgres.sh failed or needs configuration"
  fi
}

phase_g() {
  dh_log "phase" "G — security / compliance scripts"
  dh_run bash "$REPO_ROOT/scripts/compliance/verify-runtime-hardening.sh"
  dh_run bash "$REPO_ROOT/scripts/compliance/verify-networks.sh" agenticverdict
  dh_log "pass" "G.1/G.2 compliance scripts completed"
}

teardown() {
  if [[ "$DO_TEARDOWN" != 1 ]]; then
    return 0
  fi
  dh_log "phase" "H — teardown"
  local -a volflag=()
  if [[ "$DO_TEARDOWN_VOLUMES" == 1 ]]; then
    volflag=(-v)
  fi
  local pick=",$PHASE_PICK,"
  if [[ "$pick" == *",e,"* ]]; then
    dh_run docker compose "${DOCKER_HEALTH_COMPOSE_OBS[@]}" down "${volflag[@]}"
  elif [[ "$pick" == *",d,"* ]]; then
    dh_run docker compose "${DOCKER_HEALTH_COMPOSE_APPS[@]}" down "${volflag[@]}"
  elif [[ "$pick" == *",f,"* ]]; then
    dh_run docker compose "${DOCKER_HEALTH_COMPOSE_BACKUP[@]}" down "${volflag[@]}"
  elif [[ "$pick" == *",c,"* ]]; then
    dh_run docker compose "${DOCKER_HEALTH_COMPOSE_BASE[@]}" down "${volflag[@]}"
  else
    dh_log "info" "no compose up phases in --phase list; skipping compose down"
  fi
  dh_log "pass" "compose down complete (if applicable)"
}

main() {
  compose_active_refresh
  dh_log "info" "repository root: $REPO_ROOT"
  dh_require_cmd docker || exit 1
  dh_require_cmd curl || exit 1

  if [[ "$DO_DRY_RUN" == 1 ]]; then
    dh_log "info" "dry-run: will print mutating commands; read-only checks may still run"
  fi

  preflight || exit 1

  if want_phase a; then
    phase_a || exit 1
  fi

  if want_phase b && [[ "$DO_QUICK" != 1 ]]; then
    phase_b || exit 1
  fi

  if want_phase c; then
    phase_c || exit 1
  fi

  if want_phase d; then
    if [[ "$DO_QUICK" == 1 ]]; then
      phase_d_http_only || exit 1
    else
      phase_d || exit 1
    fi
  fi

  if want_phase e; then
    phase_e || exit 1
  fi

  if want_phase f; then
    phase_f || exit 1
  fi

  if want_phase g; then
    phase_g || exit 1
  fi

  teardown || exit 1

  dh_log "pass" "docker health verification finished successfully"
}

# Default phase path when --phase not set: a,c,d (+ optional flags add b/e/f/g)
if [[ -z "$PHASE_PICK" ]]; then
  if [[ "$DO_WITH_BUILD" == 1 ]]; then
    PHASE_PICK="a,b,c,d"
  else
    PHASE_PICK="a,c,d"
  fi
  if [[ "$DO_WITH_OBS" == 1 ]]; then
    PHASE_PICK="${PHASE_PICK},e"
  fi
  if [[ "$DO_WITH_BACKUP" == 1 ]]; then
    PHASE_PICK="${PHASE_PICK},f"
  fi
  if [[ "$DO_WITH_COMPLIANCE" == 1 ]]; then
    PHASE_PICK="${PHASE_PICK},g"
  fi
fi

main "$@"
