# Local Testing Guide

**Document Version:** 1.0
**Date:** 2026-04-07
**Status:** Active
**Test Environment:** Local Development

---

## Executive Summary

This guide provides comprehensive instructions for running all tests locally using Vitest. Following the Docker testing removal (2026-04-07), all tests now execute locally without Docker containers, providing faster feedback and simpler setup.

### Current Test Status: ✅ ALL PASSING

| Test Suite          | Tests   | Duration | Status             |
| ------------------- | ------- | -------- | ------------------ |
| **Unit Tests**      | 707     | ~30s     | ✅ Passing         |
| **Production Flow** | 20      | ~6s      | ✅ Passing         |
| **Total**           | **727** | **~36s** | ✅ **All Passing** |

---

## Quick Start

### Run All Tests

```bash
# Run all unit tests
pnpm run test

# Run production flow scenarios
pnpm run test:production-flow
```

### Run Specific Tests

```bash
# Run specific test file
pnpm exec vitest run tests/orchestrator/scenarios/production-flow-scenarios.test.ts

# Run specific scenario by name
pnpm exec vitest run tests/orchestrator -t "R01"

# Run worker tests
pnpm --filter @agenticverdict/worker test --run
```

### Live LLM Validation

```bash
# Requires GLM API credentials
SCENARIO_VERBOSE_LLM=1 AGENT_RUNTIME_LIVE_LLM=1 \
GLM_API_KEY="your-key" GLM_API_BASE_URL="https://api.z.ai/api/anthropic" \
GLM_MODEL="glm-4.7" \
node scripts/live-llm-verdict.mjs
```

---

## Test Suite Overview

### 1. Production Flow Scenarios (R01-R12)

**Location:** `tests/orchestrator/scenarios/`

| Scenario | Description                  | Test File                                    |
| -------- | ---------------------------- | -------------------------------------------- |
| R01      | PDF EN/LTR Report Generation | `production-flow-scenarios.test.ts`          |
| R02      | PDF AR/RTL Report Generation | `production-flow-scenarios.test.ts`          |
| R03      | DOCX Format Generation       | `production-flow-scenarios-extended.test.ts` |
| R04      | XLSX Format Generation       | `production-flow-scenarios-extended.test.ts` |
| R05      | Phase 2 Report Model Merge   | `production-flow-scenarios-extended.test.ts` |
| R06      | Mock Chat Model Invocation   | `production-flow-scenarios-extended.test.ts` |
| R07      | Tenant Isolation Validation  | `production-flow-scenarios-extended.test.ts` |
| R08      | Template Rendering           | `production-flow-scenarios-extended.test.ts` |
| R09      | Email Delivery (Mock)        | `production-flow-scenarios-extended.test.ts` |
| R10      | Scheduled Report Enqueue     | `production-flow-scenarios-extended.test.ts` |
| R11      | System Health Checks         | `production-flow-scenarios-extended.test.ts` |
| R12      | Prerequisites Validation     | `production-flow-scenarios-extended.test.ts` |

**Execution:**

```bash
pnpm run test:production-flow
```

### 2. Unit Tests

**Coverage:** All packages and apps

| Category         | Location                    | Command                                     |
| ---------------- | --------------------------- | ------------------------------------------- |
| Core packages    | `packages/*/src/*.test.ts`  | `pnpm run test`                             |
| API tests        | `apps/api/src/*.test.ts`    | `pnpm --filter @agenticverdict/api test`    |
| Worker tests     | `apps/worker/src/*.test.ts` | `pnpm --filter @agenticverdict/worker test` |
| Shared utilities | `tests/utils/*.test.ts`     | `pnpm run test:unit`                        |

**Execution:**

```bash
# All unit tests
pnpm run test

# With coverage
pnpm run test:coverage
```

### 3. Live LLM Validation

**Script:** `scripts/live-llm-verdict.mjs`

**Purpose:** End-to-end validation of the marketing pipeline with live LLM

**Prerequisites:**

- GLM API credentials
- Network connectivity to GLM API

**Execution:**

```bash
SCENARIO_VERBOSE_LLM=1 AGENT_RUNTIME_LIVE_LLM=1 \
GLM_API_KEY="your-key" \
GLM_API_BASE_URL="https://api.z.ai/api/anthropic" \
node scripts/live-llm-verdict.mjs
```

---

## Scenario Reference

### R01: PDF EN/LTR (Report Generation)

**Purpose:** Validate PDF generation for English content with LTR layout

**Validates:**

- PDF structure (%PDF header, reasonable size)
- English text rendering
- LTR layout correctness

**Run:**

```bash
pnpm exec vitest run -t "R01"
```

### R02: PDF AR/RTL (Report Generation)

**Purpose:** Validate PDF generation for Arabic content with RTL layout

**Validates:**

- PDF structure
- Arabic text rendering
- RTL layout correctness

**Run:**

```bash
pnpm exec vitest run -t "R02"
```

### R03: DOCX Format Generation

**Purpose:** Validate DOCX output format

**Validates:**

- OOXML package structure
- Required parts ([Content_Types].xml, \_rels/.rels, word/document.xml)
- Content presence

**Run:**

```bash
pnpm exec vitest run -t "R03"
```

### R04: XLSX Format Generation

**Purpose:** Validate Excel output format

**Validates:**

- XLSX structure (ZIP format)
- Worksheet presence
- Cell values

**Run:**

```bash
pnpm exec vitest run -t "R04"
```

### R05-R12: Extended Scenarios

**Purpose:** Validate various system components

