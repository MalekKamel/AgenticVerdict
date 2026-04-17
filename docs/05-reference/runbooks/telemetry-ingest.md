# Telemetry ingest (browser → API)

## Endpoint

- **URL:** `POST /api/v1/telemetry/ingest` (Fastify, `apps/api`)
- **Envelope:** Zod schema `telemetryEnvelopeSchema` in `@agenticverdict/types` (`kind`, `ts`, `tenantId`, `payload`).

## Authentication

- **Server:** `TELEMETRY_INGEST_SECRET` — shared secret; in `NODE_ENV=production` the secret **must** be set or the endpoint returns **503** (`telemetry_unconfigured`).
- **Client:** `VITE_PUBLIC_TELEMETRY_INGEST_URL` and optional `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN` (same value as the server secret). The token is **public in the browser bundle**; it only reduces abuse from random unauthenticated POSTs, not PII protection.

## PII and sampling

- **Do not** send passwords, tokens, email, or full request bodies in `payload` (see `apps/frontend/src/lib/observability/client-log.ts` redaction rules).
- **Client sampling:** `VITE_PUBLIC_TELEMETRY_SAMPLE_RATE` (0–1, default 1) drops envelopes before `fetch`/`sendBeacon` to reduce traffic.
- **Server log sampling:** `TELEMETRY_INGEST_LOG_SAMPLE_RATE` (0–1, default 1) controls how often accepted envelopes emit the structured `telemetry.ingest` INFO line (volume control for log shippers).

## Rotation

1. Generate a new secret.
2. Set `TELEMETRY_INGEST_SECRET` on the API and redeploy.
3. Set `VITE_PUBLIC_TELEMETRY_INGEST_TOKEN` for the web build and redeploy the web app.
4. Invalidate old builds that still embed the previous token.
5. Prefer rotating the secret on a schedule aligned with your compliance policy; pair with client rebuilds so old tokens are not long-lived in cached bundles.

## Operations

- Accepted envelopes may emit **info** logs with `event: "telemetry.ingest"` (no PII in structured fields), subject to `TELEMETRY_INGEST_LOG_SAMPLE_RATE`.
- **Retention:** follows your platform log retention (Fastify/Pino → stdout → collector). Tune at the log pipeline or vendor, not in this route.
- **Forwarding:** filter or route lines where `event` is `telemetry.ingest` into your observability vendor (Datadog, CloudWatch, ELK, etc.) using the same shipper as other API logs.
