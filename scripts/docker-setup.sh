#!/usr/bin/env bash
# One-time / fresh-machine setup helper for local Docker workflows.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "=========================================="
echo " AgenticVerdict — Docker setup"
echo "=========================================="

if ! command -v docker >/dev/null 2>&1; then
  echo "docker not found in PATH. Install Docker Desktop or the Docker Engine CLI."
  exit 1
fi
if ! docker compose version >/dev/null 2>&1; then
  echo "docker compose (v2) not available."
  exit 1
fi
echo "Docker OK: $(docker --version)"
echo "Compose OK: $(docker compose version)"

if [[ -f scripts/generate-secrets.sh ]]; then
  echo "Running scripts/generate-secrets.sh ..."
  bash scripts/generate-secrets.sh
fi

mkdir -p backups logs sboms

if [[ ! -f .env.docker ]] && [[ -f .env.docker.example ]]; then
  cp .env.docker.example .env.docker
  echo "Created .env.docker from .env.docker.example"
fi

if ! command -v trivy >/dev/null 2>&1; then
  echo "Optional: install Trivy for image scanning (https://aquasecurity.github.io/trivy/)."
fi
if ! command -v syft >/dev/null 2>&1; then
  echo "Optional: install Syft for SBOMs (https://github.com/anchore/syft)."
fi

echo ""
echo "Next steps:"
echo "  make help     # list Makefile targets"
echo "  make dev      # infra + apps with api/worker dev + mocks overlay"
echo "  See docs/docker/README.md for Compose stacks and overlays."
