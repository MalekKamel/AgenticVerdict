#!/usr/bin/env bash
# Gap #22 — One-shot resource snapshot for running containers.
set -euo pipefail

docker stats --no-stream
