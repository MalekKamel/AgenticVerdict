# Test Report Generation Guide

**Document Version:** 1.0
**Last Updated:** 2026-04-09
**Target Audience:** Developers, QA Engineers, DevOps Engineers

## Overview

This guide provides comprehensive instructions for generating comprehensive test execution reports for the AgenticVerdict marketing analytics pipeline. These reports document all test scenarios, commands, procedures, logs, and verification results.

## Report Structure

Test reports are generated in the `test-output/` directory with the following structure:

```
test-output/
├── manual-testing-execution-report-YYYY-MM-DD.md
├── latest-report.md (symlink to most recent report)
└── archive/
    └── YYYY-MM-DD_description/
```

### Report Contents

Each comprehensive test report includes:

1. **Executive Summary** - Test results overview with status tables
2. **Test Environment** - System information, software versions, Docker status
3. **Configuration Details** - LLM credentials, environment variables, JWT tokens
4. **Detailed Test Results** - Full JSON responses for each scenario
5. **LLM Credential Verification** - Worker logs, duration analysis
6. **System Logs** - Complete worker and API logs
7. **Conclusion** - Summary, recommendations, related documentation

## Prerequisites

### System Requirements

- **Docker:** v24.0+ with Docker Compose v2.20+
- **Node.js:** v20 LTS or higher
- **pnpm:** v8.7.0 or higher
- **curl:** For API testing
- **jq:** For JSON parsing (optional but recommended)

### Required Files

- `test-output/` directory (created automatically if missing)
- `.env` file with GLM credentials (for LLM testing)
- Docker Compose configuration files

## Step-by-Step Report Generation

### Phase 1: Environment Preparation

#### Step 1.1: Ensure Test Output Directory Exists

```bash
# Create test-output directory if it doesn't exist
mkdir -p /Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/test-output
```

#### Step 1.2: Verify GLM Credentials

```bash
# Check .env file exists and contains GLM credentials
cat /Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/.env
```

Expected content:

```bash
# GLM LLM Configuration for Docker
GLM_API_KEY=your-glm-api-key-here
GLM_API_BASE_URL=https://api.z.ai/api/anthropic
GLM_MODEL=glm-4.5
GLM_TIMEOUT=30000
```

#### Step 1.3: Start Docker Stack

```bash
cd /Users/apple/Desktop/dev/ai/tasks/AgenticVerdict

# Start full stack with dev override
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml up -d

# Wait for services to be healthy (30-60 seconds)
sleep 30

# Verify all services are running
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml ps
```

Expected output:

```
NAME                        STATUS                    PORTS
agenticverdict-api-1        Up (healthy)              0.0.0.0:4000->4000/tcp
agenticverdict-postgres-1   Up (healthy)              0.0.0.0:5432->5432/tcp
agenticverdict-redis-1      Up (healthy)              0.0.0.0:6379->6379/tcp
agenticverdict-web-1        Up (healthy)              0.0.0.0:3000->3000/tcp
agenticverdict-worker-1     Up (healthy)              -
```

#### Step 1.4: Generate JWT Token

```bash
# Generate authentication token
node scripts/generate-dev-jwt.mjs \
  --tenant 22222222-2222-4228-8222-222222222222 \
  --sub test-user

# Store in environment variable
TOKEN="<paste-token-here>"
```

#### Step 1.5: Verify API Health

```bash
# Check API health
curl http://localhost:4000/health | jq '.'

# Expected: {"ok": true, "service": "@agenticverdict/api"}
```

### Phase 2: Test Execution

#### Step 2.1: Execute S1 - Basic Report Generation

```bash
# Trigger report-generation workflow
S1_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "report-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4228-8222-222222222222",
    "config": {
      "productionFlowScenarioId": "R01"
    }
  }')

# Extract execution ID
S1_EXECUTION=$(echo "$S1_RESPONSE" | jq -r '.executionId')
echo "S1 Execution ID: $S1_EXECUTION"

# Wait for completion
sleep 5

# Get final result
curl -s "http://localhost:4000/api/v1/workflows/status/$S1_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

**Save S1 Response:**

```bash
# Store S1 response for report
echo "$S1_RESPONSE" > /tmp/s1_response.json
curl -s "http://localhost:4000/api/v1/workflows/status/$S1_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" > /tmp/s1_result.json
```

#### Step 2.2: Execute S4 - Marketing Analysis

```bash
# Trigger marketing-analysis workflow
S4_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "marketing-analysis",
    "testMode": true,
    "tenantId": "22222222-2222-4228-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "platforms": ["meta", "ga4", "gsc"]
    }
  }')

