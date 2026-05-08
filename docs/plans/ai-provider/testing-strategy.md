# Testing Strategy

**Part of:** AI Provider Implementation Plan  
**See also:** [README.md](./README.md)

---

## Test Pyramid

```
Unit (Vitest) → Integration → E2E (Playwright) → Scenario Orchestration
```

---

## Unit Tests

### Provider Factory Tests

**Files:** `packages/agent-runtime/src/core/ProviderFactory.test.ts`

**Coverage:**

- Provider registration
- Provider creation with config
- Provider listing
- Error handling for unregistered providers

**Example:**

```typescript
describe("ProviderFactory", () => {
  it("should register and list providers", () => {
    ProviderFactory.register("test", TestProvider);
    const providers = ProviderFactory.listProviders();
    expect(providers).toContain("test");
  });

  it("should create provider with credentials", () => {
    const provider = ProviderFactory.create("openai", {
      apiKey: "test-key",
    });
    expect(provider).toBeDefined();
  });
});
```

---

### Credential Encryption Tests

**Files:** `packages/agent-runtime/src/utils/credential-encryption.test.ts`

**Coverage:**

- AES-256-GCM encryption/decryption
- Key derivation
- Tenant-specific encryption
- Tampering detection

**Example:**

```typescript
describe("CredentialEncryption", () => {
  it("should encrypt and decrypt credentials", () => {
    const credentials = { apiKey: "secret-key" };
    const encrypted = encrypt(credentials, tenantId);
    const decrypted = decrypt(encrypted, tenantId);
    expect(decrypted).toEqual(credentials);
  });

  it("should fail decryption with wrong tenant", () => {
    const credentials = { apiKey: "secret-key" };
    const encrypted = encrypt(credentials, "tenant-1");
    expect(() => decrypt(encrypted, "tenant-2")).toThrow();
  });
});
```

---

### Error System Tests

**Files:** `packages/agent-runtime/src/core/errors.test.ts`

**Coverage:**

- Error code consistency
- Error translation
- Tenant context in errors
- Retryable vs non-retryable errors

**Example:**

```typescript
describe("AgentRuntimeError", () => {
  it("should include tenant context in error metadata", () => {
    const error = new AgentRuntimeError({
      code: AgentRuntimeErrorCode.PROVIDER_FAILED,
      message: "Provider failed",
      tenantId: "tenant-123",
    });
    expect(error.metadata.tenantId).toBe("tenant-123");
  });
});
```

---

### Hook Execution Tests

**Files:** `packages/agent-runtime/src/core/hooks.test.ts`

**Coverage:**

- Before/after hooks
- Hook error handling
- Hook ordering
- Tenant context in hooks

---

## Integration Tests

### API Endpoint Tests

**Files:** `apps/api/src/trpc/routers/ai-providers.test.ts`

**Coverage:**

- Credential CRUD operations
- Model listing
- Connection testing
- Tenant isolation

**Example:**

```typescript
describe("aiProviderRouter", () => {
  it("should create credential with tenant scope", async () => {
    const result = await caller.createCredential({
      providerId: "openai",
      credentials: { apiKey: "test-key" },
    });
    expect(result.success).toBe(true);
  });

  it("should reject cross-tenant credential access", async () => {
    await expect(
      caller.getCredential({ providerId: "openai", tenantId: "other-tenant" }),
    ).rejects.toThrow("Unauthorized");
  });
});
```

---

### Database Integration Tests

**Files:** `packages/database/src/schema/tenant-config.test.ts`

**Coverage:**

- Schema validation
- Default values
- Constraint enforcement
- RLS policies

---

### Provider Failover Tests

**Files:** `packages/agent-runtime/src/core/failover.test.ts`

**Coverage:**

- Sequential failover
- Circuit breaker integration
- Retryable vs non-retryable errors
- Tenant context preservation

**Example:**

```typescript
test("failover with circuit breaker", async () => {
  const failover = new ProviderFailover();
  const execute = jest
    .fn()
    .mockRejectedValueOnce(new Error("Provider 1 failed"))
    .mockRejectedValueOnce(new Error("Provider 2 failed"))
    .mockResolvedValueOnce("Success from Provider 3");

  const result = await failover.executeWithFailover(
    ["provider1", "provider2", "provider3"],
    execute,
  );

  expect(result).toBe("Success from Provider 3");
  expect(execute).toHaveBeenCalledTimes(3);
});
```

---

### Tenant Isolation Tests

**Files:** `packages/agent-runtime/src/utils/tenant-context.test.ts`

**Coverage:**

- AsyncLocalStorage propagation
- Concurrent request isolation
- Context leakage prevention
- Performance overhead

**Example:**

