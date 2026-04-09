# Manual Testing Guide Integration Guide

**Document Version:** 1.0
**Last Updated:** 2026-04-09
**Purpose:** Integration guide for comprehensive manual testing with full pipeline coverage and report archiving.

---

## Overview

This guide integrates the comprehensive testing documentation created for full pipeline testing, report archiving, and multi-language/RTL validation with the existing Manual Testing Guide.

---

## New Documentation Structure

The following documentation has been created to enhance the manual testing guide:

```
docs/06-reference/
├── manual-testing-guide.md                      # Original guide (to be updated)
├── manual-testing-guide-integration.md          # This file
├── test-reports-directory-structure.md          # Directory structure & conventions
├── full-pipeline-testing-procedures.md          # Stage-by-stage pipeline testing
├── report-archiving-procedures.md               # Format-specific archiving
├── multi-language-rtl-testing-procedures.md     # Localization & RTL testing
└── updated-success-criteria.md                  # Comprehensive success criteria
```

---

## Integration with Manual Testing Guide

### Section Updates Required

The following sections of `manual-testing-guide.md` should be updated:

#### 1. Add to Section 1 (Overview)

**After 1.4 Testing Scope**, add:

```markdown
### 1.5 Report Archiving

All test outputs are systematically archived to `test-reports/` directory with:

- Complete format coverage (PDF, DOCX, XLSX, HTML, JSON)
- Multi-language support (English LTR, Arabic RTL, French LTR)
- Comprehensive validation and verification
- Metadata tracking and manifest generation

See `test-reports-directory-structure.md` for complete specification.
```

#### 2. Update Section 3 (Test Scenarios)

**Update 3.2 Scenario Matrix** to include archiving column:

| ID      | Name                    | Workflow             | Language | Format | Archive Required | Priority |
| ------- | ----------------------- | -------------------- | -------- | ------ | ---------------- | -------- |
| **S1**  | Basic Report Generation | `report-generation`  | EN       | PDF    | ✅ All formats   | P0       |
| **S2**  | Arabic RTL Report       | `report-generation`  | AR       | PDF    | ✅ All formats   | P0       |
| **S3**  | Multi-Format Export     | `report-generation`  | EN       | ALL    | ✅ All formats   | P1       |
| **S4**  | Marketing Analysis      | `marketing-analysis` | EN       | -      | ✅ JSON          | P0       |
| **S12** | End-to-End Pipeline     | `verdict-generation` | EN       | ALL    | ✅ All formats   | P0       |

#### 3. Add to Section 4 (Step-by-Step Test Procedures)

**After 4.5 Performance Testing**, add new section:

````markdown
### 4.6 Full Pipeline Testing (S12)

For comprehensive end-to-end pipeline testing, including all five stages
(data collection through delivery), see `full-pipeline-testing-procedures.md`.

Quick start:

```bash
# Trigger full pipeline
curl -X POST http://localhost:4000/api/v1/workflows/trigger \
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
  }'

# Monitor all five stages
docker logs agenticverdict-worker-1 -f --tail=50
```
````

Pipeline stages:

1. Data Collection (Platform Adapters)
2. Data Normalization
3. AI Agent Pipeline (3 sequential agents)
4. Report Generation
5. Delivery

````

#### 4. Add to Section 5 (Observability & Verification)

**After 5.4 Data Verification**, add:

```markdown
### 5.5 Report Archiving Verification

#### Verify Archive Structure

```bash
# Check directory structure
ls -la test-reports/archive/$(date +%Y-%m-%d)_*/

# Validate all archived reports
validate_archive "test-reports/archive/$(date +%Y-%m-%d)_manual-test"
````

#### Verify Format Integrity

```bash
# PDF validation
for pdf in test-reports/archive/*/scenarios/*/pdf/*.pdf; do
  validate_pdf "$pdf"
done

# DOCX validation
for docx in test-reports/archive/*/scenarios/*/docx/*.docx; do
  validate_docx "$docx"
done
```

#### Verify Multi-Language Reports

```bash
# English reports
ls test-reports/archive/202*/localization/en_ltr/

# Arabic RTL reports
ls test-reports/archive/202*/localization/ar_rtl/

# Validate RTL rendering
validate_rtl_report test-reports/archive/202*/scenarios/S2*/pdf/*.pdf
```

