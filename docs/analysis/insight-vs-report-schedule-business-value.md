# Business Value Analysis: Insight Schedule vs. Report Schedule

**Date:** 2026-05-11
**Scope:** Business architecture analysis of scheduling redundancy and value proposition
**Audience:** Product stakeholders, architects

---

## Executive Summary

**Insight scheduling and report scheduling do NOT do the same thing.** They serve fundamentally different business purposes, target different user needs, and produce different business outputs. However, the current implementation has significant overlap in the _technical_ scheduling infrastructure, which creates unnecessary complexity. This analysis clarifies the business distinction, identifies the actual redundancy, and provides actionable recommendations.

---

## 1. Business Definitions

### 1.1 What Is an Insight?

An **Insight** is a _configured intelligence query_ — a business question that the system answers repeatedly. It defines:

- **What data to look at** (which connectors: GA4, Meta, GSC, etc.)
- **What metrics to track** (sessions, conversions, ROAS, etc.)
- **How to analyze it** (AI model, quality level, detail level)
- **When to run** (schedule: daily, weekly, monthly)
- **Who gets the results** (delivery: email, web, format)

**Business analogy:** An Insight is like hiring a senior marketing analyst and telling them: _"Every Monday at 9 AM, look at our GA4 and Meta data, find patterns, and tell me what's working and what's not."_

### 1.2 What Is a Report?

A **Report** is a _formatted document_ — a deliverable artifact that packages intelligence findings for stakeholders. It defines:

- **What format** (PDF, Word, HTML)
- **What template** (branding, layout, structure)
- **What locale** (language, text direction — e.g., Arabic RTL)
- **When to generate** (schedule: cron expression)
- **Who receives it** (email recipients)

**Business analogy:** A Report is like taking the analyst's findings and formatting them into a professional PDF document with your company logo, in the right language, and emailing it to your boss.

---

## 2. Business Value Comparison

| Aspect                   | Insight Schedule                                                    | Report Schedule                                                                        |
| ------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| **Business Purpose**     | Generate _new intelligence_ from live data                          | Package _existing intelligence_ into formatted documents                               |
| **What It Produces**     | AI-generated findings, verdicts, recommendations                    | PDF/Word documents with branding and localization                                      |
| **Primary User**         | Analyst, Marketing Manager, Business Owner                          | Stakeholder, Executive, Client (recipient)                                             |
| **Cost to Run**          | High (LLM API calls, data fetching, AI analysis)                    | Low (document generation from existing data)                                           |
| **Frequency**            | Less frequent (weekly, monthly) — expensive                         | More frequent (daily, weekly) — cheap                                                  |
| **Data Freshness**       | Fetches _live_ data from connectors at execution time               | Uses _already-analyzed_ data or re-triggers analysis                                   |
| **Value Chain Position** | COLLECT → ANALYZE → GENERATE intelligence                           | FORMAT → DELIVER to stakeholders                                                       |
| **Example**              | "Every Monday, analyze our marketing data and tell me what changed" | "Every Monday, generate a branded PDF of last week's findings and email it to the CEO" |

---

## 3. Do They Do the Same Thing?

### Short Answer: No.

### Detailed Answer:

They are **complementary, not redundant**. Here's the business workflow:

```
┌─────────────────────────────────────────────────────────────────┐
│                    THE INTELLIGENCE WORKFLOW                     │
│                                                                  │
│  STEP 1: Insight Runs (Scheduled)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Connect to GA4, Meta, TikTok (live data)             │   │
│  │  2. Normalize metrics across platforms                   │   │
│  │  3. AI analyzes patterns and anomalies                   │   │
│  │  4. Generates verdicts and recommendations               │   │
│  │  5. Stores results in database                           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                              │                                   │
│                              ▼                                   │
│  STEP 2: Report Generates (Scheduled — optionally)              │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  1. Fetch stored insight results                         │   │
│  │  2. Apply branded template (logo, colors, layout)        │   │
│  │  3. Generate PDF in correct locale (Arabic RTL, etc.)   │   │
│  │  4. Email to stakeholders                                │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  Alternative: Insight runs AND generates its own report         │
│  (current implementation — insight execution includes report    │
│   generation and email delivery as part of the pipeline)        │
└─────────────────────────────────────────────────────────────────┘
```

### The Current Implementation Reality

Looking at the actual code (`report-queues.ts:829-1083`), the `defaultInsightExecutionProcessor` already:

1. Runs the full intelligence pipeline (COLLECT → ANALYZE → GENERATE)
2. Generates a PDF report from the results
3. Emails it to configured recipients
4. Stores everything in the database

**This means the current "Insight Schedule" already includes report generation.** The separate "Report Schedule" is an _alternative path_ for generating reports — potentially from different templates, for different audiences, or on different schedules than the insight itself.

