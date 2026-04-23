# Environment variables reference

Operational catalog for **API**, **worker**, and shared dependencies. Values are examples; production secrets belong in your vault, not in git.

## Core

| Variable        | Service     | Purpose                                                                                      |
| --------------- | ----------- | -------------------------------------------------------------------------------------------- |
| `NODE_ENV`      | All         | `production` \| `development` \| `test` — controls defaults (e.g. log level, mock adapters). |
| `LOG_LEVEL`     | API, worker | Pino level: `trace` … `silent` (see `@agenticverdict/config` `observability` schema).        |
| `LOG_FILE`      | API, worker | Optional path template for JSON logs with rotation (`rotating-file-stream`).                 |
| `LOG_MAX_SIZE`  | API, worker | Max size before rotation (default `10M`).                                                    |
| `LOG_MAX_FILES` | API, worker | Rotated files to keep (default `5`).                                                         |

## API (`@agenticverdict/api`)

| Variable                   | Purpose                                                      |
| -------------------------- | ------------------------------------------------------------ |
| `REDIS_URL` / Upstash vars | Cache, BullMQ, delivery suppression (see existing API docs). |
| `DATABASE_URL`             | PostgreSQL / Drizzle when wired.                             |
| JWT / auth secrets         | Issuer, audience, signing keys (per your auth deployment).   |
| `REPORT_BLOB_STORAGE_DIR`  | Optional filesystem backend for report bytes.                |

## Worker (`@agenticverdict/worker`)

| Variable              | Purpose                                   |
| --------------------- | ----------------------------------------- |
| `REDIS_URL`           | **Required** — BullMQ + suppression sets. |
| `WORKER_HEALTH_PORT`  | Health listen port (default `9465`).      |
| `WORKER_METRICS_PORT` | Prometheus scrape port (e.g. `9464`).     |

## Platform adapters (live validation)

Optional smoke tests (`LIVE_ADAPTER_VALIDATION=1`): `META_LIVE_ACCESS_TOKEN`, `META_LIVE_AD_ACCOUNT_ID`, `GA4_LIVE_ACCESS_TOKEN`, `GA4_LIVE_PROPERTY_ID`, etc. See [platform-validation-results.md](../platform-validation-results.md).

## Mock / safety

| Variable                             | Purpose                                                                      |
| ------------------------------------ | ---------------------------------------------------------------------------- |
| `AGENTICVERDICT_RUNTIME_ENV`         | Runtime policy axis: `development \| test \| staging \| production`.         |
| `AGENTICVERDICT_MOCK_MODE`           | Mock policy mode: `off \| selective \| all` (production-like must be `off`). |
| `AGENTICVERDICT_MOCK_CONNECTORS`     | Comma-separated connector IDs used when mode is `selective`.                 |
| `AGENTICVERDICT_STUB_REPORT_FORMATS` | `0 \| 1` report-format stubs toggle (forbidden in staging/production).       |
| `AGENTICVERDICT_STUB_EMAIL_DELIVERY` | `0 \| 1` email delivery stubs toggle (forbidden in staging/production).      |

## Generating this list in CI

Prefer deriving required keys from Zod schemas in `packages/config` and failure messages from startup checks over duplicating here; update this doc when adding user-facing env contracts.
