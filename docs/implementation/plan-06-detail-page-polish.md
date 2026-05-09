# Implementation Plan 06 — Insight Detail Page Polish

**Phase:** P1 (Delivery & Reporting Enhancements)
**Original Reference:** Comprehensive Plan §2.5 (Tasks 2.5.1 – 2.5.4)
**Priority:** P1 — UI refinements
**Estimated Effort:** 4 tasks, ~1-2 days

---

## 0. Greenfield Development Policy

This is a **pre-production greenfield** codebase. This plan is frontend-only (no DB changes), but depends on schemas created by plans 02, 04, and 05. If any upstream schema changes are needed, run `make db:reset` to rebuild.

---

## 1. Overview

Refine the already-complete `InsightDetailPage.tsx` (798 lines) with a Settings tab, schedule status integration, webhook delivery status, and domain badges. The core page structure (Overview, Reports, AI Insights, History tabs, share modal, Run Now/Edit/Delete actions) is fully implemented; these tasks add polish and completeness.

### Business Value

- Per Section 2.4: "All properties editable post-creation" — Settings tab enables this
- Schedule status visibility supports automated delivery transparency
- Webhook delivery status completes the delivery pipeline visibility
- Domain badges reinforce multi-domain intelligence positioning

---

## 2. Prerequisites

### Already Implemented (Leverage These)

| Component            | Location                                                          | Notes                        |
| -------------------- | ----------------------------------------------------------------- | ---------------------------- |
| InsightDetailPage    | `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | 798 lines, complete          |
| ConfigurationSummary | Same file                                                         | Shows insight config summary |
| ReportsTab           | Same file                                                         | Shows report history         |
| ShareModal           | Same file                                                         | Share functionality          |

### Dependencies

| Plan                          | Relationship | Notes                                              |
| ----------------------------- | ------------ | -------------------------------------------------- |
| plan-02-scheduler             | Depends on   | Task 6.2 uses ScheduleStatusBadge from plan-02     |
| plan-04-domain-mapping        | Depends on   | Task 6.4 uses DomainMapper from plan-04            |
| plan-05-delivery-enhancements | Depends on   | Task 6.3 uses webhook_deliveries data from plan-05 |

---

## 3. Tasks

### Task 6.1: Add Settings Tab

**Original:** 2.5.1
**File:** `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (MODIFY)

**Implementation:**

1. Add a new "Settings" tab to the detail page tab bar (alongside Overview, Reports, AI Insights, History).

2. Settings tab content — full insight configuration editor inline:
   - **Connectors section:** Add/remove connectors, same as wizard step 2
   - **Metrics section:** Per-connector metric selection, same as wizard step 3
   - **AI Config section:** Model, quality, detail level, same as wizard step 4
   - **Schedule section:** Frequency, time, same as wizard step 5
   - **Delivery section:** Format, recipients, webhook URL, same as wizard step 5

3. Save/Cancel workflow:
   - "Save Changes" button → calls insight update API
   - "Cancel" button → reverts to current values
   - Show confirmation dialog if unsaved changes exist

4. Per Section 2.4: all properties must be editable post-creation.

5. Reuse existing wizard step components where possible (don't duplicate form logic).

**Testing:** Component tests for Settings tab; E2E test: edit setting → save → verify persisted.

---

### Task 6.2: Add Schedule Status to Overview Tab

**Original:** 2.5.2
**File:** `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (MODIFY)

**Implementation:**

1. Integrate `ScheduleStatusBadge` component (from plan-02, Task 2.5) into the Overview tab.

2. Show:
   - Next run time
   - Schedule frequency (daily, weekly, monthly, quarterly)
   - Enable/disable toggle (calls `insightSchedules.toggle` API)

3. Position below the existing ConfigurationSummary or as a dedicated "Schedule" card.

4. If no schedule exists, show "No schedule configured" with a "Set Schedule" link.

**Testing:** Component tests for all schedule states; integration with toggle API.

---

### Task 6.3: Add Webhook Delivery Status to Reports Tab

**Original:** 2.5.3
**File:** `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (MODIFY)

**Implementation:**

1. In the Reports tab, for each report entry, show delivery status:
   - Email: "Sent" / "Failed" / "Pending"
   - Webhook: "Delivered" / "Failed" / "Pending" / "Retry N/3"
   - XLSX: "Generated" / "Not requested"

2. Fetch from `webhook_deliveries` table (plan-05, Task 5.3).

3. Show delivery details on hover/click:
   - Webhook URL
   - Response code
   - Last attempt timestamp
   - Retry count

4. Use color coding: green (success), red (failed), yellow (pending/retry), gray (not applicable).

**Testing:** Component tests for all delivery status states; integration with webhook_deliveries API.

---

### Task 6.4: Add Domain Badges to ConfigurationSummary

**Original:** 2.5.4
**File:** `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` (MODIFY)

**Implementation:**

1. In the ConfigurationSummary component, display domain badges based on the insight's connectors.

2. Use `DomainMapper` service (plan-04, Task 4.1) to derive domains from connector IDs.

3. Badge format: small pill with domain name (e.g., "Marketing", "Finance", "SEO").

4. Position: Below the insight name/title, or in the connector list section.

5. Show deduplicated domains (if multiple connectors share a domain, show it once).

**Testing:** Component tests for domain badge rendering; verify correct domains for multi-connector insights.

---

## 4. File Change Summary

| File                                                              | Action     | Type                                                             |
| ----------------------------------------------------------------- | ---------- | ---------------------------------------------------------------- |
| `apps/frontend/src/features/insights/pages/InsightDetailPage.tsx` | **Modify** | Add Settings tab, schedule status, webhook status, domain badges |

---

## 5. Testing Requirements

| Test Type | Scope                                         | Coverage Target |
| --------- | --------------------------------------------- | --------------- |
| Component | Settings tab (all sections)                   | 80%+            |
| Component | Schedule status display                       | 80%+            |
| Component | Webhook delivery status                       | 80%+            |
| Component | Domain badges                                 | 80%+            |
| E2E       | Edit insight via Settings tab → save → verify | Full flow       |
| E2E       | Toggle schedule from Overview tab             | Full flow       |

---

## 6. Success Criteria

- [ ] Settings tab renders with all configuration sections
- [ ] All properties are editable and saveable from Settings tab
- [ ] Schedule status shows in Overview tab with enable/disable toggle
- [ ] Webhook delivery status shows per report in Reports tab
- [ ] Domain badges display in ConfigurationSummary
- [ ] No regressions in existing detail page functionality
- [ ] All tests pass

---

## 7. Dependencies on Other Plans

| Plan                          | Relationship | Notes                                 |
| ----------------------------- | ------------ | ------------------------------------- |
| plan-02-scheduler             | Depends on   | ScheduleStatusBadge component and API |
| plan-04-domain-mapping        | Depends on   | DomainMapper service                  |
| plan-05-delivery-enhancements | Depends on   | webhook_deliveries table and data     |

---

## 8. Risk Mitigation

| Risk                               | Mitigation                                                              |
| ---------------------------------- | ----------------------------------------------------------------------- |
| Settings tab form complexity       | Reuse wizard step components; don't duplicate form logic                |
| Unsaved changes lost on navigation | Confirmation dialog; browser `beforeunload` handler                     |
| Domain badge inconsistency         | DomainMapper is single source of truth                                  |
| Upstream schema changes            | Run `make db:reset` before starting — no migration compatibility needed |
