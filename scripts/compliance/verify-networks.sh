#!/usr/bin/env bash
# Gap #20 — List and inspect AgenticVerdict Docker networks (named bridge / segmentation).
set -euo pipefail

PATTERN="${1:-agenticverdict}"

if ! docker network ls --format '{{.Name}}' | grep -q "$PATTERN"; then
  echo "No network names matching pattern: $PATTERN"
  echo "Create stacks first (e.g. docker compose up) or pass a different pattern as \$1."
  exit 1
fi

while read -r net; do
  echo "=== $net ==="
  docker network inspect "$net" --format 'Driver={{.Driver}} Internal={{.Internal}}'
  docker network inspect "$net" --format '{{range .IPAM.Config}}Subnet={{.Subnet}} Gateway={{.Gateway}}{{end}}'
  echo -n "Containers: "
  docker network inspect "$net" --format '{{range .Containers}}{{.Name}} {{end}}'
  echo
done < <(docker network ls --format '{{.Name}}' | grep "$PATTERN")
