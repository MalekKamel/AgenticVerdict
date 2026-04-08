#!/usr/bin/env bash
# Gap #22 — Secret rotation checklist (does not push to production automatically).
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

cat <<EOF
Secret rotation (manual):

1. Generate new material (example — reuse repo helper):
     ${ROOT_DIR}/scripts/generate-secrets.sh

2. For Docker Compose file-backed secrets, replace the files under ./secrets (or your
   deploy path), chmod 600, and recreate affected services:
     docker compose -f docker-compose.yml -f docker-compose.apps.yml up -d --force-recreate api web worker

3. Rotate downstream credentials (JWT sessions may invalidate; DB users; Redis ACL).

4. In production, use your vault / cloud secret manager; update references and roll
   containers in a maintenance window.

This script only prints guidance. Edit and run org-specific automation separately.
EOF
