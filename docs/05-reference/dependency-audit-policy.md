# Dependency audit policy

**Status:** Enforced gate for High/Critical in CI (2026-04-27).

## Current behavior

- GitHub Actions runs `pnpm audit --audit-level=high` on every PR and uploads `pnpm-audit-report.txt` as an artifact.
- High/Critical audit findings now **block merges** unless explicitly waived through the tracked waiver process.
- Waiver metadata is validated in CI using `scripts/validate-vulnerability-waivers.mjs`.

## Policy

1. **Triage continuously** — Owners review CI findings and track High/Critical advisories in issues with owners and deadlines.
2. **Remediation first** — Prefer upgrades/patches that clear advisories without breaking `turbo run test` and app builds.
3. **Controlled waivers** — If an advisory cannot be fixed immediately, add a waiver entry in `docs/05-reference/vulnerability-waivers.json` with:
   - `id`, `source`, `vulnerabilityId`, `scope`, `owner`, `justification`, `expiresAt`
4. **Expiry is mandatory** — Waivers must be time-bound and are rejected by CI after expiry.
5. **Auditable trail** — Every waiver must map to a tracking issue/PR note containing mitigation and removal plan.

## References

- `/.github/workflows/ci.yml` — audit step and artifact upload.
- `/scripts/validate-vulnerability-waivers.mjs` — CI waiver validator.
- `/docs/05-reference/vulnerability-waivers.json` — waiver registry.
- `changelog/2026-04-17-web-tanstack-phase-4-production-security-tenant-ops.md` — Phase 4 baseline note on informational `pnpm audit`.
