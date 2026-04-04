# Platform adapters — error codes

## Typed platform errors (`PlatformErrorCode`)

Defined on `PlatformError` in `packages/platform-adapters/src/errors.ts`. Specialized subclasses set `code` implicitly.

| Code                | Error class (typical)      | Meaning                                                                           | What to do                                                                          |
| ------------------- | -------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `auth_failed`       | `PlatformAuthError`        | Missing/invalid tokens, failed OAuth exchange, or vendor rejected credentials.    | Refresh OAuth tokens; confirm client id/secret; verify scopes and clock skew.       |
| `rate_limited`      | `PlatformRateLimitError`   | Vendor signaled throttling or adapter rate policy blocked the call.               | Back off; inspect platform quotas; increase cache TTL where safe.                   |
| `invalid_request`   | `PlatformError`            | Malformed request or validation failure mapping to 4xx semantics from the vendor. | Fix request parameters (property id, site URL, ad account id, date range).          |
| `upstream_error`    | `PlatformError`            | Vendor 5xx or unexpected failure after classification.                            | Retry may already have run; check vendor status; open incident if persistent.       |
| `not_found`         | `PlatformError`            | Resource missing at vendor (404-class).                                           | Confirm resource IDs and tenant linkage.                                            |
| `circuit_open`      | `PlatformCircuitOpenError` | Circuit breaker is open; calls are short-circuited to protect the system.         | Wait for half-open recovery; fix upstream root cause; inspect consecutive failures. |
| `not_registered`    | `PlatformError`            | Registry has no factory for the requested `PlatformType`.                         | Register adapter for that platform in app bootstrap.                                |
| `missing_tenant_id` | `PlatformError`            | `BasePlatformAdapter` constructed without a non-empty `tenantId`.                 | Pass a real tenant id from request/job context before creating adapters.            |
| `unknown`           | `PlatformError`            | Unclassified failure.                                                             | Inspect `cause` and logs; extend `error-classifier` if pattern repeats.             |

### Logging guidance

- Log `platform`, `code`, and a safe message. Do **not** log access tokens, refresh tokens, or raw PII from vendor payloads.
- Attach `cause` chain only in structured fields restricted to operational access.

## HTTP health endpoints (`apps/web`)

| Response / body                         | When                                                                               | Resolution                                                                                              |
| --------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `400` `{ "error": "unknown_platform" }` | `GET /api/health/platforms/{platform}` with invalid slug.                          | Use `meta`, `ga4`, `gsc`, `gbp`, or `tiktok`.                                                           |
| `404` `{ "error": "not_found" }`        | Platform enum valid but row missing (should not occur for current implementation). | Verify route deployment version.                                                                        |
| `503`                                   | `GET /api/health/adapters` when aggregated `status !== "ok"`.                      | Inspect JSON `components` and `platforms` for degraded cache, Redis, DLQ backlog, or low health scores. |

## Vendor-specific HTTP mapping

Adapters map vendor HTTP responses into `PlatformError` (or retryable paths) via helpers such as:

- `mapMetaGraphHttpError`
- `mapGoogleJsonApiHttpError` / GA4 data client mappers
- `mapTikTokHttpError`

When debugging, correlate vendor `status`, response body `error` / `code`, and the thrown `PlatformError.code`.
