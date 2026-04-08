#!/usr/bin/env bash
# Gap #21 — Point-in-time recovery requires continuous WAL archiving and a recovery playbook
# from your Postgres operator or cloud provider. This script is a checklist stub only.
set -euo pipefail

cat <<'EOF'
PITR is not automated in this repository.

Before an incident:
  - Enable WAL archiving (archive_command / managed backup with PITR).
  - Document base backup location and retention.
  - Test restore to a staging instance regularly.

During recovery:
  - Restore the latest base backup compatible with your Postgres major version.
  - Apply WAL segments up to the target timestamp using provider tooling
    (e.g. pg_combinebackup, cloud console “restore to time”, or Patroni hooks).

Replace this message with org-specific commands once WAL tooling is wired.
EOF
exit 1
