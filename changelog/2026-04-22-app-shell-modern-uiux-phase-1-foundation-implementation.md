# Changelog: App Shell modernization — Phase 1 foundation implementation

**Date:** 2026-04-22  
**Scope:** Execution of the **Phase 1 (0-2 sprints)** modernization slice from [`docs/05-reference/app-shell-modern-uiux-implementation-plan.md`](../docs/05-reference/app-shell-modern-uiux-implementation-plan.md), focused on `apps/frontend/src/components/layout/AppShellLayout.tsx` and adjacent shell primitives. Delivers a typed navigation contract, functional nav rendering with active-route semantics, responsive shell behavior that restores desktop/tablet affordance parity, baseline shell accessibility improvements (landmarks, skip link, keyboard close behavior), and locale-safe routing hardening.

**Verification run:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false`, `pnpm --filter @agenticverdict/frontend lint`, `pnpm --filter @agenticverdict/frontend test -- --runInBand`.

---

## Summary

### Phase 1 goals covered

- **Replace prototype navbar with functional navigation:** Placeholder helper text was removed and replaced with a typed, rendered navigation list driven by a central contract.
- **Close critical responsive and accessibility gaps:** Desktop/tablet now preserve nav affordance; mobile drawer behavior remains controlled via burger state; semantic landmarks and skip-to-main were added.
- **Establish typed shell contracts:** A reusable typed nav schema now defines route targets, i18n keys, and active-match behavior.

### Delivered UX/UI outcomes

- **Navigation orientation:** Users now see concrete primary sections (Home, Dashboard, Onboarding, Feature Flags) with clear active state.
- **Breakpoint parity:** The shell no longer loses navigation on `sm+`; desktop/tablet now have persistent navbar access while mobile keeps burger-driven collapse behavior.
- **Accessibility baseline:** Added skip-link pattern, `header`/`nav`/`main` semantics, active-page `aria-current`, and keyboard `Escape` close for mobile nav with focus return to burger.
- **Locale-safe behavior:** Internal locale prefixing now guards against double-prefix output when a path already includes a supported locale.

---

## Added

### `apps/frontend/src/components/layout`

- **`app-shell-navigation.ts`** — typed app-shell navigation model:
  - `AppShellNavKey`
  - `AppShellNavItem`
  - `APP_SHELL_NAV_ITEMS`
  - explicit `matchMode` for exact vs prefix active-state logic
- **`AppNavigation.tsx`** — reusable nav renderer:
  - consumes typed schema
  - renders locale-aware links through `@/i18n/navigation`
  - computes and exposes active state with `aria-current="page"`
  - applies token-compatible visual active treatment using Mantine theme values

---

## Changed

### `apps/frontend/src/components/layout/AppShellLayout.tsx`

- Replaced placeholder navbar copy with real `AppNavigation` composition.
- Fixed shell navbar collapse behavior by explicitly keeping desktop nav available:
  - `collapsed: { mobile: !opened, desktop: false }`
- Added skip link before header content:
  - anchor targets `#main-content`
- Strengthened header controls for a11y:
  - dynamic `aria-label` for open/close states
  - `aria-expanded` and `aria-controls` wiring on burger
- Added keyboard close behavior:
  - `Escape` closes mobile nav
  - focus is returned to burger trigger after close
- Added semantic landmarks:
  - `AppShell.Header` as `header`
  - `AppShell.Navbar` as `nav`
  - `AppShell.Main` as `main` with stable `id="main-content"` and `tabIndex={-1}`

### `apps/frontend/src/i18n/navigation.tsx`

- Hardened `withLocalePrefix()` to avoid double locale prefixing when callers pass already-prefixed paths.
- Preserves existing locale-neutral navigation API shape (`Link`, `usePathname`, `useRouter`) while improving destination safety.

### `apps/frontend/src/styles/globals.css`

- Added `.skip-link` utility with logical positioning properties:
  - hidden off-canvas by default
  - visible on `:focus-visible`
  - high-contrast surface for keyboard users

### Translation files

- **`apps/frontend/messages/en.json`**:
  - added `Layout.closeNav`
  - added `Layout.skipToMain`
  - added `Layout.navLabel`
