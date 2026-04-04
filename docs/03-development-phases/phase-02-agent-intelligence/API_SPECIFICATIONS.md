# Phase 2 — HTTP API specifications

**Version:** 1.0  
**Last updated:** 2026-04-04  
**Status:** Normative for contract tests and Phase 3 dependencies  
**Implements:** [Remediation Plan — Part 2](/docs/03-development-phases/REMEDIATION_PLAN.md) tasks **R-1–R-4** (routes), **R-5** (auth), **R-6** (rate limit)

This document describes the public REST surface under **`/api/v1`** for insights, verdicts, analysis bundles, and validation. It is **OpenAPI 3.1–aligned**; the YAML below can be split into `apps/api` when the server is wired.

---

## Conventions

| Item             | Rule                                                                                                                                        |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Base URL**     | `https://{host}/api/v1` (no trailing slash on collection paths)                                                                             |
| **Content type** | `application/json; charset=utf-8`                                                                                                           |
| **Identifiers**  | UUID strings (`uuid`) for `id`, `tenantId`, `analysisId`, `campaignId` where applicable                                                     |
| **Dates**        | ISO 8601 date-time (`date-time`) for instants; date-only ranges use `YYYY-MM-DD` strings in query objects                                   |
| **Tenant scope** | Every successful response MUST only include data for the **JWT tenant**; cross-tenant IDs return **404** (not **403**) to avoid enumeration |

---

## Authentication

- **Scheme:** HTTP `Authorization: Bearer <JWT>`.
- **Claims (minimum):** `sub` (user id), `tenant_id` (uuid), `exp`, `iat`. Optional: `roles: string[]`.
- **401 Unauthorized:** Missing/invalid token, expired token.
- **403 Forbidden:** Valid token but insufficient **role** for the operation (if roles are enforced).

---

## Rate limiting

| Route group                 | Default limit                      | Keying              | Notes                                   |
| --------------------------- | ---------------------------------- | ------------------- | --------------------------------------- |
| `GET /insights`             | **100** requests / minute / tenant | `tenant_id` + route | Optional **5-minute** cache on success  |
| `GET /verdicts`             | **100** requests / minute / tenant | `tenant_id` + route | Optional **10-minute** cache on success |
| `GET /analysis-results/:id` | **60** requests / minute / tenant  | `tenant_id` + route | Strongly consistent; cache optional     |
| `POST .../validate`         | **30** requests / minute / tenant  | `tenant_id` + route | Lower due to CPU payload                |

**429 Too Many Requests:**

- Body: `ErrorEnvelope` (see schema).
- Header: `Retry-After: <seconds>` (positive integer).

---

## Error handling

All error responses use **`ErrorEnvelope`**:

```json
{
  "error": {
    "code": "string",
    "message": "human-readable summary",
    "details": {}
  },
  "requestId": "uuid-or-ulid"
}
```

| HTTP | `code` examples    | When                                       |
| ---- | ------------------ | ------------------------------------------ |
| 400  | `validation_error` | Malformed query/body (Zod / schema)        |
| 401  | `unauthorized`     | Auth failure                               |
| 403  | `forbidden`        | Role/tenant policy                         |
| 404  | `not_found`        | Unknown id **or** id not visible to tenant |
| 429  | `rate_limited`     | Quota exceeded                             |
| 500  | `internal_error`   | Unexpected server failure                  |

---

## Core schemas (informative TypeScript)

These align with `@agenticverdict/types` as implemented in remediation **R-7** (verdict) and companion insight types.

### `GeneratedInsight`

```typescript
type InsightType = "anomaly" | "trend" | "opportunity" | "warning";

interface GeneratedInsight {
  id: string;
  tenantId: string;
  analysisId: string;
  type: InsightType;
  title: string;
  description: string;
  confidence: number; // 0–1
  relevanceScore: number; // 0–1 recommended for sorting
  platforms: string[]; // e.g. "meta", "ga4"
  relatedMetricKeys?: string[];
  evidence?: { label: string; value?: string | number; source?: string }[];
  createdAt: string; // date-time
}
```

