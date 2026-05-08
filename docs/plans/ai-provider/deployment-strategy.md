# Deployment Strategy

**Part of:** AI Provider Implementation Plan  
**See also:** [README.md](./README.md), [testing-strategy.md](./testing-strategy.md)

---

## Deployment Philosophy

**Greenfield approach:** Destructive updates allowed, no migrations required. Each phase deploys independently with feature flags for rollback capability.

---

## Phase 1 Deployment

### Pre-Deployment Checklist

- [ ] All Phase 1 tests passing (85%+ coverage)
- [ ] Security review completed
- [ ] Zero critical bugs
- [ ] Performance benchmarks met

### Deployment Steps

1. **Deploy provider registration system**

   ```bash
   # Push agent-runtime changes
   pnpm --filter @agenticverdict/agent-runtime build
   pnpm run deploy:api
   ```

2. **Deploy tenant AI config schema**

   ```bash
   # Push schema (destructive, greenfield)
   pnpm --filter @agenticverdict/database db:push
   pnpm run deploy:api
   ```

3. **Deploy provider failover**

   ```bash
   # Already included in agent-runtime build
   pnpm run deploy:api
   ```

4. **Verify tenant isolation under load**
   ```bash
   # Run performance benchmarks
   pnpm run test:bench:tenant-isolation
   ```

### Verification

```bash
# Health check
curl http://localhost:3000/api/health

# Verify providers registered
curl http://localhost:3000/api/health/adapters

# Run tenant isolation test
pnpm run test:integration:tenant-isolation
```

### Rollback Plan

```bash
# Revert agent-runtime
git revert HEAD~3..HEAD
pnpm --filter @agenticverdict/agent-runtime build
pnpm run deploy:api

# Revert database schema (destructive)
pnpm --filter @agenticverdict/database db:push --force
```

---

## Phase 2 Deployment

### Pre-Deployment Checklist

- [ ] All Phase 2 tests passing
- [ ] 7+ providers configurable
- [ ] Performance benchmarks met (p95 <2s)
- [ ] Zero high-priority bugs

### Deployment Steps

1. **Deploy credential management API**

   ```bash
   pnpm --filter @agenticverdict/api build
   pnpm run deploy:api
   ```

2. **Deploy provider selection UI**

   ```bash
   pnpm --filter @agenticverdict/frontend build
   pnpm run deploy:frontend
   ```

3. **Deploy model management UI**

   ```bash
   # Already included in frontend build
   pnpm run deploy:frontend
   ```

4. **Deploy budget management UI**
   ```bash
   # Already included in frontend build
   pnpm run deploy:frontend
   ```

### Verification

```bash
# Test credential endpoints
curl -X POST http://localhost:3000/api/trpc/aiProvider.createCredential \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"providerId":"openai","credentials":{"apiKey":"test"}}'

# E2E smoke test
pnpm run test:e2e:frontend:smoke
```

### Rollback Plan

```bash
# Revert frontend
git revert HEAD~5..HEAD
pnpm --filter @agenticverdict/frontend build
pnpm run deploy:frontend

# Revert API if needed
git revert HEAD~1
pnpm --filter @agenticverdict/api build
pnpm run deploy:api
```

---

## Phase 3 Deployment

### Pre-Deployment Checklist

- [ ] All specialized agents integrated
- [ ] Zero hardcoded provider references (AST scan passed)
- [ ] Feature flag tested
- [ ] Performance metrics met

### Deployment Steps

1. **Enable provider system via feature flag (10% traffic)**

   ```bash
   # Set feature flag
   kubectl set env deployment/api USE_PROVIDER_SYSTEM=true
   kubectl set env deployment/api FEATURE_FLAG_TRAFFIC=10
   ```

2. **Monitor error rates and performance**

   ```bash
   # Watch metrics
   kubectl logs -f deployment/api | grep -E "(error|failover|latency)"

   # Check Grafana dashboard
   open https://grafana.example.com/d/provider-system
   ```

3. **Increase to 50% traffic**

   ```bash
   kubectl set env deployment/api FEATURE_FLAG_TRAFFIC=50
   ```

4. **Enable 100% traffic after validation**
   ```bash
   kubectl set env deployment/api FEATURE_FLAG_TRAFFIC=100
   ```

### Verification

```bash
# AST scan for hardcoded providers
rg '"(openai|anthropic|google|bedrock)"' --type ts \
  --glob '!*.test.ts' \
  --glob '!**/node_modules/**' \
  --glob '!**/dist/**'

# Verify agent integration
pnpm run test:integration:agents
```

### Rollback Plan

