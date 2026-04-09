# Test Output Directory Structure

**Document Version:** 1.1
**Last Updated:** 2026-04-09
**Purpose:** Define the standard structure and conventions for organizing test reports generated during manual and automated testing.

---

## Overview

The `test-output/` directory provides a centralized, structured location for archiving all reports generated during testing. This organization enables:

- Systematic validation of report generation across all formats
- Historical tracking of report output changes over time
- Easy comparison between different test runs
- Audit trail for testing activities
- Regression testing for report rendering and content

---

## Directory Structure

```
test-output/
├── README.md                                    # Optional local notes
├── archive/                                     # Historical test runs (organized by date)
│   ├── 2026-04-09_full-pipeline-baseline/      # Example: Baseline full pipeline test
│   │   ├── scenarios/                           # Scenario-based reports
│   │   │   ├── S1_basic-report-generation/
│   │   │   │   ├── pdf/
│   │   │   │   │   └── report_S1_{tenantId}_{timestamp}.pdf
│   │   │   │   ├── docx/
│   │   │   │   │   └── report_S1_{tenantId}_{timestamp}.docx
│   │   │   │   ├── xlsx/
│   │   │   │   │   └── report_S1_{tenantId}_{timestamp}.xlsx
│   │   │   │   ├── html/
│   │   │   │   │   └── report_S1_{tenantId}_{timestamp}.html
│   │   │   │   └── json/
│   │   │   │       └── report_S1_{tenantId}_{timestamp}.json
│   │   │   ├── S2_arabic-rtl-report/
│   │   │   │   └── [same format structure as S1]
│   │   │   ├── S3_multi-format-export/
│   │   │   │   └── [same format structure as S1]
│   │   │   ├── S4_marketing-analysis/
│   │   │   │   └── [format subdirectories]
│   │   │   ├── S5_multi-tenant-isolation/
│   │   │   │   └── [format subdirectories]
│   │   │   ├── S6_tenant-config-override/
│   │   │   │   └── [format subdirectories]
│   │   │   ├── S12_e2e-pipeline/
│   │   │   │   └── [format subdirectories]
│   │   │   └── production-flow/                # Production flow scenarios (R01-R12)
│   │   │       ├── R01_pdf-en-ltr/
│   │   │       │   └── pdf/
│   │   │       │       └── report_R01_{timestamp}.pdf
│   │   │       ├── R02_pdf-ar-rtl/
│   │   │       │   └── pdf/
│   │   │       │       └── report_R02_{timestamp}.pdf
│   │   │       ├── R03_docx/
│   │   │       ├── R04_xlsx/
│   │   │       ├── R05_template-merge/
│   │   │       └── [R06-R12]/
│   │   ├── templates/                           # Template-specific reports
│   │   │   ├── executive-summary/
│   │   │   │   └── [format subdirectories]
│   │   │   ├── detailed-analysis/
│   │   │   │   └── [format subdirectories]
│   │   │   └── technical-appendix/
│   │   │       └── [format subdirectories]
│   │   ├── localization/                        # Language/RTL-specific reports
│   │   │   ├── en_ltr/
│   │   │   │   └── [format subdirectories]
│   │   │   ├── ar_rtl/
│   │   │   │   └── [format subdirectories]
│   │   │   └── fr_ltr/
│   │   │       └── [format subdirectories]
│   │   └── metadata/                           # Test run metadata
│   │       ├── test-manifest.json              # Complete inventory of reports
│   │       ├── test-summary.md                 # Human-readable summary
│   │       ├── performance-metrics.json        # Generation times, sizes
│   │       └── validation-results.json         # Format validation results
│   └── 2026-04-10_regression-test/            # Next test run
│       └── [same structure]
├── latest/                                      # Symlink to most recent test run
├── baseline/                                    # Symlink to baseline test run
└── templates/                                   # Report template reference files
    ├── executive-summary.html
    ├── detailed-analysis.html
    └── technical-appendix.html
```

---

## File Naming Conventions

### Report Files

