# AI Provider Validation Checklist

**Document Type:** Validation Checklist  
**Part of:** AI Provider Audit (`/prompts/ai-provider-audit.md`)  
**Date:** 2026-05-05  
**Version:** 1.0

---

## How to Use This Checklist

This checklist provides executable validation steps for each acceptance criterion in the AI provider migration plan. Run these checks after each phase to verify completion.

### Legend

- ✅ Pass
- ❌ Fail
- ⚠️ Partial pass
- 🔄 Not yet tested

---

## Phase 1 Gate Validation

### Core Interfaces & Type Safety

#### ✅ Check 1.1: Provider Factory Interface

**Command:**

```bash
# Verify ProviderFactory exports and type safety
cd packages/agent-runtime
pnpm run typecheck
```

**Expected Output:**

```
✓ No type errors in ProviderFactory.ts
✓ No type errors in ProviderRegistry.ts
✓ No type errors in BaseProvider.ts
```

**Manual Verification:**

- [ ] ProviderFactory.register() accepts provider class
- [ ] ProviderFactory.create() returns ProviderRuntime interface
- [ ] Type errors prevent invalid provider registration

**Result:** ⬜

---

#### ✅ Check 1.2: Provider Registry Pattern

**Command:**

```bash
# Check provider registration
node -e "
const { ProviderFactory } = require('./packages/agent-runtime/dist');
const providers = ProviderFactory.listProviders();
console.log('Registered providers:', providers);
console.log('Count:', providers.length);
"
```

**Expected Output:**

```
Registered providers: ['openai', 'anthropic', 'google', 'bedrock', 'openai-compatible']
Count: 5
```

**Result:** ⬜

---

### Error System Integration

#### ✅ Check 1.3: Canonical Error Types

**Command:**

```bash
# Scan for non-canonical error handling
rg "throw new Error\(" packages/agent-runtime/src \
  --type ts \
  --glob '!*.test.ts' \
  --glob '!*.spec.ts'
```

**Expected Output:**

```
No matches found
```

**Manual Verification:**

- [ ] All errors use AgentRuntimeError class
- [ ] Error codes from AgentRuntimeErrorCode enum
- [ ] Tenant ID included in error metadata

**Result:** ⬜

---

#### ✅ Check 1.4: Error Translation

**Command:**

```bash
# Verify error to fault mapping
cd packages/agent-runtime
pnpm run test -- errors/core-integration.test.ts
```

**Expected Output:**

```
✓ AgentRuntimeError maps to AppFault
✓ HTTP status codes assigned correctly
✓ Retryability flags set correctly
✓ i18n message keys defined
```

**Result:** ⬜

---

### Tenant Credential Isolation

#### ✅ Check 1.5: Credential Encryption

**Command:**

```bash
# Test credential encryption
cd packages/agent-runtime
pnpm run test -- credentials.test.ts
```

**Expected Output:**

```
✓ Credentials encrypted with AES-256-GCM
✓ IV and salt generated per encryption
✓ Auth tag verified on decryption
✓ Same credential produces different ciphertext
```

**Manual Verification:**

```sql
-- Check database storage
SELECT tenantId, platform, encryptedPayload
FROM platformCredentials
WHERE tenantId = 'test-tenant-1';

-- Verify payload is encrypted (not plaintext API key)
-- Expected: encryptedPayload looks like base64-encoded ciphertext
```

**Result:** ⬜

---

#### ✅ Check 1.6: Tenant Context Propagation

**Command:**

```bash
# Concurrent tenant isolation test
cd packages/agent-runtime
pnpm run test -- tenant-context.test.ts
```

**Test Code:**

