# Architecture and data flow — platform adapters

## System context

```mermaid
flowchart LR
  subgraph Vendors
    M[Meta Graph]
    G4[GA4 Data API]
    GS[GSC API]
    GB[GBP API]
    TT[TikTok Marketing API]
  end

  subgraph AgenticVerdict
    S[Worker / API service]
    PA[@agenticverdict/data-connectors]
    C[(Cache\nMemory / Upstash)]
    DLQ[Dead letter queue]
    H[Next.js /api/health]
  end

  S --> PA
  PA --> C
  PA --> DLQ
  PA --> M
  PA --> G4
  PA --> GS
  PA --> GB
  PA --> TT
  H --> PA
```

## Request path (fetch)

1. Caller invokes `authenticate` with decrypted credentials.
2. `fetchMetrics(dateRange)` enters `BaseConnectorAdapter`:
   - optional token bucket,
   - cache get by key (`tenantId`, `platform`, `dateRange`),
   - circuit breaker,
   - backoff-wrapped vendor calls in `fetchRawMetrics`.
3. Raw payload returned to caller; `normalizeData` produces `NormalizedConnectorSnapshot`.
4. Optional `runNormalizationPipeline` and validators produce quality scores for downstream agents.

## Security

- **Transport:** All vendor calls use HTTPS (`fetch`); enforce TLS 1.2+ at runtime via platform.
- **Secrets:** Adapters accept plaintext strings only after service-level decryption; never log credential maps.
- **Multi-tenancy:** `tenantId` is required on `BaseConnectorAdapterOptions` (non-empty string) so cache keys and observability never fall back to a shared default segment.
- **PII:** Business Profile reviews and similar payloads may contain PII; restrict log verbosity and redact in observability pipelines.

## Related packages

- `@agenticverdict/types` — `ConnectorType` and shared enums.
- Future `@agenticverdict/database` — encrypted credential persistence (Phase 0/1 boundary).

## Data flow summary

**Platforms → adapter raw payload → normalized snapshot → validation → agent/reporting layers.**

See [API-REFERENCE.md](./API-REFERENCE.md) for interface detail.
