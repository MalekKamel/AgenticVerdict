#!/usr/bin/env bash
#
# Test Artifact Capture Script
#
# Runs test workflows and captures all generated artifacts:
# - Request/response logs
# - PDF reports
# - Analysis results (JSON)
# - Workflow status round-trips
#
# Output: tests/test-output/archive/<date>_test-run/

set -euo pipefail

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
DEMO_TENANT_ID="22222222-2222-4222-8222-222222222222"
TEST_RUN_DIR="tests/test-output/archive/$(date +%Y-%m-%d)_test-run"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m'

log_info() { echo -e "${GREEN}[INFO]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Create test run directory
mkdir -p "${TEST_RUN_DIR}"/{requests,responses,artifacts,logs}

log_info "Test run directory: ${TEST_RUN_DIR}"

# Check prerequisites
if [[ -z "${TOKEN:-}" ]]; then
  log_error "TOKEN not set. Generate with:"
  echo "export TOKEN=\"\$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)\""
  exit 1
fi

# ============================================================================
# Test 1: R01 Production-Flow PDF Report
# ============================================================================
log_info "Test 1: R01 Production-Flow PDF Report"

REQUEST_FILE="${TEST_RUN_DIR}/requests/r01-trigger.json"
cat > "${REQUEST_FILE}" <<EOF
{
  "workflowId": "report-generation",
  "testMode": true,
  "tenantId": "${DEMO_TENANT_ID}",
  "config": {
    "productionFlowScenarioId": "R01"
  }
}
EOF

# Trigger workflow
log_info "Triggering R01 workflow..."
RESPONSE_FILE="${TEST_RUN_DIR}/responses/r01-trigger-response.json"
curl -s -X POST "${API_BASE_URL}/api/v1/workflows/trigger" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @"${REQUEST_FILE}" | jq '.' > "${RESPONSE_FILE}"
cat "${RESPONSE_FILE}"

EXECUTION_ID=$(jq -r '.executionId' "${RESPONSE_FILE}")
log_info "Execution ID: ${EXECUTION_ID}"

# Poll for completion
log_info "Polling for completion..."
POLL_LOG="${TEST_RUN_DIR}/logs/r01-poll.log"
STATUS_FILE="${TEST_RUN_DIR}/responses/r01-final-status.json"

for ((i = 1; i <= 60; i++)); do
  sleep 2
  STATUS=$(curl -s "${API_BASE_URL}/api/v1/workflows/status/${EXECUTION_ID}" \
    -H "Authorization: Bearer ${TOKEN}")
  echo "Poll ${i}: $(echo "${STATUS}" | jq -r '.status // "unknown"')" >> "${POLL_LOG}"

  if echo "${STATUS}" | jq -e '.status == "completed" or .status == "failed"' > /dev/null; then
    echo "${STATUS}" | jq '.' > "${STATUS_FILE}"
    cat "${STATUS_FILE}"
    break
  fi
done

# Note: PDF binary is not returned in status response
# The API only returns metadata (pdfByteLength, pdfValidation)
# To capture actual PDF files, you may need to:
# 1. Check the filesystem where the application writes PDFs (if persisted)
# 2. Implement a separate download endpoint for PDF artifacts
# 3. Add base64-encoded PDF to the status response (for test mode only)
PDF_BYTES=$(jq -r '.result.pdfByteLength // 0' "${STATUS_FILE}")
log_info "PDF metadata: ${PDF_BYTES} bytes generated"
log_info "PDF validation: $(jq -r '.result.pdfValidation' "${STATUS_FILE}")"

# ============================================================================
# Test 2: Marketing-Analysis Workflow
# ============================================================================
log_info "Test 2: Marketing-Analysis Workflow"

REQUEST_FILE="${TEST_RUN_DIR}/requests/marketing-analysis-trigger.json"
cat > "${REQUEST_FILE}" <<EOF
{
  "workflowId": "marketing-analysis",
  "testMode": true,
  "tenantId": "${DEMO_TENANT_ID}",
  "config": {
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-07T00:00:00.000Z"
    },
    "platforms": ["meta", "ga4"]
  }
}
EOF

RESPONSE_FILE="${TEST_RUN_DIR}/responses/marketing-analysis-trigger-response.json"
curl -s -X POST "${API_BASE_URL}/api/v1/workflows/trigger" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @"${REQUEST_FILE}" | jq '.' > "${RESPONSE_FILE}"
cat "${RESPONSE_FILE}"

EXECUTION_ID=$(jq -r '.executionId' "${RESPONSE_FILE}")
log_info "Execution ID: ${EXECUTION_ID}"

# Poll for completion
log_info "Polling for completion..."
POLL_LOG="${TEST_RUN_DIR}/logs/marketing-analysis-poll.log"
STATUS_FILE="${TEST_RUN_DIR}/responses/marketing-analysis-final-status.json"

for ((i = 1; i <= 90; i++)); do
  sleep 2
  STATUS=$(curl -s "${API_BASE_URL}/api/v1/workflows/status/${EXECUTION_ID}" \
    -H "Authorization: Bearer ${TOKEN}")
  echo "Poll ${i}: $(echo "${STATUS}" | jq -r '.status // "unknown"')" >> "${POLL_LOG}"

  if echo "${STATUS}" | jq -e '.status == "completed" or .status == "failed"' > /dev/null; then
    echo "${STATUS}" | jq '.' > "${STATUS_FILE}"
    cat "${STATUS_FILE}"
    break
  fi