```bash
# Disable feature flag
kubectl set env deployment/api USE_PROVIDER_SYSTEM=false

# Or reduce traffic
kubectl set env deployment/api FEATURE_FLAG_TRAFFIC=0
```

---

## Phase 4 Deployment

### Pre-Deployment Checklist

- [ ] All advanced features functional
- [ ] 10+ providers supported
- [ ] Tenant isolation test suite passed
- [ ] Production-ready documentation

### Deployment Steps

1. **Deploy cost tracking dashboard**

   ```bash
   pnpm --filter @agenticverdict/frontend build
   pnpm run deploy:frontend
   ```

2. **Deploy error monitoring dashboard**

   ```bash
   # Already included in frontend build
   pnpm run deploy:frontend
   ```

3. **Deploy provider health monitoring**

   ```bash
   pnpm --filter @agenticverdict/api build
   pnpm run deploy:api
   ```

4. **Enable all advanced features**
   ```bash
   kubectl set env deployment/api ENABLE_ADVANCED_FEATURES=true
   ```

### Verification

```bash
# Test monitoring endpoints
curl http://localhost:3000/api/monitoring/health

# Test cost tracking
curl http://localhost:3000/api/trpc/billing.getUsage \
  -H "Authorization: Bearer <token>"

# E2E verification
pnpm run test:e2e
```

### Rollback Plan

```bash
# Disable advanced features
kubectl set env deployment/api ENABLE_ADVANCED_FEATURES=false

# Revert if needed
git revert HEAD~4..HEAD
pnpm --filter @agenticverdict/frontend build
pnpm run deploy:frontend
```

---

## Environment Configuration

### Production Environment Variables

```bash
# .env.production

# Feature flags
USE_PROVIDER_SYSTEM=true
FEATURE_FLAG_TRAFFIC=100
ENABLE_ADVANCED_FEATURES=true

# Provider configuration
DEFAULT_AI_PROVIDER=openai
DEFAULT_AI_MODEL=gpt-4o
FALLBACK_AI_PROVIDER=anthropic
FALLBACK_AI_MODEL=claude-3-5-sonnet

# Security
ENCRYPTION_KEY=<generated-secret>
TENANT_ISOLATION Enforcement=strict

# Monitoring
ENABLE_COST_TRACKING=true
ENABLE_ERROR_MONITORING=true
ENABLE_AUDIT_LOGGING=true
```

### Staging Environment Variables

```bash
# .env.staging

# Feature flags (gradual rollout)
USE_PROVIDER_SYSTEM=true
FEATURE_FLAG_TRAFFIC=10
ENABLE_ADVANCED_FEATURES=false

# Testing
AGENTICVERDICT_MOCK_MODE=partial
AGENTICVERDICT_MOCK_SEED=42001
```

---

## Monitoring & Observability

### Key Metrics

| Metric                        | Alert Threshold | Dashboard                |
| ----------------------------- | --------------- | ------------------------ |
| **Error rate**                | >1%             | Grafana: Provider System |
| **p95 latency**               | >2s             | Grafana: Performance     |
| **Tenant isolation failures** | >0              | Grafana: Security        |
| **Failover activations**      | >10/hour        | Grafana: Reliability     |
| **Circuit breaker trips**     | >5/hour         | Grafana: Reliability     |

### Alerting Rules

```yaml
# prometheus/alerts.yml
groups:
  - name: provider-system
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.01
        for: 5m
        labels:
          severity: critical
        annotations:
          summary: "Provider system error rate >1%"

      - alert: TenantIsolationFailure
        expr: tenant_isolation_failures_total > 0
        for: 0m
        labels:
          severity: critical
        annotations:
          summary: "Tenant isolation failure detected"

      - alert: HighFailoverRate
        expr: rate(provider_failover_total[1h]) > 10
        for: 10m
        labels:
          severity: warning
        annotations:
          summary: "High provider failover rate"
```

---

## Post-Deployment Verification

### Immediate Checks (First 15 minutes)

- [ ] Health endpoints responding
- [ ] No error spikes in logs
- [ ] Tenant isolation tests passing
- [ ] Provider registration verified

### Short-Term Checks (First 24 hours)

- [ ] Error rate <1%
- [ ] p95 latency <2s
- [ ] Zero tenant isolation failures
- [ ] Failover working as expected

### Long-Term Checks (First week)

- [ ] Cost tracking accurate
- [ ] Error monitoring functional
- [ ] Audit logs complete
- [ ] Provider health stable

---

## Next Steps

→ Review [risk-mitigation.md](./risk-mitigation.md) for risk management strategies
