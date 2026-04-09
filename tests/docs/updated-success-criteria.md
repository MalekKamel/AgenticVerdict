# Updated Success Criteria for Manual Testing Guide

**Document Version:** 1.8 (Supplement to manual-testing-guide.md Section 7)
**Last Updated:** 2026-04-09
**Purpose:** Comprehensive success criteria including report archiving and full pipeline validation.

---

## 7. Success Criteria (Updated)

### 7.1 Functional Requirements

Each test scenario must meet:

- **Workflow Completion**: Job reaches `completed` status
- **Data Integrity**: All data transformations preserve accuracy
- **Tenant Isolation**: No cross-tenant data leakage
- **Error Handling**: Graceful degradation on failures
- **Report Quality**: Generated reports match specifications
- **Archive Completeness**: All reports saved in all formats to `test-reports/`

### 7.2 Performance Thresholds

| Metric                      | Target | Maximum |
| --------------------------- | ------ | ------- |
| Report generation (simple)  | <10s   | 30s     |
| Report generation (complex) | <30s   | 60s     |
| Marketing analysis          | <45s   | 90s     |
| Platform adapter fetch      | <2s    | 5s      |
| LLM call                    | <10s   | 30s     |
| Queue processing            | <1s    | 5s      |
| Full pipeline (S12)         | <90s   | 180s    |

### 7.3 Full Pipeline Validation Checkpoints

#### Stage 1: Data Collection

- [ ] All platform adapters return data
- [ ] No circuit breaker activation
- [ ] Caching strategy works (second fetch faster)
- [ ] Rate limiting respects platform quotas
- [ ] Authentication succeeds for all platforms
- [ ] Error handling works for platform failures

#### Stage 2: Data Normalization

- [ ] Platform-specific data converted to unified schema
- [ ] Date ranges properly applied
- [ ] Tenant context correctly injected
- [ ] Metric values within expected ranges
- [ ] No data loss during transformation
- [ ] Provenance records created in database

#### Stage 3: AI Agent Pipeline

- [ ] Cross-Platform Analysis Agent completes
- [ ] Marketing Insights Generation Agent completes
- [ ] Media Verdict Agent completes
- [ ] All agents use tenant-specific prompts
- [ ] Insights are data-driven with evidence
- [ ] Verdict score within 0-100 range
- [ ] Confidence score calculated (0-1)
- [ ] LLM calls complete within thresholds

#### Stage 4: Report Generation

- [ ] Reports generated in all 5 formats (PDF, DOCX, XLSX, HTML, JSON)
- [ ] Template variables properly substituted
- [ ] Multi-language rendering works (EN/AR/FR)
- [ ] RTL layout correct for Arabic
- [ ] Branding elements preserved
- [ ] Charts and graphics render correctly
- [ ] No template syntax errors
- [ ] File sizes within expected ranges

#### Stage 5: Delivery

- [ ] Email delivery queued successfully
- [ ] Webhook notifications sent (if configured)
- [ ] Report metadata stored in database
- [ ] Download links generated (if applicable)
- [ ] Delivery status tracked
- [ ] Retry mechanism functional

### 7.4 Report Archiving Requirements

#### Archive Structure

- [ ] Directory structure follows `test-reports/` specification
- [ ] Each scenario has subdirectories for all formats
- [ ] Production flow scenarios (R01-R12) organized separately
- [ ] Template-specific reports organized
- [ ] Localization directories created (en_ltr, ar_rtl, fr_ltr)
- [ ] Metadata directory present with required files

#### File Naming Conventions

- [ ] Files follow pattern: `report_{SCENARIO}_{TENANT}_{TIMESTAMP}.{EXT}`
- [ ] Scenario IDs match test documentation
- [ ] Tenant IDs use first 8 characters
- [ ] Timestamps in ISO 8601 format (YYYYMMDD-HHMMSS)

#### Format-Specific Validation

**PDF Files:**