See `report-archiving-procedures.md` for comprehensive archiving procedures.

````

#### 5. Replace Section 7 (Success Criteria)

**Replace entire Section 7 with content from** `updated-success-criteria.md`.

This includes:
- Full pipeline validation checkpoints
- Report archiving requirements
- Multi-language & RTL validation
- Comprehensive quality gates

#### 6. Add New Appendix

**Add as Appendix D**:

```markdown
## Appendix D: Additional Testing Documentation

- **Test Reports Directory Structure**: `test-reports-directory-structure.md`
- **Full Pipeline Testing Procedures**: `full-pipeline-testing-procedures.md`
- **Report Archiving Procedures**: `report-archiving-procedures.md`
- **Multi-Language & RTL Testing**: `multi-language-rtl-testing-procedures.md`
- **Updated Success Criteria**: `updated-success-criteria.md`

These documents provide comprehensive procedures for:
- Complete pipeline stage-by-stage testing
- Systematic report archiving in all formats
- Multi-language and RTL validation
- Detailed validation and verification procedures
````

---

## Quick Start Guide

### 1. Initialize Test Run

```bash
# Create test run directory structure
./scripts/archive_complete_test_run.sh "test-reports/archive/$(date +%Y-%m-%d)_full-pipeline-test"

# Or manually:
TEST_RUN_DIR="test-reports/archive/$(date +%Y-%m-%d)_full-pipeline-test"
mkdir -p "$TEST_RUN_DIR"/{scenarios,metadata,templates,localization}
```

### 2. Execute Test Scenarios

```bash
# For each scenario (S1-S12), execute:
# 1. Trigger workflow
# 2. Monitor execution
# 3. Retrieve results
# 4. Archive all formats

# Example: S1 - Basic Report Generation
./scripts/test_scenario_s1.sh
./scripts/archive_scenario_all_formats.sh "S1" "$TENANT_ID" "$EXECUTION_ID" "$REPORT_ID" "$TEST_RUN_DIR"
```

### 3. Validate Archived Reports

```bash
# Validate all formats
./scripts/validate_archive.sh "$TEST_RUN_DIR"

# Validate RTL for Arabic reports
./scripts/validate_rtl.sh "$TEST_RUN_DIR/scenarios/S2*/pdf/*.pdf"
```

### 4. Generate Final Documentation

```bash
# Generate test manifest
./scripts/generate_manifest.sh "$TEST_RUN_DIR"

# Update test summary
./scripts/update_summary.sh "$TEST_RUN_DIR"

# Update latest symlink
ln -sfn "$TEST_RUN_DIR" test-reports/latest
```

---

## Comprehensive Test Execution Workflow

### Full Pipeline Test with Archiving

```bash
#!/bin/bash
# comprehensive_test.sh

echo "=========================================="
echo "Comprehensive Pipeline Test & Archive"
echo "=========================================="

# Setup
TOKEN=$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)
TEST_RUN_DIR="test-reports/archive/$(date +%Y-%m-%d)_full-pipeline-test"

# Initialize archive structure
./scripts/archive_complete_test_run.sh "$TEST_RUN_DIR"

# Test all scenarios
for SCENARIO in S1 S2 S3 S4 S5 S6 S7 S8 S9 S10 S11 S12; do
  echo ""
  echo "Testing Scenario: $SCENARIO"
  echo "=========================================="

  # Execute scenario
  ./scripts/test_scenario_$SCENARIO.sh

  # Archive all formats
  ./scripts/archive_scenario_all_formats.sh "$SCENARIO" "$TENANT_ID" "$EXEC_ID" "$REPORT_ID" "$TEST_RUN_DIR"

  # Validate archived reports
  ./scripts/validate_scenario_archive.sh "$TEST_RUN_DIR/scenarios/$SCENARIO"
done

# Validate multi-language
echo ""
echo "Validating Multi-Language Reports"
echo "=========================================="
./scripts/validate_rtl.sh "$TEST_RUN_DIR/scenarios/S2*/pdf/*.pdf"
./scripts/validate_ltr.sh "$TEST_RUN_DIR/scenarios/S1*/pdf/*.pdf"