---

## 4. Business Scenarios: When Each Is Needed

### Scenario A: Small Business (Direct Tenant)

- **Needs:** Insight scheduling only
- **Why:** The business owner wants weekly marketing analysis. The insight runs, generates findings, produces a PDF, and emails it. One schedule, one output.
- **Report Schedule Value:** Low — the insight already produces a deliverable.

### Scenario B: Marketing Agency (Agency Partner)

- **Needs:** Both insight scheduling AND report scheduling
- **Why:**
  - Insight runs daily to catch anomalies early (internal monitoring)
  - Report generates weekly for the client (polished, branded, white-labeled)
  - Different audiences, different formats, different schedules
- **Report Schedule Value:** High — separates internal intelligence from client deliverables.

### Scenario C: Executive Reporting

- **Needs:** Report scheduling on top of insight scheduling
- **Why:**
  - Insights run frequently (daily) to maintain fresh analysis
  - Executive report generates monthly (consolidated, high-level, branded)
  - The report aggregates multiple insights into one document
- **Report Schedule Value:** High — different cadence and audience.

### Scenario D: Multi-Channel Delivery

- **Needs:** Report scheduling
- **Why:**
  - Insight produces the intelligence (stored in DB)
  - Report schedule generates PDF for email
  - Another report schedule generates Word for archive
  - Another report schedule generates HTML for web viewing
- **Report Schedule Value:** High — same intelligence, multiple deliverable formats.

---

## 5. The Actual Problem: Technical Redundancy, Not Business Redundancy

### What IS Redundant (Technical Layer)

| Redundant Component     | Current State                                         | Problem                                               |
| ----------------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| **Schedule Storage**    | Reports: in-memory Map; Insights: JSONB column        | Two different storage mechanisms for the same concept |
| **Cron Validation**     | Reports: naive regex; Insights: none                  | Inconsistent validation quality                       |
| **BullMQ Registration** | Reports: `report-bullmq.ts`; Insights: direct enqueue | Duplicated job registration patterns                  |
| **Conflict Detection**  | Reports: in-memory check; Insights: none              | Inconsistent safety guarantees                        |
| **API Layer**           | Reports: Fastify REST; Insights: tRPC                 | Two different API paradigms                           |
| **Startup Recovery**    | Neither has it                                        | Both would lose schedules on restart                  |

### What is NOT Redundant (Business Layer)

| Business Aspect    | Insight Schedule               | Report Schedule           | Why Different                |
| ------------------ | ------------------------------ | ------------------------- | ---------------------------- |
| **Execution Cost** | High (LLM + data fetch)        | Low (document gen)        | Different resource planning  |
| **Output Type**    | Intelligence findings          | Formatted documents       | Different business artifacts |
| **Audience**       | Analyst/Manager                | Stakeholder/Client        | Different recipients         |
| **Configuration**  | Connectors, metrics, AI model  | Template, format, locale  | Different config domains     |
| **Error Impact**   | No new intelligence this cycle | No deliverable this cycle | Different business risk      |

---

## 6. Industry Standard Comparison

### How Leading Platforms Handle This

| Platform               | Insight Equivalent                    | Report Equivalent              | Approach                                            |
| ---------------------- | ------------------------------------- | ------------------------------ | --------------------------------------------------- |
| **Google Analytics 4** | Scheduled exploration queries         | Scheduled PDF exports          | Separate — query runs, then export                  |
| **Looker Studio**      | Data refresh schedule                 | Report delivery schedule       | Separate — data refreshes independently of delivery |
| **Tableau**            | Extract refresh schedule              | Subscription delivery schedule | Separate — data prep vs. distribution               |
| **HubSpot**            | Workflow automation (data processing) | Email report schedule          | Separate — processing vs. delivery                  |
| **SEMrush**            | Position tracking run                 | PDF report generation          | Separate — data collection vs. formatted output     |

**Industry Pattern:** All major platforms separate _data processing/analysis scheduling_ from _report delivery scheduling_. This is not redundancy — it's a deliberate architectural choice that enables:

- Different frequencies for analysis vs. delivery
- Multiple delivery formats from the same analysis
- Different audiences for internal vs. external reports
- Cost optimization (expensive analysis less frequent, cheap delivery more frequent)

---

## 7. Recommendations

### Recommendation 1: Keep Both, Unify the Infrastructure ✅

**Rationale:** The business value of having both is clear and matches industry standards. The problem is not the business concepts — it's the duplicated technical implementation.

**Action:** Implement the unified scheduling architecture as planned in `plan-02-scheduler.md`:

- Single `schedules` table with `entity_type` polymorphism
- Shared BullMQ utilities
- Unified tRPC API
- Shared conflict detection, recovery, and audit trail