- [ ] File size > 500 bytes
- [ ] Valid PDF format (magic number check)
- [ ] Contains expected content
- [ ] Text extraction works
- [ ] No corruption errors
- [ ] Metadata preserved

**DOCX Files:**

- [ ] Valid ZIP/DOCX format
- [ ] Contains required OOXML components
- [ ] Valid document.xml structure
- [ ] Styles preserved
- [ ] No corruption errors

**XLSX Files:**

- [ ] Valid ZIP/XLSX format
- [ ] Contains required spreadsheet components
- [ ] Valid workbook structure
- [ ] Worksheets present
- [ ] Data integrity preserved

**HTML Files:**

- [ ] Valid HTML structure
- [ ] Required tags present (html, head, body)
- [ ] Charset declaration present
- [ ] CSS styles preserved
- [ ] Responsive layout maintained

**JSON Files:**

- [ ] Valid JSON syntax
- [ ] Required keys present
- [ ] Data types correct
- [ ] No null values in required fields
- [ ] Timestamps in ISO 8601 format

#### Multi-Language & RTL Validation

**English (LTR):**

- [ ] Text flows left to right
- [ ] Numbers formatted: 1,234.56
- [ ] Dates in expected format
- [ ] No character encoding issues
- [ ] Font rendering is proper

**Arabic (RTL):**

- [ ] Text flows right to left
- [ ] Arabic characters render correctly
- [ ] No character clipping or overflow
- [ ] Proper ligature formation
- [ ] Diacritical marks display correctly
- [ ] Layout mirrored correctly
- [ ] `dir="rtl"` attribute present (HTML)
- [ ] Arabic font specified

**French (LTR):**

- [ ] Accented characters render correctly
- [ ] Numbers use French formatting: 1 234,56
- [ ] Dates in DD/MM/YYYY format
- [ ] No encoding issues with special characters

#### Metadata Files

- [ ] `test-manifest.json` created and valid
- [ ] `test-summary.md` created with run information
- [ ] `performance-metrics.json` includes generation times
- [ ] `validation-results.json` includes all format checks

#### Archive Integrity

- [ ] All expected scenarios present
- [ ] All formats generated for each scenario
- [ ] No duplicate files
- [ ] No empty files
- [ ] Total report count matches expectations
- [ ] File sizes documented in manifest

### 7.5 Quality Gates

Before marking a scenario as passed:

- [ ] All assertions validated
- [ ] No errors in logs
- [ ] Metrics within thresholds
- [ ] Database consistent
- [ ] No memory leaks
- [ ] No DLQ entries
- [ ] Circuit breakers closed
- [ ] Reports archived in all formats
- [ ] Format validation passed
- [ ] Language/RTL validation passed
- [ ] Metadata files generated

### 7.6 Comprehensive Test Scenarios

#### S1: Basic Report Generation (English/LTR)

**Pipeline Validation:**

- [ ] Data collection from all platforms
- [ ] Normalization complete
- [ ] AI agents executed (if applicable)
- [ ] Report generated successfully

**Archive Validation:**

- [ ] PDF report archived
- [ ] DOCX report archived
- [ ] XLSX report archived
- [ ] HTML report archived
- [ ] JSON report archived
- [ ] All formats validated
- [ ] English/LTR rendering verified

#### S2: Arabic RTL Report

**Pipeline Validation:**

- [ ] Arabic tenant config loaded
- [ ] Data collected with RTL context
- [ ] AI agents use Arabic prompts
- [ ] Report generated with RTL

**Archive Validation:**

- [ ] PDF report archived with RTL
- [ ] DOCX report archived with RTL
- [ ] XLSX report archived with RTL
- [ ] HTML report archived with RTL
- [ ] JSON report archived
- [ ] RTL rendering validated
- [ ] Arabic characters verified

#### S3: Multi-Format Export

**Pipeline Validation:**

- [ ] All format generators executed
- [ ] Template applied consistently
- [ ] Branding preserved across formats

**Archive Validation:**

