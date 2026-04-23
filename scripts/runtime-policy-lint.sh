#!/usr/bin/env bash
set -euo pipefail

echo "[runtime-policy-lint] scanning for forbidden production-like mock/stub toggles"

forbidden_patterns=(
  'AGENTICVERDICT_USE_MOCK_ADAPTERS:\s*"1"'
  'AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS:\s*"1"'
  'AGENTICVERDICT_PRODUCTION_FLOW_MOCK_EMAIL:\s*"1"'
  'VITE_PUBLIC_AUTH_API_MOCK'
)

target_files=(
  docker-compose.apps.yml
  .github/workflows/ci.yml
  .github/workflows/docker-compose-validate.yml
)

failed=0
for file in "${target_files[@]}"; do
  for pattern in "${forbidden_patterns[@]}"; do
    if rg -n "$pattern" "$file" >/dev/null 2>&1; then
      echo "[runtime-policy-lint] forbidden pattern found in $file :: $pattern"
      failed=1
    fi
  done
done

if rg -n \
  --glob '!**/*.test.*' \
  --glob '!**/README.md' \
  --glob '!packages/config/src/runtime-policy.ts' \
  'VITE_PUBLIC_AUTH_API_MOCK|AGENTICVERDICT_USE_STUB_FORMAT_GENERATORS|AGENTICVERDICT_PRODUCTION_FLOW_MOCK_EMAIL' \
  apps packages >/dev/null 2>&1; then
  echo "[runtime-policy-lint] legacy runtime env variable usage remains in apps/packages"
  failed=1
fi

echo "[runtime-policy-lint] validating production runtime entrypoints"
if rg -n 'CMD \["node", "--import", "tsx", "src/cli.ts"\]' apps/api/Dockerfile apps/worker/Dockerfile >/dev/null 2>&1; then
  echo "[runtime-policy-lint] direct tsx-only runtime entrypoint detected in API/worker Dockerfiles"
  failed=1
fi

if ! rg -n 'dist/cli\.mjs' apps/api/Dockerfile apps/worker/Dockerfile >/dev/null 2>&1; then
  echo "[runtime-policy-lint] dist/cli.mjs runtime entrypoint missing in API/worker Dockerfiles"
  failed=1
fi

if [[ "$failed" -ne 0 ]]; then
  echo "[runtime-policy-lint] FAILED"
  exit 1
fi

echo "[runtime-policy-lint] PASSED"