- **`apps/frontend/messages/ar.json`**:
  - added `Layout.closeNav`
  - added `Layout.skipToMain`
  - added `Layout.navLabel`
- **`apps/frontend/messages/fr.json`**:
  - added `Layout.closeNav`
  - added `Layout.skipToMain`
  - added `Layout.navLabel`
  - added missing `navigation.onboarding`
  - added missing `navigation.featureFlags`

---

## Plan mapping

| Plan section                                               | Delivered                                                                                                                                                   |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **§3.1 Component structure recommendations**               | Introduced separated shell navigation unit (`AppNavigation`) and typed model (`app-shell-navigation.ts`) while preserving `AppShellLayout` as orchestrator. |
| **§3.3 Navigation architecture**                           | Implemented typed nav schema with route keys and active-match semantics; rendered through locale-safe link wrapper.                                         |
| **§4.1 Navigation and information hierarchy**              | Replaced placeholder navbar with real section links and active-route indication.                                                                            |
| **§4.2 Interaction patterns**                              | Preserved burger interaction for mobile and added deterministic keyboard close/focus-return behavior.                                                       |
| **§4.4 Accessibility expectations (WCAG 2.1 AA baseline)** | Added skip-to-content, semantic landmarks, and improved ARIA state wiring for navigation controls.                                                          |
| **§4.5 Internationalization and RTL/LTR readiness**        | Added localized shell labels and logical-property skip-link styling; improved locale-prefix safety.                                                         |
| **§5.1 Phase 1 prioritized tasks 2–5**                     | Typed navigation model, functional navigation rendering, breakpoint behavior correction, and base accessibility mechanics delivered.                        |

---

## Validation evidence

- **Type safety:** `pnpm --filter @agenticverdict/frontend exec tsc --noEmit --pretty false` passed.
- **Linting:** `pnpm --filter @agenticverdict/frontend lint` passed.
- **Tests:** `pnpm --filter @agenticverdict/frontend test -- --runInBand` passed (20 files, 101 tests).
- **Design assets:** No `.pen` files were changed in this slice; `validate:pen-files` was not required.

---

## Risks addressed and residual follow-ups

### Addressed in this slice

- **Desktop nav affordance gap:** resolved by explicit desktop nav visibility behavior.
- **Orientation weakness:** resolved via concrete nav IA and active state.
- **Keyboard escape/focus path for mobile drawer:** baseline support added.

### Deferred to subsequent phases (per plan)

- **Nav filtering by tenant/role/feature flags** (plan §5.2 task 2).
- **Shell loading/error/empty states and retry UX** (plan §4.3, §5.2 task 1).
- **Breadcrumb and context-slot framework** (plan §4.1, §5.2 task 3).
- **Persistent shell preferences (tenant/user scoped)** (plan §4.2, §5.2 task 4).
- **Shell interaction instrumentation and route-transition telemetry** (plan §3.5, §5.2 task 5).
- **Expanded responsive verification matrix including E2E shell keyboard flows** (plan §6.1/§6.4).

---

## References

- [`docs/05-reference/app-shell-modern-uiux-implementation-plan.md`](../docs/05-reference/app-shell-modern-uiux-implementation-plan.md) — modernization source plan.
- [`apps/frontend/src/components/layout/AppShellLayout.tsx`](../apps/frontend/src/components/layout/AppShellLayout.tsx) — shell orchestrator updates.
- [`apps/frontend/src/components/layout/AppNavigation.tsx`](../apps/frontend/src/components/layout/AppNavigation.tsx) — new navigation renderer.
- [`apps/frontend/src/components/layout/app-shell-navigation.ts`](../apps/frontend/src/components/layout/app-shell-navigation.ts) — typed nav contract.
- [`apps/frontend/src/i18n/navigation.tsx`](../apps/frontend/src/i18n/navigation.tsx) — locale prefix hardening.
- [`apps/frontend/src/styles/globals.css`](../apps/frontend/src/styles/globals.css) — skip-link utility styles.
- [`apps/frontend/messages/en.json`](../apps/frontend/messages/en.json), [`apps/frontend/messages/ar.json`](../apps/frontend/messages/ar.json), [`apps/frontend/messages/fr.json`](../apps/frontend/messages/fr.json) — localization updates.
