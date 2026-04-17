# Unified API Architecture: tRPC for All Clients

**Document Version:** 2.0
**Date Created:** 2026-04-13
**Last Updated:** 2026-04-13
**Status:** Active
**Author:** AgenticVerdict Architecture Team

---

## Executive Summary

This specification establishes **tRPC as the unified API layer** for the AgenticVerdict platform, serving web, mobile, and CLI clients through a single type-safe contract. This decision aligns with the TanStack Start migration (see `/changelog/2026-04-13-nextjs-to-tanstack-start-documentation-migration.md`) and addresses the requirement for multi-client support with mobile and CLI applications planned for Phase 2-3 (3-6 month timeline).

**Core Decision:** Maintain Fastify + tRPC v11 as the canonical API layer. Use TanStack Start for frontend routing and UI, consuming tRPC for data operations. This provides full type safety, excellent developer experience, and enables all client types (web, mobile, CLI) to share a single API surface.

**Impact:** This affects architectural documentation and API patterns. Since AgenticVerdict is pre-production with greenfield implementation, no backward compatibility concerns exist.

---

## 1. Background and Context

### 1.1 Current State

The AgenticVerdict platform is architected as a distributed system:

- **Frontend:** TanStack Start for client-side rendering and routing
- **Backend API:** Fastify with tRPC v11 for type-safe RPC calls
- **Worker:** BullMQ background job processor for long-running tasks

This separation provides:

- Clear separation of concerns
- Independent scaling capabilities
- Multi-client API support

### 1.2 TanStack Start Migration Context

As documented in `/changelog/2026-04-13-nextjs-to-tanstack-start-documentation-migration.md`, Phases 1-4 of the Next.js to TanStack Start migration are complete, updating primary and secondary architecture documents. Phase 5 (remaining implementation guides) is pending.

### 1.3 Multi-Client Requirements

**Critical Requirement:** AgenticVerdict must support multiple client types:

| Client Type               | Timeline               | API Access Requirements                        |
| ------------------------- | ---------------------- | ---------------------------------------------- |
| **Web (React)**           | Phase 1 (immediate)    | Full API access, type-safe queries & mutations |
| **Mobile (React Native)** | Phase 2-3 (3-6 months) | Full API parity with web, offline support      |
| **CLI/Admin Tools**       | Phase 2-3 (3-6 months) | Full API access, scriptable operations         |

This requirement **eliminates TanStack Start server functions** as a viable option, as they only work with TanStack Start web applications.

### 1.4 Greenfield Implementation Advantage

AgenticVerdict is in pre-production. The existing Next.js prototype (`apps/frontend/`) is a demonstration prototype only with no production features. This provides:

- No backward compatibility requirements
- No existing API contracts to maintain
- Complete architectural freedom

---

## 2. Proposed Architecture: tRPC as Unified API Layer

### 2.1 Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                      AgenticVerdict API Layer                        │
│                         (Fastify + tRPC v11)                        │
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │   tRPC       │  │   tRPC       │  │   tRPC       │              │
│  │  Router:     │  │  Router:     │  │  Router:     │              │
│  │  auth        │  │  connectors  │  │  reports     │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
         │                      │                      │
         ▼                      ▼                      ▼
    ┌─────────┐          ┌─────────┐          ┌─────────┐
    │   Web   │          │  Mobile │          │   CLI   │
    │(tRPC    │          │(tRPC    │          │(HTTP    │
    │ client) │          │ client) │          │ client) │
    └─────────┘          └─────────┘          └─────────┘
    TanStack Start      React Native         Node.js CLI
```

### 2.2 Technology Stack

| Layer                  | Technology              | Purpose                                        |
| ---------------------- | ----------------------- | ---------------------------------------------- |
| **Frontend Framework** | TanStack Start          | File-based routing, SSR, load & action pattern |
| **API Server**         | **Fastify** (retained)  | High-performance Node.js server                |
| **API Layer**          | **tRPC v11** (retained) | End-to-end type-safe RPC                       |
| **State Management**   | TanStack Store          | Client-side state                              |
| **Form Handling**      | TanStack Form           | Type-safe form validation                      |
| **Worker Process**     | BullMQ                  | Background job processing                      |

### 2.3 tRPC Integration with TanStack Start

TanStack Start provides first-class tRPC integration via `@tanstack/start-trpc`:

```typescript
// apps/frontend/src/routes/index.tsx
import { createRoute } from '@tanstack/react-router'
import { trpc } from '@/lib/trpc'

export const Route = createRoute({
  component: Dashboard,
})