```typescript
test("concurrent tenant isolation", async () => {
  const tenants = Array.from({ length: 10 }, (_, i) => `tenant-${i}`);
  const results = await Promise.all(
    tenants.map((tenantId) =>
      credentialManager.runWithTenantContext(tenantId, async () => {
        await sleep(random(10, 100));
        const currentTenant = credentialManager.getTenantId();
        expect(currentTenant).toBe(tenantId);
      }),
    ),
  );
});
```

---

## E2E Tests

### Provider Configuration Flow

**Files:** `apps/frontend/e2e/provider-configuration.spec.ts`

**Coverage:**

- Navigate to provider settings
- Enable/disable provider
- Configure credentials
- Test connection
- Save configuration

**Example:**

```typescript
test("provider configuration flow", async ({ page }) => {
  await page.goto("/settings/providers");

  // Enable provider
  await page.click('[data-provider="openai"] [data-enable-switch]');

  // Configure credentials
  await page.click('[data-provider="openai"] [data-configure]');
  await page.fill('[name="apiKey"]', "sk-test-key");
  await page.click('[type="submit"]');

  // Test connection
  await page.click("[data-test-connection]");
  await expect(page.locator("[data-success]")).toBeVisible();
});
```

---

### Model Management Flow

**Files:** `apps/frontend/e2e/model-management.spec.ts`

**Coverage:**

- View available models
- Enable/disable models
- Create custom model
- Sort models
- Filter by type

---

### Connection Testing Flow

**Files:** `apps/frontend/e2e/connection-testing.spec.ts`

**Coverage:**

- Select model for testing
- Initiate connection test
- View loading state
- Verify success/error display

---

### Budget Management Flow

**Files:** `apps/frontend/e2e/budget-management.spec.ts`

**Coverage:**

- Set monthly budget
- Configure alert threshold
- Toggle hard/soft limit
- View usage progress
- Reset budget

---

## Performance Tests

### Concurrent Tenant Isolation

**Files:** `packages/agent-runtime/src/perf/tenant-isolation.bench.ts`

**Target:** 10+ concurrent tenants, <1ms overhead

**Example:**

```typescript
bench("concurrent tenant isolation", async () => {
  const tenants = Array.from({ length: 10 }, (_, i) => `tenant-${i}`);
  await Promise.all(
    tenants.map((tenantId) =>
      credentialManager.runWithTenantContext(tenantId, async () => {
        await sleep(random(10, 100));
        assert.strictEqual(credentialManager.getTenantId(), tenantId);
      }),
    ),
  );
});
```

---

### Credential Caching Performance

**Files:** `packages/agent-runtime/src/perf/credential-caching.bench.ts`

**Target:** p95 latency <2s

---

### Model Discovery Latency

**Files:** `packages/agent-runtime/src/perf/model-discovery.bench.ts`

**Target:** p95 latency <500ms

---

### Failover Response Time

**Files:** `packages/agent-runtime/src/perf/failover-response.bench.ts`

**Target:** Circuit breaker activation <100ms

---

## Security Tests

### Encryption Verification

**Files:** `packages/agent-runtime/src/security/encryption.test.ts`

**Coverage:**

- AES-256-GCM encryption
- Key rotation
- Tampering detection
- Zero plaintext logging

---

### Tenant Boundary Tests

**Files:** `packages/agent-runtime/src/security/tenant-boundaries.test.ts`

**Coverage:**

- Cross-tenant access prevention
- RLS policy enforcement
- Cache key isolation
- Log sanitization

---

### Credential Leakage Prevention

**Files:** `packages/agent-runtime/src/security/credential-safety.test.ts`

**Coverage:**

- Zero credentials in logs
- Zero credentials in traces
- Zero credentials in error messages
- Masked credential display

---

### PII Safety in Logs/Traces

**Files:** `packages/observability/src/security/pii-safety.test.ts`

**Coverage:**

- Log sanitization
- Trace redaction
- Error message filtering

---

## Coverage Thresholds

| Scope                                         | Threshold |
| --------------------------------------------- | --------- |
| **Overall**                                   | 70%       |
| **Business logic**                            | 85%       |
| **Critical (auth, tenant isolation, agents)** | 90%       |
| **UI components**                             | 70%       |

---

## Test Commands

```bash
# Unit tests (Vitest workspace)
pnpm run test:unit

# Unit tests with coverage
pnpm run test:coverage

# Integration tests
pnpm run test:integration

# E2E tests (Playwright)
pnpm run test:e2e

# Performance benchmarks
pnpm run test:bench

# Security tests
pnpm run test:security
```

---

## CI Integration

### Automated Scans

```bash
# Scan for hardcoded provider references
rg '"(openai|anthropic|google|bedrock)"' --type ts \
  --glob '!*.test.ts' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**'
```

### AST Scan for Error Consistency

```bash
# Verify all errors use canonical types
pnpm run verify:error-codes
```

---

## Next Steps

→ Review [deployment-strategy.md](./deployment-strategy.md) for deployment procedures
