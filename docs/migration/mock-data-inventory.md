# Mock Data Inventory

**Generated:** 2026-05-03  
**Scope:** All production code paths (excluding `*.test.ts`, `*.integration.test.ts`, `test/` directories)  
**Purpose:** Comprehensive inventory of mock data implementations requiring migration to production-ready integrations

---

## Executive Summary

| Category               | Count           | Risk Level | Priority     |
| ---------------------- | --------------- | ---------- | ------------ |
| Frontend API Mocks     | 2               | High       | P0           |
| Platform Adapter Mocks | 5 connectors    | High       | P0           |
| Runtime Policy Mocks   | 1 config system | Medium     | P1           |
| Testing Utilities      | 8 files         | Low        | P2 (exclude) |

**Total Production Mock Implementations:** 8 critical files requiring migration

---

## 1. Frontend API Layer Mocks

### 1.1 Dashboard API - Hardcoded Mock Data

**File:** `/apps/frontend/src/features/dashboard/api/dashboard-api.ts`

**Mock Patterns Found:**

| Function                       | Lines   | Mock Type               | Data Source                    |
| ------------------------------ | ------- | ----------------------- | ------------------------------ |
| `fetchDashboardHomeSummary`    | 48-97   | Static hardcoded object | Inline literal                 |
| `fetchDashboardDomainSummary`  | 167-179 | Static hardcoded object | Inline literal                 |
| `fetchDashboardAgencyOverview` | 197-259 | Static array + computed | `MOCK_AGENCY_CLIENTS` constant |

**Mock Data Details:**

```typescript
// KPIs - Static values
{
  id: "insights", labelKey: "home.kpi.totalInsights", value: 12, ...
  id: "connectors", labelKey: "home.kpi.activeConnectors", value: 5, ...
  id: "reports", labelKey: "home.kpi.reportsThisMonth", value: 48, ...
}

// Insights - Single static item
{
  id: "1", titleKey: "home.insights.sampleTitle", ...
}

// Connectors - Static status
[
  { id: "ga4", status: "healthy" },
  { id: "meta", status: "healthy" },
  { id: "gsc", status: "degraded" }
]

// Agency Clients - Hardcoded array
MOCK_AGENCY_CLIENTS = [
  { clientId: "client-a", name: "Acme Co", permitted: true, insightCount: 12 },
  { clientId: "client-b", name: "Contoso", permitted: true, insightCount: 8 },
  { clientId: "client-unscoped", name: "Blocked Org", permitted: false }
]
```

**Production Source Required:**

- tRPC procedure: `dashboard.homeSummary`, `dashboard.domainSummary`, `dashboard.agencyOverview`
- Database tables: `tenant_connectors`, `insights`, `reports`, `tenants`
- Aggregation logic: Per-tenant KPI calculations

**Risk Assessment:** HIGH - Core dashboard functionality displays fake data to users

---

### 1.2 Auth API - In-Memory Mock Session

**File:** `/apps/frontend/src/lib/api/auth-api.ts`

**Mock Patterns Found:**

| Function                          | Lines   | Mock Type                           | State Management                 |
| --------------------------------- | ------- | ----------------------------------- | -------------------------------- |
| `authApi.login`                   | 388-429 | In-memory session + Promise.resolve | `mockBrowserSession`             |
| `authApi.register`                | 464-488 | In-memory verification state        | `mockVerificationStateByKey` Map |
| `authApi.logout`                  | 514-529 | Session nullification               | `mockBrowserSession = null`      |
| `authApi.getSession`              | 565-583 | Session read                        | `mockBrowserSession`             |
| `authApi.verifyEmail`             | 614-683 | Verification simulation             | `mockVerificationStateByKey`     |
| `authApi.resendEmailVerification` | 689-729 | Cooldown simulation                 | `resendCooldownTracker`          |
| `authApi.requestPasswordReset`    | 760-778 | Stub success                        | None                             |
| `authApi.confirmPasswordReset`    | 807-827 | Stub success                        | None                             |

**Mock Configuration:**

- Controlled by: `isFrontendAuthApiMockEnabled()` from `@/lib/auth/frontend-runtime-policy`
- Default tenant: `MOCK_DEFAULT_TENANT_ID = "11111111-1111-4111-8111-111111111111"`
- Default code: `MOCK_DEFAULT_VERIFICATION_CODE = "123456"`
- Verification expiry: 15 minutes
- Max attempts: 5
- Lock duration: 10 minutes
- Resend cooldown: 60 seconds

