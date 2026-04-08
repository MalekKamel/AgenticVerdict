#!/bin/bash
set -u

failed=0

check_service() {
  local service=$1
  local url=$2

  if curl -fsS "$url" > /dev/null; then
    echo "OK $service"
  else
    echo "FAIL $service" >&2
    failed=1
  fi
}

echo "Running HTTP health checks..."
check_service "Web" "${WEB_HEALTH_URL:-http://localhost:3000/api/health}"
check_service "API" "${API_HEALTH_URL:-http://localhost:4000/health}"

echo "Docker service probes (non-fatal if compose is not running)..."
if command -v docker >/dev/null 2>&1; then
  docker compose -f docker-compose.yml exec -T postgres pg_isready -U postgres -d agenticverdict 2>/dev/null && echo "OK postgres" || echo "SKIP postgres (not running or not this stack)"
  docker compose -f docker-compose.yml exec -T redis redis-cli ping 2>/dev/null && echo "OK redis" || echo "SKIP redis (not running or not this stack)"
fi

echo "Health check script finished"
exit "$failed"