function Dashboard() {
  // Type-safe query — no API client code needed
  const { data, isLoading } = trpc.connectors.getMetrics.useQuery({
    dateRange: { start: '2026-04-01', end: '2026-04-13' }
  })

  if (isLoading) return <div>Loading...</div>
  return <div>{/* data is fully typed */}</div>
}
```

### 2.4 Mobile Client Integration

React Native apps use the same tRPC API with `@trpc/client`:

```typescript
// apps/mobile/src/screens/Dashboard.tsx
import { trpc } from './lib/trpc'

function Dashboard() {
  // Same query, same types, works on React Native
  const { data } = trpc.connectors.getMetrics.useQuery({
    dateRange: { start: '2026-04-01', end: '2026-04-13' }
  })

  return <View>{/* Render mobile UI */}</View>
}
```

### 2.5 CLI Client Integration

CLI tools access the same API via standard HTTP:

```typescript
// packages/cli/src/commands/report.ts
import { fetch } from "undici";

async function generateReport() {
  const response = await fetch("http://api.local/trpc/reports.generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      json: {
        companyId: "masafh",
        dateRange: {
          /* ... */
        },
      },
    }),
  });
  const report = await response.json();
  console.log(report);
}
```

---

## 3. Technical Rationale

### 3.1 Why tRPC Over Alternatives

| Concern                  | Server Functions           | tRPC Unified                  | REST API                    |
| ------------------------ | -------------------------- | ----------------------------- | --------------------------- |
| **Web Type Safety**      | ✅ Excellent               | ✅ Excellent                  | ❌ Requires code generation |
| **Mobile Support**       | ❌ Not possible            | ✅ React Native client        | ✅ HTTP                     |
| **CLI Support**          | ❌ Not possible            | ✅ HTTP                       | ✅ HTTP                     |
| **Single API Surface**   | ❌ Would need separate API | ✅ One API for all            | ✅ One API                  |
| **Developer Experience** | ✅ Zero-API feel           | ✅ Near-zero-API              | ⚠️ Boilerplate              |
| **Independent Scaling**  | ❌ Bound to web process    | ✅ Scales independently       | ✅ Scales independently     |
| **API Versioning**       | ❌ Harder                  | ✅ Built-in router versioning | ✅ URL versioning           |

**Conclusion:** tRPC provides the best balance of type safety, developer experience, and multi-client support.

### 3.2 Type Safety Flow

```
┌─────────────────────────────────────────────────────────────┐
│                      Single Source of Truth                  │
│                                                              │
│  packages/api/src/routers/connectors.ts                     │
│  ┌────────────────────────────────────────────────────┐     │
│  │ export const connectorsRouter = t.router({         │     │
│  │   getMetrics: t.procedure                           │     │
│  │     .input(z.object({ dateRange: DateRangeSchema }))│    │
│  │     .query(async ({ input }) => {                   │     │
│  │       return await fetchMetrics(input)               │     │
│  │     })                                               │     │
│  │ })                                                   │     │
│  └────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
    ┌─────────┐               ┌─────────┐
    │   Web   │               │  Mobile │
    │ Infer   │               │  Infer  │
    │ Types   │               │  Types  │
    └─────────┘               └─────────┘
