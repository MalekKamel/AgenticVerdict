#!/usr/bin/env bash
set -euo pipefail

SERVICE="${1:-web}"
case "$SERVICE" in
  web|api|worker) ;;
  *)
    echo "usage: $0 [web|api|worker]" >&2
    exit 2
    ;;
esac

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DOCKERFILE="${ROOT_DIR}/apps/${SERVICE}/Dockerfile"
TAG="agenticverdict/${SERVICE}:perf-test"
LOG_DIR="${ROOT_DIR}/.build-metrics"
mkdir -p "$LOG_DIR"
LOG_FILE="${LOG_DIR}/build-${SERVICE}-$(date +%Y%m%d-%H%M%S).log"

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found in PATH" >&2
  exit 1
fi

export DOCKER_BUILDKIT=1
export BUILDKIT_PROGRESS=plain

if [ -f "${ROOT_DIR}/scripts/docker-prep.sh" ]; then
  bash "${ROOT_DIR}/scripts/docker-prep.sh"
fi

DEPS_TAG="agenticverdict/deps:local"
echo "Building shared deps layer -> ${DEPS_TAG}"
docker buildx build \
  --progress=plain \
  --load \
  -f "${ROOT_DIR}/packages/docker/base/Dockerfile.deps" \
  -t "${DEPS_TAG}" \
  "${ROOT_DIR}"

build_args=(--build-arg "DEPS_IMAGE=${DEPS_TAG}")
if [ "$SERVICE" = "worker" ]; then
  CHROMIUM_TAG="agenticverdict/chromium-base:local"
  echo "Building Chromium base -> ${CHROMIUM_TAG}"
  docker buildx build \
    --progress=plain \
    --load \
    -f "${ROOT_DIR}/packages/docker/base/Dockerfile.chromium" \
    -t "${CHROMIUM_TAG}" \
    "${ROOT_DIR}"
  build_args+=(--build-arg "CHROMIUM_IMAGE=${CHROMIUM_TAG}")
fi

echo "Building ${SERVICE}; log -> ${LOG_FILE}"
SECONDS=0
set +e
docker buildx build \
  --progress=plain \
  -f "${DOCKERFILE}" \
  -t "${TAG}" \
  "${build_args[@]}" \
  "${ROOT_DIR}" 2>&1 | tee "${LOG_FILE}"
build_status=${PIPESTATUS[0]}
set -e
elapsed="${SECONDS}"

cached="$(awk 'BEGIN { c=0 } /CACHED/ { c++ } END { print c+0 }' "${LOG_FILE}")"
total="$(awk 'BEGIN { t=0 } /^#/ { t++ } END { print t+0 }' "${LOG_FILE}")"
hit_rate="$(awk -v c="$cached" -v t="$total" 'BEGIN {
  if (t+0 <= 0) { print "n/a" }
  else { printf "%.2f", (c / t) * 100 }
}')"

echo "----"
echo "Wall clock (script): ${elapsed}s"
echo "Lines matching CACHED: ${cached}"
echo "Lines starting with # (heuristic): ${total}"
echo "Heuristic cache-ish rate: ${hit_rate}%"
echo "Log: ${LOG_FILE}"

if [ "$build_status" -ne 0 ]; then
  echo "docker buildx build failed (exit ${build_status})" >&2
  exit "$build_status"
fi