```typescript
test("concurrent tenant isolation", async () => {
  const tenants = Array.from({ length: 10 }, (_, i) => `tenant-${i}`);
  const results = await Promise.all(
    tenants.map((tenantId) =>
      credentialManager.runWithTenantContext(tenantId, async () => {
        await sleep(random(10, 100));
        const currentTenant = credentialManager.getTenantId();
        expect(currentTenant).toBe(tenantId);
        return currentTenant;
      }),
    ),
  );

  // Verify all tenants got correct context
  expect(results).toEqual([
    "tenant-0",
    "tenant-1",
    "tenant-2",
    "tenant-3",
    "tenant-4",
    "tenant-5",
    "tenant-6",
    "tenant-7",
    "tenant-8",
    "tenant-9",
  ]);
});
```

**Expected Output:**

```
✓ Tenant context isolated under concurrent load
✓ Zero cross-tenant context leakage
✓ AsyncLocalStorage overhead <1ms
```

**Result:** ⬜

---

### OpenAI Provider Functionality

#### ✅ Check 1.7: OpenAI Provider Chat

**Command:**

```bash
# Test OpenAI provider
cd packages/agent-runtime
AGENTICVERDICT_OPENAI_API_KEY=sk-test-key pnpm run test -- providers/openai/index.test.ts
```

**Expected Output:**

```
✓ OpenAIProvider.chat() sends correct request
✓ Response parsed correctly
✓ Token usage extracted
✓ Error handling for rate limits
✓ Error handling for authentication failures
```

**Result:** ⬜

---

#### ✅ Check 1.8: OpenAI Provider Model Discovery

**Command:**

```bash
# Test model listing
cd packages/agent-runtime
AGENTICVERDICT_OPENAI_API_KEY=sk-test-key pnpm run test -- providers/openai/models.test.ts
```

**Expected Output:**

```
✓ listModels() returns model array
✓ Models normalized with capabilities
✓ Context window tokens included
✓ Abilities detected (vision, functionCall, etc.)
```

**Result:** ⬜

---

### Test Coverage

#### ✅ Check 1.9: Coverage Thresholds

**Command:**

```bash
cd packages/agent-runtime
pnpm run test:coverage
```

**Expected Output:**

```
----------------------|---------|----------|---------|---------|-------------------
File                  | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s
----------------------|---------|----------|---------|---------|-------------------
All files             |   87.42 |    82.15 |   89.67 |   88.01 |
 core/                |   92.31 |    88.46 |   94.12 |   93.05 |
  ProviderFactory.ts  |     100 |      100 |     100 |     100 |
  ProviderRegistry.ts |     100 |      100 |     100 |     100 |
  BaseProvider.ts     |   88.46 |    85.71 |    90.9 |   89.36 | 45-52
 errors/              |   95.65 |      100 |   91.67 |   95.65 |
  AgentRuntimeError.ts|   95.65 |      100 |   91.67 |   95.65 | 78
 utils/               |   84.21 |    78.95 |   86.67 |   85.33 |
  credentials.ts      |   86.49 |    81.25 |   88.89 |   87.67 | 134-142, 198
  tenant-context.ts   |   78.95 |    71.43 |      80 |      80 | 23-28
 providers/openai/    |   89.47 |    84.62 |   92.31 |   90.24 |
  index.ts            |   89.47 |    84.62 |   92.31 |   90.24 | 67-72, 89
----------------------|---------|----------|---------|---------|-------------------

✓ Overall coverage: 87.42% (threshold: 85%)
✓ Business logic coverage: 89.67% (threshold: 85%)
✓ Critical paths coverage: 92.31% (threshold: 90%)
```

**Result:** ⬜

---

### Security Audit

#### ✅ Check 1.10: Security Scan

**Command:**

```bash
# Run security audit
pnpm audit
npm audit

# Check for hardcoded credentials
rg "sk-[a-zA-Z0-9]{20,}" packages/ --type ts --glob '!*.test.ts'
rg "api[_-]?key.*=.*['\"]" packages/ --type ts --glob '!*.test.ts'

# Check for credential logging
rg "console\.log.*credential|api.*key" packages/ --type ts --glob '!*.test.ts'
```

**Expected Output:**