```

Both web and mobile clients **automatically infer** the correct input/output types from the router definition. No manual type definitions or code generation required.

### 3.3 Performance Characteristics

| Aspect               | tRPC               | REST               | Server Functions  |
| -------------------- | ------------------ | ------------------ | ----------------- |
| **Network Overhead** | Minimal (JSON-RPC) | Minimal            | Same              |
| **Type Inference**   | Zero-runtime cost  | Build-time only    | Zero-runtime cost |
| **Bundle Size**      | ~10KB client       | ~5KB fetch wrapper | ~8KB runtime      |
| **Dev Server**       | Hot reload         | Hot reload         | Hot reload        |

**Reality Check:** All approaches serialize over HTTP. Performance differences are negligible. tRPC's advantage is developer ergonomics, not runtime speed.

### 3.4 Deployment Architecture

```
┌────────────────────────────────────────────────────────────────┐
│                     Production Deployment                       │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   Nginx /    │  │   Fastify    │  │    BullMQ    │        │
│  │   Load       │──▶│   API Server │  │    Worker    │        │
│  │   Balancer   │  │   (tRPC)     │  │              │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
│         │                   │                   │              │
│         ▼                   ▼                   �              │
│    ┌─────────┐         ┌─────────┐                              │
│    │   Web   │         │  Redis  │                              │
│    │  (CDN)  │         │  (Queue │                              │
│    └─────────┘         └─────────┘                              │
└────────────────────────────────────────────────────────────────┘
```

- **Web:** TanStack Start deployed to edge/CDN for static assets
- **API:** Fastify server horizontally scaled behind load balancer
- **Worker:** BullMQ workers process background jobs

---

## 4. Implementation Scope

### 4.1 Documentation Updates Required

The following documents must be updated to reflect the tRPC unified architecture:

#### Primary Documents (Critical)

1. **`/CLAUDE.md`**
   - Confirm Fastify + tRPC as API layer
   - Update "Technology Stack" table
   - Update "Repository Structure" to retain `apps/api/`
   - Update Docker commands for multi-process deployment

2. **`/docs/architecture/ui/00-overview.md`**
   - Update "Technology Stack" table to confirm Fastify + tRPC
   - Update "Performance Strategy" for multi-process architecture
   - Add "Multi-Client Support" section

3. **`/docs/architecture/business/technical-architecture.md`**
   - Update architecture diagrams to show API layer with multiple clients
   - Revise "Components" section to describe tRPC router structure
   - Update "Deployment" section for multi-process deployment
   - Add mobile/CLI client architecture

4. **`/docs/architecture/business/implementation-guide.md`**
   - Update tRPC route examples
   - Update "Application Structure" to show API package
   - Add multi-client code examples

#### Secondary Documents

5. **`/docs/architecture/ui/03-implementation-guide/getting-started.md`**
   - Update "API Server Setup" with tRPC configuration
   - Add TanStack Start + tRPC integration examples

6. **`/docs/architecture/ui/03-implementation-guide/migration-guide.md`**
   - Remove or mark as irrelevant (no migration needed from Next.js API routes)

7. **`/docs/architecture/ui/04-decision-record.md`**
   - Add decision record for tRPC vs alternatives
   - Document multi-client requirements as driving factor

#### Testing and Validation Documents

8. **`/docs/architecture/ui/03-implementation-guide/testing-strategy.md`**
   - Update to reflect tRPC testing patterns
   - Add mobile/CLI client testing guidance

### 4.2 API Specification Examples

#### Example: Connector Authentication API

```typescript
// packages/api/src/routers/connectors.ts
import { t } from "../trpc";
import { z } from "zod";
import { authenticateConnector } from "@agenticverdict/data-connectors";

export const connectorsRouter = t.router({
  authenticate: t.procedure
    .input(
      z.object({
        connector: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
        credentials: z.object({
          accessToken: z.string().min(1),
          accountId: z.string().optional(),
        }),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      // Tenant context from tRPC middleware
      const tenantId = ctx.tenantId;

      return await authenticateConnector(tenantId, input.connector, input.credentials);
    }),

  fetchMetrics: t.procedure
    .input(
      z.object({
        connector: z.enum(["meta", "ga4", "gsc", "gbp", "tiktok"]),
        dateRange: z.object({
          start: z.string(),
          end: z.string(),
        }),
      }),
    )
    .query(async ({ input, ctx }) => {
      const tenantId = ctx.tenantId;
      return await fetchConnectorMetrics(tenantId, input.connector, input.dateRange);
    }),
});
```

#### Web Client Usage

```typescript
// apps/frontend/src/components/ConnectorCard.tsx
import { trpc } from '@/lib/trpc'

function ConnectorCard({ connector }: { connector: string }) {
  const utils = trpc.useContext()

  const { data } = trpc.connectors.fetchMetrics.useQuery({
    connector,
    dateRange: { start: '2026-04-01', end: '2026-04-13' }
  })

  const authenticate = trpc.connectors.authenticate.useMutation({
    onSuccess: () => {
      utils.connectors.fetchMetrics.invalidate()
    }
  })

  return (
    <Card>
      <Button onClick={() => authenticate.mutate({ connector, credentials })}>
        Authenticate
      </Button>
      {data && <Metrics data={data} />}
    </Card>
  )
}
```

#### Mobile Client Usage

```typescript
// apps/mobile/src/screens/Connectors.tsx
import { trpc } from '../lib/trpc'

function ConnectorsScreen() {
  const { data } = trpc.connectors.list.useQuery()

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ConnectorItem connector={item} />}
    />
  )
}
```

### 4.3 Required tRPC Procedures

Based on current system requirements:

| Domain             | Procedures                                               | Description                                |
| ------------------ | -------------------------------------------------------- | ------------------------------------------ |
| **Authentication** | `login`, `logout`, `refreshToken`, `me`                  | User authentication and session management |
| **Connectors**     | `authenticate`, `fetchMetrics`, `testConnection`, `list` | Platform connector management              |
| **Companies**      | `create`, `updateConfig`, `getConfig`, `list`            | Multi-tenant company management            |
| **Reports**        | `generate`, `schedule`, `getHistory`, `cancel`           | Report generation and delivery             |
| **Insights**       | `generate`, `list`, `getById`, `rate`                    | AI-powered insight generation              |
| **Dashboards**     | `getData`, `updateLayout`, `list`                        | Dashboard configuration and data           |
| **Users**          | `create`, `update`, `invite`, `remove`                   | User management within companies           |

---

## 5. Migration Strategy

### 5.1 Phased Approach

**Phase 1: Documentation Update (Week 1)**

- Update all architecture documents to reflect tRPC unified API
- Create code examples for web, mobile, and CLI clients
- Update decision records with rationale

**Phase 2: API Package Structure (Week 1-2)**

- Create or update `packages/api/` with tRPC router structure
- Define all required procedures with Zod schemas
- Set up tRPC context with tenant isolation
- Add middleware for authentication and tenant context

**Phase 3: Web Client Integration (Week 2-3)**

- Set up TanStack Start + tRPC integration
- Create tRPC client configuration
- Implement example queries and mutations
- Update existing components to use tRPC

**Phase 4: Testing (Week 3-4)**

- Unit tests for tRPC procedures
- Integration tests for API endpoints
- E2E tests covering web client workflows
- Contract tests for mobile/CLI compatibility

**Phase 5: Mobile Client Preparation (Week 4-5)**

- Document React Native tRPC setup
- Create mobile client examples
- Test API with mock mobile client

**Phase 6: Deployment Validation (Week 5-6)**

- Validate multi-process Docker deployment
- Test load balancing and scaling
- Production deployment

### 5.2 Rollback Considerations

Since this is a greenfield implementation:

- No production rollback required
- If issues arise, document lessons learned
- Consider alternative architectures if tRPC proves insufficient

### 5.3 Success Criteria

- [ ] All documentation updated consistently
- [ ] All required tRPC procedures implemented with Zod validation
- [ ] Unit tests pass for all procedures (80%+ coverage)
- [ ] E2E tests cover critical web user journeys
- [ ] Mobile client examples provided
- [ ] CLI client examples provided
- [ ] Docker multi-process deployment validated
- [ ] Performance targets maintained (<2s page load, <200ms API response)
- [ ] Type safety verified (zero `any` types in API layer)

---

## 6. Constraints and Considerations

### 6.1 Greenfield Implementation

**Constraint:** No backward compatibility required
**Implication:** API contracts designed from scratch for optimal tRPC usage

### 6.2 Multi-Tenancy Requirements

**Constraint:** All tRPC procedures must enforce tenant isolation

**Implementation:**

```typescript
// packages/api/src/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import { AsyncLocalStorage } from "node:async_hooks";

