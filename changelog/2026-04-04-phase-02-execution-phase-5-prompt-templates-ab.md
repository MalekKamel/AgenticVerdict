# Changelog entry: Phase 2 — Execution Phase 5 (Prompt templates, company injection, A/B framework)

**Date:** 2026-04-04  
**Scope:** Phase 2 — [Execution Phase 5 — Prompt templates, company injection, and A/B framework](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md), mapping to `tasks.md` **3.1**, **3.2**, and **3.3**.

This entry adds a **versioned, Zod-validated** prompt catalog (≥10 production templates), a **company context** builder with **approximate token budgeting** and **layered assembly** (documented precedence: system policy → company context → user task → tool context), and a **paired A/B harness** with aggregate metrics, paired **Student _t_** significance, winner selection, and an audit-friendly **decision record** helper. All templates are covered by **golden** and **registry** tests; injection and A/B paths are unit-tested without live LLMs.

---

## Summary

- New **`packages/agent-runtime/src/prompts/`** module: **`types`** (`PromptTemplateRecord`, Zod schemas, **`PromptTemplateError`**), **`library`** (**13** records / **12** unique ids including **`analysis.cross_platform_overview@1.1.0`** history), **`registry`** (**`resolvePromptTemplate`**, **`getPromptTemplateHistory`**, **`listPromptTemplateIds`**, **`listPromptTemplatesByType`**), **`render`** (**`renderPromptTemplate`**, **`listTemplatePlaceholders`**, **`estimateApproximateTokenCount`**).
- **`company-injection`**: **`buildCompanyPromptContextSections`**, **`buildCompanyPromptContext`** (priority-ordered inclusion, **compact** identity/localization when the budget is tight), **`assemblePromptLayers`** (trims **tool** then **company** text; does not truncate caller system policy or user task).
- **`ab-testing`**: **`runPairedPromptAbTest`**, **`selectPromptAbWinner`**, **`buildAbDecisionRecord`** (paired quality diff, optional significance at 95%, token/latency/efficiency aggregates).
- **`@agenticverdict/config`** dependency on **`agent-runtime`** for **`CompanyConfig`** typing; **`AGENT_RUNTIME_PACKAGE_VERSION`** → **0.6.0**; root **`prompts/index.ts`** + package **`index.ts`** re-exports.

---

## Added

### Source modules (`packages/agent-runtime/src/prompts/`)

- **`types.ts`** — **`promptTemplateTypeSchema`**, **`promptTemplateRecordSchema`**, **`PromptTemplateError`**.
- **`library.ts`** — **`PRODUCTION_PROMPT_TEMPLATES`**, **`PRODUCTION_PROMPT_TEMPLATE_COUNT`**.
- **`registry.ts`** — semver-ordered history and resolution helpers.
- **`render.ts`** — placeholder validation and rendering; token **heuristic** (~4 chars per token).
- **`company-injection.ts`** — tenant-safe **`CompanyConfig`** serialization and budgeting.
- **`ab-testing.ts`** — paired fixture runner and winner selection.
- **`index.ts`** — barrel exports.

### Tests

- **`src/prompts/prompts.test.ts`** — catalog size + Zod, latest-version resolution, history order, render golden, injection + layer assembly, A/B mock invoke.

---

## Changed

- **`packages/agent-runtime/package.json`** — **`@agenticverdict/config`** workspace dependency.
- **`packages/agent-runtime/src/index.ts`** — Phase 5 public exports; version **0.6.0**.
- **`pnpm-lock.yaml`** — lockfile updated for the new dependency edge.

---

## Verification (local)

Commands run successfully after the changes:

- `pnpm --filter @agenticverdict/agent-runtime exec vitest run src/prompts/prompts.test.ts`
- `pnpm exec turbo run lint typecheck test --filter=@agenticverdict/agent-runtime`
- `pnpm run check:cycles`

---

## Usage notes

- **Templates:** Call **`resolvePromptTemplate(id, version?)`** (omit **`version`** for latest). Render with **`renderPromptTemplate(record, values)`**; placeholders must match declared **`variables`**.
- **Company context:** Use **`buildCompanyPromptContext(config, { maxApproxTokens })`** for a single system-friendly block; combine with **`assemblePromptLayers`** when separating **system** vs **user** and optional **tool** blob.
- **A/B:** Pass deterministic **`invoke`** (for example **`AgentMockChatModel`**) in CI; use **`buildAbDecisionRecord`** for structured logging or trace metadata (**no PII**).

---

## Known follow-ups (not in this change set)

- **Execution Phase 6** — agent factory wiring default prompt + memory (**tasks.md** Category 4).
- **Provider tokenizers** — replace **`estimateApproximateTokenCount`** when calibrating against Anthropic/OpenAI token APIs.
- **§1.3.7 / optimization playbook** — extended quality rubrics and human review workflow (this change supplies code hooks and documentation in JSDoc only).

---

## Related documentation

- [`docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md`](docs/03-development-phases/phase-02-agent-intelligence/EXECUTION-PLAN.md) — Execution Phase 5 definition and verification.
- [`docs/03-development-phases/phase-02-agent-intelligence/tasks.md`](docs/03-development-phases/phase-02-agent-intelligence/tasks.md) — tasks **3.1–3.3**.
