#!/usr/bin/env bash
# Gap #19 — Inspect running containers for read-only rootfs, dropped caps, non-root user (where applicable).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$ROOT_DIR"

CONTAINERS=("$@")
if [[ ${#CONTAINERS[@]} -eq 0 ]]; then
  while IFS= read -r line; do
    [[ -n "$line" ]] && CONTAINERS+=("$line")
  done < <(docker ps --format '{{.Names}}' | grep -E 'agenticverdict|postgres|redis|web|api|worker' || true)
fi

if [[ ${#CONTAINERS[@]} -eq 0 ]]; then
  echo "No containers matched. Pass names explicitly: $0 <container> ..."
  exit 1
fi

fail=0
for c in "${CONTAINERS[@]}"; do
  if ! docker inspect "$c" &>/dev/null; then
    echo "✗ missing container: $c"
    fail=1
    continue
  fi
  ro=$(docker inspect -f '{{.HostConfig.ReadonlyRootfs}}' "$c")
  caps=$(docker inspect -f '{{.HostConfig.CapDrop}}' "$c")
  user=$(docker inspect -f '{{.Config.User}}' "$c")
  echo "— $c"
  echo "    ReadonlyRootfs: $ro"
  echo "    CapDrop:        $caps"
  echo "    Config.User:    ${user:-<empty>}"
done

if [[ "$fail" -ne 0 ]]; then
  exit 1
fi
