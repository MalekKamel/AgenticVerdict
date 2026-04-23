# Frontend auth routes: UI/UX improvement

## Scope

- **Code path:** `apps/frontend/src/routes/$locale/auth`
- **Problem:** The authentication UI is functionally present but visually and experientially basic (spacing, alignment, hierarchy, and visual polish are below product expectations).

## Objective

Deliver a **professional, modern** authentication experience: clear visual hierarchy, consistent spacing and alignment, intentional use of icons, accessible focus and contrast, and layouts that feel considered on typical viewports. Align implementation with the project’s design system and UI guidelines (see `design-system/README.md` and `.cursor/rules/ui-guidelines.mdc`).

## Outcomes (definition of done)

1. **Layout and rhythm** — Predictable vertical spacing, consistent horizontal alignment, and balanced use of whitespace; no cramped or misaligned blocks.
2. **Visual hierarchy** — Primary actions, headings, and supporting text are easy to scan; brand-appropriate density without clutter.
3. **Icons and affordances** — Icons used purposefully (labels remain clear without relying on icons alone); states (loading, error, success) are obvious.
4. **Polish** — Rounded corners, dividers, and responsive behavior are consistent with the rest of the app and design tokens.
5. **Accessibility** — Meets WCAG 2.1 AA expectations for contrast, focus visibility, and keyboard use; supports RTL/LTR via logical properties and existing tenant/theme configuration.

## Task

1. **Review** the current auth route components, shared layout, and styles. Note gaps versus the design system (atoms/molecules, tokens, patterns already used elsewhere).
2. **Implement** UI/UX improvements within that scope: refine structure, spacing, typography scale, form presentation, and feedback (alerts, validation, buttons).
3. **Verify** visually and with basic keyboard/focus checks; keep changes scoped to the auth experience and shared primitives already in the repo (avoid one-off duplicate components when an existing pattern fits).

## Non-goals

- Redesigning authentication flows or backend contracts unless a small change is required solely to support the UI.
- Broad refactors outside the auth routes and their immediate dependencies.

## Deliverable

A merge-ready change set: updated auth UI in `apps/frontend/src/routes/$locale/auth` (and only related shared styling or components if required for consistency), with a short summary of what was improved and how it was validated.