Format: `report_{SCENARIO_ID}_{TENANT_ID}_{TIMESTAMP}.{EXTENSION}`

Components:

- `SCENARIO_ID`: Test scenario identifier (e.g., `S1`, `R01`, `S12`)
- `TENANT_ID`: UUID of tenant (shortened to first 8 chars for brevity)
- `TIMESTAMP`: ISO 8601 timestamp (YYYYMMDD-HHMMSS)
- `EXTENSION`: File format (pdf, docx, xlsx, html, json)

Examples:

```
report_S1_22222222_20260409-143022.pdf
report_R02_11111111_20260409-143025.pdf
report_S4_22222222_20260409-143115.json
```

### Metadata Files

- `test-manifest.json`: Complete inventory of all reports generated
- `test-summary.md`: Human-readable test run summary
- `performance-metrics.json`: Generation times and file sizes
- `validation-results.json`: Format validation results

---

## Test Manifest Schema

The `test-manifest.json` file provides a complete inventory of the test run:

```json
{
  "testRunId": "2026-04-09_full-pipeline-baseline",
  "timestamp": "2026-04-09T14:30:00Z",
  "version": "1.0.0",
  "environment": {
    "NODE_ENV": "development",
    "gitCommit": "abc123def",
    "gitBranch": "feature/phase-00-foundation"
  },
  "scenarios": [
    {
      "scenarioId": "S1",
      "scenarioName": "Basic Report Generation",
      "status": "passed",
      "tenantId": "22222222-2222-4222-8222-222222222222",
      "language": "en",
      "direction": "ltr",
      "formats": [
        {
          "format": "pdf",
          "path": "scenarios/S1_basic-report-generation/pdf/report_S1_22222222_20260409-143022.pdf",
          "sizeBytes": 41616,
          "generationTimeMs": 1820,
          "validation": {
            "minBytesOk": true,
            "shellDir": "ltr",
            "shellLang": "en",
            "mustContainPhrasesOk": true
          }
        },
        {
          "format": "docx",
          "path": "scenarios/S1_basic-report-generation/docx/report_S1_22222222_20260409-143025.docx",
          "sizeBytes": 12345,
          "generationTimeMs": 1450
        }
      ]
    }
  ],
  "summary": {
    "totalReports": 60,
    "byFormat": {
      "pdf": 12,
      "docx": 12,
      "xlsx": 12,
      "html": 12,
      "json": 12
    },
    "byLanguage": {
      "en": 48,
      "ar": 12
    },
    "byStatus": {
      "passed": 58,
      "failed": 2,
      "skipped": 0
    }
  }
}
```

---

## Usage Guidelines

### Creating a New Test Run

1. Create a new directory with timestamp and descriptive name
2. Follow the standard directory structure
3. Save all reports with proper naming conventions
4. Generate and save metadata files
5. Update the `latest` symlink

### Updating the Latest Symlink

```bash
ln -sfn archive/2026-04-09_full-pipeline-baseline latest
```

### Comparing Test Runs

```bash
# Compare PDF content
diff -q latest/scenarios/S1_basic-report-generation/pdf/ \
       baseline/scenarios/S1_basic-report-generation/pdf/

# Compare metadata
jq -S '.' archive/2026-04-09_*/metadata/test-manifest.json
```

---

## Integration with Manual Testing Guide

The `test-output/` directory is the standard output location for all manual testing procedures documented in [`manual-testing-guide.md`](./manual-testing-guide.md). Each test scenario should:

1. Generate reports in all supported formats
2. Save reports to the appropriate scenario subdirectory
3. Validate file integrity and content
4. Record metrics in the test manifest
5. Update metadata files

---

## Retention Policy

- Keep baseline test runs indefinitely
- Keep regression test runs for 6 months
- Keep ad-hoc test runs for 3 months
- Archive older runs to compressed storage

---

## Maintenance

- Regularly update symlinks after each test run
- Clean up old test runs according to retention policy
- Update this document when directory structure changes
- Maintain template reference files in `templates/`

---

**End of Document**
