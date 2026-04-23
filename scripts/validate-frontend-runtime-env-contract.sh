#!/usr/bin/env bash
set -euo pipefail

echo "[frontend-runtime-contract] validating static frontend runtime env contract"

required_static_files=(
  "docker-compose.apps.yml"
  "docker-compose.dev.yml"
  ".env.docker.example"
)

for file in "${required_static_files[@]}"; do
  if ! rg -n "VITE_PUBLIC_API_URL" "$file" >/dev/null 2>&1; then
    echo "[frontend-runtime-contract] missing VITE_PUBLIC_API_URL in $file"
    exit 1
  fi
  if ! rg -n "VITE_PUBLIC_DEFAULT_TENANT_ID" "$file" >/dev/null 2>&1; then
    echo "[frontend-runtime-contract] missing VITE_PUBLIC_DEFAULT_TENANT_ID in $file"
    exit 1
  fi
done

if ! rg -n "API_URL|FRONTEND_INTERNAL_API_URL" "docker-compose.apps.yml" ".env.docker.example" >/dev/null 2>&1; then
  echo "[frontend-runtime-contract] missing API_URL/FRONTEND_INTERNAL_API_URL mapping in compose/env docs"
  exit 1
fi

if ! rg -n "ARG VITE_PUBLIC_API_URL|ARG VITE_PUBLIC_DEFAULT_TENANT_ID" "apps/frontend/Dockerfile" >/dev/null 2>&1; then
  echo "[frontend-runtime-contract] frontend Dockerfile must define required build args"
  exit 1
fi

echo "[frontend-runtime-contract] validating rendered compose stacks"

render_prod="$(mktemp)"
render_dev="$(mktemp)"
trap 'rm -f "$render_prod" "$render_dev"' EXIT

docker compose -f docker-compose.yml -f docker-compose.apps.yml config >"$render_prod"
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f docker-compose.dev.yml config >"$render_dev"

if ! rg -n "frontend:" "$render_prod" >/dev/null 2>&1; then
  echo "[frontend-runtime-contract] frontend service missing in merged prod-like compose render"
  exit 1
fi

required_render_patterns=(
  "API_URL:"
  "VITE_PUBLIC_API_URL:"
  "VITE_PUBLIC_DEFAULT_TENANT_ID:"
)

for pattern in "${required_render_patterns[@]}"; do
  if ! rg -n "$pattern" "$render_prod" >/dev/null 2>&1; then
    echo "[frontend-runtime-contract] missing $pattern in prod-like compose render"
    exit 1
  fi
done

for pattern in "${required_render_patterns[@]}"; do
  if ! rg -n "$pattern" "$render_dev" >/dev/null 2>&1; then
    echo "[frontend-runtime-contract] missing $pattern in dev compose render"
    exit 1
  fi
done

echo "[frontend-runtime-contract] PASSED"