### `MarketingVerdict` (unified — **no Phase 3 transform**)

Full field list and Zod constraints are defined in [Remediation Plan — R-7](/docs/03-development-phases/REMEDIATION_PLAN.md#task-r-7-standardize-verdict-schema-for-all-phases). API consumers MUST treat this as the **canonical** verdict JSON shape.

### `ProvenanceInfo`

```typescript
interface Transformation {
  type: string;
  description: string;
  timestamp: string; // date-time
  parameters?: Record<string, unknown>;
}

interface DataSourceProvenance {
  platform: "meta" | "ga4" | "gsc" | "gbp" | "tiktok";
  metrics: string[];
  dateRange: { start: string; end: string }; // ISO dates
  freshnessHours: number;
  qualityScore: number; // 0–100
}

interface ProvenanceInfo {
  analysisId: string;
  tenantId: string;
  generatedAt: string; // date-time
  dataSources: DataSourceProvenance[];
  transformations: Transformation[];
  agentVersion?: string;
  modelUsed?: string;
  parameters?: Record<string, unknown>;
  overallDataQualityScore?: number; // 0–100
}
```

### `ValidationResult`

```typescript
type Severity = "critical" | "high" | "medium" | "low";

interface ValidationError {
  field: string;
  code: string;
  message: string;
  severity: Severity;
}

interface ValidationWarning {
  field: string;
  code: string;
  message: string;
  suggestion?: string;
}

interface ValidationResult {
  isValid: boolean;
  score: number; // 0–100
  errors: ValidationError[];
  warnings: ValidationWarning[];
  recommendations: string[];
  metadata?: {
    validatedAt: string; // date-time
    validatorVersion: string;
  };
}
```

---

## Operations

### `GET /insights`

**Summary:** Paginated list of generated insights for the current tenant.

**Query parameters:**

| Name                    | Type                                     | Description                 |
| ----------------------- | ---------------------------------------- | --------------------------- |
| `filter[type]`          | `InsightType`                            | Optional                    |
| `filter[confidenceMin]` | number `0–1`                             | Minimum confidence          |
| `filter[relevanceMin]`  | number `0–1`                             | Minimum relevance           |
| `sort`                  | `relevance` \| `created` \| `confidence` | Default `relevance`         |
| `limit`                 | integer                                  | Default **50**, max **100** |
| `offset`                | integer                                  | Default **0**               |

**200 Response:**

```typescript
interface InsightListResponse {
  insights: GeneratedInsight[];
  total: number;
  limit: number;
  offset: number;
}
```

---

### `GET /verdicts`

**Summary:** List marketing verdicts for the tenant.

**Query parameters:**

| Name               | Type                                                                                          | Description |
| ------------------ | --------------------------------------------------------------------------------------------- | ----------- |
| `campaignId`       | uuid                                                                                          | Optional    |
| `verdictType`      | `budget_allocation` \| `platform_performance` \| `creative_effectiveness` \| `overall_health` | Optional    |
| `dateRange[start]` | `date`                                                                                        | Inclusive   |
| `dateRange[end]`   | `date`                                                                                        | Inclusive   |

**200 Response:**

```typescript
interface VerdictListResponse {
  verdicts: MarketingVerdict[]; // unified schema — see R-7
  total: number;
}
```

---

### `GET /analysis-results/{id}`

**Summary:** Single analysis bundle including provenance, insights, and verdicts.

**Path:** `id` = `analysisId` (uuid).

**200 Response:**

```typescript
interface AnalysisResultResponse {
  analysisId: string;
  tenantId: string;
  period: { start: string; end: string };
  platformsAnalyzed: string[];
  dataQualityScore: number;
  generatedAt: string; // date-time
  provenance: ProvenanceInfo;
  insights: GeneratedInsight[];
  verdicts: MarketingVerdict[];
}
```

**404:** Unknown id or not visible to tenant.

---

### `POST /insights/validate`

**Summary:** Run data-quality checks on a batch of insights (tooling, pre-publish, CI).

**Request:**

```typescript
interface InsightValidationRequest {
  insights: GeneratedInsight[];
}
```

**200 Response:** `ValidationResult` for the batch (aggregated score; errors/warnings list all failing items with `field` paths like `insights[2].description`).

---

### `POST /verdicts/validate`

**Summary:** Validate a single verdict against the unified schema and quality rules.

**Request:**

```typescript
interface VerdictValidationRequest {
  verdict: MarketingVerdict;
}
```

**200 Response:** `ValidationResult`.

---

## OpenAPI 3.1 fragment

The following fragment can be imported or merged into the root API spec.

```yaml
openapi: 3.1.0
info:
  title: AgenticVerdict Phase 2 — Insights & Verdicts API
  version: 1.0.0
servers:
  - url: https://api.example.com/api/v1
paths:
  /insights:
    get:
      operationId: listInsights
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: filter[type]
          schema:
            type: string
            enum: [anomaly, trend, opportunity, warning]
        - in: query
          name: filter[confidenceMin]
          schema:
            type: number
            minimum: 0
            maximum: 1
        - in: query
          name: filter[relevanceMin]
          schema:
            type: number
            minimum: 0
            maximum: 1
        - in: query
          name: sort
          schema:
            type: string
            enum: [relevance, created, confidence]
            default: relevance
        - in: query
          name: limit
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 50
        - in: query
          name: offset
          schema:
            type: integer
            minimum: 0
            default: 0
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/InsightListResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimited"
  /verdicts:
    get:
      operationId: listVerdicts
      security:
        - bearerAuth: []
      parameters:
        - in: query
          name: campaignId
          schema:
            type: string
            format: uuid
        - in: query
          name: verdictType
          schema:
            type: string
            enum:
              - budget_allocation
              - platform_performance
              - creative_effectiveness
              - overall_health
        - in: query
          name: dateRange[start]
          schema:
            type: string
            format: date
        - in: query
          name: dateRange[end]
          schema:
            type: string
            format: date
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/VerdictListResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimited"
  /analysis-results/{id}:
    get:
      operationId: getAnalysisResult
      security:
        - bearerAuth: []
      parameters:
        - in: path
          name: id
          required: true
          schema:
            type: string
            format: uuid
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AnalysisResultResponse"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "404":
          $ref: "#/components/responses/NotFound"
        "429":
          $ref: "#/components/responses/RateLimited"
  /insights/validate:
    post:
      operationId: validateInsights
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/InsightValidationRequest"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ValidationResult"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimited"
  /verdicts/validate:
    post:
      operationId: validateVerdict
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/VerdictValidationRequest"
      responses:
        "200":
          description: OK
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ValidationResult"
        "400":
          $ref: "#/components/responses/BadRequest"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "429":
          $ref: "#/components/responses/RateLimited"
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  responses:
    Unauthorized:
      description: Unauthorized
      headers:
        Retry-After:
          schema:
            type: integer
          required: false
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
    RateLimited:
      description: Too Many Requests
      headers:
        Retry-After:
          schema:
            type: integer
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
    NotFound:
      description: Not Found
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
    BadRequest:
      description: Bad Request
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/ErrorEnvelope"
  schemas:
    ErrorEnvelope:
      type: object
      required: [error, requestId]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object
              additionalProperties: true
        requestId:
          type: string
    GeneratedInsight:
      type: object
      required:
        - id
        - tenantId
        - analysisId
        - type
        - title
        - description
        - confidence
        - relevanceScore
        - platforms
        - createdAt
      properties:
        id:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        analysisId:
          type: string
          format: uuid
        type:
          type: string
          enum: [anomaly, trend, opportunity, warning]
        title:
          type: string
        description:
          type: string
        confidence:
          type: number
          minimum: 0
          maximum: 1
        relevanceScore:
          type: number
          minimum: 0
          maximum: 1
        platforms:
          type: array
          items:
            type: string
        relatedMetricKeys:
          type: array
          items:
            type: string
        evidence:
          type: array
          items:
            type: object
        createdAt:
          type: string
          format: date-time
    MarketingVerdict:
      description: >
        Unified verdict schema (R-7). Use a $ref to the generated schema
        from @agenticverdict/types when available.
      type: object
      additionalProperties: true
    InsightListResponse:
      type: object
      required: [insights, total, limit, offset]
      properties:
        insights:
          type: array
          items:
            $ref: "#/components/schemas/GeneratedInsight"
        total:
          type: integer
          minimum: 0
        limit:
          type: integer
        offset:
          type: integer
    VerdictListResponse:
      type: object
      required: [verdicts, total]
      properties:
        verdicts:
          type: array
          items:
            $ref: "#/components/schemas/MarketingVerdict"
        total:
          type: integer
          minimum: 0
    ProvenanceInfo:
      type: object
      required: [analysisId, tenantId, generatedAt, dataSources, transformations]
      properties:
        analysisId:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        generatedAt:
          type: string
          format: date-time
        dataSources:
          type: array
          items:
            type: object
        transformations:
          type: array
          items:
            type: object
        agentVersion:
          type: string
        modelUsed:
          type: string
        parameters:
          type: object
          additionalProperties: true
        overallDataQualityScore:
          type: number
          minimum: 0
          maximum: 100
    AnalysisResultResponse:
      type: object
      required:
        - analysisId
        - tenantId
        - period
        - platformsAnalyzed
        - dataQualityScore
        - generatedAt
        - provenance
        - insights
        - verdicts
      properties:
        analysisId:
          type: string
          format: uuid
        tenantId:
          type: string
          format: uuid
        period:
          type: object
          required: [start, end]
          properties:
            start:
              type: string
              format: date
            end:
              type: string
              format: date
        platformsAnalyzed:
          type: array
          items:
            type: string
        dataQualityScore:
          type: number
        generatedAt:
          type: string
          format: date-time
        provenance:
          $ref: "#/components/schemas/ProvenanceInfo"
        insights:
          type: array
          items:
            $ref: "#/components/schemas/GeneratedInsight"
        verdicts:
          type: array
          items:
            $ref: "#/components/schemas/MarketingVerdict"
    ValidationError:
      type: object
      required: [field, code, message, severity]
      properties:
        field:
          type: string
        code:
          type: string
        message:
          type: string
        severity:
          type: string
          enum: [critical, high, medium, low]
    ValidationWarning:
      type: object
      required: [field, code, message]
      properties:
        field:
          type: string
        code:
          type: string
        message:
          type: string
        suggestion:
          type: string
    ValidationResult:
      type: object
      required: [isValid, score, errors, warnings, recommendations]
      properties:
        isValid:
          type: boolean
        score:
          type: number
          minimum: 0
          maximum: 100
        errors:
          type: array
          items:
            $ref: "#/components/schemas/ValidationError"
        warnings:
          type: array
          items:
            $ref: "#/components/schemas/ValidationWarning"
        recommendations:
          type: array
          items:
            type: string
        metadata:
          type: object
    InsightValidationRequest:
      type: object
      required: [insights]
      properties:
        insights:
          type: array
          items:
            $ref: "#/components/schemas/GeneratedInsight"
    VerdictValidationRequest:
      type: object
      required: [verdict]
      properties:
        verdict:
          $ref: "#/components/schemas/MarketingVerdict"
```

---

## Related documentation

- [Phase 2 overview](./overview.md)
- [Phase 2 tasks](./tasks.md) — Category 8
- [Phase 2 acceptance criteria](./acceptance-criteria.md) — sections 1.7 (HTTP API) and 1.8 (schemas & provenance)
- [Remediation Plan](/docs/03-development-phases/REMEDIATION_PLAN.md)

---

**Document owner:** Engineering / API  
**Review cadence:** When R-7 verdict Zod schema lands, update `MarketingVerdict` `$ref` to the generated OpenAPI component from `@agenticverdict/types`.