| Scenario | Component                          |
| -------- | ---------------------------------- |
| R05      | Phase 2 report model integration   |
| R06      | Mock LLM chat model                |
| R07      | Tenant-scoped cache keys           |
| R08      | Template engine rendering          |
| R09      | Report delivery (email mock)       |
| R10      | Scheduled report enqueue           |
| R11      | System health (Redis/PostgreSQL)   |
| R12      | Prerequisites (Node/pnpm versions) |

**Run:**

```bash
pnpm exec vitest run apps/worker/src/queues/production-flow-scenarios-extended.test.ts
```

---

## Troubleshooting

### Issue: Tests Fail with "Module Not Found"

**Solution:**

```bash
pnpm install
pnpm run build
```

### Issue: Port Conflicts

**Symptom:** Tests fail with EADDRINUSE errors

**Solution:**

```bash
# Find what's using the port
lsof -i :3000
lsof -i :4000

# Stop the conflicting service
```

### Issue: LLM Tests Fail

**Symptom:** Live LLM tests timeout or fail with auth errors

**Solutions:**

1. Verify API credentials are set
2. Check network connectivity
3. Verify API base URL is correct

```bash
# Test GLM API connectivity
curl -X POST https://api.z.ai/api/anthropic/v1/messages \
  -H "x-api-key: $GLM_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"glm-4.7","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'
```

### Issue: Tests Timeout

**Symptom:** Tests exceed default timeout (10s)

**Solution:**

```bash
# Increase timeout for specific tests
pnpm exec vitest run --testTimeout=30000
```

---

## Performance Benchmarks

| Test Suite       | Duration | Tests | Time per Test |
| ---------------- | -------- | ----- | ------------- |
| Unit Tests       | ~30s     | 707   | ~42ms         |
| Production Flow  | ~6s      | 20    | ~300ms        |
| Live LLM Verdict | ~60s     | 1     | ~60s          |

### Optimization Tips

1. **Use test watch mode for development:**

   ```bash
   pnpm exec vitest watch
   ```

2. **Run specific test files during development:**

   ```bash
   pnpm exec vitest run path/to/test.test.ts
   ```

3. **Use parallel execution for full suite:**
   ```bash
   pnpm run test --threads
   ```

---

## CI/CD Integration

### GitHub Actions

Tests run automatically on:

- Push to main branch
- Pull requests
- Manual workflow dispatch

### Local CI Simulation

```bash
# Run the same tests as CI
pnpm run test
pnpm run test:production-flow
```

### Test Artifacts

| Artifact         | Location                    |
| ---------------- | --------------------------- |
| Coverage reports | `coverage/`                 |
| JUnit XML        | Configured in vitest config |

---

## Environment Variables

### Testing

| Variable                 | Default | Description                     |
| ------------------------ | ------- | ------------------------------- |
| `NODE_ENV`               | `test`  | Node environment                |
| `AGENT_RUNTIME_LIVE_LLM` | `0`     | Enable live LLM (1=enabled)     |
| `SCENARIO_VERBOSE_LLM`   | `0`     | Verbose LLM logging (1=enabled) |

### Optional Services

| Variable           | Description                     |
| ------------------ | ------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection (for R11) |
| `REDIS_URL`        | Redis connection (for R11)      |
| `GLM_API_KEY`      | GLM API key for live tests      |
| `GLM_API_BASE_URL` | GLM API endpoint                |
| `GLM_MODEL`        | GLM model to use                |

---

## Best Practices

### Writing Tests

1. **Use descriptive test names**

   ```typescript
   it("validates tenant isolation between contexts", () => {
     // ...
   });
   ```

2. **Follow AAA pattern** (Arrange, Act, Assert)

   ```typescript
   it("calculates total spend correctly", () => {
     // Arrange
     const campaigns = createMockCampaigns();

     // Act
     const total = calculateTotalSpend(campaigns);

     // Assert
     expect(total).toBeGreaterThan(0);
   });
   ```

3. **Use test fixtures**

   ```typescript
   import { createTestTenantContext } from "@agenticverdict/testing";

   const tenantContext = createTestTenantContext({ tenantId: "test-tenant" });
   ```

### Running Tests

1. **Run tests frequently during development**
2. **Use watch mode for faster feedback**
3. **Run full suite before committing**
4. **Check coverage for new code**

---

## Appendix: Command Reference

### Test Execution

```bash
# All tests
pnpm run test

# Production flow
pnpm run test:production-flow

# Unit tests only
pnpm run test:unit

# With coverage
pnpm run test:coverage

# Watch mode
pnpm exec vitest watch

# Specific file
pnpm exec vitest run path/to/test.test.ts

# Specific pattern
pnpm exec vitest run tests/orchestrator

# By test name
pnpm exec vitest run -t "test name"
```

### Development Services

```bash
# Start PostgreSQL and Redis for development
pnpm run db:up

# Stop development services
pnpm run db:down

# Start observability stack
pnpm run observability:up
```

---

## Related Documents

- **Testing Strategy:** `docs/02-planning-and-methodology/testing-strategy.md`
- **Failing Tests Analysis:** `docs/02-planning-and-methodology/failing-tests-analysis.md`
- **Docker Testing Removal:** `docs/02-planning-and-methodology/docker-testing-removal-plan.md`
- **Changelog:** `changelog/2026-04-07-docker-testing-removal-local-testing-migration.md`

---

**Change History:**

| Version | Date       | Changes                                               |
| ------- | ---------- | ----------------------------------------------------- |
| 1.0     | 2026-04-07 | Initial document created after Docker testing removal |