```
✓ No hardcoded credentials found
✓ No credential logging detected
✓ No critical security vulnerabilities
```

**Manual Verification:**

- [ ] Encryption key from environment variable only
- [ ] Credentials never logged
- [ ] TLS required for all API calls
- [ ] Rate limiting implemented

**Result:** ⬜

---

#### ✅ Check 1.11: AsyncLocalStorage Context Propagation

**Command:**

```bash
# Verify AsyncLocalStorage usage
cd packages/agent-runtime
rg "AsyncLocalStorage" src/ --type ts
```

**Expected Output:**

```
src/utils/credentials.ts: AsyncLocalStorage<CredentialManagerContext>
src/utils/tenant-context.ts: export const tenantContext = new AsyncLocalStorage<TenantContext>()
```

**Manual Verification:**

- [ ] AsyncLocalStorage used for tenant context
- [ ] Context set before database calls
- [ ] Context propagated to hooks
- [ ] Context included in error metadata

**Result:** ⬜

---

## Phase 2 Gate Validation

### Provider Expansion

#### ✅ Check 2.1: Provider Count

**Command:**

```bash
# Count registered providers
node -e "
const { ProviderFactory } = require('./packages/agent-runtime/dist');
const providers = ProviderFactory.listProviders();
console.log('Provider count:', providers.length);
console.log('Providers:', providers.join(', '));
"
```

**Expected Output:**

```
Provider count: 7+
Providers: openai, anthropic, google, bedrock, openai-compatible, [additional providers]
```

**Result:** ⬜

---

#### ✅ Check 2.2: Lifecycle Hooks

**Command:**

```bash
# Test billing hook
cd packages/agent-runtime
pnpm run test -- hooks/billing.test.ts

# Test tracing hooks
pnpm run test -- hooks/langsmith.test.ts
pnpm run test -- hooks/langfuse.test.ts
```

**Expected Output:**

```
✓ Billing hook tracks token usage
✓ Billing hook calculates cost
✓ Billing hook enforces budget limits
✓ LangSmith hook creates traces
✓ Langfuse hook creates traces
✓ Traces include tenant metadata
```

**Result:** ⬜

---

#### ✅ Check 2.3: Configuration-Driven Provider Selection

**Command:**

```bash
# Verify provider selection from config
cd packages/agent-runtime
pnpm run test -- agent-factory.test.ts
```

**Expected Output:**

```
✓ Provider selected from tenant config
✓ Model selected based on role
✓ Fallback providers configured
✓ No hardcoded provider IDs
```

**Result:** ⬜

---

### Performance Benchmarks

#### ✅ Check 2.4: p95 Latency

**Command:**

```bash
# Run performance benchmark
cd packages/agent-runtime
pnpm run benchmark -- provider-latency
```

**Expected Output:**

```
Provider Latency Benchmarks:
---------------------------
p50:  245ms
p75:  456ms
p90:  789ms
p95:  1.2s  ✓ (threshold: <2s)
p99:  1.8s

✓ p95 latency meets threshold (<2s)
```

**Result:** ⬜

---

### Monitoring Dashboard

#### ✅ Check 2.5: Dashboard Functional

**Manual Verification:**

- [ ] Navigate to `/settings/monitoring`
- [ ] Provider health metrics visible
- [ ] Error rates displayed
- [ ] Latency trends shown
- [ ] Alerts configured

**Command:**

```bash
# Verify monitoring API endpoint
curl -X GET http://localhost:3000/api/health/adapters | jq
```

**Expected Output:**

```json
{
  "providers": {
    "openai": { "status": "healthy", "latency": 245 },
    "anthropic": { "status": "healthy", "latency": 312 },
    "google": { "status": "healthy", "latency": 189 }
  },
  "alerts": []
}
```

**Result:** ⬜

---

## Phase 3 Gate Validation

### Specialized Agents Migration

#### ✅ Check 3.1: Agent Factory Uses Provider Factory

**Command:**