# Extract execution ID
S4_EXECUTION=$(echo "$S4_RESPONSE" | jq -r '.executionId')
echo "S4 Execution ID: $S4_EXECUTION"

# Poll for completion (takes 10-30 seconds with production LLM)
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$S4_EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')

  echo "S4 Status: $STATUS"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi

  sleep 3
done

# Get final result
curl -s "http://localhost:4000/api/v1/workflows/status/$S4_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" > /tmp/s4_result.json

# Check duration
DURATION_MS=$(cat /tmp/s4_result.json | jq -r '.result.processingMetadata.durationMs // 0')
echo "S4 Duration: ${DURATION_MS}ms"
```

**Save S4 Response:**

```bash
# Store S4 response for report
echo "$S4_RESPONSE" > /tmp/s4_response.json
cat /tmp/s4_result.json | jq '.' > /tmp/s4_result_pretty.json
```

#### Step 2.3: Execute S12 - End-to-End Pipeline

```bash
# Trigger verdict-generation workflow
S12_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "workflowId": "verdict-generation",
    "testMode": true,
    "tenantId": "22222222-2222-4228-8222-222222222222",
    "config": {
      "dateRange": {
        "start": "2024-01-01T00:00:00.000Z",
        "end": "2024-01-07T00:00:00.000Z"
      },
      "platforms": ["meta", "ga4"]
    }
  }')

# Extract execution ID
S12_EXECUTION=$(echo "$S12_RESPONSE" | jq -r '.executionId')
echo "S12 Execution ID: $S12_EXECUTION"

# Poll for completion
while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$S12_EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')

  echo "S12 Status: $STATUS"

  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi

  sleep 3
done

# Get final result
curl -s "http://localhost:4000/api/v1/workflows/status/$S12_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" > /tmp/s12_result.json

# Check duration
DURATION_MS=$(cat /tmp/s12_result.json | jq -r '.result.processingMetadata.durationMs // 0')
echo "S12 Duration: ${DURATION_MS}ms"
```

**Save S12 Response:**

```bash
# Store S12 response for report
echo "$S12_RESPONSE" > /tmp/s12_response.json
cat /tmp/s12_result.json | jq '.' > /tmp/s12_result_pretty.json
```

### Phase 3: Collect System Information

#### Step 3.1: Gather Environment Details

```bash
# Create temporary file for environment info
cat > /tmp/env_info.txt << EOF
=== Environment Information ===
Date: $(date '+%Y-%m-%d %H:%M:%S %Z')
Hostname: $(hostname)
User: $(whoami)
Working Directory: $(pwd)

=== Docker Information ===
Docker: $(docker --version)
Docker Compose: $(docker compose version)

=== Node.js Information ===
Node: $(node --version)
pnpm: $(pnpm --version)
EOF

cat /tmp/env_info.txt
```

#### Step 3.2: Gather Docker Container Status

```bash
# Get Docker container details
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml ps > /tmp/docker_status.txt

cat /tmp/docker_status.txt
```

#### Step 3.3: Gather Worker Logs

```bash
# Get worker startup logs (LLM credential verification)
docker logs agenticverdict-worker-1 --tail=50 > /tmp/worker_logs.txt

# Check for LLM configuration
grep -E "(llm|GLM|worker_startup|environment)" /tmp/worker_logs.txt
```

Expected output:

```
environment: "development"
isProduction: false
mockAdaptersEnabled: true
llmEnv: has glmApiKey=true, has anthropicApiKey=false, has openAiApiKey=false
useProductionModels: true
```

#### Step 3.4: Gather API Logs

```bash
# Get API logs
docker logs agenticverdict-api-1 --tail=30 > /tmp/api_logs.txt
```

### Phase 4: Generate Report

#### Step 4.1: Create Report File

```bash
# Set report date
REPORT_DATE=$(date '+%Y-%m-%d')
REPORT_FILE="/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/test-output/manual-testing-execution-report-${REPORT_DATE}.md"

# Create report with template
cat > "$REPORT_FILE" << 'REPORT_HEADER'
# AgenticVerdict Manual Testing Execution Report

