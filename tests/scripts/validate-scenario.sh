#!/usr/bin/env bash
# Lightweight guard: scenario directory exists and contains a Vitest file.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

id="${1:-}"
if [[ -z "$id" ]]; then
  echo "usage: validate-scenario.sh <R01|folder-name>" >&2
  exit 2
fi

norm=$(echo "$id" | tr '[:lower:]' '[:upper:]')
DIR=""
case "$norm" in
  R01 | R1) DIR="R01-pdf-generation-en-ltr" ;;
  R02 | R2) DIR="R02-pdf-generation-ar-rtl" ;;
  R03 | R3) DIR="R03-docx-generation" ;;
  R04 | R4) DIR="R04-xlsx-generation" ;;
  R05 | R5) DIR="R05-multi-platform-report" ;;
  R06 | R6) DIR="R06-llm-provider-integration" ;;
  R07 | R7) DIR="R07-tenant-isolation" ;;
  R08 | R8) DIR="R08-template-rendering" ;;
  R09 | R9) DIR="R09-report-delivery" ;;
  R10) DIR="R10-scheduled-reports" ;;
  R11) DIR="R11-system-health-validation" ;;
  R12) DIR="R12-prerequisites-validation" ;;
  *) DIR="$id" ;;
esac

path="tests/scenarios/$DIR"
if [[ ! -d "$path" ]]; then
  echo "Missing scenario directory: $path" >&2
  exit 1
fi

count=$(find "$path" -name "*.test.ts" 2>/dev/null | wc -l | tr -d " ")
if [[ "${count:-0}" -lt 1 ]]; then
  echo "No *.test.ts under $path" >&2
  exit 1
fi

echo "OK: scenario $DIR is wired for Vitest"
