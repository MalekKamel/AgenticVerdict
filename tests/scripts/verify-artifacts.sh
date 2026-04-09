#!/usr/bin/env bash
#
# Artifact Verification Script
#
# Queries the AgenticVerdict API to verify generated artifacts:
# - Workflow status and execution results
# - Analysis results from AI agent pipeline
# - Production-flow PDF reports
#
# Usage:
#   export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)" \
#   ./scripts/verify-artifacts.sh [execution_id]
#
# If execution_id is provided, queries that specific workflow.
# Otherwise, triggers a new R01 report-generation workflow and verifies it.

set -euo pipefail

# Configuration
API_BASE_URL="${API_BASE_URL:-http://localhost:4000}"
DEMO_TENANT_ID="22222222-2222-4222-8222-222222222222"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Logging functions (send to stderr to avoid interfering with command substitution)
log_info() { echo -e "${GREEN}[INFO]${NC} $*" >&2; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $*" >&2; }
log_error() { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# Check prerequisites
check_prerequisites() {
  if [[ -z "${TOKEN:-}" ]]; then
    log_error "TOKEN environment variable not set"
    echo "Generate with: export TOKEN=\"\$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)\""
    exit 1
  fi

  if ! command -v jq &> /dev/null; then
    log_error "jq is required but not installed"
    exit 1
  fi

  # Check API health
  if ! curl -sf "${API_BASE_URL}/health" > /dev/null; then
    log_error "API is not responding at ${API_BASE_URL}"
    exit 1
  fi

  log_info "Prerequisites checked"
}

# Trigger workflow and return execution ID
trigger_workflow() {
  local workflow_id="$1"
  local config="$2"

  log_info "Triggering ${workflow_id} workflow..."

  local response
  response=$(curl -s -X POST "${API_BASE_URL}/api/v1/workflows/trigger" \
    -H "Authorization: Bearer ${TOKEN}" \
    -H "Content-Type: application/json" \
    -d "${config}")

  # Check for errors
  if echo "${response}" | jq -e '.error' > /dev/null; then
    log_error "Workflow trigger failed"
    echo "${response}" | jq -r '.error.message // .error'
    exit 1
  fi

  local execution_id
  execution_id=$(echo "${response}" | jq -r '.executionId')
  local status
  status=$(echo "${response}" | jq -r '.status')

  log_info "Workflow triggered: ${execution_id}"
  log_info "Initial status: ${status}"

  echo "${execution_id}"
}

# Poll workflow status until completion
poll_workflow_status() {
  local execution_id="$1"
  local max_polls="${2:-60}"
  local poll_interval="${3:-2}"

  log_info "Polling workflow status (max ${max_polls} polls, ${poll_interval}s interval)..."

  local status
  for ((i = 1; i <= max_polls; i++)); do
    local response
    response=$(curl -s "${API_BASE_URL}/api/v1/workflows/status/${execution_id}" \
      -H "Authorization: Bearer ${TOKEN}")

    status=$(echo "${response}" | jq -r '.status // "unknown"')

    if [[ "${status}" == "completed" || "${status}" == "failed" ]]; then
      log_info "Workflow ${status} (poll ${i}/${max_polls})"
      echo "${response}"
      return 0
    fi

    if [[ $((i % 10)) -eq 0 ]]; then
      log_info "Still running... (${i}/${max_polls} polls)"
    fi

    sleep "${poll_interval}"
  done

  log_warn "Workflow did not complete within ${max_polls} polls"
  echo "${response}"
  return 1
}

# Verify R01 production-flow PDF report
verify_r01_report() {
  local result="$1"

  log_info "Verifying R01 production-flow PDF report..."

  local message
  message=$(echo "${result}" | jq -r '.result.message // empty')

  if [[ "${message}" != "production_flow_pdf_ok" ]]; then
    log_warn "Unexpected message: ${message}"
  fi

  local pdf_length
  pdf_length=$(echo "${result}" | jq -r '.result.pdfByteLength // 0')

  if [[ "${pdf_length}" -lt 500 ]]; then
    log_error "PDF too small: ${pdf_length} bytes (expected > 500)"
    return 1
  fi

  log_info "PDF size: ${pdf_length} bytes ✓"

  # Check validation results
  local min_bytes_ok
  min_bytes_ok=$(echo "${result}" | jq -r '.result.pdfValidation.minBytesOk // false')
  local phrases_ok
  phrases_ok=$(echo "${result}" | jq -r '.result.pdfValidation.mustContainPhrasesOk // false')
  local shell_dir
  shell_dir=$(echo "${result}" | jq -r '.result.pdfValidation.shellDir // empty')
  local shell_lang
  shell_lang=$(echo "${result}" | jq -r '.result.pdfValidation.shellLang // empty')

  log_info "Validation results:"
  echo "  - minBytesOk: ${min_bytes_ok}"
  echo "  - mustContainPhrasesOk: ${phrases_ok}"
  echo "  - shellDir: ${shell_dir}"
  echo "  - shellLang: ${shell_lang}"

  if [[ "${min_bytes_ok}" != "true" || "${phrases_ok}" != "true" ]]; then
    log_error "PDF validation failed"
    return 1
  fi

  log_info "R01 report verification passed ✓"
}

# Verify analysis results
verify_analysis_results() {
  local analysis_id="$1"

  log_info "Fetching analysis results: ${analysis_id}"

  local response
  response=$(curl -s "${API_BASE_URL}/api/v1/analysis-results/${analysis_id}" \
    -H "Authorization: Bearer ${TOKEN}")

  # Check for error
  if echo "${response}" | jq -e '.error' > /dev/null; then
    log_error "Failed to fetch analysis results"
    echo "${response}" | jq -r '.error.message // .error'
    return 1
  fi

  local analysis_id_check
  analysis_id_check=$(echo "${response}" | jq -r '.analysisId // empty')

  if [[ "${analysis_id_check}" != "${analysis_id}" ]]; then
    log_error "Analysis ID mismatch"
    return 1
  fi

  local insight_count
  insight_count=$(echo "${response}" | jq -r '.insights | length')

  log_info "Insights count: ${insight_count}"

  if [[ "${insight_count}" -gt 0 ]]; then
    log_info "First insight preview:"
    echo "${response}" | jq -r '.insights[0] | {
      id,
      type,
      title,
      confidence
    }'

    # Check insight structure
    local first_insight
    first_insight=$(echo "${response}" | jq '.insights[0]')

    local has_id
    has_id=$(echo "${first_insight}" | jq -e '.id' > /dev/null && echo "true" || echo "false")
    local has_type
    has_type=$(echo "${first_insight}" | jq -e '.type' > /dev/null && echo "true" || echo "false")
    local has_title
    has_title=$(echo "${first_insight}" | jq -e '.title' > /dev/null && echo "true" || echo "false")
    local has_description
    has_description=$(echo "${first_insight}" | jq -e '.description' > /dev/null && echo "true" || echo "false")
    local has_confidence
    has_confidence=$(echo "${first_insight}" | jq -e '.confidence' > /dev/null && echo "true" || echo "false")

    if [[ "${has_id}" != "true" || "${has_type}" != "true" || "${has_title}" != "true" || "${has_description}" != "true" || "${has_confidence}" != "true" ]]; then
      log_error "Insight structure incomplete"
      return 1
    fi
  fi

  # Demo tenant: full platform coverage and real provenance metrics (not placeholder-only)
  local tenant_in_response
  tenant_in_response=$(echo "${response}" | jq -r '.tenantId // empty')
  if [[ -n "${tenant_in_response}" && "${tenant_in_response}" == "${DEMO_TENANT_ID}" ]]; then
    local platform_count
    platform_count=$(echo "${response}" | jq -r '.platformsAnalyzed | length')
    if [[ "${platform_count}" -lt 5 ]]; then
      log_error "Expected at least 5 platforms in platformsAnalyzed for demo tenant; got ${platform_count}"
      return 1
    fi
    local expected_platforms=("meta" "ga4" "gsc" "gbp" "tiktok")
    for platform in "${expected_platforms[@]}"; do
      if ! echo "${response}" | jq -e --arg p "${platform}" '.platformsAnalyzed | index($p) != null' >/dev/null; then
        log_error "Demo tenant analysis missing platform: ${platform}"
        return 1
      fi
    done
    if echo "${response}" | jq -e '.provenance.dataSources[]? | select(.metrics == ["unknown"])' >/dev/null 2>&1; then
      log_error "Provenance still contains placeholder metrics [\"unknown\"]"
      return 1
    fi
    if echo "${response}" | jq -e '.provenance.dataSources[]? | select(.metrics == ["unavailable"]) | length > 0' >/dev/null 2>&1; then
      log_warn "Some data sources list metrics as unavailable (tool snapshots may be empty in this run)"
    fi
  fi

  log_info "Analysis results verification passed ✓"
}

# Verify processing metadata
verify_processing_metadata() {
  local result="$1"

  log_info "Verifying processing metadata..."

  local has_metadata
  has_metadata=$(echo "${result}" | jq -e '.result.processingMetadata' > /dev/null && echo "true" || echo "false")

  if [[ "${has_metadata}" != "true" ]]; then
    log_warn "No processing metadata found"
    return 0
  fi

  local duration
  duration=$(echo "${result}" | jq -r '.result.processingMetadata.durationMs // 0')
  local pipeline_status
  pipeline_status=$(echo "${result}" | jq -r '.result.processingMetadata.pipelineStatus // empty')
  local platforms
  platforms=$(echo "${result}" | jq -r '.result.processingMetadata.platformsAnalyzed[]? // empty' | wc -l | tr -d ' ')

  log_info "Processing metadata:"
  echo "  - duration: ${duration}ms"
  echo "  - pipelineStatus: ${pipeline_status}"
  echo "  - platformsAnalyzed: ${platforms} platform(s)"

  if [[ "${duration}" -gt 10000 ]]; then
    log_info "✓ Real LLM detected (duration > 10s)"
  elif [[ "${duration}" -lt 100 ]]; then
    log_info "ℹ Mock LLM detected (duration < 100ms)"
  fi

  log_info "Processing metadata verification passed ✓"
}

# Main verification function
verify_artifacts() {
  local execution_id="$1"

  log_info "Starting artifact verification for: ${execution_id}"

  # Poll workflow status
  local status_result
  status_result=$(poll_workflow_status "${execution_id}" 60 2)

  local status
  status=$(echo "${status_result}" | jq -r '.status')

  if [[ "${status}" != "completed" ]]; then
    log_error "Workflow did not complete successfully"
    echo "${status_result}" | jq '.'
    return 1
  fi

  log_info "Workflow completed successfully"

  # Get workflow type
  local workflow_id
  workflow_id=$(echo "${status_result}" | jq -r '.result.workflowId // empty')

  # Verify based on workflow type
  case "${workflow_id}" in
    "report-generation")
      verify_r01_report "${status_result}"
      ;;
    "marketing-analysis"|"verdict-generation")
      # Verify analysis results if present
      local analysis_id
      analysis_id=$(echo "${status_result}" | jq -r '.result.analysisId // empty')

      if [[ -n "${analysis_id}" && "${analysis_id}" != "null" ]]; then
        verify_analysis_results "${analysis_id}"
      fi

      verify_processing_metadata "${status_result}"
      ;;
    *)
      log_warn "Unknown workflow type: ${workflow_id}"
      ;;
  esac

  # Print full result for reference
  log_info "Full workflow result:"
  echo "${status_result}" | jq -c '{
    executionId,
    status,
    workflowId: .result.workflowId,
    phase: .result.phase,
    message: .result.message,
    durationMs: .result.processingMetadata.durationMs,
    analysisId: .result.analysisId,
    pdfByteLength: .result.pdfByteLength
  }'

  log_info "Artifact verification completed ✓"
  return 0
}

# Main script
main() {
  check_prerequisites

  local execution_id="${1:-}"

  if [[ -z "${execution_id}" ]]; then
    # Trigger new R01 workflow
    local config='{
      "workflowId": "report-generation",
      "testMode": true,
      "tenantId": "'${DEMO_TENANT_ID}'",
      "config": {
        "productionFlowScenarioId": "R01"
      }
    }'

    execution_id=$(trigger_workflow "report-generation" "${config}")
  fi

  verify_artifacts "${execution_id}"
}

# Run main function
main "$@"
