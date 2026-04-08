#!/usr/bin/env bash
# Gap #22 — Lightweight host snapshot: engine version and reminder for image scans.
set -euo pipefail

echo "=== Docker ==="
docker version
echo
echo "=== Compose ==="
docker compose version
echo
echo "=== Reminder ==="
echo "Run image scans regularly, for example:"
echo "  trivy image --severity HIGH,CRITICAL ghcr.io/<org>/<repo>/web:latest"
echo "CI may already run Trivy on PRs; see .github/workflows/docker-scan.yml"
