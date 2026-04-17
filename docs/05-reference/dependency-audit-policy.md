# Dependency audit policy

**Status:** Informational gate in CI (2026-04-17). This document records the team policy until the workspace is clean enough to fail builds on audit severity.

## Current behavior

- GitHub Actions runs `pnpm audit` on every PR and uploads `pnpm-audit-report.txt` as an artifact.
- The audit step uses `continue-on-error: true` so **critical/high findings do not block merges** while transitive advisories are triaged.

## Policy

1. **Triage weekly** — Owners review the CI artifact (or run `pnpm audit` locally) and track **critical** and **high** severity items in the issue tracker.
2. **Remediation** — Prefer dependency upgrades that clear advisories without breaking `turbo run test` and `pnpm --filter @agenticverdict/web build` on the same branch.
3. **Waivers** — If a finding cannot be fixed immediately, document the **CVE/advisory ID**, **risk assessment**, and **targeted fix date** on the tracking ticket. Do not merge unrelated code without a recorded decision.
4. **Future gate** — When the monorepo is free of unresolved critical issues (or a defined subset), CI may switch to `continue-on-error: false` or `pnpm audit --audit-level=high` with explicit owner approval.

## References

- `/.github/workflows/ci.yml` — audit step and artifact upload.
- `changelog/2026-04-17-web-tanstack-phase-4-production-security-tenant-ops.md` — Phase 4 baseline note on informational `pnpm audit`.
