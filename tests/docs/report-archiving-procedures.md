# Report Archiving Procedures

**Document Version:** 1.0
**Last Updated:** 2026-04-09
**Purpose:** Comprehensive procedures for generating, validating, and archiving all report formats to the `test-output/` directory during manual testing.

---

## Table of Contents

1. [Overview](#overview)
2. [Archiving Setup](#archiving-setup)
3. [Format-Specific Archiving](#format-specific-archiving)
4. [Automated Archiving Scripts](#automated-archiving-scripts)
5. [Validation & Verification](#validation--verification)
6. [Manifest Generation](#manifest-generation)

---

## Overview

The report archiving system ensures all test outputs are systematically saved, organized, and validated. This enables:

- Complete audit trail of all test runs
- Regression testing capabilities
- Format validation across all report types
- Historical comparison of report outputs
- Compliance with testing documentation requirements

### Supported Report Formats

| Format | Extension | Generation Method       | Validation Priority |
| ------ | --------- | ----------------------- | ------------------- |
| PDF    | `.pdf`    | Playwright Chromium     | P0                  |
| DOCX   | `.docx`   | HTML to Word conversion | P0                  |
| XLSX   | `.xlsx`   | HTML tables to Excel    | P0                  |
| HTML   | `.html`   | Direct rendering        | P1                  |
| JSON   | `.json`   | Structured export       | P1                  |

---

## Archiving Setup

### Initial Directory Structure

```bash
# Create base directory structure
TEST_RUN_BASE="test-output/archive/$(date +%Y-%m-%d)_manual-test"
mkdir -p "$TEST_RUN_BASE"/{scenarios,metadata,templates,localization}

# Create format subdirectories for each scenario
for scenario in S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12; do
  mkdir -p "$TEST_RUN_BASE/scenarios/${scenario}"/{pdf,docx,xlsx,html,json}
done

# Create production flow scenario directories
for pf in R01 R02 R03 R04 R05 R06 R07 R08 R09 R10 R11 R12; do
  mkdir -p "$TEST_RUN_BASE/scenarios/production-flow/${pf}"/{pdf,docx,xlsx,html,json}
done

# Create template directories
for template in executive-summary detailed-analysis technical-appendix; do
  mkdir -p "$TEST_RUN_BASE/templates/${template}"/{pdf,docx,xlsx,html,json}
done

# Create localization directories
mkdir -p "$TEST_RUN_BASE/localization"/{en_ltr,ar_rtl,fr_ltr}/{pdf,docx,xlsx,html,json}

echo "Archive structure created at: $TEST_RUN_BASE"
```

### Environment Configuration

```bash
# Set archiving environment variables
export TEST_OUTPUT_DIR="$PWD/test-output"
export TEST_RUN_ID="$(date +%Y-%m-%d)_manual-test"
export ARCHIVE_DIR="$TEST_OUTPUT_DIR/archive/$TEST_RUN_ID"

# Create manifest file
cat > "$ARCHIVE_DIR/metadata/test-manifest.json" << EOF
{
  "testRunId": "$TEST_RUN_ID",
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
```

---

## Format-Specific Archiving

### PDF Report Archiving

#### Generation & Archival Procedure

```bash
#!/bin/bash
# archive_pdf.sh - Archive PDF reports

archive_pdf_report() {
  local SCENARIO_ID=$1
  local TENANT_ID=$2
  local EXECUTION_ID=$3
  local OUTPUT_DIR=$4

  echo "Archiving PDF report for scenario $SCENARIO_ID..."

  # Generate authentication token
  local TOKEN=$(
    node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
  )

  # Get workflow result
  local RESULT=$(
    curl -s "http://localhost:4000/api/v1/workflows/status/$EXECUTION_ID" \
      -H "Authorization: Bearer $TOKEN"
  )

  # Extract PDF data if available in response
  # Note: Implementation depends on API response format

  # Alternative: Download from URL if provided
  local PDF_URL=$(echo "$RESULT" | jq -r '.result.reportUrl // empty')

  if [ -n "$PDF_URL" ]; then
    local TENANT_SHORT="${TENANT_ID:0:8}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local FILENAME="report_${SCENARIO_ID}_${TENANT_SHORT}_${TIMESTAMP}.pdf"
    local FILEPATH="$OUTPUT_DIR/$FILENAME"

    # Download PDF
    curl -s "$PDF_URL" -o "$FILEPATH"

    # Validate PDF
    if validate_pdf "$FILEPATH"; then
      local SIZE=$(stat -f%z "$FILEPATH" 2>/dev/null || stat -c%s "$FILEPATH" 2>/dev/null)

      echo "✓ PDF archived: $FILEPATH ($SIZE bytes)"

      # Return metadata for manifest
      jq -n \
        --arg format "pdf" \
        --arg path "$FILEPATH" \
        --argjson size "$SIZE" \
        --argjson validation '{"minBytesOk":true,"shellDir":"ltr","shellLang":"en"}' \
        '{format: $format, path: $path, sizeBytes: $size, validation: $validation}'
    else
      echo "✗ PDF validation failed: $FILEPATH"
      return 1
    fi
  else
    echo "✗ No PDF URL in response"
    return 1
  fi
}

# Validation function
validate_pdf() {
  local PDF_FILE=$1

  # Check file exists and has content
  if [ ! -s "$PDF_FILE" ]; then
    echo "ERROR: PDF file is empty or missing"
    return 1
  fi

  # Check minimum size
  local SIZE=$(stat -f%z "$PDF_FILE" 2>/dev/null || stat -c%s "$PDF_FILE" 2>/dev/null)
  if [ $SIZE -lt 500 ]; then
    echo "ERROR: PDF too small ($SIZE bytes, minimum 500)"
    return 1
  fi

  # Check PDF magic number
  if ! file "$PDF_FILE" | grep -q "PDF"; then
    echo "ERROR: Not a valid PDF file"
    return 1
  fi

  # Extract and validate content
  if command -v pdftotext &>/dev/null; then
    local TEXT=$(pdftotext "$PDF_FILE" - 2>/dev/null)

    # Check for required content
    if ! echo "$TEXT" | grep -qi "agenticverdict"; then
      echo "WARNING: PDF may be missing expected content"
    fi
  fi

  return 0
}

# Usage
# archive_pdf_report "S1" "22222222-2222-4222-8222-222222222222" "$EXECUTION_ID" "$ARCHIVE_DIR/scenarios/S1_basic-report-generation/pdf"
```

#### Validation Checklist

- [ ] File size > 500 bytes
- [ ] Valid PDF format (magic number check)
- [ ] Contains expected content
- [ ] Properly formatted text extraction
- [ ] No corruption errors
- [ ] Metadata preserved

---

### DOCX Report Archiving

#### Generation & Archival Procedure

```bash
#!/bin/bash
# archive_docx.sh - Archive DOCX reports

archive_docx_report() {
  local SCENARIO_ID=$1
  local TENANT_ID=$2
  local REPORT_ID=$3
  local OUTPUT_DIR=$4

  echo "Archiving DOCX report for scenario $SCENARIO_ID..."

  local TOKEN=$(
    node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
  )

  # Get report details
  local REPORT_INFO=$(
    curl -s "http://localhost:4000/api/v1/reports/$REPORT_ID" \
      -H "Authorization: Bearer $TOKEN"
  )

  # Download DOCX if available
  local DOCX_URL=$(echo "$REPORT_INFO" | jq -r '.formats.docx.url // empty')

  if [ -n "$DOCX_URL" ]; then
    local TENANT_SHORT="${TENANT_ID:0:8}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local FILENAME="report_${SCENARIO_ID}_${TENANT_SHORT}_${TIMESTAMP}.docx"
    local FILEPATH="$OUTPUT_DIR/$FILENAME"

    curl -s "$DOCX_URL" -o "$FILEPATH"

    if validate_docx "$FILEPATH"; then
      local SIZE=$(stat -f%z "$FILEPATH" 2>/dev/null || stat -c%s "$FILEPATH" 2>/dev/null)
      echo "✓ DOCX archived: $FILEPATH ($SIZE bytes)"
      return 0
    else
      echo "✗ DOCX validation failed"
      return 1
    fi
  fi
}

validate_docx() {
  local DOCX_FILE=$1

  # Check file is a valid ZIP
  if ! unzip -t "$DOCX_FILE" &>/dev/null; then
    echo "ERROR: Not a valid DOCX/ZIP file"
    return 1
  fi

  # Check for required OOXML components
  local REQUIRED_FILES=(
    "[Content_Types].xml"
    "_rels/.rels"
    "word/document.xml"
  )

  for file in "${REQUIRED_FILES[@]}"; do
    if ! unzip -l "$DOCX_FILE" | grep -q "$file"; then
      echo "ERROR: Missing required DOCX component: $file"
      return 1
    fi
  done

  # Validate document.xml structure
  local DOC_XML=$(unzip -p "$DOCX_FILE" word/document.xml 2>/dev/null)
  if ! echo "$DOC_XML" | grep -q "<w:document"; then
    echo "ERROR: Invalid document.xml structure"
    return 1
  fi

  return 0
}
```

#### Validation Checklist

- [ ] Valid ZIP/DOCX format
- [ ] Contains required OOXML components
- [ ] Valid document.xml structure
- [ ] Styles preserved
- [ ] No corruption errors

---

### XLSX Report Archiving

#### Generation & Archival Procedure

```bash
#!/bin/bash
# archive_xlsx.sh - Archive XLSX reports

archive_xlsx_report() {
  local SCENARIO_ID=$1
  local TENANT_ID=$2
  local REPORT_ID=$3
  local OUTPUT_DIR=$4

  echo "Archiving XLSX report for scenario $SCENARIO_ID..."

  local TOKEN=$(
    node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
  )

  local REPORT_INFO=$(
    curl -s "http://localhost:4000/api/v1/reports/$REPORT_ID" \
      -H "Authorization: Bearer $TOKEN"
  )

  local XLSX_URL=$(echo "$REPORT_INFO" | jq -r '.formats.xlsx.url // empty')

  if [ -n "$XLSX_URL" ]; then
    local TENANT_SHORT="${TENANT_ID:0:8}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local FILENAME="report_${SCENARIO_ID}_${TENANT_SHORT}_${TIMESTAMP}.xlsx"
    local FILEPATH="$OUTPUT_DIR/$FILENAME"

    curl -s "$XLSX_URL" -o "$FILEPATH"

    if validate_xlsx "$FILEPATH"; then
      local SIZE=$(stat -f%z "$FILEPATH" 2>/dev/null || stat -c%s "$FILEPATH" 2>/dev/null)
      echo "✓ XLSX archived: $FILEPATH ($SIZE bytes)"
      return 0
    else
      echo "✗ XLSX validation failed"
      return 1
    fi
  fi
}

validate_xlsx() {
  local XLSX_FILE=$1

  # Check file is a valid ZIP
  if ! unzip -t "$XLSX_FILE" &>/dev/null; then
    echo "ERROR: Not a valid XLSX/ZIP file"
    return 1
  fi

  # Check for required XLSX components
  local REQUIRED_FILES=(
    "[Content_Types].xml"
    "_rels/.rels"
    "xl/workbook.xml"
    "xl/worksheets/sheet1.xml"
  )

  for file in "${REQUIRED_FILES[@]}"; do
    if ! unzip -l "$XLSX_FILE" | grep -q "$file"; then
      echo "ERROR: Missing required XLSX component: $file"
      return 1
    fi
  done

  # Validate workbook structure
  local WB_XML=$(unzip -p "$XLSX_FILE" xl/workbook.xml 2>/dev/null)
  if ! echo "$WB_XML" | grep -q "<workbook"; then
    echo "ERROR: Invalid workbook.xml structure"
    return 1
  fi

  return 0
}
```

#### Validation Checklist

- [ ] Valid ZIP/XLSX format
- [ ] Contains required spreadsheet components
- [ ] Valid workbook structure
- [ ] Worksheets present
- [ ] Data integrity preserved

---

### HTML Report Archiving

#### Generation & Archival Procedure

```bash
#!/bin/bash
# archive_html.sh - Archive HTML reports

archive_html_report() {
  local SCENARIO_ID=$1
  local TENANT_ID=$2
  local REPORT_ID=$3
  local OUTPUT_DIR=$4

  echo "Archiving HTML report for scenario $SCENARIO_ID..."

  local TOKEN=$(
    node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
  )

  local REPORT_INFO=$(
    curl -s "http://localhost:4000/api/v1/reports/$REPORT_ID" \
      -H "Authorization: Bearer $TOKEN"
  )

  local HTML_URL=$(echo "$REPORT_INFO" | jq -r '.formats.html.url // empty')

  if [ -n "$HTML_URL" ]; then
    local TENANT_SHORT="${TENANT_ID:0:8}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local FILENAME="report_${SCENARIO_ID}_${TENANT_SHORT}_${TIMESTAMP}.html"
    local FILEPATH="$OUTPUT_DIR/$FILENAME"

    curl -s "$HTML_URL" -o "$FILEPATH"

    if validate_html "$FILEPATH"; then
      local SIZE=$(stat -f%z "$FILEPATH" 2>/dev/null || stat -c%s "$FILEPATH" 2>/dev/null)
      echo "✓ HTML archived: $FILEPATH ($SIZE bytes)"
      return 0
    else
      echo "✗ HTML validation failed"
      return 1
    fi
  fi
}

validate_html() {
  local HTML_FILE=$1

  # Check for valid HTML structure
  if ! grep -q "<!DOCTYPE html" "$HTML_FILE" && \
     ! grep -q "<html" "$HTML_FILE"; then
    echo "ERROR: Not a valid HTML file"
    return 1
  fi

  # Check for required HTML elements
  local REQUIRED_TAGS=("html" "head" "body")
  for tag in "${REQUIRED_TAGS[@]}"; do
    if ! grep -qi "<$tag" "$HTML_FILE"; then
      echo "ERROR: Missing <$tag> tag"
      return 1
    fi
  done

  # Check for charset declaration
  if ! grep -qi "charset" "$HTML_FILE"; then
    echo "WARNING: Missing charset declaration"
  fi

  return 0
}
```

#### Validation Checklist

- [ ] Valid HTML structure
- [ ] Required tags present
- [ ] Charset declaration present
- [ ] CSS styles preserved
- [ ] Responsive layout maintained

---

### JSON Report Archiving

#### Generation & Archival Procedure

```bash
#!/bin/bash
# archive_json.sh - Archive JSON reports

archive_json_report() {
  local SCENARIO_ID=$1
  local TENANT_ID=$2
  local REPORT_ID=$3
  local OUTPUT_DIR=$4

  echo "Archiving JSON report for scenario $SCENARIO_ID..."

  local TOKEN=$(
    node scripts/generate-dev-jwt.mjs --tenant "$TENANT_ID"
  )

  local REPORT_INFO=$(
    curl -s "http://localhost:4000/api/v1/reports/$REPORT_ID" \
      -H "Authorization: Bearer $TOKEN"
  )

  local JSON_URL=$(echo "$REPORT_INFO" | jq -r '.formats.json.url // empty')

  if [ -n "$JSON_URL" ]; then
    local TENANT_SHORT="${TENANT_ID:0:8}"
    local TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    local FILENAME="report_${SCENARIO_ID}_${TENANT_SHORT}_${TIMESTAMP}.json"
    local FILEPATH="$OUTPUT_DIR/$FILENAME"

    curl -s "$JSON_URL" -o "$FILEPATH"

    if validate_json "$FILEPATH"; then
      local SIZE=$(stat -f%z "$FILEPATH" 2>/dev/null || stat -c%s "$FILEPATH" 2>/dev/null)
      echo "✓ JSON archived: $FILEPATH ($SIZE bytes)"

      # Pretty print for readability
      jq '.' "$FILEPATH" > "${FILEPATH}.pretty"
      mv "${FILEPATH}.pretty" "$FILEPATH"

      return 0
    else
      echo "✗ JSON validation failed"
      return 1
    fi
  fi
}

validate_json() {
  local JSON_FILE=$1

  # Validate JSON syntax
  if ! jq empty "$JSON_FILE" 2>/dev/null; then
    echo "ERROR: Invalid JSON syntax"
    return 1
  fi

  # Check for required top-level keys
  local REQUIRED_KEYS=(
    "reportId"
    "tenantId"
    "generatedAt"
    "data"
  )

  for key in "${REQUIRED_KEYS[@]}"; do
    if ! jq -e ".has(\"$key\")" "$JSON_FILE" &>/dev/null; then
      echo "ERROR: Missing required key: $key"
      return 1
    fi
  done

  return 0
}
```

#### Validation Checklist

- [ ] Valid JSON syntax
- [ ] Required keys present
- [ ] Data types correct
- [ ] No null values in required fields
- [ ] Timestamps in ISO 8601 format

---

## Automated Archiving Scripts

### Complete Scenario Archiver

```bash
#!/bin/bash
# archive_scenario.sh - Archive all formats for a scenario

archive_scenario_all_formats() {
  local SCENARIO_ID=$1
  local TENANT_ID=$2
  local EXECUTION_ID=$3
  local REPORT_ID=$4
  local BASE_DIR=$5

  echo "================================"
  echo "Archiving Scenario: $SCENARIO_ID"
  echo "Tenant: $TENANT_ID"
  echo "================================"

  local SCENARIO_DIR="$BASE_DIR/scenarios/${SCENARIO_ID}"
  local METADATA_FILE="$BASE_DIR/metadata/test-manifest.json"

  # Initialize scenario entry in manifest
  local MANIFEST_ENTRY=$(jq -n \
    --arg scenarioId "$SCENARIO_ID" \
    --arg scenarioName "Test Scenario $SCENARIO_ID" \
    --arg tenantId "$TENANT_ID" \
    '{scenarioId: $scenarioId, scenarioName: $scenarioName, tenantId: $tenantId, formats: []}')

  # Archive each format
  for FORMAT in pdf docx xlsx html json; do
    echo ""
    echo "Processing $FORMAT..."

    local FORMAT_DIR="$SCENARIO_DIR/$FORMAT"
    mkdir -p "$FORMAT_DIR"

    local FORMAT_METADATA

    case $FORMAT in
      pdf)
        FORMAT_METADATA=$(archive_pdf_report "$SCENARIO_ID" "$TENANT_ID" "$EXECUTION_ID" "$FORMAT_DIR")
        ;;
      docx)
        FORMAT_METADATA=$(archive_docx_report "$SCENARIO_ID" "$TENANT_ID" "$REPORT_ID" "$FORMAT_DIR")
        ;;
      xlsx)
        FORMAT_METADATA=$(archive_xlsx_report "$SCENARIO_ID" "$TENANT_ID" "$REPORT_ID" "$FORMAT_DIR")
        ;;
      html)
        FORMAT_METADATA=$(archive_html_report "$SCENARIO_ID" "$TENANT_ID" "$REPORT_ID" "$FORMAT_DIR")
        ;;
      json)
        FORMAT_METADATA=$(archive_json_report "$SCENARIO_ID" "$TENANT_ID" "$REPORT_ID" "$FORMAT_DIR")
        ;;
    esac

    if [ $? -eq 0 ]; then
      # Add format metadata to manifest entry
      MANIFEST_ENTRY=$(echo "$MANIFEST_ENTRY" | jq --argjson fmt "$FORMAT_METADATA" '.formats += [$fmt]')
    fi
  done

  echo ""
  echo "Scenario $SCENARIO_ID archiving complete"
  echo ""

  # Update manifest
  jq --argjson entry "$MANIFEST_ENTRY" '.scenarios += [$entry]' "$METADATA_FILE" > "${METADATA_FILE}.tmp"
  mv "${METADATA_FILE}.tmp" "$METADATA_FILE"

  return 0
}

# Usage example:
# archive_scenario_all_formats \
#   "S1" \
#   "22222222-2222-4222-8222-222222222222" \
#   "$EXECUTION_ID" \
#   "$REPORT_ID" \
#   "$ARCHIVE_DIR"
```

### Multi-Scenario Batch Archiver

```bash
#!/bin/bash
# archive_test_run.sh - Archive complete test run

archive_complete_test_run() {
  local BASE_DIR=${1:-"test-output/archive/$(date +%Y-%m-%d)_manual-test"}
  local SCENARIOS=${2:-"S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12"}

  echo "========================================"
  echo "Complete Test Run Archiver"
  echo "Output Directory: $BASE_DIR"
  echo "========================================"
  echo ""

  # Create directory structure
  mkdir -p "$BASE_DIR"/{scenarios,metadata,templates,localization}

  for scenario in $SCENARIOS; do
    for format in pdf docx xlsx html json; do
      mkdir -p "$BASE_DIR/scenarios/$scenario/$format"
    done
  done

  # Create production flow directories
  for pf in R01 R02 R03 R04 R05 R06 R07 R08 R09 R10 R11 R12; do
    for format in pdf docx xlsx html json; do
      mkdir -p "$BASE_DIR/scenarios/production-flow/$pf/$format"
    done
  done

  # Create template directories
  for template in executive-summary detailed-analysis technical-appendix; do
    for format in pdf docx xlsx html json; do
      mkdir -p "$BASE_DIR/templates/$template/$format"
    done
  done

  # Create localization directories
  for locale in en_ltr ar_rtl fr_ltr; do
    for format in pdf docx xlsx html json; do
      mkdir -p "$BASE_DIR/localization/$locale/$format"
    done
  done

  # Initialize manifest
  cat > "$BASE_DIR/metadata/test-manifest.json" << EOF
{
  "testRunId": "$(basename $BASE_DIR)",
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

  echo "Directory structure created"
  echo "Manifest initialized"
  echo ""
  echo "Run individual scenario archivers to populate:"
  for scenario in $SCENARIOS; do
    echo "  - archive_scenario_all_formats $scenario ..."
  done
  echo ""

  # Create summary markdown
  cat > "$BASE_DIR/metadata/test-summary.md" << EOF
# Test Run Summary

**Test Run ID:** $(basename $BASE_DIR)
**Timestamp:** $(date -u +%Y-%m-%dT%H:%M:%SZ)
**Environment:** $NODE_ENV

## Test Scenarios

| Scenario | Status | Notes |
|----------|--------|-------|
$(for scenario in $SCENARIOS; do echo "| $scenario | - | Pending |"; done)

## Report Formats

All scenarios should generate reports in the following formats:
- PDF (Portable Document Format)
- DOCX (Microsoft Word)
- XLSX (Microsoft Excel)
- HTML (Web)
- JSON (Machine-readable)

## Localization

| Language | Direction | Status |
|----------|-----------|--------|
| English | LTR | Pending |
| Arabic | RTL | Pending |
| French | LTR | Pending |

---

*This summary will be updated as tests complete.*
EOF

  echo "Test run initialized at: $BASE_DIR"
  echo "Summary file: $BASE_DIR/metadata/test-summary.md"
}

# Usage:
# archive_complete_test_run "test-output/archive/2026-04-09_full-pipeline-test"
```

---

## Validation & Verification

### Comprehensive Validation Suite

```bash
#!/bin/bash
# validate_archive.sh - Validate archived reports

validate_archive() {
  local ARCHIVE_DIR=$1

  echo "========================================"
  echo "Archive Validation"
  echo "Directory: $ARCHIVE_DIR"
  echo "========================================"
  echo ""

  local VALIDATION_FILE="$ARCHIVE_DIR/metadata/validation-results.json"

  # Initialize validation results
  cat > "$VALIDATION_FILE" << EOF
{
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "archiveDirectory": "$ARCHIVE_DIR",
  "results": []
}
EOF

  # Validate all PDF files
  echo "Validating PDF files..."
  find "$ARCHIVE_DIR" -name "*.pdf" -type f | while read -r pdf; do
    if validate_pdf "$pdf"; then
      echo "  ✓ $(basename $pdf)"
      jq --arg file "$pdf" --arg status "valid" '.results += [{file: $file, format: "pdf", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    else
      echo "  ✗ $(basename $pdf)"
      jq --arg file "$pdf" --arg status "invalid" '.results += [{file: $file, format: "pdf", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    fi
  done

  # Validate all DOCX files
  echo "Validating DOCX files..."
  find "$ARCHIVE_DIR" -name "*.docx" -type f | while read -r docx; do
    if validate_docx "$docx"; then
      echo "  ✓ $(basename $docx)"
      jq --arg file "$docx" --arg status "valid" '.results += [{file: $docx, format: "docx", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    else
      echo "  ✗ $(basename $docx)"
      jq --arg file "$docx" --arg status "invalid" '.results += [{file: $docx, format: "docx", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    fi
  done

  # Validate all XLSX files
  echo "Validating XLSX files..."
  find "$ARCHIVE_DIR" -name "*.xlsx" -type f | while read -r xlsx; do
    if validate_xlsx "$xlsx"; then
      echo "  ✓ $(basename $xlsx)"
      jq --arg file "$xlsx" --arg status "valid" '.results += [{file: $xlsx, format: "xlsx", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    else
      echo "  ✗ $(basename $xlsx)"
      jq --arg file "$xlsx" --arg status "invalid" '.results += [{file: $xlsx, format: "xlsx", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    fi
  done

  # Validate all HTML files
  echo "Validating HTML files..."
  find "$ARCHIVE_DIR" -name "*.html" -type f | while read -r html; do
    if validate_html "$html"; then
      echo "  ✓ $(basename $html)"
      jq --arg file "$html" --arg status "valid" '.results += [{file: $html, format: "html", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    else
      echo "  ✗ $(basename $html)"
      jq --arg file "$html" --arg status "invalid" '.results += [{file: $html, format: "html", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    fi
  done

  # Validate all JSON files
  echo "Validating JSON files..."
  find "$ARCHIVE_DIR" -name "*.json" -type f | while read -r json; do
    if validate_json "$json"; then
      echo "  ✓ $(basename $json)"
      jq --arg file "$json" --arg status "valid" '.results += [{file: $json, format: "json", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    else
      echo "  ✗ $(basename $json)"
      jq --arg file "$json" --arg status "invalid" '.results += [{file: $json, format: "json", status: $status}]' "$VALIDATION_FILE" > "${VALIDATION_FILE}.tmp"
      mv "${VALIDATION_FILE}.tmp" "$VALIDATION_FILE"
    fi
  done

  # Print summary
  echo ""
  echo "========================================"
  echo "Validation Summary"
  echo "========================================"

  local TOTAL=$(jq '.results | length' "$VALIDATION_FILE")
  local VALID=$(jq '[.results[] | select(.status == "valid")] | length' "$VALIDATION_FILE")
  local INVALID=$(jq '[.results[] | select(.status == "invalid")] | length' "$VALIDATION_FILE")

  echo "Total files: $TOTAL"
  echo "Valid: $VALID"
  echo "Invalid: $INVALID"
  echo ""

  if [ $INVALID -gt 0 ]; then
    echo "⚠️  Some files failed validation"
    return 1
  else
    echo "✅ All files validated successfully"
    return 0
  fi
}

# Usage:
# validate_archive "test-output/archive/2026-04-09_full-pipeline-test"
```

---

## Manifest Generation

### Complete Test Manifest

```bash
#!/bin/bash
# generate_manifest.sh - Generate comprehensive test manifest

generate_complete_manifest() {
  local ARCHIVE_DIR=$1
  local MANIFEST_FILE="$ARCHIVE_DIR/metadata/test-manifest.json"

  echo "Generating complete test manifest..."

  # Count files by format
  local PDF_COUNT=$(find "$ARCHIVE_DIR" -name "*.pdf" -type f | wc -l)
  local DOCX_COUNT=$(find "$ARCHIVE_DIR" -name "*.docx" -type f | wc -l)
  local XLSX_COUNT=$(find "$ARCHIVE_DIR" -name "*.xlsx" -type f | wc -l)
  local HTML_COUNT=$(find "$ARCHIVE_DIR" -name "*.html" -type f | wc -l)
  local JSON_COUNT=$(find "$ARCHIVE_DIR" -name "*.json" -type f | wc -l)

  # Calculate total size by format
  local PDF_SIZE=$(find "$ARCHIVE_DIR" -name "*.pdf" -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
  local DOCX_SIZE=$(find "$ARCHIVE_DIR" -name "*.docx" -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}')
  local XLSX_SIZE=$(find "$ARCHIVE_DIR" -name "*.xlsx" -exec stat -f%z {} \; 2>/dev/null | awk '{s+=$1} END {print s}')

  # Update manifest summary
  jq --arg total "$((PDF_COUNT + DOCX_COUNT + XLSX_COUNT + HTML_COUNT + JSON_COUNT))" \
     --argjson pdf "{\"count\": $PDF_COUNT, \"totalBytes\": $PDF_SIZE}" \
     --argjson docx "{\"count\": $DOCX_COUNT, \"totalBytes\": $DOCX_SIZE}" \
     --argjson xlsx "{\"count\": $XLSX_COUNT, \"totalBytes\": $XLSX_SIZE}" \
     --argjson html "{\"count\": $HTML_COUNT}" \
     --argjson json "{\"count\": $JSON_COUNT}" \
     '.summary = {
       totalReports: ($total | tonumber),
       byFormat: {pdf: $pdf, docx: $docx, xlsx: $xlsx, html: $html, json: $json}
     }' "$MANIFEST_FILE" > "${MANIFEST_FILE}.tmp"

  mv "${MANIFEST_FILE}.tmp" "$MANIFEST_FILE"

  echo "Manifest generated: $MANIFEST_FILE"
  jq '.' "$MANIFEST_FILE"
}

# Usage:
# generate_complete_manifest "test-output/archive/2026-04-09_full-pipeline-test"
```

---

## Quick Reference

### Common Archiving Commands

```bash
# Initialize test run archive
archive_complete_test_run "test-output/archive/$(date +%Y-%m-%d)_manual-test"

# Archive single scenario (all formats)
archive_scenario_all_formats "S1" "22222222-2222-4222-8222-222222222222" "$EXEC_ID" "$REPORT_ID" "$ARCHIVE_DIR"

# Validate all archived reports
validate_archive "$ARCHIVE_DIR"

# Generate final manifest
generate_complete_manifest "$ARCHIVE_DIR"

# Update latest symlink
ln -sfn "$ARCHIVE_DIR" test-output/latest
```

---

**End of Document**

For integration with the main manual testing guide, see `manual-testing-guide.md`.
