#!/usr/bin/env bash
# Quick Docker / Compose checks and optional host hints before bringing stacks up.
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'
color_ok() {
  if [[ -t 1 ]]; then echo -e "${GREEN}$*${NC}"; else echo "$*"; fi
}
color_warn() {
  if [[ -t 1 ]]; then echo -e "${YELLOW}$*${NC}"; else echo "$*"; fi
}
color_bad() {
  if [[ -t 1 ]]; then echo -e "${RED}$*${NC}"; else echo "$*"; fi
}

if ! command -v docker >/dev/null 2>&1; then
  color_bad "docker: not found in PATH"
  exit 1
fi
color_ok "docker: $(docker --version)"

if ! docker compose version >/dev/null 2>&1; then
  color_bad "docker compose (v2): not available"
  exit 1
fi
color_ok "docker compose: $(docker compose version)"

if [[ "$(uname -s)" == "Darwin" ]]; then
  if mem_bytes="$(sysctl -n hw.memsize 2>/dev/null)"; then
    mem_gb=$((mem_bytes / 1073741824))
    color_ok "Host memory (approx): ${mem_gb} GiB (hw.memsize)"
  elif sp_mem="$(system_profiler SPHardwareDataType 2>/dev/null | awk -F': ' '/Memory:/ {gsub(/ /,\"\",$2); print $2; exit}')"; then
    [[ -n "$sp_mem" ]] && color_ok "Host memory (system_profiler): ${sp_mem}"
  else
    color_warn "Could not read memory size on Darwin (non-fatal)."
  fi
fi

PORTS=(3000 4000 5432 6379 9090 3001)
for port in "${PORTS[@]}"; do
  if command -v lsof >/dev/null 2>&1; then
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
      color_warn "Port ${port}: something is listening (lsof). Stop conflicting services if needed."
    fi
  else
    color_warn "lsof not found; skipping port ${port} check."
    break
  fi
done

if [[ ! -f .env.docker ]] && [[ -f .env.docker.example ]]; then
  color_warn ".env.docker is missing. Copy the example when running locally:"
  echo "  cp .env.docker.example .env.docker"
  echo "(Not auto-copied so CI and fresh clones stay explicit.)"
fi

color_ok "Preflight finished."
