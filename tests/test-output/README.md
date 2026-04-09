# Test Output Directory

This directory contains artifacts from manual testing and automated test runs of live API workflows.

## Directory Structure

```
tests/test-output/
├── archive/                          # Archived test runs by date
│   └── YYYY-MM-DD_test-run/          # Individual test run
│       ├── requests/                 # API request payloads
│       ├── responses/                # API responses
│       ├── artifacts/                # Generated artifacts (analysis results, etc.)
│       ├── logs/                     # Poll logs and execution traces
│       └── MANIFEST.json             # Test run manifest
└── latest -> (symlink)               # Symlink to most recent test run
```

## Archive Contents

Each test run archive contains:

### Requests (`requests/`)

- JSON payloads sent to `/api/v1/workflows/trigger`
- Useful for reproducing tests and understanding input parameters

### Responses (`responses/`)

- Initial trigger responses (with execution IDs)
- Final status responses (with results and metadata)
- Useful for validating API contract and response structure

### Artifacts (`artifacts/`)

- Analysis results from `/api/v1/analysis-results/:id`
- Contains AI-generated insights, verdicts, and recommendations
- Useful for testing AI quality and data structure validation

### Logs (`logs/`)

- Poll logs showing workflow status progression
- Useful for debugging timing issues and workflow execution

### MANIFEST.json

- Complete summary of the test run
- Includes execution IDs, durations, and results
- Useful for quick reference and CI/CD integration

## Generating New Test Runs

Use the artifact capture script:

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
./tests/scripts/capture-test-artifacts.sh
```

This will:

1. Trigger all three workflow types (report-generation, marketing-analysis, verdict-generation)
2. Poll for completion
3. Save all requests, responses, and artifacts to a new dated directory
4. Generate a MANIFEST.json with summary information

## Known Limitations

### PDF Reports

The `report-generation` workflow generates PDFs but currently does not return the binary content in the status response. The response includes:

- `pdfByteLength`: Size of generated PDF
- `pdfValidation`: Validation results (size, phrases, RTL/LTR, language)

To capture actual PDF files, you may need to:

1. Check the filesystem where the application writes PDFs (if persisted)
2. Implement a separate download endpoint for PDF artifacts
3. Add base64-encoded PDF to the status response (for test mode only)

## Example: Reading Captured Analysis Results

```bash
# View manifest
cat tests/test-output/archive/*/MANIFEST.json | jq

# View marketing analysis insights
cat tests/test-output/archive/*/artifacts/marketing-analysis-results.json | jq '.insights[] | {title, confidence, type}'

# Check verdict recommendations
cat tests/test-output/archive/*/artifacts/verdict-analysis-results.json | jq '.verdicts[].recommendations[] | {title, priority, effort}'

# View poll timing
cat tests/test-output/archive/*/logs/marketing-analysis-poll.log
```

## Test Coverage

The artifact capture script covers:

1. **R01 Production-Flow PDF Report** - Basic report generation with LTR/EN validation
2. **Marketing-Analysis Workflow** - Cross-platform analysis with AI insights
3. **Verdict-Generation Workflow** - Full pipeline with budget allocation verdicts

## Related Testing

- **Automated tests**: `tests/artifact-verification.test.ts` — Run with `pnpm test artifact-verification`
- **Manual testing guide**: `tests/docs/manual-testing-guide.md` — Complete API testing procedures
- **Integration guide**: `tests/docs/manual-testing-guide-integration.md` — Quick reference for running tests

## Additional Testing Scenarios

For comprehensive testing, also consider:

- **R02-R12 Production-Flow Scenarios** - Different report types and configurations
- **Multi-language Testing** - AR (RTL) reports with Arabic content validation
- **Error Cases** - Invalid tenantId, missing fields, malformed requests
- **Performance Testing** - Large date ranges, multiple platforms, concurrent requests

See `tests/docs/manual-testing-guide.md` for complete testing procedures.
