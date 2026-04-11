# Connector refactoring — staged implementation review and remediation plan

**Date:** 2026-04-10  
**Scope:** Implementation vs `docs/architecture/connector-refactoring-migration-execution-plan.md`  
**Plan parts reviewed:** Part 1 (Code restructuring), Part 2 (Interface renaming), Part 3 (Testing strategy), Part 7 (Documentation updates), Part 8 (Common issues and solutions)  
**Diff reviewed:** Git **staged** changes at time of review (large connector-centric refactor, database workflow change, new packages).

---

## 1. Executive summary

| Criterion                                           | Result                                                                                                                                                                           |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No `TODO(MUST_IMPLEMENT)`                           | **Pass** — no occurrences in the repository.                                                                                                                                     |
| No stubs / legacy adapter package in application TS | **Pass** — no `ConnectorAdapter`, `createConnectorAdapter`, or `@agenticverdict/data-connectors` in `*.ts` / `*.tsx`.                                                            |
| ESLint (`turbo run lint`)                           | **Pass** — all packages in scope succeeded.                                                                                                                                      |
| TypeScript (`turbo run typecheck --continue`)       | **Fail** — `@agenticverdict/api` fails on `apps/api/src/server.ts` (Fastify instance / logger generic mismatch).                                                                 |
| Tests (`turbo run test --continue`)                 | **Fail** — `@agenticverdict/mock-platform-server`, `@agenticverdict/phase01-platform-integration` (rename fallout: `platform` vs `connector`, undefined connector in mock path). |

**Overall verdict:** **Not merge-ready** under a strict bar of monorepo-wide typecheck and test green. The refactor direction is coherent and most packages pass; remaining work is concentrated in **API typing**, **integration/mock-server tests**, **changelog accuracy**, and **documentation sweep / runbook alignment** with the push-only database workflow.

---

## 2. Traceability matrix (plan → evidence)

### Part 1: Code restructuring

| Requirement (plan)                                                                                         | Status          | Evidence / notes                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Core schema: agency partners, companies FK, insights, insight_connectors, usage, connector registry + tags | **Met**         | `packages/database/src/schema/core/{tenants,connectors,insights,usage}.ts`, `seed-connectors.ts`, `companies` enhancements.                                                                                                                                                    |
| Package rename `platform-adapters` → `data-connectors`                                                     | **Met**         | Staged tree under `packages/data-connectors/`; old package removed.                                                                                                                                                                                                            |
| New workspace packages (`multi-tenancy`, `queueing`)                                                       | **Met**         | `packages/multi-tenancy/`, `packages/queueing/`.                                                                                                                                                                                                                               |
| Drizzle numbered migrations + `migrate` flow as in §1.1 steps 3–4                                          | **Superseded**  | `changelog/2026-04-10-database-remove-versioned-sql-migrations.md`: versioned SQL removed; **push-only** (`drizzle-kit push`), `migrate.ts` removed, Makefile targets updated. Treat as intentional deviation; update any consumer docs that still describe `db:migrate` only. |
| Part 4 checklist: `pipeline-engine`, `pipeline-templates`                                                  | **Not present** | No such packages in repo; only relevant if Part 4 post-migration checklist is in scope for “done.”                                                                                                                                                                             |

### Part 2: Interface renaming

| Requirement (plan)                                                                                                   | Status          | Evidence / notes                                                                                          |
| -------------------------------------------------------------------------------------------------------------------- | --------------- | --------------------------------------------------------------------------------------------------------- |
| Rename family: platform adapters → connectors (`ConnectorAdapter`, snapshots/credentials/registry, config mock keys) | **Met (TS)**    | Types and imports aligned; string union `ConnectorType` in `packages/types`.                              |
| Plan snippet `ConnectorAdapter` with `fetchData` / `getMetrics` / rich surface                                       | **Not literal** | Actual interface uses `fetchMetrics`, etc. Documented intent in Part 3 changelog as plan-vs-repo mapping. |
| Tests and mock HTTP payloads use new field names                                                                     | **Partial**     | Failures where code uses `connector` but tests still assert `platform`.                                   |