done

# Fetch and save analysis results
ANALYSIS_ID=$(jq -r '.result.analysisId // empty' "${STATUS_FILE}")
if [[ -n "${ANALYSIS_ID}" && "${ANALYSIS_ID}" != "null" ]]; then
  log_info "Fetching analysis results: ${ANALYSIS_ID}"
  ANALYSIS_FILE="${TEST_RUN_DIR}/artifacts/marketing-analysis-results.json"
  curl -s "${API_BASE_URL}/api/v1/analysis-results/${ANALYSIS_ID}" \
    -H "Authorization: Bearer ${TOKEN}" | jq '.' > "${ANALYSIS_FILE}"
  cat "${ANALYSIS_FILE}"
fi

# ============================================================================
# Test 3: Verdict-Generation Workflow (Full Pipeline)
# ============================================================================
log_info "Test 3: Verdict-Generation Workflow (Full Pipeline)"

REQUEST_FILE="${TEST_RUN_DIR}/requests/verdict-generation-trigger.json"
cat > "${REQUEST_FILE}" <<EOF
{
  "workflowId": "verdict-generation",
  "testMode": true,
  "tenantId": "${DEMO_TENANT_ID}",
  "config": {
    "dateRange": {
      "start": "2024-01-01T00:00:00.000Z",
      "end": "2024-01-07T00:00:00.000Z"
    },
    "platforms": ["meta", "ga4"],
    "verdictDepth": "quick",
    "outputFormat": "pdf"
  }
}
EOF

RESPONSE_FILE="${TEST_RUN_DIR}/responses/verdict-generation-trigger-response.json"
curl -s -X POST "${API_BASE_URL}/api/v1/workflows/trigger" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d @"${REQUEST_FILE}" | jq '.' > "${RESPONSE_FILE}"
cat "${RESPONSE_FILE}"

EXECUTION_ID=$(jq -r '.executionId' "${RESPONSE_FILE}")
log_info "Execution ID: ${EXECUTION_ID}"

# Poll for completion
log_info "Polling for completion..."
POLL_LOG="${TEST_RUN_DIR}/logs/verdict-generation-poll.log"
STATUS_FILE="${TEST_RUN_DIR}/responses/verdict-generation-final-status.json"

for ((i = 1; i <= 90; i++)); do
  sleep 2
  STATUS=$(curl -s "${API_BASE_URL}/api/v1/workflows/status/${EXECUTION_ID}" \
    -H "Authorization: Bearer ${TOKEN}")
  echo "Poll ${i}: $(echo "${STATUS}" | jq -r '.status // "unknown"')" >> "${POLL_LOG}"

  if echo "${STATUS}" | jq -e '.status == "completed" or .status == "failed"' > /dev/null; then
    echo "${STATUS}" | jq '.' > "${STATUS_FILE}"
    cat "${STATUS_FILE}"
    break
  fi
done

# Fetch analysis results
ANALYSIS_ID=$(jq -r '.result.analysisId // empty' "${STATUS_FILE}")
if [[ -n "${ANALYSIS_ID}" && "${ANALYSIS_ID}" != "null" ]]; then
  log_info "Fetching analysis results: ${ANALYSIS_ID}"
  ANALYSIS_FILE="${TEST_RUN_DIR}/artifacts/verdict-analysis-results.json"
  curl -s "${API_BASE_URL}/api/v1/analysis-results/${ANALYSIS_ID}" \
    -H "Authorization: Bearer ${TOKEN}" | jq '.' > "${ANALYSIS_FILE}"
  cat "${ANALYSIS_FILE}"
fi

# ============================================================================
# Summary and Post-Processing
# ============================================================================

# Create symlink to latest test run
ln -sfn "$(basename "${TEST_RUN_DIR}")" tests/test-output/archive/latest
log_info "Created symlink: tests/test-output/archive/latest -> ${TEST_RUN_DIR}"

# Create MANIFEST.json
MANIFEST_FILE="${TEST_RUN_DIR}/MANIFEST.json"
cat > "${MANIFEST_FILE}" <<EOF
{
  "testRunId": "$(basename "${TEST_RUN_DIR}")",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "tenantId": "${DEMO_TENANT_ID}",
  "description": "Automated artifact capture for manual testing verification",
  "apiBaseUrl": "${API_BASE_URL}",
  "formatsCaptured": ["json"],
  "notes": [
    "All JSON files are prettified for readability",
    "PDF reports are not included in status response (metadata only)",
    "Analysis results contain AI-generated insights and verdicts"
  ]
}
EOF
jq '.' "${MANIFEST_FILE}" > "${MANIFEST_FILE}.tmp" && mv "${MANIFEST_FILE}.tmp" "${MANIFEST_FILE}"

log_info "Test run complete! Artifacts saved to: ${TEST_RUN_DIR}"
echo ""
echo "Directory structure:"
find "${TEST_RUN_DIR}" -type f | sort
echo ""
echo "Quick access:"
echo "  Latest test run: tests/test-output/latest"
echo "  All archives:    tests/test-output/archive/"
echo ""
echo "View analysis results:"
echo "  cat tests/test-output/latest/artifacts/marketing-analysis-results.json | jq '.insights[] | {title, confidence}'"

log_info "Capture test artifacts complete ✓"