```bash
# Scan for hardcoded providers in agent-factory
rg "providerId:\s*['\"](openai|anthropic)['\"]" packages/agent-runtime/src/agent-factory.ts
```

**Expected Output:**

```
No matches found
```

**Manual Verification:**

- [ ] Agent factory uses tenant config
- [ ] Provider selection dynamic
- [ ] Model selection based on role

**Result:** ⬜

---

#### ✅ Check 3.2: Zero Hardcoded API Keys

**Command:**

```bash
# Scan for hardcoded API keys
rg "apiKey.*=.*['\"]sk-[a-zA-Z0-9]" packages/ --type ts --glob '!*.test.ts'
rg "ANTHROPIC_API_KEY.*=.*['\"]" packages/ --type ts --glob '!*.test.ts'
rg "GOOGLE_API_KEY.*=.*['\"]" packages/ --type ts --glob '!*.test.ts'
```

**Expected Output:**

```
No matches found
```

**Result:** ⬜

---

#### ✅ Check 3.3: Legacy Code Removal

**Command:**

```bash
# AST scan for legacy provider references
rg "import.*from.*['\"].*legacy.*provider" packages/ --type ts
rg "LegacyProvider" packages/ --type ts
rg "OldProvider" packages/ --type ts
```

**Expected Output:**

```
No matches found
```

**Result:** ⬜

---

### Provider Failover

#### ✅ Check 3.4: Failover Tested

**Command:**

```bash
# Test failover
cd packages/agent-runtime
pnpm run test -- core/failover.test.ts
```

**Expected Output:**

```
✓ Failover executes on provider failure
✓ Sequential failover working
✓ Circuit breaker triggers correctly
✓ Tenant context preserved during failover
```

**Result:** ⬜

---

#### ✅ Check 3.5: Gradual Cutover

**Manual Verification:**

- [ ] Feature flag exists
- [ ] Traffic split configurable
- [ ] Monitoring shows both systems
- [ ] Rollback tested

**Command:**

```bash
# Verify feature flag
curl -X GET http://localhost:3000/api/health | jq '.features.providerMigration'
```

**Expected Output:**

```json
{
  "providerMigration": {
    "enabled": true,
    "trafficPercent": 100
  }
}
```

**Result:** ⬜

---

## Phase 4 Gate Validation

### Model Discovery

#### ✅ Check 4.1: Dynamic Model Discovery

**Command:**

```bash
# Test model discovery API
curl -X POST http://localhost:3000/api/trpc/aiProvider.listModels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"providerId": "openai"}' | jq
```

**Expected Output:**

```json
{
  "models": [
    { "id": "gpt-4o", "name": "GPT-4o", "contextWindow": 128000 },
    { "id": "gpt-4-turbo", "name": "GPT-4 Turbo", "contextWindow": 128000 }
  ]
}
```

**Result:** ⬜

---

### Health Monitoring

#### ✅ Check 4.2: Health Dashboard Operational

**Manual Verification:**

- [ ] Navigate to `/settings/monitoring/health`
- [ ] All providers listed
- [ ] Health status shown (green/yellow/red)
- [ ] Latency metrics displayed
- [ ] Error rates visible

**Result:** ⬜

---

### Rate Limiting

#### ✅ Check 4.3: Rate Limiting Enforced

**Command:**

```bash
# Test rate limiting
cd packages/agent-runtime
pnpm run test -- core/rate-limiter.test.ts
```

**Expected Output:**

```
✓ Rate limiter configured per tenant
✓ Requests blocked when limit exceeded
✓ Rate limit headers returned
✓ Tenant context in rate limit errors
```

**Result:** ⬜

---

### Cost Optimization

#### ✅ Check 4.4: Cost Recommendations

**Manual Verification:**

- [ ] Navigate to `/settings/billing/cost-analysis`
- [ ] Cost breakdown by provider
- [ ] Optimization suggestions shown
- [ ] Alternative models recommended

**Result:** ⬜

---

### Tenant Isolation

