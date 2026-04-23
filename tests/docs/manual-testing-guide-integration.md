# Manual Testing Guide Integration

**Document Version:** 1.1  
**Last Updated:** 2026-04-09  
**Purpose:** Describe how the extended manual-testing documentation fits together, which artifacts live where, and what you can run today versus what is still specified-only.

---

## Overview

This file is **not** a second copy of the step-by-step manual test plan. The executable procedures, scenarios, and API contracts live in **[`manual-testing-guide.md`](./manual-testing-guide.md)** (with deeper dives in the companion files under **`tests/docs/`**).

Use this document to:

- Find the correct paths and filenames (everything ships under **`tests/docs/`**, not `docs/06-reference/`).
- Initialize **`test-output/`** archive layout without assuming non-existent shell scripts.
- Run **real** repo scripts for JWT generation and optional workflow smoke checks.

---

## Documentation layout (`tests/docs/`)

Companion artifacts for full-pipeline, archiving, localization, and success criteria:

```
tests/docs/
├── manual-testing-guide.md                 # Primary manual test plan (SSOT)
├── manual-testing-guide-integration.md     # This file
├── test-output-directory-structure.md        # Archive layout & conventions
├── full-pipeline-testing-procedures.md       # Stage-by-stage pipeline testing
├── report-archiving-procedures.md            # Format-specific archiving (examples)
├── multi-language-rtl-testing-procedures.md  # Localization & RTL testing
└── updated-success-criteria.md               # Extended success criteria
```

**[`manual-testing-guide.md`](./manual-testing-guide.md) Appendix D** already cross-links these files. Historical “Section Updates Required” notes from early drafts are **superseded** by the current Appendix D and §1.5 / §4.6 / §5.6 in that guide.

---

## Archive root: `test-output/`

Manual testing standard output directory is **`test-output/`** (see **[`test-output-directory-structure.md`](./test-output-directory-structure.md)**). It is listed in **`.gitignore`** so local runs do not dirty the tree.

---

## Runnable commands today

### JWT for workflow and report routes

```bash
export TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
```

Requires `JWT_SECRET`, `JWT_SECRET_FILE`, or `secrets/jwt_secret.txt` (see comment header in `scripts/generate-dev-jwt.mjs`).

### Trigger full pipeline (S12-style) — expect **HTTP 202**

`POST /api/v1/workflows/trigger` requires **`workflowId`**, **`testMode: true`**, UUID **`tenantId`**, and a **`config` object** (may be empty `{}`; optional fields include `dateRange`, `platforms`, `verdictDepth`, `outputFormat`, etc.—see `workflowTriggerJobConfigSchema` in `apps/worker/src/queues/job-types.ts`).

```bash
curl -sS -X POST http://127.0.0.1:4000/api/v1/workflows/trigger \
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
      },
      "platforms": ["meta", "ga4"],
      "verdictDepth": "quick",
      "outputFormat": "pdf"
    }
  }'
```

Poll **`GET /api/v1/workflows/status/:executionId`** until `completed` or `failed`, then use **`result.analysisId`** with **`GET /api/v1/analysis-results/:id`** (see **`manual-testing-guide.md`** §4).

### Optional: queue round-trip smoke script

With **API + worker + Redis** running:

Use the **same tenant UUID** for the JWT as for the workflow body (must have tenant config, e.g. shipped demo **`22222222-2222-4222-8222-222222222222`** — see **`configs/tenants/`**). The API resolves the JWT’s `tenant_id` before enqueue; a token for an unconfigured tenant returns **`403`** (`tenant_config_not_found`).

```bash
export ADMIN_BEARER_TOKEN="$(node scripts/generate-dev-jwt.mjs --tenant 22222222-2222-4222-8222-222222222222)"
export API_BASE_URL="${API_BASE_URL:-http://127.0.0.1:4000}"
node scripts/workflow-status-roundtrip-smoke.mjs
```

