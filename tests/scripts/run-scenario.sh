#!/usr/bin/env bash
# Run a single R01–R12 production-flow scenario (orchestrator Vitest, repo root).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

raw="${1:-}"
if [[ -z "$raw" ]]; then
  echo "usage: run-scenario.sh <R01|R12> [vitest-args...]" >&2
  exit 2
fi
shift || true

norm=$(echo "$raw" | tr '[:lower:]' '[:upper:]')
case "$norm" in
  R01 | R1) pat="R01 PDF" ;;
  R02 | R2) pat="R02 PDF" ;;
  R03 | R3) pat="R03 DOCX" ;;
  R04 | R4) pat="R04 XLSX" ;;
  R05 | R5) pat="R05 multi" ;;
  R06 | R6) pat="R06 mock" ;;
  R07 | R7) pat="R07 tenant" ;;
  R08 | R8) pat="R08 template" ;;
  R09 | R9) pat="R09 report" ;;
  R10) pat="R10 scheduled" ;;
  R11) pat="R11 system" ;;
  R12) pat="R12 prerequisites" ;;
  *)
    echo "Unknown scenario: $raw" >&2
    exit 2
    ;;
esac

exec pnpm exec vitest run tests/orchestrator/scenarios/production-flow-scenarios.test.ts -t "$pat" "$@"
