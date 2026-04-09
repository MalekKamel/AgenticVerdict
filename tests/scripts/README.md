# Test Scripts

This directory contains shell scripts for running various test scenarios and capturing artifacts from live API testing.

## Scripts

### Production Flow Scenarios

| Script                  | Purpose                                         | Usage                                             |
| ----------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `run-scenario.sh`       | Run a single production flow scenario (R01-R12) | `./tests/scripts/run-scenario.sh R01`             |
| `run-scenario-group.sh` | Run a group of related scenarios                | `./tests/scripts/run-scenario-group.sh marketing` |
| `run-all-scenarios.sh`  | Run all production flow scenarios               | `./tests/scripts/run-all-scenarios.sh`            |
| `validate-scenario.sh`  | Validate scenario output structure              | `./tests/scripts/validate-scenario.sh R01`        |

### Artifact Verification & Capture

| Script                      | Purpose                                            | Usage                                                                                                         |
| --------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `verify-artifacts.sh`       | Verify generated artifacts from workflow execution | `TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant <id>) ./tests/scripts/verify-artifacts.sh [execution_id]` |
| `capture-test-artifacts.sh` | Capture all artifacts from test workflows          | `TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant <id>) ./tests/scripts/capture-test-artifacts.sh`          |

## Usage

### Prerequisites

All artifact verification and capture scripts require:

- JWT token for authentication (generate with `scripts/generate-dev-jwt.mjs`)
- Running API server at `http://localhost:4000` (or set `API_BASE_URL`)
- Running worker and Redis (for workflow execution)

### Examples

**Verify a specific workflow execution:**

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
./tests/scripts/verify-artifacts.sh workflow-report-generation-abc123
```

**Verify by triggering a new workflow:**

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
./tests/scripts/verify-artifacts.sh
```

**Capture all artifacts from test run:**

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
./tests/scripts/capture-test-artifacts.sh
```

**Run a specific production flow scenario:**

```bash
pnpm run test:scenario R01
# or
./tests/scripts/run-scenario.sh R01
```

## Output

### Artifact Scripts

- `verify-artifacts.sh`: Outputs validation results to stdout with colored status messages
- `capture-test-artifacts.sh`: Creates dated archive in `tests/test-output/archive/` with:
  - `requests/` - API request payloads
  - `responses/` - API responses
  - `artifacts/` - Generated analysis results
  - `logs/` - Poll logs and execution traces
  - `MANIFEST.json` - Test run summary

### Scenario Scripts

Scenario scripts output test results and may generate:

- Console output with test status
- Visual baselines in `tests/scenarios/visual-baselines/`
- Test reports in coverage directories

## Related Documentation

- **Manual testing guide**: `tests/docs/manual-testing-guide.md`
- **Integration guide**: `tests/docs/manual-testing-guide-integration.md`
- **Test output README**: `tests/test-output/README.md`
- **Production flow scenarios**: `tests/orchestrator/README.md`
