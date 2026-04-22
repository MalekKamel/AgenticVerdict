# Frontend UI and architecture enforcement checklist

Use this checklist for any PR changing `apps/frontend`, `packages/ui`, localization, routing, UX flows, or frontend-facing architecture.

---

## Implementation checklist

- [ ] Route -> page -> component -> hook/service -> API boundary remains intact.
- [ ] Route files stay thin; business/state-transition logic lives in hooks/services.
- [ ] Navigation/redirect handling is validated and loop-prone targets are blocked.
- [ ] Shared feature shell/layout and existing `@agenticverdict/ui` components are reused.
- [ ] Styles use design tokens; no unexplained one-off hardcoded colors.
- [ ] Accessibility semantics are correct (`main`, status/alert regions, focus visibility, keyboard support).
- [ ] Localization keys are complete for touched locale namespaces (`en`, `ar`, `fr` as applicable).
- [ ] RTL/LTR behavior is validated for changed layouts.
- [ ] Telemetry for changed critical flows remains structured, tenant-safe, and secret-free.

---

## Verification checklist

- [ ] `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`
- [ ] Targeted Vitest suites for changed critical logic
- [ ] Relevant Playwright flows for changed behavior
- [ ] `pnpm --filter @agenticverdict/frontend run i18n:validate` (if locale changes)
- [ ] A11y automation/checks for changed surfaces

---

## Waiver checklist (only if deviating from MUST rules)

- [ ] PR includes explicit deviation rationale.
- [ ] Risk and mitigation are documented.
- [ ] Owner and due date for remediation are assigned.
