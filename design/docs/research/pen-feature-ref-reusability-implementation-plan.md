# Implementation plan: enforce `.pen` reuse and alignment with `design/system` libraries

**Version:** 1.1.0  
**Date:** 2026-04-15  
**Status:** Updated for official Pencil Design Libraries model (imports + cross-file `ref`)  
**Baseline:** [2026-04-15 design system Pencil architecture migration](../../../../changelog/2026-04-15-design-system-pen-architecture-migration.md), [pen-architecture-implementation-plan.md](./pen-architecture-implementation-plan.md) §1.2, [target-architecture.md](./target-architecture.md)

---

## Executive summary

This plan turns “reuse system primitives in feature `.pen` files” into **governed, repeatable practice** using Pencil’s official **Design Libraries** and JSON **`imports`** model. Feature work composes screens by referencing components from `/design/system/*.pen` through imported aliases (for example `system/PrimaryButton`), rather than rebuilding generic primitives in each feature file. Shipped UI remains **`@agenticverdict/ui`** as the runtime SSOT.

---

## 1. Scope and definitions

### 1.1 What is “system” vs “feature”

| Layer                    | Path                                                                             | Role                                                                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **System library**       | `design/system/` (`design-tokens.lib.pen`, `atoms.lib.pen`, `molecules.lib.pen`) | **Canonical** Pencil library sources for tokens and reusable primitives. Masters are `reusable: true` with stable naming (`Component/Category/Variant`) and are imported by feature files via aliases. |
| **Feature compositions** | `design/features/` (`auth.pen`, future `dashboard.pen`, …)                       | **Domain** screens, flows, and organisms. May introduce feature-local composition nodes, but generic atoms/molecules must be consumed from `design/system` libraries through imports.                  |
| **Assets**               | `design/assets/`                                                                 | Shared media referenced by `.pen` files; not a component library.                                                                                                                                      |
| **Markdown blueprints**  | `design/docs/` and implementation notes                                          | Human-readable specs that guide MCP and React implementation.                                                                                                                                          |

### 1.2 What counts as “forbidden duplication”

**Forbidden:**

- New **generic** UI primitives (buttons, inputs, cards, alerts, typographic styles, etc.) defined only under `features/` when an equivalent exists or belongs in `system/`.
- **Forked** masters: a `reusable` node under `design/features/` that copies system intent but uses **divergent** structure, token usage, or naming **without** an approved exception (see §5).
- **Hardcoded** colors/spacing in feature files where tokens exist in `design/system/design-tokens.lib.pen` or established variables.

**Not forbidden (and expected):**

- **Cross-file `ref` via imports** where a feature file references `design/system` components using `alias/ComponentId` (official Pencil model).
- **Feature-only** compositions (e.g. `Auth/LoginScreen/Default`) that are not reusable across domains—still must **consume** primitives via the authoring rules in §2.
- Feature-local reusable shells that are domain-only (for example `Auth/LayoutShell`) and do not duplicate system primitives.

### 1.3 What “compose from system” means in this repo

With official Pencil Design Libraries and `imports`, “compose from system” means:

1. Each feature `.pen` imports `/design/system` files with explicit aliases at root (`imports`).
2. Feature instances use `type: "ref"` with `ref: "alias/ComponentId"` for system atoms/molecules.
3. Token usage references imported library variables (for example `$alias/color-primary`) instead of hardcoded values.
4. React parity remains enforced through `@agenticverdict/ui` for shipped product UI.

---

## 2. Authoring rules

### 2.1 Where new reusable masters live

| Change                                                           | Location                                                                                                                  |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| New atom or molecule variant, or change to an existing primitive | **`design/system/`** only (MCP `batch_design` on `atoms.pen` / `molecules.pen` / tokens as appropriate).                  |
| New domain screen or flow                                        | **`design/features/<domain>.pen`** (prefer one file per domain; split with `design/features/README.md` inventory update). |

### 2.2 How feature files should instantiate “system” components

Authors MUST follow this order:

1. **Inspect system library** — Use Pencil MCP `batch_get` / `get_variables` on `design/system/atoms.lib.pen`, `design/system/molecules.lib.pen`, and `design/system/design-tokens.lib.pen`.
2. **Declare imports** — Add root-level `imports` aliases in the feature file that point to system `.pen` files with correct relative URIs.
3. **Instantiate from library** — In features, use `type: "ref"` and `ref: "alias/ComponentId"` for generic primitives.
4. **Prefer imported reuse over redraw** — If a primitive exists in system, instantiate it from the imported library rather than creating a parallel feature master.