**Mock User Data:**

```typescript
{
  id: "mock-user-id",
  email: input.email,
  firstName: "Mock",
  lastName: "User",
  emailVerified: true,
  tenantId: mockTenant,
  tenantType: "direct_business",
  tenantStatus: "active",
  roles: ["viewer"],
  permissions: [PERMISSIONS.REPORTS_READ]
}
```

**Production Source Required:**

- tRPC procedures: `auth.login`, `auth.register`, `auth.logout`, `auth.getSession`, `auth.verifyEmail`, etc.
- Database tables: `users`, `tenants`, `user_roles`, `user_permissions`
- JWT signing: `apps/api/src/lib/auth-session-jwt.ts`
- Password hashing: `apps/api/src/lib/auth-password.ts`

**Risk Assessment:** CRITICAL - Authentication bypass in mock mode allows unauthorized access

---

## 2. Platform Connector Adapter Mocks

### 2.1 Mock Adapter Infrastructure

**Files:**

- `/packages/data-connectors/src/mock-adapter.ts` (80 lines)
- `/packages/data-connectors/src/mock-adapter-factory.ts` (84 lines)
- `/packages/data-connectors/src/mock-static-data.ts` (scenario-based data generation)

**Mock Patterns:**

| Component              | Purpose                             | Configuration                                   |
| ---------------------- | ----------------------------------- | ----------------------------------------------- |
| `MockConnectorAdapter` | Simulates platform API calls        | `rawResponse`, `records`, `fetchFailureMessage` |
| `MockAdapterFactory`   | Creates mock adapters per connector | `scenario`, `seed`, `dateRange`                 |
| Scenario System        | Deterministic data generation       | `"normal"`, `"error"`, `"degraded"`             |

**Supported Scenarios:**

- `"normal"`: Successful auth + valid metrics
- `"error"`: Auth success, fetch fails with `invalid_request`
- `"degraded"`: Partial data, warnings

**Mock Data Generation:**

```typescript
buildScenarioRecords({
  connector: "ga4" | "meta" | "gsc" | "gbp" | "tiktok",
  scenario: "normal" | "error" | "degraded",
  seed: 42_001,
  dateRange: { startDate: "YYYY-MM-DD", endDate: "YYYY-MM-DD" },
});
```

**Production Source Required:**

- Real platform APIs: Meta Graph API, GA4 Data API, GSC API, GBP API, TikTok Marketing API
- OAuth2 token management
- Rate limiting + circuit breakers (already implemented in base adapter)

**Risk Assessment:** HIGH - All 5 platform connectors can run in mock mode

---

### 2.2 Adapter Factory - Mock Routing Logic

**File:** `/packages/data-connectors/src/adapter-factory.ts`

**Mock Detection Logic:**

```typescript
function shouldUseMockAdapter(connector, explicitUseMock): boolean {
  if (explicitUseMock === true) {
    return !IS_PRODUCTION; // Blocks mock in production build
  }
  if (IS_PRODUCTION) {
    return false;
  }
  return isMockEnabledForConnector(connector); // Runtime config check
}
```

**Configuration Source:**

- Build constant: `IS_PRODUCTION` from `@agenticverdict/config/build-constants`
- Runtime policy: `isMockEnabledForConnector()` from `@agenticverdict/config/configuration`
- Environment variables:
  - `AGENTICVERDICT_MOCK_MODE`: `"off" | "selective" | "all"`
  - `AGENTICVERDICT_MOCK_CONNECTORS`: Comma-separated list
  - `AGENTICVERDICT_MOCK_SEED`: Deterministic seed
  - `AGENTICVERDICT_MOCK_SCENARIO`: Scenario name

**Risk Assessment:** MEDIUM - Production builds block mock adapters, but runtime config can enable in staging/dev

---

## 3. Runtime Policy Configuration

### 3.1 Mock Mode Configuration System

**File:** `/packages/config/src/runtime-policy.ts` (220 lines)

**Mock Configuration Schema:**

```typescript
type RuntimePolicy = {
  runtimeEnv: "development" | "test" | "staging" | "production";
  mockMode: "off" | "selective" | "all";
  mockConnectors: ConnectorType[];
  mockScenario?: string;
  stubs: {
    reportFormats: boolean;
    emailDelivery: boolean;
  };
  frontend: {
    authApiMode: "real" | "mock";
  };
  tenant: {
    allowSyntheticFallback: boolean;
  };
};
```

