#!/usr/bin/env bash
# Run all R01–R12 production-flow scenario tests (orchestrator).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"
exec pnpm run test:production-flow "$@"