### 2.3 Naming and structure

- **System:** `Component/Category/Variant` per [target-architecture.md](./target-architecture.md) §3.
- **Features:** `Domain/Component/Purpose` (e.g. `Auth/LoginForm/Default`) for domain-only reusable nodes.
- **Import aliases:** stable short names such as `system`, `tokens`, `atoms`, `molecules`.
- **Document splits:** `design/features/<domain>-<concern>.pen` only when size or ownership requires it; update `design/features/README.md` inventory table.

### 2.4 MCP workflow (mandatory for encrypted `.pen`)

- **Read/search:** `batch_get`, `get_variables`, `snapshot_layout`, `get_screenshot` for QA.
- **Edits:** `batch_design` (and related MCP tools) only—**no** hand-editing encrypted `.pen` JSON except validator-approved mechanical fixes ([Design system README](../../../../design/README.md)).

### 2.5 Contribution model (industry-aligned)

- **Design system maintainers** own merges to `design/system/`.
- **Product/feature designers** own `design/features/` but **request review** from design-system owners when adding imports, reusable nodes, or library overrides.
- **Exceptions** (temporary divergence) require a short **ADR or exception ticket** linked in the PR (see §5.2).

---

## 3. Enforcement strategy

### 3.1 Current automated gate (baseline)

- **Import checks (required)** — each feature file must have valid relative `imports` entries for required system libraries, and imported refs must resolve (`alias/ComponentId`).
- **CI:** `.github/workflows/ui-guidelines-enforcement.yml` runs validation on pushes/PRs touching `design/**`.

### 3.2 PR review checklist (required)

Reviewers of any `design/features/*.pen` change confirm:

- [ ] No new generic atom/molecule **reusable** masters unless justified as domain-specific and not duplicating `system/`.
- [ ] Token usage: prefer variables from system tokens; no unexplained raw hex where a token exists.
- [ ] Repeated primitives within the file use **`ref`**, not duplicated trees.
- [ ] Screenshots or `snapshot_layout` attached for non-trivial layout changes (per team norm).

### 3.3 Automation roadmap (recommended phases)

| Phase                 | Control                                                                                                                                | Fails CI / blocks merge when    |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| **A — Policy**        | Document + checklist (this plan)                                                                                                       | Manual review only              |
| **B — Heuristics**    | Reuse policy checks for feature files under `design/features/` (imports present, refs resolved, no unauthorized primitive duplication) | **CI:** strict mode fails build |
| **C — Deeper checks** | Optional: export node metadata via MCP in CI or nightly job; compare counts/naming to system inventory                                 | Team-defined thresholds         |

**Explicit:** Human review still validates structural/token semantics and exception quality, but import validity and cross-file ref resolution should be machine-checked in CI.

### 3.4 What fails CI or review today

- **CI:** validation errors on invalid `.pen`, broken `imports` paths, unresolved `alias/ComponentId` refs, or reuse-policy violations.
- **Review:** Merging feature PRs that violate §2 or §1.2 without an approved exception.

---

## 4. Migration and remediation

### 4.1 Inventory

1. List all `design/features/*.pen` (currently includes `auth.pen`; extend as new files land).
2. For each file, list nodes with `reusable: true` and map to **system** counterparts (or mark as domain-specific).

### 4.2 Remediation steps (per file)

1. Open feature file via MCP; add or verify `imports` aliases for `design/system` dependencies.
2. Replace duplicated generic primitives with imported `ref` instances (`alias/ComponentId`).
3. Update **`design/features/README.md`** inventory if file names or domains change.

### 4.3 Ordering and risk control

- Prefer **one domain per PR** to keep diffs reviewable.
- **No** mass mechanical JSON edit; use MCP operations to preserve ids and instance relationships where possible.

### 4.4 Acceptance criteria (remediation done)

- [ ] Each feature `.pen` documents (in PR description or README row) which system libraries it imports and why.
- [ ] No unexplained duplicate generic primitives remain per inventory; generic refs resolve from imported system libraries.

---

## 5. Risks and mitigations