**Environment Variables:**
| Variable | Purpose | Values | Default |
|----------|---------|-------|---------|
| `AGENTICVERDICT_RUNTIME_ENV` | Environment detection | `development`, `test`, `staging`, `production` | `development` |
| `AGENTICVERDICT_MOCK_MODE` | Mock enablement | `off`, `selective`, `all` | `off` |
| `AGENTICVERDICT_MOCK_CONNECTORS` | Selective mock connectors | `meta,ga4,gsc,gbp,tiktok` | `[]` |
| `AGENTICVERDICT_MOCK_SCENARIO` | Mock data scenario | `normal`, `error`, `degraded` | `normal` |
| `AGENTICVERDICT_MOCK_SEED` | Deterministic seed | Integer | `42001` |
| `VITE_PUBLIC_AUTH_API_MODE` | Frontend auth mode | `real`, `mock` | `real` |
| `AGENTICVERDICT_STUB_REPORT_FORMATS` | Report stubs | `0`, `1` | `0` |
| `AGENTICVERDICT_STUB_EMAIL_DELIVERY` | Email stubs | `0`, `1` | `0` |

**Production Safety Checks:**

```typescript
assertProductionSafeRuntimePolicy(policy): void {
  // Throws error if any mock enabled in staging/production
  if (policy.runtimeEnv === "staging" || policy.runtimeEnv === "production") {
    require(policy.mockMode === "off");
    require(policy.mockConnectors.length === 0);
    require(policy.stubs.reportFormats === false);
    require(policy.stubs.emailDelivery === false);
    require(policy.frontend.authApiMode === "real");
  }
}
```

**Risk Assessment:** MEDIUM - Safety checks exist but rely on correct `runtimeEnv` detection

---

## 4. Worker Mock Integrations

### 4.1 Worker Tenant Synthetic Fallback

**File:** `/apps/worker/src/tenant/worker-tenant-als.ts`

**Mock Pattern:**

```typescript
if (!isFeatureMockEnabled(policy, "tenantSyntheticFallback")) {
  // Skip synthetic tenant context
}
```

**Purpose:** Allows worker jobs to run without real tenant context in test mode

**Production Source Required:**

- Real tenant context from JWT → AsyncLocalStorage propagation
- Database tenant validation

**Risk Assessment:** LOW - Only used in test environments

---

### 4.2 Report Queue Mock Configuration

**File:** `/apps/worker/src/queues/report-queues.ts`

**Mock Data Flow:**

```typescript
mockScenario: validatedData.config.mockData?.scenario,
mockSeed: validatedData.config.mockData?.seed,
```

**Purpose:** Passes mock configuration to report generation jobs

**Production Source Required:**

- Real connector data from platform APIs
- Actual report generation with real metrics

**Risk Assessment:** MEDIUM - Report generation depends on connector mock data

---

### 4.3 Production Flow Scenarios (Test Infrastructure)

**File:** `/apps/worker/src/queues/production-flow-scenarios-extended.ts`

**Mock Usage:**

```typescript
import { AgentMockChatModel } from "@agenticverdict/testing";
const model = new AgentMockChatModel({});

if (!isFeatureMockEnabled(policy, "emailDelivery")) {
  throw new Error("production_flow_r09:mock_email_env_unset");
}
```

**Purpose:** Testing framework for R01-R12 production scenarios

**Risk Assessment:** LOW - Test-only infrastructure, not used in production

---

## 5. Testing Utilities (Excluded from Migration)

The following files contain mock implementations but are **test-only** and should NOT be migrated:

| File                                               | Purpose                  | Action |
| -------------------------------------------------- | ------------------------ | ------ |
| `/packages/testing/src/mock-chat-model.ts`         | Mock LLM for agent tests | Keep   |
| `/packages/testing/src/mock-llm-library.ts`        | Mock LLM utilities       | Keep   |
| `/apps/frontend/src/router/testing/mock-router.ts` | Router mock for tests    | Keep   |
| `/apps/frontend/src/test/setup.ts`                 | Test setup mocks         | Keep   |
| `/packages/ui/tests/setup.ts`                      | UI test mocks            | Keep   |
| `/packages/database/test/*.test.ts`                | Database test mocks      | Keep   |
| `/packages/data-connectors/src/*.test.ts`          | Adapter test mocks       | Keep   |
| `/apps/api/src/**/*.test.ts`                       | API test mocks           | Keep   |

---

## 6. Dependency Graph

