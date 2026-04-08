#!/usr/bin/env bash
# Run a named group of production-flow scenarios (orchestrator Vitest).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

group="${1:-}"
if [[ -z "$group" ]]; then
  echo "usage: run-scenario-group.sh <generation|integration|delivery|scheduling|system> [vitest-args...]" >&2
  exit 2
fi
shift || true

case "$group" in
  generation)
    pattern="R01 PDF|R02 PDF|R03 DOCX|R04 XLSX|R08 template"
    ;;
  integration)
    pattern="R05 multi|R06 mock|R07 tenant"
    ;;
  delivery)
    pattern="R09 report"
    ;;
  scheduling)
    pattern="R10 scheduled"
    ;;
  system)
    pattern="R11 system|R12 prerequisites"
    ;;
  *)
    echo "Unknown group: $group (expected generation|integration|delivery|scheduling|system)" >&2
    exit 2
    ;;
esac

exec pnpm exec vitest run tests/orchestrator/scenarios/production-flow-scenarios.test.ts -t "$pattern" "$@"
