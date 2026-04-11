# Technology selection — prerequisites (Week 1, Day 3)

**Date:** 2026-04-04  
**Purpose:** Lock choices that unblock Part 2 (infrastructure) and Part 4 (format generation) without baking company-specific logic into code.

## Report formats

| Area              | Direction                                                                                      | Notes                                                                                                                   |
| ----------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **HTML → PDF**    | **Playwright** (primary) with **Puppeteer** as an acceptable alternative for headless Chromium | Aligns with testing stack (Playwright for E2E) and technology research; pick one engine per deployment to simplify ops. |
| **Excel exports** | **ExcelJS**                                                                                    | Already in architecture docs for spreadsheet delivery alongside PDF/DOCX.                                               |
| **DOCX**          | **docx** (or equivalent maintained library)                                                    | Phase 4 execution tasks call for programmatic Word-compatible documents.                                                |

## Charts and data visualization

- **In-browser / print HTML:** A React-friendly chart library (for example **Recharts**) is suitable for rendering that is then captured in PDF via the HTML pipeline.
- **Server-side static charts:** Optional path using **Chart.js** or **QuickChart**-style rendering if headless HTML is generated without a full React tree; decision is per-template complexity.

Detailed comparisons and rationale belong in **`docs/04-technology-research/`**; this document records **decisions compatible** with the stack described in the repository **`CLAUDE.md`**.

## Email delivery

- **Primary provider:** **Resend** (implemented in `apps/worker/src/services/email.ts`).
- **Secondary:** **SendGrid** HTTP v3 when `SENDGRID_API_KEY` is set and Resend is not configured.

Operational sending requirements (SPF, DKIM, DMARC) are **environment-specific** and tracked in runbooks, not in application code.

## Internationalization

- Report templates and web shell continue to follow **`CompanyConfig.localization`** (`language`, `timezone`, `currency`) and shared i18n packages as Phase 03 progresses (Part 2 **INF-2** in the execution plan).