```
┌─────────────────────────────────────────────────────┐
│            Environment Configuration                │
│  (AGENTICVERDICT_MOCK_MODE, runtime-policy.ts)      │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┬────────────────────┐
        │                     │                    │
        ▼                     ▼                    ▼
┌───────────────┐   ┌─────────────────┐  ┌─────────────────┐
│  Frontend     │   │  Connector      │  │  Worker         │
│  Auth API     │   │  Adapters       │  │  Queues         │
│  (auth-api.ts)│   │  (adapter-      │  │  (report-queues)│
│               │   │   factory.ts)   │  │                 │
└───────┬───────┘   └────────┬────────┘  └────────┬────────┘
        │                    │                     │
        │                    │                     │
        ▼                    ▼                     ▼
┌─────────────────────────────────────────────────────┐
│         Mock Data Sources                           │
│  • In-memory session (auth)                         │
│  • Static scenario data (connectors)                │
│  • Synthetic tenant context (worker)                │
└─────────────────────────────────────────────────────┘
```

---

## 7. Migration Priority Matrix

| Priority | Component          | Files               | Impact                | Effort | Dependencies               |
| -------- | ------------------ | ------------------- | --------------------- | ------ | -------------------------- |
| **P0**   | Dashboard API      | `dashboard-api.ts`  | User-facing fake data | 2 days | tRPC procedures, DB schema |
| **P0**   | Auth API           | `auth-api.ts`       | Security risk         | 3 days | JWT, DB users table        |
| **P0**   | Connector Adapters | 5 platform adapters | Core functionality    | 5 days | Platform API credentials   |
| **P1**   | Runtime Policy     | `runtime-policy.ts` | Configuration         | 1 day  | Env var deployment         |
| **P1**   | Worker Queues      | `report-queues.ts`  | Report generation     | 2 days | Connector migration        |
| **P2**   | Test Utilities     | 8 test files        | None (test-only)      | 0 days | Exclude from migration     |

**Total Estimated Effort:** 13 days (excluding test utilities)

---

## 8. Production Readiness Checklist

### Pre-Migration Requirements

- [ ] tRPC procedures implemented for all mocked endpoints
- [ ] Database schema deployed with RLS policies
- [ ] Platform API credentials obtained (Meta, GA4, GSC, GBP, TikTok)
- [ ] JWT secret configured in production environment
- [ ] Environment variables documented and validated

### Migration Validation

- [ ] Zero mock data in production code paths
- [ ] All APIs enforce tenant isolation via `AsyncLocalStorage`
- [ ] Full TypeScript type coverage (no `any` escapes)
- [ ] Structured logging with tenant context on all endpoints
- [ ] Test coverage ≥ 85% for migrated business logic
- [ ] Integration tests pass with real data sources
- [ ] E2E scenarios validate production flows

### Post-Migration Cleanup

- [ ] Remove `isFrontendAuthApiMockEnabled()` function
- [ ] Delete `mock-adapter.ts`, `mock-adapter-factory.ts`, `mock-static-data.ts`
- [ ] Remove `AGENTICVERDICT_MOCK_MODE` configuration options
- [ ] Update documentation to reflect production-only mode
- [ ] Remove mock-related environment variables from `.env.example`

---

## Appendix A: File Locations

### Critical Production Files (Migration Required)

```
apps/frontend/src/features/dashboard/api/dashboard-api.ts
apps/frontend/src/lib/api/auth-api.ts
packages/data-connectors/src/mock-adapter.ts
packages/data-connectors/src/mock-adapter-factory.ts
packages/data-connectors/src/mock-static-data.ts
packages/data-connectors/src/adapter-factory.ts
packages/config/src/runtime-policy.ts
apps/worker/src/tenant/worker-tenant-als.ts
apps/worker/src/queues/report-queues.ts
```

### Test-Only Files (No Migration Needed)

```
packages/testing/src/mock-chat-model.ts
packages/testing/src/mock-llm-library.ts
apps/frontend/src/router/testing/mock-router.ts
apps/frontend/src/test/setup.ts
packages/ui/tests/setup.ts
packages/database/test/*.test.ts
packages/data-connectors/src/*.test.ts
apps/api/src/**/*.test.ts
apps/worker/src/**/*.test.ts
```

---

**Next Steps:**

1. Review this inventory with the team
2. Create implementation plan (see `production-api-plan.md`)
3. Begin P0 migrations (Dashboard + Auth APIs)
4. Proceed with connector adapter migrations
5. Clean up mock infrastructure post-migration