**Business Impact:** Zero change to user experience. Significant reduction in maintenance burden and technical debt.

---

### Recommendation 2: Clarify the Business Relationship in the Product

**Rationale:** Users may be confused about the difference between insight scheduling and report scheduling. The product should make the relationship clear.

**Action:**

- In the UI, position report scheduling as a _delivery option_ that can be configured on top of an insight
- Use language like "When to analyze" (insight schedule) vs. "When to deliver" (report schedule)
- Consider coupling them by default: when a user creates an insight with a schedule, offer to also set up report delivery

---

### Recommendation 3: Consider Merging for Simple Use Cases

**Rationale:** For small businesses (Scenario A), having two separate schedules is overkill. The insight already generates its own report.

**Action:**

- Default behavior: Insight schedule includes report generation (current implementation)
- Advanced option: "Separate report schedule" for users who need different delivery cadences or formats
- This matches the industry pattern of "simple by default, powerful when needed"

---

### Recommendation 4: Add Cost Awareness to Scheduling

**Rationale:** Insight schedules are expensive (LLM API calls). Users should understand the cost impact of their schedule frequency.

**Action:**

- Show estimated monthly cost when configuring insight schedule frequency
- Warn users about high-frequency schedules (e.g., hourly insights)
- Suggest optimal frequencies based on data freshness needs

---

## 8. Risk Assessment

### If We Merge Insight and Report Scheduling Into One

| Risk                                                                           | Impact | Likelihood |
| ------------------------------------------------------------------------------ | ------ | ---------- |
| Agency partners lose ability to separate internal analysis from client reports | High   | Certain    |
| Cannot deliver same intelligence in multiple formats on different schedules    | High   | Certain    |
| Cannot have different audiences for analysis vs. delivery                      | Medium | Certain    |
| Product becomes less competitive with industry standards                       | Medium | High       |

### If We Keep Both But Don't Unify Infrastructure

| Risk                                                       | Impact   | Likelihood         |
| ---------------------------------------------------------- | -------- | ------------------ |
| Schedule data loss on restart (reports are in-memory)      | Critical | Certain on restart |
| Inconsistent validation (insights have no cron validation) | Medium   | High               |
| Duplicated code increases bug surface                      | Medium   | Certain over time  |
| Two API paradigms confuse frontend developers              | Low      | High               |

---

## 9. Conclusion

**Insight scheduling and report scheduling are NOT redundant from a business perspective.** They serve different purposes in the intelligence value chain:

- **Insight Schedule** = "When to think about the data" (expensive, analytical, internal)
- **Report Schedule** = "When to package and deliver the findings" (cheap, formatting, external)

This separation is an **industry standard** followed by GA4, Looker Studio, Tableau, HubSpot, and SEMrush. It enables agencies, enterprises, and multi-channel delivery scenarios that a single schedule cannot support.

**The real problem is technical debt** — two different implementations of the same scheduling infrastructure. The unified architecture planned in `plan-02-scheduler.md` is the correct solution: keep both business concepts, but implement them on a single, shared, maintainable foundation.

---

## Appendix A: Glossary

| Term                      | Definition                                                                   |
| ------------------------- | ---------------------------------------------------------------------------- | ----------------------------------------- |
| **Insight**               | A configured intelligence query that analyzes data from connectors using AI  |
| **Insight Schedule**      | When the insight's intelligence pipeline runs (COLLECT → ANALYZE → GENERATE) |
| **Report**                | A formatted document (PDF, Word, HTML) packaging intelligence findings       |
| **Report Schedule**       | When the report document is generated and delivered to stakeholders          |
| **Intelligence Pipeline** | The full lifecycle: COLLECT → ANALYZE → GENERATE → DELIVER                   |
| **Entity Type**           | Polymorphic classifier ('report'                                             | 'insight') in the unified schedules table |

## Appendix B: Current Implementation Mapping

| Business Concept  | Current Technical Implementation                    | Planned Unified Implementation                                 |
| ----------------- | --------------------------------------------------- | -------------------------------------------------------------- |
| Insight Schedule  | `insights.schedule` JSONB column                    | `schedules` table, `entity_type = 'insight'`                   |
| Report Schedule   | `schedule-store.ts` in-memory Map                   | `schedules` table, `entity_type = 'report'`                    |
| Insight Execution | `INSIGHT_EXECUTION_QUEUE` worker                    | Same, via `INSIGHT_SCHEDULE_QUEUE` → `INSIGHT_EXECUTION_QUEUE` |
| Report Generation | `REPORT_SCHEDULE_QUEUE` → `REPORT_GENERATION_QUEUE` | Same, via unified `schedules` table                            |
| Schedule API      | Fastify REST (reports) + tRPC (insights)            | Unified tRPC `schedules` router                                |