export interface TenantContext {
  tenantId: string;
  userId: string;
}

const tenantContext = new AsyncLocalStorage<TenantContext>();

export const t = initTRPC.context<TenantContext>().create();

// Middleware to inject tenant context
const isAuthed = t.middleware(({ next, ctx }) => {
  if (!ctx.tenantId) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({ ctx });
});

export const protectedProcedure = t.procedure.use(isAuthed);
```

**Usage in procedures:**

```typescript
export const companiesRouter = t.router({
  getConfig: protectedProcedure.query(async ({ ctx }) => {
    // ctx.tenantId is guaranteed to exist
    return await db.companies.findById(ctx.tenantId);
  }),
});
```

### 6.3 Worker Process Integration

**Scope:** BullMQ worker process consumes domain logic, not tRPC directly

**Pattern:**

```typescript
// apps/worker/src/jobs/generate-report.ts
import { generateReport } from "@agenticverdict/report-generator";
// Worker imports domain logic, not tRPC procedures

export default async (job: Job) => {
  const { companyId, reportId } = job.data;
  await generateReport(companyId, reportId);
};
```

### 6.4 Client Libraries

**Decision:** Create client libraries for each platform

- **`@agenticverdict/api-client`** — Shared types and utilities
- **`@agenticverdict/web-api`** — Web-specific tRPC client
- **`@agenticverdict/mobile-api`** — React Native tRPC client
- **`@agenticverdict/cli-api`** — CLI HTTP client

---

## 7. Open Questions and Decisions Required

### 7.1 State Management

**Question:** Should we use TanStack Store or TanStack Store for client state?

| Factor                   | TanStack Store | TanStack Store |
| ------------------------ | -------------- | -------------- |
| **Bundle Size**          | ~1KB           | ~3KB           |
| **Learning Curve**       | Low            | Low            |
| **DevTools**             | Excellent      | Excellent      |
| **TanStack Integration** | None           | Native         |

**Recommendation:** TanStack Store for simplicity, TanStack Store if using other TanStack libraries heavily.

### 7.2 Form Handling

**Question:** Should we use TanStack Form or React Hook Form?

| Factor                   | TanStack Form  | React Hook Form   |
| ------------------------ | -------------- | ----------------- |
| **TanStack Integration** | Native         | None              |
| **Bundle Size**          | ~8KB           | ~25KB             |
| **Maturity**             | New            | Battle-tested     |
| **Zod Integration**      | Native adapter | Requires resolver |

**Recommendation:** TanStack Form for consistency with TanStack ecosystem.

### 7.3 API Versioning Strategy

**Question:** How should we handle breaking API changes?

| Option                   | Description                                        | Pros                 | Cons                |
| ------------------------ | -------------------------------------------------- | -------------------- | ------------------- |
| **Semantic versioning**  | Version routers (`v1.connectors`, `v2.connectors`) | Clear migration path | Duplicate code      |
| **Backward compatible**  | Add new fields, never remove                       | No migration needed  | Accumulates cruft   |
| **Deprecation warnings** | Mark old procedures as deprecated                  | Gradual migration    | Requires monitoring |

**Recommendation:** Backward compatible additions with deprecation warnings for removals.

---

## 8. Next Steps

1. **Review and Approve This Specification**
   - Architecture team review
   - Stakeholder sign-off
   - Document decision in `/docs/architecture/ui/04-decision-record.md`

2. **Begin Documentation Updates (Phase 1)**
   - Update `/CLAUDE.md`
   - Update `/docs/architecture/ui/00-overview.md`
   - Update technical architecture documents

3. **Create API Package Structure (Phase 2)**
   - Set up `packages/api/` with tRPC router
   - Define all required procedures
   - Implement tenant context middleware

4. **Implement Web Client Integration (Phase 3)**
   - Set up TanStack Start + tRPC
   - Create example queries/mutations
   - Update existing components

5. **Prepare Mobile Client Documentation (Phase 5)**
   - Document React Native setup
   - Create mobile client examples

6. **Validate and Deploy**
   - End-to-end testing
   - Performance validation
   - Production deployment

---

## 9. References

- **tRPC Documentation:** https://trpc.io/docs
- **TanStack Start tRPC Integration:** https://tanstack.com/start/latest/docs/framework/react/examples/with-trpc
- **React Native tRPC:** https://trpc.io/docs/react-native
- **Migration Changelog:** `/changelog/2026-04-13-nextjs-to-tanstack-start-documentation-migration.md`
- **Technical Architecture:** `/docs/architecture/business/technical-architecture.md`
- **Implementation Guide:** `/docs/architecture/business/implementation-guide.md`

---

## Appendix A: Sample Project Structure

```
agenticverdict/
├── apps/
│   ├── web/                          # TanStack Start web app
│   │   └── src/
│   │       ├── lib/
│   │       │   └── trpc.ts           # tRPC client setup
│   │       └── routes/               # File-based routes
│   ├── api/                          # Fastify + tRPC API server
│   │   └── src/
│   │       ├── routers/              # tRPC routers
│   │       │   ├── index.ts          # Root router
│   │       │   ├── auth.ts
│   │       │   ├── connectors.ts
│   │       │   ├── companies.ts
│   │       │   └── reports.ts
│   │       ├── middleware/           # tRPC middleware
│   │       │   ├── tenant.ts         # Tenant context
│   │       │   └── auth.ts           # Authentication
│   │       └── server.ts             # Fastify server
│   ├── mobile/                       # React Native app (Phase 2-3)
│   │   └── src/
│   │       └── lib/
│   │           └── trpc.ts           # tRPC client for RN
│   └── worker/                       # BullMQ worker
│       └── src/
│           └── jobs/                 # Background jobs
├── packages/
│   ├── api/                          # Shared API types
│   │   └── src/
│   │       └── trpc.ts               # Shared tRPC utilities
│   ├── data-connectors/              # Platform connectors
│   ├── report-generator/             # Report generation
│   └── types/                        # Shared types
└── docs/
```

---

**Document Status:** Active
**Next Review:** After Phase 2 completion (estimated 2 weeks)
**Maintainer:** Architecture Team
