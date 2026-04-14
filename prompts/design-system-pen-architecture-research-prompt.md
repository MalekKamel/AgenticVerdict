# Design system `.pen` architecture: research and restructure prompt

**Purpose:** Guide research, decision-making, and execution for reorganizing AgenticVerdict design files and their relationship to `@agenticverdict/ui`, without preserving legacy layout (pre-production).

---

## 1. Context

The current `/design-system` layout scatters primitives and feature work in ways that increase fragmentation, weakens discoverability, and makes reuse across features harder than necessary. Before changing files, validate whether consolidation and a clearer split between **system primitives** and **feature compositions** improves maintainability and matches common practice for design-token and component libraries.

---

## 2. Objectives

1. **Centralize primitives** — Maintain authoritative `.pen` sources for reusable building blocks (for example, a single `atoms.pen` for primitives such as badge and button, and `molecules.pen` for composed patterns such as alert and card), unless research shows a better industry-accepted split.
2. **Isolate feature design** — Keep product areas in dedicated feature files (for example `auth.pen`, `dashboard.pen`) that **reference** shared primitives rather than duplicating them.
3. **Align implementation** — Generate or map reusable React (Mantine v9 + `@agenticverdict/ui`) components from the system `.pen` sources so the app consumes one implementation path.
4. **Document decisions** — Produce written research, a recommended target tree, and a phased implementation plan with acceptance criteria.

---

## 3. Proposed target layout (hypothesis — validate in research)

Use a spec-driven, three-bucket layout under the design root (exact root folder name must match repository conventions, for example `design/` vs `design/`):

| Area         | Role                                             | Examples                                              |
| ------------ | ------------------------------------------------ | ----------------------------------------------------- |
| **System**   | Tokens, atoms, molecules, stencil exports        | `atoms.pen`, `molecules.pen`, shared variables/themes |
| **Features** | Screen- or domain-specific compositions          | `auth.pen`, `profile.pen`, `dashboard.pen`            |
| **Assets**   | External raster/vector references used by `.pen` | Icons, illustrations, stock imagery                   |

Illustrative structure:

```text
<design-root>/
├── system/           # atoms.pen, molecules.pen, stencil collection exports
├── features/         # auth.pen, profile.pen, dashboard.pen, …
└── assets/           # icons, images, and other shared media
```

Feature files should **reuse** system components (instances/refs per Pencil workflows), not fork copies of atoms and molecules.

---

## 4. Research scope (deliver evidence-backed answers)

Conduct structured research and cite sources (design-system literature, tooling docs, and comparable OSS monorepos where useful). Address at least:

- **File granularity:** One file per tier (`atoms.pen`, `molecules.pen`) versus multiple files per category; trade-offs for merge conflicts, load times, and MCP/Pencil workflows.
- **Atomic design and naming:** How atoms/molecules/templates map to `.pen` and to React packages in mature systems.
- **Feature vs. system boundary:** Where templates/pages live in `.pen` and how feature files should depend on system frames.
- **Code generation:** Patterns for generating or hand-maintaining `packages/ui` from `.pen` (or keeping `.pen` as visual SSOT with parallel code), including drift prevention.
- **Assets:** Conventions for shared icons and images so RTL/LTR and theming stay consistent.

---

## 5. Required deliverables

Produce new or updated documentation under the repository (paths to be chosen for consistency with `/design/docs/` and `/design/`), including:

1. **Research memo** — Assumptions, findings, citations, and a clear recommendation (accept, adapt, or reject the proposed layout).
2. **Target architecture** — Final directory tree, naming rules, and rules for what belongs in `system/` vs `features/` vs `assets/`.
3. **Implementation plan** — Phases, file moves, Pencil MCP steps (`validate:pen-files` and related checks), and updates to `@agenticverdict/ui` exports.
4. **Migration checklist** — Ordered tasks to retire the old structure completely (no backward-compatibility branch required).

---

## 6. Constraints

- **Pre-production:** No requirement to preserve backward compatibility with the current `/design-system` file arrangement.
- **Full restructure:** Plan for a deliberate cutover of design files and dependent references, not incremental coexistence unless research justifies it for risk reduction.

---

## 7. Execution notes

- Edit `.pen` files only through **Pencil MCP** workflows per project UI guidelines; run **`pnpm run validate:pen-files`** after `.pen` changes.
- Keep **WCAG 2.1 AA** and **RTL/LTR** requirements in scope when recommending structure (shared primitives, logical layout, tenant theming).

---

## 8. Definition of done

- Research memo and implementation plan are merged with explicit file paths and owner-ready tasks.
- Target `system/` / `features/` / `assets/` layout is specified and mapped to `packages/ui` consumption.
- Validation commands for `.pen` artifacts are listed and pass on the final tree.