### Part 3: Testing strategy

| Requirement (plan)                               | Status      | Evidence / notes                                                                                          |
| ------------------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------- |
| Unit + contract coverage for adapters / registry | **Met**     | e.g. `connector-adapter.contract.test.ts`, `registry.test.ts`, Vitest coverage config in data-connectors. |
| Shared fixtures (`@agenticverdict/testing`)      | **Met**     | `mockConnector`, `createTenant`, exports and tests.                                                       |
| Monorepo-wide coverage gates (70% / 85% / …)     | **Partial** | Part 3 changelog: not added as global CI policy.                                                          |
| All tests passing                                | **Not met** | See Section 4.                                                                                            |

### Part 7: Documentation updates

| Requirement (plan)                                 | Status           | Evidence / notes                                                                                                              |
| -------------------------------------------------- | ---------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`, root `README.md`                      | **Met (staged)** | Updated for connectors / `data-connectors`.                                                                                   |
| Runbooks (migration, performance, troubleshooting) | **Met (staged)** | `connector-centric-operations.md`, `connector-performance-validation.md`.                                                     |
| JSDoc on key public APIs                           | **Met (staged)** | Adapter, registry, tenant context (per Parts 6–7 work).                                                                       |
| Entire doc tree free of old package/API names      | **Not met**      | Many markdown files outside this stage still reference `platform-adapters`, `MockConnectorAdapter`, `createConnectorAdapter`. |

### Part 8: Common issues and solutions

| Requirement (plan)                                        | Status  | Evidence / notes                                                                                         |
| --------------------------------------------------------- | ------- | -------------------------------------------------------------------------------------------------------- |
| Operational troubleshooting aligned with migration issues | **Met** | `connector-centric-operations.md` symptom table links to Part 8 and related runbooks.                    |
| Consistency with actual DB workflow                       | **Gap** | Runbook still implies classic “generate/apply migrations” in places; repo is push-only for schema apply. |

---

## 3. Detailed findings

### 3.1 Blockers

1. **`@agenticverdict/api` typecheck** — `apps/api/src/server.ts`: `FastifyInstance` / logger generic incompatibility (multiple TS2345 / TS2322 lines). Pre-existing relative to connector work but blocks a clean `turbo run typecheck`.
2. **`@agenticverdict/phase01-platform-integration`** — `adapters-e2e.integration.test.ts`: assertions use `norm.platform`; normalized snapshots expose **`connector`**, so expectations receive `undefined`.
3. **Same package — `mock-mode.integration.test.ts`** — `isMockEnabledForConnector` called with **undefined** `connector` → `connector.toUpperCase()` throws.
4. **`@agenticverdict/mock-platform-server`** — `server.test.ts` expects `body.platform === "meta"`; response shape likely now uses **`connector`**.

### 3.2 Major

5. **`changelog/2026-04-10-connector-refactoring-part1-code-restructuring.md`** states Part 2 was “not executed” and old naming remained — **contradicts** current staged code and `2026-04-10-connector-part2-interface-renaming.md`. Risks confusion for auditors and future merges.
6. **Documentation debt** — High-value paths updated; broad repo still has stale references (`docs/mock-adapter-configuration.md`, `tests/docs/manual-testing-guide.md`, `docs/05-reference/mock-adapter-integration.md`, architecture research examples, older changelogs). Increases onboarding and support friction.

### 3.3 Minor

7. **`connector-centric-operations.md`** — Align “Drizzle / migration” bullets with **push-only** workflow documented in `packages/database/README.md` and `2026-04-10-database-remove-versioned-sql-migrations.md`.
8. **Plan §2 illustrative interface** — Either annotate the migration plan with a pointer to the canonical `ConnectorAdapter` in code, or trim the snippet to match `fetchMetrics` to avoid duplicate sources of truth.

---

## 4. Verification log (commands)

```bash
rg 'TODO\(MUST_IMPLEMENT\)'
rg 'ConnectorAdapter|createConnectorAdapter|@agenticverdict/data-connectors' --glob '*.{ts,tsx}'