| Risk                                                 | Mitigation                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| **Broken import paths after file moves**             | Keep imports relative and validated in CI; update imports whenever files are moved.                                |
| **Visual drift** between feature and system          | Mandatory library reuse via imported refs; spot-check screenshots; React still uses `@agenticverdict/ui`.          |
| **Workaround: fork primitives in features**          | Code review + optional heuristic script (§3.3); exceptions need written approval.                                  |
| **Tooling gap** (no automated duplication detection) | Phase B/C in §3.3; periodic audit (§6).                                                                            |
| **Unscoped variable usage**                          | Require alias-scoped variable references for imported design tokens; reject hardcoded fallbacks without rationale. |

### 5.1 Exception process

1. Open a short **exception** (issue or ADR) describing why the primitive cannot live in `system/` yet.
2. **Timebox** the exception; track follow-up to merge into `system/` or delete.
3. **Allowlist** (if Phase B scripting exists) the feature node id or name pattern until resolved.

---

## 6. Metrics and ongoing maintenance

| Metric                         | Method                                                                | Cadence                             |
| ------------------------------ | --------------------------------------------------------------------- | ----------------------------------- |
| **Feature file count / size**  | `design/features/README.md` inventory                                 | Update on each new file             |
| **Import integrity**           | Scripted check of `imports` paths and resolved refs                   | Every PR touching `design/features` |
| **Reusable nodes in features** | Manual or scripted count of `reusable: true` under `design/features/` | Quarterly audit                     |
| **Exceptions open**            | Issue tracker label `pen-exception`                                   | Review monthly                      |
| **Drift audits**               | Compare random screens to system screenshots + UI package             | Quarterly or before major release   |

**Ownership:** Design system working group (or assigned **design system + frontend** pair) reviews metrics quarterly and updates this plan when tooling or Pencil behavior changes.

---

## 7. Roles (RACI-style)

| Activity                        | Design system maintainer           | Feature designer | Frontend (UI package) | CI/DevEx |
| ------------------------------- | ---------------------------------- | ---------------- | --------------------- | -------- |
| `design/system/*.pen` changes   | **A/R**                            | C                | C                     | I        |
| `design/features/*.pen` changes | **C** (approval for reusable risk) | **A/R**          | I                     | I        |
| Validator / CI updates          | C                                  | I                | C                     | **A/R**  |
| Exception approvals             | **A**                              | R                | C                     | I        |

_(A = accountable, R = responsible, C = consulted, I = informed.)_

---

## 8. Phased rollout

| Phase              | Duration  | Outcome                                                                            |
| ------------------ | --------- | ---------------------------------------------------------------------------------- |
| **P0 — Adopt**     | 1 sprint  | This plan merged; PR checklist in `.github/PULL_REQUEST_TEMPLATE/design_system.md` |
| **P1 — Audit**     | 1 sprint  | Inventory in `design/features/README.md` (extend per new file)                     |
| **P2 — Remediate** | Ongoing   | Execute §4 per domain                                                              |
| **P3 — Automate**  | As needed | Phase B shipped; Phase C optional                                                  |

---

## 9. Success criteria (neutral reviewer)

A reviewer can answer **yes** to:

1. **Can a new feature `.pen` be authored in a way that respects system primitives?**  
   **Yes**—by following §2: import `/design/system` libraries, instantiate via `alias/ComponentId` refs, and avoid duplicate generic primitives.

2. **Is there an enforceable path to prevent duplicated primitives from reappearing in `features/`?**  
   **Yes**—through required imports, resolved cross-file refs, validation gates, review checklist, exception process, and quarterly audits (§3–§6).

3. **Are validation, review, and remediation steps specific enough to execute?**

---

## References

- [changelog/2026-04-15-design-system-pen-architecture-migration.md](../../../../changelog/2026-04-15-design-system-pen-architecture-migration.md)
- [Pencil docs: Design Libraries](https://docs.pencil.dev/core-concepts/design-libraries)
- [design/README.md](../../../../design/README.md)
- [pen-architecture-implementation-plan.md](./pen-architecture-implementation-plan.md) §1.2 (`ref` semantics)
- [target-architecture.md](./target-architecture.md) §2.3 (feature rules)
- [design/features/README.md](../../../../design/features/README.md)
- [design/system/README.md](../../../../design/system/README.md)
- `.github/workflows/ui-guidelines-enforcement.yml`