# Generate final documentation
echo ""
echo "Generating Documentation"
echo "=========================================="
./scripts/generate_manifest.sh "$TEST_RUN_DIR"
./scripts/generate_summary.sh "$TEST_RUN_DIR"

# Final validation
echo ""
echo "Final Validation"
echo "=========================================="
./scripts/validate_archive.sh "$TEST_RUN_DIR"

echo ""
echo "Test complete! Results saved to: $TEST_RUN_DIR"
echo "Summary: $TEST_RUN_DIR/metadata/test-summary.md"
```

---

## Testing Checklist

### Pre-Test Setup

- [ ] Services running (docker compose ps)
- [ ] Database initialized (db:push)
- [ ] Mock adapters configured
- [ ] Authentication tokens generated
- [ ] Test archive structure created
- [ ] Required tools installed (jq, pdftotext, unzip)

### During Testing

- [ ] Monitor logs for errors
- [ ] Track performance metrics
- [ ] Verify each pipeline stage
- [ ] Archive all report formats
- [ ] Validate format integrity
- [ ] Check RTL rendering for Arabic
- [ ] Document any issues

### Post-Test

- [ ] All scenarios completed
- [ ] All reports archived
- [ ] All formats validated
- [ ] Manifest generated
- [ ] Summary updated
- [ ] Validation results saved
- [ ] Symlinks updated
- [ ] Issues documented

---

## Documentation Cross-Reference

| Question                                  | Reference Document                                    |
| ----------------------------------------- | ----------------------------------------------------- |
| How to structure test reports directory?  | `test-reports-directory-structure.md`                 |
| How to test full pipeline stage by stage? | `full-pipeline-testing-procedures.md`                 |
| How to archive reports in all formats?    | `report-archiving-procedures.md`                      |
| How to test multi-language and RTL?       | `multi-language-rtl-testing-procedures.md`            |
| What are the complete success criteria?   | `updated-success-criteria.md`                         |
| How to integrate with existing guide?     | `manual-testing-guide-integration.md` (this document) |

---

## Script Repository

The following scripts should be created in `scripts/test-archive/`:

| Script                            | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `archive_complete_test_run.sh`    | Initialize test run directory structure |
| `archive_scenario_all_formats.sh` | Archive all formats for a scenario      |
| `archive_pdf_report.sh`           | Archive and validate PDF                |
| `archive_docx_report.sh`          | Archive and validate DOCX               |
| `archive_xlsx_report.sh`          | Archive and validate XLSX               |
| `archive_html_report.sh`          | Archive and validate HTML               |
| `archive_json_report.sh`          | Archive and validate JSON               |
| `validate_archive.sh`             | Validate entire archive                 |
| `validate_pdf.sh`                 | Validate PDF format                     |
| `validate_docx.sh`                | Validate DOCX format                    |
| `validate_xlsx.sh`                | Validate XLSX format                    |
| `validate_html.sh`                | Validate HTML format                    |
| `validate_json.sh`                | Validate JSON format                    |
| `validate_rtl.sh`                 | Validate RTL rendering                  |
| `generate_manifest.sh`            | Generate test manifest                  |
| `generate_summary.sh`             | Generate test summary                   |

---

## Best Practices

1. **Always Archive**: Every test run should archive all generated reports
2. **Validate Everything**: Use automated validation for all formats
3. **Track Metadata**: Maintain comprehensive manifests and summaries
4. **Test All Languages**: Include Arabic RTL testing in every test run
5. **Monitor Performance**: Record generation times for all formats
6. **Version Control**: Commit validation results and manifests to git
7. **Baseline Comparison**: Compare outputs against previous runs for regression
8. **Clean Up**: Archive old test runs per retention policy

---

## Troubleshooting

| Issue                         | Solution                                      |
| ----------------------------- | --------------------------------------------- |
| Archive directory not created | Run `archive_complete_test_run.sh` first      |
| PDF validation fails          | Check file size (>500 bytes) and format       |
| RTL rendering incorrect       | Verify `dir="rtl"` in HTML, check Arabic font |
| Missing format                | Check generator logs, verify API response     |
| Manifest invalid              | Run `generate_manifest.sh` to regenerate      |
| Symlink broken                | Update `latest` symlink after each run        |

---

**End of Integration Guide**

This guide provides complete integration between the existing Manual Testing Guide and the new comprehensive testing documentation.
