#!/usr/bin/env bash
# Wrapper — canonical repo-root entry for Docker health verification.
# See scripts/docker-health/verify-docker-health.sh and docs/docker/docker-health-verification-execution-plan.md
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec "$ROOT/docker-health/verify-docker-health.sh" "$@"
