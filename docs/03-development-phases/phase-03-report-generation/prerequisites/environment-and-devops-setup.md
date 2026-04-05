# Environment and DevOps setup — dev / staging (Week 1, Day 4)

**Execution plan reference:** Part 1, Week 1 (Day 4) and supporting PR-1 / PR-7.

## Local development

1. **Node.js 20** and **pnpm** (workspace installs at repo root).
2. **PostgreSQL 16** — `DATABASE_URL` (see root `.env.example`; typical local URL matches `docker-compose` when used).
3. **Optional Redis** — `REDIS_URL` for future BullMQ; API may use **Upstash REST** instead of TCP Redis for rate limiting and cache.

## API (`apps/api`)

| Variable                                              | Purpose                                                                                               |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `JWT_SECRET`                                          | HS256 signing/verification for Bearer tokens (required for meaningful auth in non-test environments). |
| `API_PORT`                                            | Listen port (default documented in package).                                                          |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional; enables distributed rate limit and response cache.                                          |
| `COMPANY_CONFIG_DIR`                                  | Directory of tenant JSON configs (shared with web/agent tooling).                                     |

## Worker / email (`apps/worker`)

| Variable                                                           | Purpose                                                     |
| ------------------------------------------------------------------ | ----------------------------------------------------------- |
| `RESEND_API_KEY`                                                   | Preferred transactional email provider.                     |
| `SENDGRID_API_KEY`                                                 | Alternative when Resend is not configured.                  |
| `RESEND_FROM_EMAIL` / `SENDGRID_FROM_EMAIL` / `SENDGRID_FROM_NAME` | From-address and display name.                              |
| `APP_URL`                                                          | Base URL inserted into report download links in email HTML. |

## Staging checklist (high level)

- Secrets injected via CI or a secrets manager (never committed).
- Database migrations applied (`packages/database` / Drizzle workflow).
- Smoke: **GET** `/health` on API; **GET** `/documentation/json` returns OpenAPI; authenticated **GET** `/api/v1/insights` returns **200** with demo or seeded data.
- Worker: dry-run or sandbox send with a test inbox when validating email.

## Production notes (out of scope for Part 1 coding)

- Separate databases and keys per environment.
- Observability (structured logs, metrics) per **`CLAUDE.md`** patterns.
