# Full Pipeline Testing Procedures

**Document Version:** 1.0
**Last Updated:** 2026-04-09
**Purpose:** Comprehensive procedures for testing the complete marketing analytics pipeline from data collection through AI agent processing to report generation and delivery.

---

## Table of Contents

1. [Pipeline Overview](#pipeline-overview)
2. [Testing Prerequisites](#testing-prerequisites)
3. [Stage-by-Stage Testing](#stage-by-stage-testing)
4. [End-to-End Pipeline Testing](#end-to-end-pipeline-testing)
5. [Report Generation & Archiving](#report-generation--archiving)
6. [Validation & Verification](#validation--verification)

---

## Pipeline Overview

The AgenticVerdict marketing analytics pipeline consists of five sequential stages:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MARKETING ANALYTICS PIPELINE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  STAGE 1: DATA COLLECTION                                               │
│  ├─ Platform Adapters (Meta, GA4, GSC, GBP, TikTok)                    │
│  ├─ OAuth Authentication                                                │
│  ├─ Rate Limiting & Circuit Breakers                                   │
│  └─ L1 + L2 Caching Strategy                                           │
│                              ↓                                          │
│  STAGE 2: DATA NORMALIZATION                                            │
│  ├─ Unified Schema Conversion                                          │
│  ├─ Date Range Processing                                               │
│  ├─ Tenant Context Application                                          │
│  └─ Data Validation & Error Handling                                    │
│                              ↓                                          │
│  STAGE 3: AI AGENT PIPELINE                                             │
│  ├─ Cross-Platform Analysis Agent                                      │
│  ├─ Marketing Insights Generation Agent                                │
│  ├─ Media Verdict Agent                                                │
│  └─ LangChain.js + LangGraph.js Orchestration                          │
│                              ↓                                          │
│  STAGE 4: REPORT GENERATION                                             │
│  ├─ Template-Based Rendering                                            │
│  ├─ Multi-Format Output (PDF, DOCX, XLSX, HTML, JSON)                   │
│  ├─ Multi-Language Support (EN/AR/FR with RTL/LTR)                     │
│  └─ Variable Injection & Branding                                       │
│                              ↓                                          │
│  STAGE 5: DELIVERY                                                      │
│  ├─ Email Delivery (Resend/SendGrid)                                    │
│  ├─ Webhook Notifications                                               │
│  ├─ Report Storage & Metadata Tracking                                  │
│  └─ Scheduled Generation (BullMQ)                                       │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Testing Prerequisites

### Environment Setup

1. **Services Running**: All services must be operational

   ```bash
   docker compose -f docker-compose.yml -f docker-compose.apps.yml \
     -f deploy/docker-compose.dev.override.yml ps
   ```

2. **Database Initialization**:

   ```bash
   pnpm --filter @agenticverdict/database db:push
   pnpm --filter @agenticverdict/database db:seed
   ```

3. **Authentication Token**:

   ```bash
   export TOKEN=$(
     node scripts/generate-dev-jwt.mjs \
       --tenant 22222222-2222-4222-8222-222222222222
   )
   ```

4. **Test Reports Directory**:
   ```bash
   mkdir -p test-output/archive/$(date +%Y-%m-%d)_full-pipeline-test
   cd test-output/archive/$(date +%Y-%m-%d)_full-pipeline-test
   mkdir -p scenarios metadata templates localization
   ```

### Test Data Preparation

- **Mock Mode**: Ensure mock adapters are enabled (`AGENTICVERDICT_USE_MOCK_ADAPTERS=1`)
- **Date Range**: Use consistent test date ranges
- **Tenant Context**: Verify tenant configs exist

---

## Stage-by-Stage Testing

### Stage 1: Data Collection Testing

#### 1.1 Platform Adapter Health Check

```bash
# Check adapter health status
curl -s http://localhost:3000/api/health/adapters | jq '.'

# Expected response includes:
# - status: "ok" or "degraded"
# - components: cache, redis, deadLetter, circuitBreaker
# - platforms: array with health status for each platform
```

**Verification Checklist**:

- [ ] All platforms show `status: "ok"` or `status: "unknown"`
- [ ] Circuit breaker state is `closed`
- [ ] Dead letter queue is empty (`backlog: 0`)
- [ ] Cache status is operational

#### 1.2 Individual Platform Data Fetch

```bash
# Trigger platform-specific data fetch (via marketing-analysis workflow)
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "platforms": ["meta"]
    }
  }'
```

**Verification Checklist**:

- [ ] Platform adapter fetches data successfully
- [ ] No circuit breaker activation
- [ ] Data is properly normalized
- [ ] Caching strategy works (second fetch should be faster)

#### 1.3 Multi-Platform Data Collection

```bash
# Fetch from all platforms simultaneously
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "platforms": ["meta", "ga4", "gsc", "gbp", "tiktok"]
    }
  }'
```

**Verification Checklist**:

- [ ] All platforms return data
- [ ] No rate limiting errors
- [ ] Concurrent requests handled properly
- [ ] Response time within thresholds (< 5s per platform)

---

### Stage 2: Data Normalization Testing

#### 2.1 Schema Validation

```bash
# Monitor worker logs for normalization events
docker logs agenticverdict-worker-1 -f --tail=50 | grep "normalize"
```

**Verification Checklist**:

- [ ] Platform-specific data converted to unified schema
- [ ] Date ranges properly applied
- [ ] Tenant context correctly injected
- [ ] Metric values within expected ranges
- [ ] No data loss during transformation

#### 2.2 Data Integrity Verification

```bash
# Query database for normalized data
docker exec -it agenticverdict-postgres-1 psql -U postgres -d agenticverdict

SELECT * FROM provenance_records
WHERE tenant_id = '22222222-2222-4222-8222-222222222222'
ORDER BY captured_at DESC
LIMIT 10;
```

**Verification Checklist**:

- [ ] Provenance records created
- [ ] Data source attribution preserved
- [ ] Timestamps correctly captured
- [ ] Tenant isolation maintained

---

### Stage 3: AI Agent Pipeline Testing

#### 3.1 Cross-Platform Analysis Agent

```bash
# Trigger marketing analysis workflow
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }' | jq -r '.executionId' > /tmp/analysis_exec.txt

EXECUTION=$(cat /tmp/analysis_exec.txt)

# Poll for completion
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  echo "Status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 2
done
```

**Verification Checklist**:

- [ ] Agent processes all platform data
- [ ] Trends and patterns identified
- [ ] Cross-platform correlations found
- [ ] Analysis completes within threshold (< 45s)

#### 3.2 Marketing Insights Generation

```bash
# Retrieve analysis results
ANALYSIS_ID=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
  -H "Authorization: Bearer $TOKEN" | jq -r '.result.analysisId')

curl -s "http://localhost:4000/api/v1/analysis-results/$ANALYSIS_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.insights' > /tmp/insights.json
```

**Verification Checklist**:

- [ ] Actionable insights generated
- [ ] Opportunities identified
- [ ] Threats flagged
- [ ] Anomaly detection working
- [ ] Insights data-driven with evidence

#### 3.3 Media Verdict Agent

```bash
# Trigger verdict generation workflow
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "verdict-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }' | jq -r '.executionId' > /tmp/verdict_exec.txt
```

**Verification Checklist**:

- [ ] Verdict score generated (0-100)
- [ ] Confidence score calculated (0-1)
- [ ] Recommendations with priorities
- [ ] Action items with effort levels
- [ ] Evidence sources tracked
- [ ] Data freshness and quality scores

---

### Stage 4: Report Generation Testing

#### 4.1 Template Validation

```bash
# List available templates
curl -s http://localhost:4000/api/v1/report-templates \
  -H "Authorization: Bearer $TOKEN" | jq '.templates[] | .id'

# Preview template
curl -s -X POST http://localhost:4000/api/v1/report-templates/executive-summary/preview \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "language": "en"
  }'
```

**Verification Checklist**:

- [ ] All templates accessible
- [ ] Preview renders correctly
- [ ] Variable substitution works
- [ ] Template inheritance respected

#### 4.2 Multi-Format Report Generation

```bash
# Generate report with all formats
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "productionFlowScenarioId": "R01"
    }
  }' | jq -r '.executionId' > /tmp/report_exec.txt

EXECUTION=$(cat /tmp/report_exec.txt)

# Wait for completion and retrieve results
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  if [ "$STATUS" = "completed" ]; then
    curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
      -H "Authorization: Bearer $TOKEN" | jq '.result' > /tmp/report_result.json
    break
  fi
  sleep 2
done
```

**Verification Checklist**:

- [ ] PDF generated successfully
- [ ] DOCX generated successfully
- [ ] XLSX generated successfully
- [ ] HTML generated successfully
- [ ] JSON generated successfully
- [ ] All formats render correctly
- [ ] File sizes within expected ranges
- [ ] Generation times within thresholds

#### 4.3 Multi-Language & RTL Testing

```bash
# Generate Arabic RTL report
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "11111111-1111-4111-8111-111111111111",
    "config": {
      "productionFlowScenarioId": "R02"
    }
  }'
```

**Verification Checklist**:

- [ ] Arabic text renders correctly
- [ ] RTL layout applied properly
- [ ] No text overflow or alignment issues
- [ ] Font support for Arabic script
- [ ] Dates and numbers formatted correctly

---

### Stage 5: Delivery Testing

#### 5.1 Email Delivery (Mock)

```bash
# Trigger report delivery
curl -s -X POST http://localhost:4000/api/v1/reports/delivery \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": "<report-id>",
    "deliveryMethod": "email",
    "recipients": ["test@example.com"]
  }'
```

**Verification Checklist**:

- [ ] Email queued successfully
- [ ] Delivery status tracked
- [ ] Attachments included
- [ ] Download link generated (if applicable)

#### 5.2 Webhook Notifications

```bash
# Set up webhook listener (in separate terminal)
nc -l 8080

# Trigger workflow with webhook
curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "webhookUrl": "http://localhost:8080/webhook",
    "config": {
      "productionFlowScenarioId": "R01"
    }
  }'
```

**Verification Checklist**:

- [ ] Webhook called on completion
- [ ] Payload contains expected data
- [ ] Signature verification works
- [ ] Retry mechanism functional

---

## End-to-End Pipeline Testing

### E2E Test Scenario S12

```bash
#!/bin/bash
# Complete end-to-end pipeline test

# Setup
export TOKEN=$(
  node scripts/generate-dev-jwt.mjs \
    --tenant 22222222-2222-4222-8222-222222222222
)

TEST_DIR="test-output/archive/$(date +%Y-%m-%d)_full-pipeline-test"
mkdir -p "$TEST_DIR"/{scenarios,metadata,templates,localization}

# 1. Trigger verdict-generation workflow (full pipeline)
echo "Triggering full pipeline..."
RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "verdict-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4222-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      }
    }
  }')

EXECUTION_ID=$(echo $RESPONSE | jq -r '.executionId')
echo "Execution ID: $EXECUTION_ID"

# 2. Monitor pipeline stages
echo "Monitoring pipeline stages..."
docker logs agenticverdict-worker-1 -f --tail=50 &
LOG_PID=$!

# 3. Poll for completion
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION_ID" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  echo "Pipeline Status: $STATUS"

  if [ "$STATUS" = "completed" ]; then
    echo "Pipeline completed successfully!"
    break
  elif [ "$STATUS" = "failed" ]; then
    echo "Pipeline failed!"
    curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION_ID" \
      -H "Authorization: Bearer $TOKEN" | jq '.'
    exit 1
  fi

  sleep 5
done

kill $LOG_PID

# 4. Retrieve and save results
echo "Retrieving results..."
curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION_ID" \
  -H "Authorization: Bearer $TOKEN" | jq '.' > "$TEST_DIR/metadata/s12_result.json"

# 5. Generate reports in all formats
echo "Generating reports in all formats..."
for FORMAT in pdf docx xlsx html json; do
  echo "Generating $FORMAT..."
  # (Implementation varies by API - use appropriate endpoints)
done

echo "E2E test complete. Results saved to $TEST_DIR"
```

**Verification Checklist**:

- [ ] All pipeline stages execute sequentially
- [ ] Data flows correctly between stages
- [ ] AI agents process data properly
- [ ] Reports generated in all formats
- [ ] Delivery mechanism works
- [ ] No errors or exceptions
- [ ] Performance within thresholds
- [ ] Tenant context preserved throughout

---

## Report Generation & Archiving

### Saving Reports to test-output/

```bash
#!/bin/bash
# Archive all generated reports

TEST_RUN_DIR="test-output/archive/$(date +%Y-%m-%d)_full-pipeline-test"
mkdir -p "$TEST_RUN_DIR"/scenarios

# Function to save report with proper naming
save_report() {
  local SCENARIO_ID=$1
  local FORMAT=$2
  local REPORT_DATA=$3
  local TENANT_SHORT=${4:0:8}
  local TIMESTAMP=$(date +%Y%m%d-%H%M%S)

  local DIR="$TEST_RUN_DIR/scenarios/${SCENARIO_ID}/${FORMAT}"
  mkdir -p "$DIR"

  local FILENAME="report_${SCENARIO_ID}_${TENANT_SHORT}_${TIMESTAMP}.${FORMAT}"
  echo "$REPORT_DATA" > "$DIR/$FILENAME"

  echo "Saved: $DIR/$FILENAME"
}

# Example: Save S1 reports
SCENARIO="S1_basic-report-generation"
TENANT="22222222-2222-4222-8222-222222222222"

# Get reports from API or download links
# (Implementation depends on API response format)

# Create test manifest
cat > "$TEST_RUN_DIR/metadata/test-manifest.json" << EOF
{
  "testRunId": "$(basename $TEST_RUN_DIR)",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "version": "1.0.0",
  "environment": {
    "NODE_ENV": "$NODE_ENV",
    "gitCommit": "$(git rev-parse HEAD)",
    "gitBranch": "$(git rev-parse --abbrev-ref HEAD)"
  },
  "scenarios": []
}
EOF

echo "Test manifest created"
```

---

## Validation & Verification

### PDF Validation

```bash
# Verify PDF integrity
validate_pdf() {
  local PDF_FILE=$1

  # Check file size
  SIZE=$(stat -f%z "$PDF_FILE" 2>/dev/null || stat -c%s "$PDF_FILE" 2>/dev/null)
  if [ $SIZE -lt 500 ]; then
    echo "ERROR: PDF too small ($SIZE bytes)"
    return 1
  fi

  # Check PDF magic number
  if ! file "$PDF_FILE" | grep -q "PDF"; then
    echo "ERROR: Not a valid PDF file"
    return 1
  fi

  # Extract text for validation
  TEXT=$(pdftotext "$PDF_FILE" - 2>/dev/null)

  # Check for required content
  if ! echo "$TEXT" | grep -q "AgenticVerdict"; then
    echo "ERROR: Missing expected content"
    return 1
  fi

  echo "PDF validation passed"
  return 0
}
```

### DOCX Validation

```bash
# Verify DOCX structure
validate_docx() {
  local DOCX_FILE=$1

  # DOCX is a ZIP file
  if ! unzip -t "$DOCX_FILE" &>/dev/null; then
    echo "ERROR: Not a valid DOCX file"
    return 1
  fi

  # Check for required DOCX components
  if ! unzip -l "$DOCX_FILE" | grep -q "word/document.xml"; then
    echo "ERROR: Missing document.xml"
    return 1
  fi

  echo "DOCX validation passed"
  return 0
}
```

### XLSX Validation

```bash
# Verify XLSX structure
validate_xlsx() {
  local XLSX_FILE=$1

  # XLSX is a ZIP file
  if ! unzip -t "$XLSX_FILE" &>/dev/null; then
    echo "ERROR: Not a valid XLSX file"
    return 1
  fi

  # Check for required XLSX components
  if ! unzip -l "$XLSX_FILE" | grep -q "xl/workbook.xml"; then
    echo "ERROR: Missing workbook.xml"
    return 1
  fi

  echo "XLSX validation passed"
  return 0
}
```

---

## Troubleshooting

### Common Pipeline Issues

| Issue                            | Symptom                   | Solution                                                   |
| -------------------------------- | ------------------------- | ---------------------------------------------------------- |
| Stage 1: Platform timeout        | Fetch takes > 5s          | Check network, verify credentials, examine circuit breaker |
| Stage 2: Normalization error     | Data transformation fails | Verify schema, check tenant context, review logs           |
| Stage 3: Agent timeout           | LLM call exceeds 30s      | Check API key, verify rate limits, consider fallback       |
| Stage 4: Report generation fails | PDF/DOCX errors           | Verify Chromium installation, check template syntax        |
| Stage 5: Delivery failure        | Email/webhook not sent    | Check delivery configuration, verify endpoints             |

---

**End of Document**

For integration with the main manual testing guide, see `manual-testing-guide.md`.
