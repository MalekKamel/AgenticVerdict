#!/usr/bin/env bash
# Remove local build outputs so Docker build context stays small (see docs/docker/build-optimization-implemented.md).
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

echo "docker-prep: removing local build artifacts..."
rm -rf apps/web/.next apps/web/out
rm -rf apps/api/dist apps/api/build
rm -rf apps/worker/dist apps/worker/build
find packages -type d \( -name .next -o -name dist -o -name build \) -prune -exec rm -rf {} + 2>/dev/null || true
rm -rf node_modules/.cache/turbo .turbo 2>/dev/null || true
echo "docker-prep: done."