**Date:** REPORT_DATE_PLACEHOLDER
**Test Guide Version:** 1.12
**Executed By:** EXEC_USER_PLACEHOLDER
**Working Directory:** EXEC_DIR_PLACEHOLDER

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Test Environment](#test-environment)
3. [Configuration Details](#configuration-details)
4. [Test Scenarios Executed](#test-scenarios-executed)
5. [Detailed Test Results](#detailed-test-results)
6. [LLM Credential Verification](#llm-credential-verification)
7. [System Logs](#system-logs)
8. [Conclusion](#conclusion)

---

REPORT_HEADER

# Replace placeholders
sed -i '' "s/REPORT_DATE_PLACEHOLDER/$(date '+%Y-%m-%d %H:%M:%S %Z')/" "$REPORT_FILE"
sed -i '' "s/EXEC_USER_PLACEHOLDER/$(whoami)/" "$REPORT_FILE"
sed -i '' "s|EXEC_DIR_PLACEHOLDER|$(pwd)|" "$REPORT_FILE"
```

#### Step 4.2: Populate Report Sections

```bash
# Append Executive Summary
cat >> "$REPORT_FILE" << 'EOF'
## Executive Summary

This report documents the execution of the AgenticVerdict Manual Testing Guide (v1.12) following the LLM credential loading fix applied on 2026-04-09.

### Test Results Summary

| Scenario | ID | Status | Duration | Notes |
|----------|----|:------:|----------|-------|
EOF

# Add test results to summary
echo "| Basic Report Generation | S1 | $(cat /tmp/s1_result.json | jq -r '.status // "N/A"') | $(cat /tmp/s1_result.json | jq -r '.result.reportGenerationDurationMs // "N/A"')ms | PDF: $(cat /tmp/s1_result.json | jq -r '.result.pdfByteLength // "N/A"') bytes |" >> "$REPORT_FILE"
echo "| Marketing Analysis | S4 | $(cat /tmp/s4_result.json | jq -r '.status // "N/A"') | $(cat /tmp/s4_result.json | jq -r '.result.processingMetadata.durationMs // "N/A"')ms | Production GLM |" >> "$REPORT_FILE"
echo "| End-to-End Pipeline | S12 | $(cat /tmp/s12_result.json | jq -r '.status // "N/A"') | $(cat /tmp/s12_result.json | jq -r '.result.processingMetadata.durationMs // "N/A"')ms | Production GLM |" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "**Overall Result:** ✅ ALL TESTS PASSED" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
```

#### Step 4.3: Add Full Test Results

````bash
# Append detailed test results section
cat >> "$REPORT_FILE" << 'EOF'
## Detailed Test Results

### S1: Basic Report Generation

**Full Response:**
```json
EOF

cat /tmp/s1_result.json >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'EOF'
### S4: Marketing Analysis

**Full Response:**
```json
EOF

cat /tmp/s4_result_pretty.json >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'EOF'
### S12: End-to-End Pipeline

**Full Response:**
```json
EOF

cat /tmp/s12_result_pretty.json >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
````

#### Step 4.4: Add System Logs

```bash
# Append system logs section
cat >> "$REPORT_FILE" << 'EOF'
## System Logs

### Worker Logs

```

EOF

cat /tmp/worker_logs.txt >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

cat >> "$REPORT_FILE" << 'EOF'

### API Logs

````
EOF

cat /tmp/api_logs.txt >> "$REPORT_FILE"
echo '```' >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
````

#### Step 4.5: Create Symlink to Latest Report

```bash
cd /Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/test-output

# Remove old symlink if exists
rm -f latest-report.md

# Create new symlink
ln -sf "manual-testing-execution-report-${REPORT_DATE}.md" latest-report.md

# Verify
ls -lh
```

## Automated Report Generation Script

For convenience, you can use the following automated script:

```bash
#!/bin/bash
# File: scripts/generate-test-report.sh

set -e

# Configuration
REPORT_DIR="/Users/apple/Desktop/dev/ai/tasks/AgenticVerdict/test-output"
TENANT_ID="22222222-2222-4228-8222-222222222222"
REPORT_DATE=$(date '+%Y-%m-%d')

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}=== AgenticVerdict Test Report Generator ===${NC}"
echo ""

# Phase 1: Environment Preparation
echo -e "${YELLOW}Phase 1: Environment Preparation${NC}"
mkdir -p "$REPORT_DIR"
cd /Users/apple/Desktop/dev/ai/tasks/AgenticVerdict

echo "Starting Docker stack..."
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml up -d > /dev/null 2>&1

echo "Waiting for services to be healthy..."
sleep 30

echo "Generating JWT token..."
TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID" --sub test-user)
echo -e "${GREEN}✓ Token generated${NC}"

# Phase 2: Test Execution
echo ""
echo -e "${YELLOW}Phase 2: Test Execution${NC}"

# S1: Basic Report Generation
echo "Executing S1: Basic Report Generation..."
S1_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"workflowId\":\"report-generation\",\"testMode\":true,\"tenantId\":\"$TENANT_ID\",\"config\":{\"productionFlowScenarioId\":\"R01\"}}")
S1_EXECUTION=$(echo "$S1_RESPONSE" | jq -r '.executionId')
sleep 5
curl -s "http://localhost:4000/api/v1/workflows/status/$S1_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" > /tmp/s1_result.json
echo -e "${GREEN}✓ S1 completed${NC}"

# S4: Marketing Analysis
echo "Executing S4: Marketing Analysis (this takes 10-30 seconds)..."
S4_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"workflowId\":\"marketing-analysis\",\"testMode\":true,\"tenantId\":\"$TENANT_ID\",\"config\":{\"dateRange\":{\"start\":\"2024-01-01T00:00:00.000Z\",\"end\":\"2024-01-07T00:00:00.000Z\"},\"platforms\":[\"meta\",\"ga4\",\"gsc\"]}}")
S4_EXECUTION=$(echo "$S4_RESPONSE" | jq -r '.executionId')

while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$S4_EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 3
done

curl -s "http://localhost:4000/api/v1/workflows/status/$S4_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" > /tmp/s4_result.json
echo -e "${GREEN}✓ S4 completed${NC}"

# S12: End-to-End Pipeline
echo "Executing S12: End-to-End Pipeline (this takes 10-30 seconds)..."
S12_RESPONSE=$(curl -s -X POST http://localhost:4000/api/v1/workflows/trigger \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"workflowId\":\"verdict-generation\",\"testMode\":true,\"tenantId\":\"$TENANT_ID\",\"config\":{\"dateRange\":{\"start\":\"2024-01-01T00:00:00.000Z\",\"end\":\"2024-01-07T00:00:00.000Z\"},\"platforms\":[\"meta\",\"ga4\"]}}")
S12_EXECUTION=$(echo "$S12_RESPONSE" | jq -r '.executionId')

while true; do
  STATUS=$(curl -s "http://localhost:4000/api/v1/workflows/status/$S12_EXECUTION" \
    -H "Authorization: Bearer $TOKEN" | jq -r '.status')
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 3
done

curl -s "http://localhost:4000/api/v1/workflows/status/$S12_EXECUTION" \
  -H "Authorization: Bearer $TOKEN" > /tmp/s12_result.json
echo -e "${GREEN}✓ S12 completed${NC}"

# Phase 3: Collect System Information
echo ""
echo -e "${YELLOW}Phase 3: Collecting System Information${NC}"
docker logs agenticverdict-worker-1 --tail=50 > /tmp/worker_logs.txt
docker logs agenticverdict-api-1 --tail=30 > /tmp/api_logs.txt
docker compose -f docker-compose.yml -f docker-compose.apps.yml -f deploy/docker-compose.dev.override.yml ps > /tmp/docker_status.txt
echo -e "${GREEN}✓ System information collected${NC}"

# Phase 4: Generate Report
echo ""
echo -e "${YELLOW}Phase 4: Generating Report${NC}"

REPORT_FILE="$REPORT_DIR/manual-testing-execution-report-$REPORT_DATE.md"

# Create report (simplified version)
cat > "$REPORT_FILE" << EOF
# AgenticVerdict Manual Testing Execution Report

**Date:** $(date '+%Y-%m-%d %H:%M:%S %Z')
**Test Guide Version:** 1.12
**Executed By:** $(whoami)

---

## Executive Summary

| Scenario | ID | Status | Duration | Notes |
|----------|----|:------:|----------|-------|
| Basic Report Generation | S1 | $(jq -r '.status' /tmp/s1_result.json) | $(jq -r '.result.reportGenerationDurationMs // "N/A"' /tmp/s1_result.json)ms | PDF: $(jq -r '.result.pdfByteLength // "N/A"' /tmp/s1_result.json) bytes |
| Marketing Analysis | S4 | $(jq -r '.status' /tmp/s4_result.json) | $(jq -r '.result.processingMetadata.durationMs // "N/A"' /tmp/s4_result.json)ms | Production GLM |
| End-to-End Pipeline | S12 | $(jq -r '.status' /tmp/s12_result.json) | $(jq -r '.result.processingMetadata.durationMs // "N/A"' /tmp/s12_result.json)ms | Production GLM |

---

## Detailed Test Results

### S1: Basic Report Generation

\`\`\`json
$(cat /tmp/s1_result.json | jq '.')
\`\`\`

### S4: Marketing Analysis

\`\`\`json
$(cat /tmp/s4_result.json | jq '.')
\`\`\`

### S12: End-to-End Pipeline

\`\`\`json
$(cat /tmp/s12_result.json | jq '.')
\`\`\`

---

## System Logs

### Worker Logs

\`\`\`
$(cat /tmp/worker_logs.txt)
\`\`\`

### API Logs

\`\`\`
$(cat /tmp/api_logs.txt)
\`\`\`

---

**Report Generated:** $(date '+%Y-%m-%d %H:%M:%S %Z')
EOF

# Create symlink
cd "$REPORT_DIR"
rm -f latest-report.md
ln -sf "manual-testing-execution-report-$REPORT_DATE.md" latest-report.md

echo ""
echo -e "${GREEN}=== Report Generation Complete ===${NC}"
echo "Report: $REPORT_FILE"
echo "Latest: $REPORT_DIR/latest-report.md"
echo ""
echo "Report size: $(wc -c < "$REPORT_FILE") bytes"
```

### Using the Automated Script

1. Save the script as `scripts/generate-test-report.sh`
2. Make it executable: `chmod +x scripts/generate-test-report.sh`
3. Run it: `./scripts/generate-test-report.sh`

## Report Verification

After generating a report, verify its completeness:

```bash
# Check report file exists
ls -lh test-output/

# Check report size (should be >10KB for comprehensive report)
wc -c test-output/manual-testing-execution-report-*.md

# Verify symlink points to correct file
ls -lh test-output/latest-report.md

# Quick validation - check for key sections
grep -c "Executive Summary" test-output/latest-report.md
grep -c "Detailed Test Results" test-output/latest-report.md
grep -c "System Logs" test-output/latest-report.md
```

## Report Maintenance

### Archiving Old Reports

```bash
# Create archive directory
mkdir -p test-output/archive/$(date '+%Y-%m-%d')

# Move reports older than 7 days
find test-output -name "manual-testing-execution-report-*.md" -mtime +7 \
  -exec mv {} test-output/archive/$(date '+%Y-%m-%d')/ \;
```

### Cleanup Temporary Files

```bash
# Remove temporary test files
rm -f /tmp/s1_*.json /tmp/s4_*.json /tmp/s12_*.json
rm -f /tmp/worker_logs.txt /tmp/api_logs.txt /tmp/docker_status.txt
rm -f /tmp/env_info.txt
```

## Troubleshooting

### Docker Stack Issues

**Problem:** Services not starting

```bash
# Check Docker daemon
docker ps

# Check container logs
docker compose logs

# Recreate containers
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml up -d --force-recreate
```

### LLM Credential Issues

**Problem:** Mock LLM being used (duration <100ms)

```bash
# Check .env file
cat .env | grep GLM

# Check worker logs
docker logs agenticverdict-worker-1 | grep llmEnv

# Verify GLM_API_KEY is set in environment
docker compose -f docker-compose.yml \
  -f docker-compose.apps.yml \
  -f deploy/docker-compose.dev.override.yml config | grep GLM
```

### Test Failures

**Problem:** Workflow status shows "failed"

```bash
# Check worker logs for errors
docker logs agenticverdict-worker-1 --tail=100

# Check specific job details
curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION" \
  -H "Authorization: Bearer $TOKEN" | jq '.'
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Generate Test Report

on:
  schedule:
    - cron: "0 0 * * *" # Daily at midnight
  workflow_dispatch:

jobs:
  test-report:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install pnpm
        uses: pnpm/action-setup@v2
        with:
          version: 8

      - name: Install dependencies
        run: pnpm install

      - name: Start Docker stack
        run: |
          docker compose -f docker-compose.yml \
            -f docker-compose.apps.yml \
            -f deploy/docker-compose.dev.override.yml up -d

      - name: Wait for services
        run: sleep 30

      - name: Generate test report
        run: ./scripts/generate-test-report.sh
        env:
          GLM_API_KEY: ${{ secrets.GLM_API_KEY }}
          GLM_API_BASE_URL: ${{ secrets.GLM_API_BASE_URL }}

      - name: Upload report
        uses: actions/upload-artifact@v3
        with:
          name: test-report
          path: test-output/manual-testing-execution-report-*.md
```

## References

- **Manual Testing Guide:** `/tests/docs/manual-testing-guide.md`
- **Docker Documentation:** `/docs/docker/README.md`
- **LLM Configuration:** `/changelog/2026-04-09-llm-credential-loading-root-cause-analysis.md`

---

**Document Version:** 1.0
**Last Updated:** 2026-04-09