Optional: **`SMOKE_TENANT_ID`**, **`SMOKE_MAX_POLLS`** (default `90`), **`SMOKE_POLL_INTERVAL_MS`** (default `2000`) if runs are slow or you use another configured tenant.

### Worker logs

Container names depend on Compose project name. List services, then follow logs:

```bash
docker compose ps
docker logs "$(docker compose ps -q worker | head -n1)" -f --tail=50
```

---

## Initialize an archive run (no extra scripts required)

The procedures in **`report-archiving-procedures.md`** and **`full-pipeline-testing-procedures.md`** sometimes reference **future** automation under `scripts/test-archive/`. Until those scripts exist, create layout manually:

```bash
TEST_RUN_DIR="test-output/archive/$(date +%Y-%m-%d)_full-pipeline-test"
mkdir -p "$TEST_RUN_DIR"/{scenarios,metadata,templates,localization}
```

Optional symlink:

```bash
ln -sfn "$TEST_RUN_DIR" test-output/latest
```

---

## Verification snippets (illustrative)

Commands like **`validate_archive`**, **`validate_pdf`**, **`validate_rtl_report`** appear in companion docs as **pseudocode / future helpers**. They are **not** installed in `PATH` in this repository. Use the concrete **`find`**, **`pdftotext`**, and **`file`** examples in **`manual-testing-guide.md`** §5.6 until shared scripts land.

Example listing only:

```bash
find test-output/archive -type f \( -name "*.pdf" -o -name "*.docx" \) | sort
```

---

## Planned automation (`scripts/test-archive/`)

The following scripts are **specified** in **`manual-testing-guide.md`** Appendix D and in **`report-archiving-procedures.md`** but are **not** committed yet:

| Script                            | Purpose                                 |
| --------------------------------- | --------------------------------------- |
| `archive_complete_test_run.sh`    | Initialize test run directory structure |
| `archive_scenario_all_formats.sh` | Archive all formats for a scenario      |
| `validate_archive.sh`             | Validate entire archive                 |
| `validate_pdf.sh`                 | Validate PDF format                     |
| `validate_rtl.sh`                 | Validate RTL rendering                  |
| `generate_manifest.sh`            | Generate test manifest                  |

Do **not** run `./scripts/archive_complete_test_run.sh` or `./scripts/test_scenario_S1.sh` from older drafts—they are not in the repo.

---

## Documentation cross-reference

| Question                                  | Reference                                                                                |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| How to structure test output directories? | [`test-output-directory-structure.md`](./test-output-directory-structure.md)             |
| How to test full pipeline stage by stage? | [`full-pipeline-testing-procedures.md`](./full-pipeline-testing-procedures.md)           |
| How to archive reports in all formats?    | [`report-archiving-procedures.md`](./report-archiving-procedures.md)                     |
| How to test multi-language and RTL?       | [`multi-language-rtl-testing-procedures.md`](./multi-language-rtl-testing-procedures.md) |
| What are the extended success criteria?   | [`updated-success-criteria.md`](./updated-success-criteria.md)                           |
| Primary manual procedures & API contract  | [`manual-testing-guide.md`](./manual-testing-guide.md)                                   |

---

## Troubleshooting

| Issue                                     | What to check                                                                                                                                                                                                                                     |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`401` / `403` on `/workflows/trigger`** | Token from `generate-dev-jwt.mjs`; JWT must include `roles` including `admin`. For **`403`** with **`tenant_config_not_found`**, the JWT’s `tenant_id` must be a tenant that has valid tenant configuration (not only the UUID in the JSON body). |
| **`503` on trigger**                      | BullMQ / Redis not configured for API (`isBullmqConfigured`).                                                                                                                                                                                     |
| **`400` test triggers disabled**          | Production build gate: `testMode` triggers require non-production workflow test gate (see **`manual-testing-guide.md`** and `isWorkflowTestTriggerAllowed`).                                                                                      |
| Archive path confusion                    | Use **`test-output/`** consistently; ignore older drafts that mentioned **`test-reports/`**.                                                                                                                                                      |

---

**End of document**
