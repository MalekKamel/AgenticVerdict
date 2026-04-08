#!/bin/bash
set -euo pipefail

DEPLOY_ROOT="${DEPLOY_ROOT:-/opt/agenticverdict}"
mkdir -p "$DEPLOY_ROOT"/{secrets,certs,logs,backups,scripts,monitoring}

chmod 700 "$DEPLOY_ROOT/secrets"
chmod 700 "$DEPLOY_ROOT/logs"
chmod 700 "$DEPLOY_ROOT/backups"
chmod 755 "$DEPLOY_ROOT/scripts"

echo "Deployment directories created at $DEPLOY_ROOT"
