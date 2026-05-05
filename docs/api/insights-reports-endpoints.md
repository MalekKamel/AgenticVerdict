# Insights & Reports API Endpoints

**Last Updated:** 2026-05-04  
**Version:** 1.0.0

---

## Insights Endpoints

### `insight.list`

List all insights for the authenticated tenant.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  status?: "enabled" | "disabled" | "all";
  search?: string;
  page?: number; // default: 1
  pageSize?: number; // default: 20, max: 100
}
```

**Output:**

```typescript
{
  insights: Array<{
    id: string;
    tenantId: string;
    name: string;
    description: string | null;
    templateId: string | null;
    enabled: boolean;
    schedule: Record<string, unknown>;
    delivery: Record<string, unknown>;
    aiConfig: Record<string, unknown>;
    createdAt: Date;
    connectors: Array<{
      id: string;
      connectorId: string;
      enabled: boolean;
      selectedMetrics: unknown[];
      filters: Record<string, unknown>;
    }>;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

**Errors:**

- `UNAUTHORIZED` - User not authenticated
- `INTERNAL_SERVER_ERROR` - Database error

---

### `insight.detail` / `insight.getById`

Get detailed information about a specific insight.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
}
```

**Output:**

```typescript
{
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  templateId: string | null;
  enabled: boolean;
  schedule: Record<string, unknown>;
  delivery: Record<string, unknown>;
  aiConfig: Record<string, unknown>;
  createdAt: Date;
  connectors: Array<{
    id: string;
    connectorId: string;
    enabled: boolean;
    selectedMetrics: unknown[];
    filters: Record<string, unknown>;
  }>;
}
```

**Errors:**

- `NOT_FOUND` - Insight not found
- `UNAUTHORIZED` - User doesn't own insight

---

### `insight.create`

Create a new insight.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  name: string; // min: 1, max: 255
  description?: string;
  templateId?: string;
  enabled?: boolean; // default: true
  schedule?: Record<string, unknown>; // default: {}
  delivery?: Record<string, unknown>; // default: {}
  aiConfig?: Record<string, unknown>; // default: {}
  connectors?: Array<{
    connectorId: string;
    enabled?: boolean; // default: true
    selectedMetrics?: string[]; // default: []
    filters?: Record<string, unknown>; // default: {}
  }>;
}
```

**Output:**

```typescript
{
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  templateId: string | null;
  enabled: boolean;
  schedule: Record<string, unknown>;
  delivery: Record<string, unknown>;
  aiConfig: Record<string, unknown>;
  createdAt: Date;
  connectors: Array<{
    /* ... */
  }>;
}
```

**Audit Trail:** Creates `created` event with metadata

**Errors:**

- `UNAUTHORIZED` - User not authenticated
- `INTERNAL_SERVER_ERROR` - Failed to create insight

---

### `insight.update`

Update an existing insight.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
  data: {
    name?: string;
    description?: string;
    templateId?: string;
    enabled?: boolean;
    schedule?: Record<string, unknown>;
    delivery?: Record<string, unknown>;
    aiConfig?: Record<string, unknown>;
    connectors?: Array<{ /* ... */ }>;
  };
}
```

**Output:**

```typescript
{
  id: string;
  tenantId: string;
  name: string;
  description: string | null;
  templateId: string | null;
  enabled: boolean;
  schedule: Record<string, unknown>;
  delivery: Record<string, unknown>;
  aiConfig: Record<string, unknown>;
  createdAt: Date;
  connectors: Array<{
    /* ... */
  }>;
}
```

**Audit Trail:** Creates `updated` event with changes metadata

**Errors:**

- `NOT_FOUND` - Insight not found
- `UNAUTHORIZED` - User doesn't own insight

---

### `insight.delete`

Delete an insight.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Audit Trail:** Creates `deleted` event before deletion

**Errors:**

- `NOT_FOUND` - Insight not found
- `UNAUTHORIZED` - User doesn't own insight

---

### `insight.run`

Manually trigger an insight run.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
}
```

**Output:**

```typescript
{
  success: boolean;
  jobId?: string;
}
```

**Errors:**

- `NOT_FOUND` - Insight not found
- `UNAUTHORIZED` - User doesn't own insight

---

### `insight.getAuditTrail`

Get audit trail events for an insight.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  tenantId: string;
  insightId: string;
  eventType?: "run" | "config_change" | "delivery" | "error";
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
}
```

**Output:**

```typescript
{
  events: Array<{
    id: string;
    insightId: string;
    eventType: string;
    status: string;
    timestamp: string;
    duration?: number;
    metadata?: Record<string, unknown>;
  }>;
}
```

**Errors:**

- `UNAUTHORIZED` - User not authenticated
- `NOT_FOUND` - Insight not found

---

## Reports Endpoints

### `report.list`

List all reports for the authenticated tenant.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  status?: string;
  format?: "pdf" | "excel" | "all"; // default: "all"
  search?: string;
  dateFrom?: string; // ISO 8601
  dateTo?: string; // ISO 8601
  page?: number; // default: 1
  pageSize?: number; // default: 20, max: 100
}
```

**Output:**

```typescript
{
  reports: Array<{
    id: string;
    tenantId: string;
    title: string;
    status: string;
    metadata: Record<string, unknown> | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
  total: number;
  page: number;
  pageSize: number;
}
```

**Errors:**

- `UNAUTHORIZED` - User not authenticated

---

### `report.detail`