- [ ] All 5 formats present
- [ ] Cross-format consistency verified
- [ ] File sizes documented

#### S4: Marketing Analysis

**Pipeline Validation:**

- [ ] Cross-Platform Analysis Agent completed
- [ ] Marketing Insights generated
- [ ] All platforms analyzed
- [ ] Insights data-driven

**Archive Validation:**

- [ ] Analysis results saved (JSON)
- [ ] Report formats generated

#### S12: End-to-End Pipeline

**Pipeline Validation:**

- [ ] Stage 1: Data Collection complete
- [ ] Stage 2: Data Normalization complete
- [ ] Stage 3: AI Agent Pipeline complete
- [ ] Stage 4: Report Generation complete
- [ ] Stage 5: Delivery complete

**Archive Validation:**

- [ ] All formats archived
- [ ] All pipeline stages documented
- [ ] Performance metrics recorded
- [ ] Full traceability maintained

### 7.7 Sign-Off Checklist

**Functional Testing:**

- [ ] All P0 scenarios passed
- [ ] All P1 scenarios passed
- [ ] All P2 scenarios passed (if applicable)

**Archive Validation:**

- [ ] All reports archived in all formats
- [ ] All formats validated
- [ ] Multi-language testing complete
- [ ] RTL testing complete
- [ ] Metadata files generated

**Documentation:**

- [ ] Test manifest complete
- [ ] Test summary updated
- [ ] Performance baselines recorded
- [ ] Known issues documented
- [ ] Validation results saved

**Quality Assurance:**

- [ ] No critical bugs
- [ ] No data corruption
- [ ] No security issues
- [ ] Performance acceptable
- [ ] Tenant isolation verified

**Release Readiness:**

- [ ] All quality gates passed
- [ ] Stakeholder sign-off obtained
- [ ] Rollback plan documented
- [ ] Monitoring configured

### 7.8 Test Completion Criteria

A test run is considered complete when:

1. **All Scenarios Executed**: All planned scenarios (S1-S12) have been executed
2. **All Reports Archived**: Every scenario has reports in all 5 formats archived
3. **All Validations Passed**: Format, language, and RTL validations complete
4. **Documentation Complete**: Manifest, summary, and validation files generated
5. **Issues Documented**: All failures and anomalies documented
6. **Metrics Recorded**: Performance metrics and baselines captured

---

## Quick Reference: Archive Validation Command

```bash
# Validate entire archive
validate_archive "test-reports/archive/$(date +%Y-%m-%d)_manual-test"

# Expected output:
# ✅ All files validated successfully
# Total files: 60
# Valid: 60
# Invalid: 0
```

---

## Appendix: Scenario-Specific Archive Checklist

### Production Flow Scenarios (R01-R12)

| Scenario | Description          | Format | Language | RTL | Archive Required |
| -------- | -------------------- | ------ | -------- | --- | ---------------- |
| R01      | PDF EN/LTR           | PDF    | EN       | No  | ✅               |
| R02      | PDF AR/RTL           | PDF    | AR       | Yes | ✅               |
| R03      | DOCX                 | DOCX   | EN       | No  | ✅               |
| R04      | XLSX                 | XLSX   | EN       | No  | ✅               |
| R05      | Template Merge       | ALL    | EN       | No  | ✅               |
| R06      | LLM Integration      | JSON   | EN       | No  | ✅               |
| R07      | Cache/Tenant Context | ALL    | EN       | No  | ✅               |
| R08      | Template Validation  | HTML   | EN       | No  | ✅               |
| R09      | Email Delivery       | -      | -        | -   | Email metadata   |
| R10      | Schedule Enqueue     | JSON   | EN       | No  | ✅               |
| R11      | Redis/DB Integration | ALL    | EN       | No  | ✅               |
| R12      | Node.js Environment  | ALL    | EN       | No  | ✅               |

---

**End of Updated Success Criteria**

This document supplements Section 7 of `manual-testing-guide.md`.
