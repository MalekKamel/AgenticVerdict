# Phase 3: Agent Integration

**Duration:** 2 weeks  
**Effort:** 12 person-days  
**Dependencies:** Phase 2 complete

---

## Goal

Integrate all specialized agents with the provider architecture and enforce zero hardcoded provider references.

---

## Tasks

### Task 3.1: Integrate Specialized Marketing Agents

**Priority:** 🔴 Critical  
**Effort:** 3 days  
**Dependencies:** Phase 2 complete  
**Files:** `packages/agent-runtime/src/specialized-marketing-agents.ts`

**Acceptance Criteria:**

- [ ] Cross-platform analysis agent uses tenant config
- [ ] Insight generation agent uses tenant config
- [ ] Media verdict agent uses tenant config
- [ ] All agent tests passing

**Implementation:**

```typescript
// Remove hardcoded provider selection
const agent = new ProviderAgent({
  factoryConfig: {
    providerId: tenantConfig.ai.getProviderForRole(role),
    modelId: tenantConfig.ai.getModelForRole(role),
    // ...
  },
});
```

**Testing:**

- Agent integration tests
- End-to-end workflow tests

---

### Task 3.2: AST Scan for Hardcoded Provider References

**Priority:** 🔴 Critical  
**Effort:** 2 days  
**Dependencies:** Task 3.1  
**Files:** Scripts for scanning

**Acceptance Criteria:**

- [ ] Zero hardcoded provider IDs in production code
- [ ] Scan script added to CI pipeline
- [ ] Exceptions documented (test files, examples)

**Scan Script:**

```bash
# Scan for hardcoded provider references
rg '"(openai|anthropic|google|bedrock)"' --type ts \
  --glob '!*.test.ts' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**'
```

**Testing:**

- Manual code review
- Automated scan in CI

---

### Task 3.3: Enforce Zero Hardcoded Providers

**Priority:** 🟡 High  
**Effort:** 2 days  
**Dependencies:** Task 3.2  
**Files:** Various

**Acceptance Criteria:**

- [ ] Zero hardcoded provider initialization in production code
- [ ] All configuration loaded from tenant config or registry
- [ ] All tests passing

**Testing:**

- Full test suite
- Integration tests

---

### Task 3.4: Feature Flag for Provider System

**Priority:** 🟡 High  
**Effort:** 3 days  
**Dependencies:** Task 3.1  
**Files:** `packages/agent-runtime/src/agent-factory.ts`

**Acceptance Criteria:**

- [ ] Feature flag for provider system configuration
- [ ] Monitoring for error rates
- [ ] Configuration documented

**Implementation:**

```typescript
const useProviderSystem = process.env.USE_PROVIDER_SYSTEM === "true";

if (useProviderSystem) {
  return createAgentWithProviderSystem(config);
} else {
  return createAgentWithDefaultConfig(config);
}
```

**Testing:**

- Feature flag tests
- Rollback tests

---

### Task 3.5: Provider Failover Testing

**Priority:** 🟡 High  
**Effort:** 2 days  
**Dependencies:** Task 3.4  
**Files:** `packages/agent-runtime/src/core/failover.ts`

**Acceptance Criteria:**

- [ ] Failover tested with mock provider failures
- [ ] Circuit breaker triggers correctly
- [ ] Tenant context preserved during failover

**Testing:**

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

## Phase 3 Deliverables

- [ ] All specialized agents integrated
- [ ] Zero hardcoded provider references
- [ ] Feature flag working
- [ ] Failover tested

---

## Phase 3 Exit Criteria

- [ ] 100% traffic on provider system
- [ ] Zero hardcoded provider references
- [ ] All tests passing
- [ ] Performance metrics met

---

## Next Phase

→ Proceed to [Phase 4: Advanced Features](./04-phase-4-advanced-features.md)