Get detailed information about a specific report.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
}
```

**Output:**

```typescript
{
  id: string;
  tenantId: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Errors:**

- `NOT_FOUND` - Report not found
- `UNAUTHORIZED` - User doesn't own report

---

### `report.content`

Get report content in specified format.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
  format: "pdf" | "excel";
}
```

**Output:**

```typescript
{
  content: string; // base64-encoded
  contentType: string;
}
```

**Errors:**

- `NOT_FOUND` - Report not found
- `UNAUTHORIZED` - User doesn't own report

---

### `report.delete`

Delete a report.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  id: string;
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Audit Trail:** Creates `deleted` event before deletion

**Errors:**

- `NOT_FOUND` - Report not found
- `UNAUTHORIZED` - User doesn't own report

---

### `report.deleteMany`

Delete multiple reports.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  ids: string[];
}
```

**Output:**

```typescript
{
  success: boolean;
  deletedCount: number;
}
```

**Audit Trail:** Creates `deleted` event with deletedCount metadata

**Errors:**

- `UNAUTHORIZED` - User not authenticated

---

## Report Sharing Endpoints

### `report.shares`

List all share links for a report.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  reportId: string;
}
```

**Output:**

```typescript
{
  shares: Array<{
    id: string;
    token: string;
    expiresAt: Date;
    revokedAt: Date | null;
    createdAt: Date;
    createdBy: string;
  }>;
}
```

**Errors:**

- `UNAUTHORIZED` - User not authenticated

---

### `report.createShareLink`

Create a new share link for a report.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  reportId: string;
  expiresAt: Date; // max 30 days from now
}
```

**Output:**

```typescript
{
  shareUrl: string; // full URL for sharing
  expiresAt: Date;
  token: string; // 32-char hex token
}
```

**Audit Trail:** Creates `shared` event with shareId and expiresAt metadata

**Errors:**

- `NOT_FOUND` - Report not found
- `UNAUTHORIZED` - User doesn't own report
- `INTERNAL_SERVER_ERROR` - Failed to create share link

**Security:**

- Token is 32-character hex string (192 bits entropy)
- Maximum expiration: 30 days
- Token is URL-safe

---

### `report.revokeShareLink`

Revoke an existing share link.

**Access:** Authenticated (tenant-scoped)

**Input:**

```typescript
{
  shareId: string;
}
```

**Output:**

```typescript
{
  success: boolean;
}
```

**Audit Trail:** Creates `share_revoked` event with shareId metadata

**Errors:**

- `NOT_FOUND` - Share link not found
- `UNAUTHORIZED` - User doesn't own share link

**Security:**

- Tenant isolation enforced
- Revocation is immediate
- Revoked links cannot be reactivated

---

### `report.getSharedReport`

Get report metadata via share link (public access).

**Access:** Public (no authentication required)

**Input:**

```typescript
{
  reportId: string;
  token: string;
}
```

**Output:**

```typescript
{
  id: string;
  tenantId: string;
  title: string;
  status: string;
  metadata: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}
```

**Validation:**

- Token format validated
- Expiration checked
- Revocation status verified

**Errors:**

- `NOT_FOUND` - Share link not found
- `FORBIDDEN` - Share link expired
- `FORBIDDEN` - Share link revoked

**Security:**

- Token validation before access
- No tenant context required (public endpoint)
- Rate limiting recommended (100 req/hour per token)

---

### `report.getSharedReportContent`

Get report content via share link (public access).

**Access:** Public (no authentication required)

**Input:**

```typescript
{
  reportId: string;
  token: string;
  format: "pdf" | "excel";
}
```

**Output:**

```typescript
{
  content: string; // base64-encoded
  contentType: string;
}
```

**Validation:**

- Token format validated
- Expiration checked
- Revocation status verified

**Errors:**

- `NOT_FOUND` - Share link not found
- `FORBIDDEN` - Share link expired
- `FORBIDDEN` - Share link revoked

**Security:**

- Same validation as `getSharedReport`
- Content type restricted to pdf/excel

---

## Security Considerations

### Tenant Isolation

All authenticated endpoints enforce tenant isolation via:

- `dbScoped()` wrapper for database queries
- Tenant extraction from JWT token
- Row-level security (RLS) in PostgreSQL

### Token Security

Share link tokens:

- 32-character hex strings (192 bits entropy)
- URL-safe encoding
- Brute-force protected via rate limiting
- Single-use tracking (access count)

### Audit Trail

All CRUD operations create audit trail entries with:

- Actor identification (user ID)
- Timestamp
- Event type and action
- Metadata (changes, IDs)
- Request ID for tracing

### Rate Limiting

Recommended rate limits:

- Share link access: 100 requests/hour per token
- Share link creation: 10 requests/hour per user
- Audit trail queries: 60 requests/hour per user

---

## Error Codes

| Code                    | Description                     | HTTP Equivalent |
| ----------------------- | ------------------------------- | --------------- |
| `UNAUTHORIZED`          | User not authenticated          | 401             |
| `FORBIDDEN`             | Access denied (expired/revoked) | 403             |
| `NOT_FOUND`             | Resource not found              | 404             |
| `INTERNAL_SERVER_ERROR` | Server error                    | 500             |

---

## Related Documentation

- [RBAC Endpoints](./rbac-endpoints.md)
- [API Security Headers](../05-reference/api-security-headers-baseline.md)
- [Multi-tenant Guardrails](../05-reference/multi-tenant-guardrails.md)