pnpm exec turbo run typecheck --continue
pnpm exec turbo run lint --continue
pnpm exec turbo run test --continue
```

Record results in CI or PR description when remediating.

---

## 5. Changelog accuracy (quick audit)

| Changelog                                                         | Assessment                                                                                                                                 |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `2026-04-10-connector-refactoring-part1-code-restructuring.md`    | **Update required** — remove or revise “Part 2 not executed” and any statements that adapter naming is unchanged inside `data-connectors`. |
| `2026-04-10-connector-part2-interface-renaming.md`                | **Accurate** for rename scope; correctly notes API typecheck debt.                                                                         |
| `2026-04-10-connector-part3-testing-strategy.md`                  | **Accurate**; does not claim full monorepo test green.                                                                                     |
| `2026-04-10-connector-parts-6-7-performance-and-documentation.md` | **Accurate** for stated Parts 6–7 scope.                                                                                                   |
| `2026-04-10-database-remove-versioned-sql-migrations.md`          | **Accurate**; supersedes plan §1.1 migration mechanics where they conflict.                                                                |

---

## 6. Comprehensive remediation plan

### 6.1 Goals (exit criteria)

- `pnpm exec turbo run typecheck` exits **0** (or document explicit scope if API is temporarily excluded — not recommended).
- `pnpm exec turbo run test` exits **0** for packages touched by the refactor and for default CI scope.
- No regression of **lint**.
- **Changelogs** reflect final state (no contradictory “Part 2 not done” narrative).
- **Runbooks** match **push-only** DB workflow where they mention migrations.
- **Optional but recommended:** doc sweep or tracked follow-up ticket for remaining `platform-adapters` / `MockConnectorAdapter` references in markdown.

### 6.2 Phase A — Test and mock-server alignment (highest priority, low risk)

**Objective:** Eliminate rename drift between runtime and tests.

| Step | Action                                                                                                                                                                                       | Files / areas                                                                                                                                                          |
| ---- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| A.1  | Replace `norm.platform` with `norm.connector` (or assert both during transition only if backward compatibility is required — prefer single canonical field).                                 | `tests/phase01-platform-integration/src/integration/adapters-e2e.integration.test.ts`                                                                                  |
| A.2  | Fix mock-mode test: ensure `createConnectorAdapter` (or factory under test) receives a defined **`connector`** (`ConnectorType`) for every code path that calls `isMockEnabledForConnector`. | `tests/phase01-platform-integration/src/integration/mock-mode.integration.test.ts`                                                                                     |
| A.3  | Align mock HTTP test with response contract: expect `body.connector` (and update TypeScript type for parsed body if present).                                                                | `packages/mock-platform-server/src/server.test.ts`; verify `packages/mock-platform-server/src/index.ts` (or handler) emits the same field name as production adapters. |
| A.4  | Grep for remaining `.platform` on normalized snapshots or mock bodies in tests.                                                                                                              | `rg 'norm\\.platform                                                                                                                                                   | body\\.platform'`under`tests/`and`packages/mock-platform-server` |

**Verify:**

```bash
pnpm --filter @agenticverdict/mock-platform-server test
pnpm --filter @agenticverdict/phase01-platform-integration test
```

### 6.3 Phase B — API typecheck (unblock monorepo compile)

**Objective:** Resolve or properly narrow Fastify + logger types so `apps/api` passes `tsc --noEmit`.

| Step | Action                                                                                                                                                                                                     | Notes                                          |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| B.1  | Reproduce locally: `pnpm --filter @agenticverdict/api typecheck`.                                                                                                                                          | Capture exact lines.                           |
| B.2  | Prefer **minimal** fix: align `register` / plugin helper signatures with the actual `FastifyInstance` generic from `fastify()` construction, or introduce a small typed wrapper that satisfies both sides. | Avoid unrelated refactors.                     |
| B.3  | If the mismatch is dependency version skew (e.g. `pino` / `@types` / `fastify`), align versions per lockfile policy and document in PR.                                                                    |                                                |
| B.4  | Confirm no new `any`.                                                                                                                                                                                      | Use `unknown` + narrowing or correct generics. |

**Verify:**

```bash
pnpm --filter @agenticverdict/api typecheck
pnpm exec turbo run typecheck --continue
```

### 6.4 Phase C — Documentation and runbooks

| Step | Action                                                                                                                                                                                                                                                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- | -------------------------------------------------------------------------- |
| C.1  | Edit `docs/05-reference/runbooks/connector-centric-operations.md`: database section should primary-document **`db:push`** / `db:reset` / Makefile targets per `packages/database/README.md`; mention `generate` only as optional output to gitignored dir if applicable.                                                     |
| C.2  | Sweep high-traffic docs: `docs/mock-adapter-configuration.md`, `tests/docs/manual-testing-guide.md`, `docs/05-reference/mock-adapter-integration.md` — replace package names and factory names with `@agenticverdict/data-connectors`, `createConnectorAdapter`, `MockConnectorAdapter`, and snapshot field **`connector`**. |
| C.3  | Optional backlog: `rg 'platform-adapters                                                                                                                                                                                                                                                                                     | createConnectorAdapter | MockConnectorAdapter'`in`docs/` and fix or add “historical — see …” notes. |

### 6.5 Phase D — Changelog and plan hygiene

| Step | Action                                                                                                                                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D.1  | Amend or add a short addendum to `changelog/2026-04-10-connector-refactoring-part1-code-restructuring.md` clarifying that Part 2 was completed in a subsequent commit and the Part 1 file describes the **initial** restructuring batch only. |
| D.2  | Optionally add a dated sentence to the migration execution plan: “§1.1 migration apply path: team uses push-only workflow; see database README and remove-versioned-sql changelog.”                                                           |

### 6.6 Phase E — Hardening and policy (optional, time-boxed)

| Step | Action                                                                                                                                                                                                |
| ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E.1  | Add or tune CI to run `phase01-platform-integration` and `mock-platform-server` on PRs if not already mandatory.                                                                                      |
| E.2  | Consider a monorepo coverage gate incrementally (start with `@agenticverdict/data-connectors` + `@agenticverdict/testing`).                                                                           |
| E.3  | If Part 4 packages (`pipeline-engine`, `pipeline-templates`) are still desired, split into a separate initiative with its own design doc; do not block this refactor on them unless product mandates. |

### 6.7 Rollback / risk controls

- Keep connector rename and test fixes in **small commits** (tests first, then API types, then docs) for easy bisect.
- After DB workflow change, ensure **new developers** run `db:push` before seed — document in PR checklist.
- Re-run **`pnpm exec turbo run build`** if any export maps or `package.json` `exports` change during remediation.

### 6.8 Final sign-off checklist

- [ ] `pnpm exec turbo run lint`
- [ ] `pnpm exec turbo run typecheck`
- [ ] `pnpm exec turbo run test`
- [ ] `pnpm exec turbo run build` (if CI includes it)
- [ ] Part 1 changelog contradiction resolved
- [ ] Runbook DB wording aligned with push-only flow
- [ ] PR description links this review file and summarizes delta

---

## 7. Document control

| Field        | Value                                                                                         |
| ------------ | --------------------------------------------------------------------------------------------- |
| Maintainer   | Engineering                                                                                   |
| Location     | `docs/05-reference/reviews/2026-04-10-connector-refactoring-staged-review-and-remediation.md` |
| Related plan | `docs/architecture/connector-refactoring-migration-execution-plan.md`                         |

When remediation completes, add a one-line pointer from the PR or a short changelog entry referencing this file and the closing verification commands.
