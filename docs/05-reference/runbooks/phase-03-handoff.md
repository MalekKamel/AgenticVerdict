# Phase 03 handoff checklist

**Purpose**: Close remediation Part 3 (testing + documentation) and start report generation work with shared context.

## Engineering readiness

- [ ] `pnpm --filter @agenticverdict/api test` passes (API contract + auth middleware).
- [ ] `pnpm --filter @agenticverdict/worker test` passes (email service unit tests).
- [ ] OpenAPI: confirm `/documentation` and `/documentation/json` in target deployment match expected v1 paths.
- [ ] Environment: `JWT_SECRET`, optional Upstash Redis, optional `RESEND_API_KEY` documented for each stage.

## Documentation

- [ ] API troubleshooting: `docs/05-reference/runbooks/api-troubleshooting.md`
- [ ] Email service: `docs/05-reference/runbooks/email-service.md`
- [ ] Known gaps: `docs/05-reference/runbooks/remediation-known-issues.md`
- [ ] API specifications: `specs/00-core/02-intelligence/API_SPECIFICATIONS.md`

## Session scheduling (manual)

- [ ] **Phase 03 kickoff** scheduled with backend + reporting owners.
- [ ] **Training / walkthrough** slot for unified `MarketingVerdict` shape and validation endpoints (30–45 minutes recommended).

## Training outline (suggested agenda)

1. **Types**: `MarketingVerdict` fields used in PDF/Excel templates (`evidence`, `recommendations`, `reportMetadata`).
2. **API**: How to fetch bundles (`GET /api/v1/analysis-results/:id`) and validate payloads before render (`POST /api/v1/verdicts/validate`).
3. **Operational**: Rate limits, JWT claims, email delivery env vars.

## Sign-off

| Role           | Name | Date |
| -------------- | ---- | ---- |
| Tech lead      |      |      |
| Phase 03 owner |      |      |