#### ✅ Check 4.5: Tenant Isolation Test Suite

**Command:**

```bash
# Run tenant isolation test suite
cd packages/agent-runtime
pnpm run test:tenant-isolation
```

**Expected Output:**

```
✓ Credential isolation verified
✓ Cache key scoping verified
✓ Database RLS verified
✓ Error context propagation verified
✓ Concurrent request isolation verified
```

**Result:** ⬜

---

## Success Metrics Validation

### Provider Addition Time

#### ✅ Metric 1: <4 Hours

**Test:**

1. Start timer
2. Add new provider (e.g., Mistral) following documentation
3. Register provider
4. Add provider card to UI
5. Test connection
6. Stop timer

**Expected:** <4 hours  
**Actual:** ⬜ hours  
**Result:** ⬜

---

### Error Consistency

#### ✅ Metric 2: 100% Canonical Types

**Command:**

```bash
# AST scan for non-canonical error handling
rg "throw new Error\(" packages/ --type ts --glob '!*.test.ts' --glob '!*.spec.ts' | wc -l
```

**Expected:** 0  
**Actual:** ⬜  
**Result:** ⬜

---

### Tenant Isolation

#### ✅ Metric 3: Complete

**Command:**

```bash
# Run comprehensive tenant isolation tests
pnpm run test:tenant-isolation:all
```

**Expected Output:**

```
✓ All tenant isolation tests passed
✓ Zero cross-tenant data leakage
```

**Result:** ⬜

---

### Test Coverage

#### ✅ Metric 4: Coverage Thresholds

**Command:**

```bash
pnpm run test:coverage
```

**Expected:**

- Overall: ≥70%
- Business logic: ≥85%
- Critical paths: ≥90%

**Actual:**

- Overall: ⬜%
- Business logic: ⬜%
- Critical: ⬜%

**Result:** ⬜

---

### Supported Providers

#### ✅ Metric 5: 10+ Providers

**Command:**

```bash
node -e "
const { ProviderFactory } = require('./packages/agent-runtime/dist');
const providers = ProviderFactory.listProviders();
console.log('Provider count:', providers.length);
"
```

**Expected:** ≥10  
**Actual:** ⬜  
**Result:** ⬜

---

### Legacy Code Removal

#### ✅ Metric 6: 100%

**Command:**

```bash
# AST scan for hardcoded provider references
rg "providerId:\s*['\"](openai|anthropic)['\"]" packages/ --type ts --glob '!*.test.ts' | wc -l
```

**Expected:** 0  
**Actual:** ⬜  
**Result:** ⬜

---

## Sign-Off

### Phase 1 Gate

- [ ] All Phase 1 checks passed
- [ ] Security audit completed
- [ ] Test coverage thresholds met
- [ ] Zero critical bugs

**Signed by:** **\*\***\_\_\_\_**\*\***  
**Date:** **\*\***\_\_\_\_**\*\***

---

### Phase 2 Gate

- [ ] All Phase 2 checks passed
- [ ] Performance benchmarks met
- [ ] Monitoring dashboard functional
- [ ] Zero high-priority bugs

**Signed by:** **\*\***\_\_\_\_**\*\***  
**Date:** **\*\***\_\_\_\_**\*\***

---

### Phase 3 Gate

- [ ] All Phase 3 checks passed
- [ ] 100% traffic on new system
- [ ] Zero legacy code references
- [ ] All tests passing

**Signed by:** **\*\***\_\_\_\_**\*\***  
**Date:** **\*\***\_\_\_\_**\*\***

---

### Phase 4 Gate

- [ ] All Phase 4 checks passed
- [ ] All advanced features functional
- [ ] 10+ providers supported
- [ ] Production-ready documentation

**Signed by:** **\*\***\_\_\_\_**\*\***  
**Date:** **\*\***\_\_\_\_**\*\***

---

**Document Version:** 1.0  
**Status:** Draft for review  
**Next Review:** After Phase 1 completion
