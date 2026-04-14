# Design system: enforce `.pen` reuse via `ref` (implementation plan prompt)

**Purpose:** Instruct an author or agent to produce a **single, authoritative implementation plan** that makes **`design/system`** the mandatory source for reusable Pencil masters in **`design/features`**, with **no ad hoc duplication** of primitives or composed patterns across feature files—aligned with common design-system governance practice and this repository’s Pencil constraints.

---

## 1. Background (read first)

The **pen architecture migration** is implemented and summarized in:

- [`changelog/2026-04-15-design-system-pen-architecture-migration.md`](../changelog/2026-04-15-design-system-pen-architecture-migration.md)

Use that changelog (and linked architecture docs it references) as the factual baseline for paths, file roles (`system/` vs `features/` vs `assets/`), and how **`ref`** is expected to behave in consolidated system documents.

---

## 2. Objective

- **Reuse, don’t copy:** Every feature-level `.pen` under `design/features/` must **compose** screens and flows by **referencing** reusable masters from `design/system/` using Pencil **`type: "ref"`** (and related instance patterns), instead of duplicating atom or molecule definitions inline.
- **Apply everywhere:** Treat this as a **repo-wide rule** for **all** current and future feature `.pen` files—not an optional convention for select domains.
- **Stay consistent with product SSOT:** Pencil remains the design source; shipped UI continues to map to **`@agenticverdict/ui`** and Mantine patterns per existing guidelines.

---

## 3. Deliverable

Produce **one markdown document** (implementation plan) that is:

- **Actionable** — Phases, owners or roles, concrete checks, and acceptance criteria.
- **Aligned with industry practice** — Governance (contribution model, review gates), versioning or change control where relevant, documentation and discoverability, and prevention of drift (lint/validation, CI, or manual audits as appropriate).
- **Grounded in this repo** — References `validate:pen-files`, Pencil MCP workflows, and paths under `design/`; calls out **technical constraints** (for example, how **`ref`** resolves in this toolchain, including same-document vs cross-document behavior) and turns them into explicit enforcement or workflow rules.

---

## 4. Required sections in the plan

The plan **must** include, at minimum:

1. **Scope and definitions** — What counts as “system” vs “feature,” and what constitutes forbidden duplication.
2. **Authoring rules** — How feature files should instantiate system components; naming, structure, and where new reusable masters must live.
3. **Enforcement strategy** — How compliance is verified continuously (automation first where feasible, plus human review); what fails CI or review.
4. **Migration / remediation** — How to bring existing `features/*.pen` into compliance without breaking references or validation.
5. **Risks and mitigations** — Including Pencil-specific limitations and how the team will avoid workarounds that reintroduce duplication.
6. **Metrics and ongoing maintenance** — How the team will know the rule is holding (spot checks, dashboards, periodic audits).

---

## 5. Constraints

- Do **not** hand-edit encrypted `.pen` JSON except for validator-approved mechanical fixes; design changes use **Pencil MCP** tools per repository rules.
- Do **not** contradict the **Design system README** and **`pnpm run validate:pen-files`** expectations without documenting an explicit exception process.

---

## 6. Success criteria

The plan is complete when a neutral reviewer can answer **yes** to:

- Can a new feature `.pen` be authored **only** by composing **`ref`** instances from `design/system/`?
- Is there a **clear, enforceable** path to prevent duplicated primitives from reappearing in `design/features/`?
- Are **validation, review, and remediation** steps specific enough to execute without further architecture debate?
