# Accessibility Verification Guide

**Scope:** All UI Foundation Components
**Standard:** WCAG 2.1 AA
**Date:** 2026-04-14

---

## Overview

This guide provides a systematic approach to verifying that all UI Foundation components meet WCAG 2.1 AA accessibility requirements. It includes automated testing strategies, manual verification procedures, and component-specific checklists.

---

## 1. Automated Testing

### 1.1 axe-core Integration

Configure axe-core for automated accessibility testing:

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    setupFiles: ["./tests/setup/accessibility.ts"],
    environment: "jsdom",
  },
});
```

```typescript
// tests/setup/accessibility.ts
import { configureAxe } from "jest-axe";

export const axe = configureAxe({
  rules: {
    // Enable all WCAG 2.1 AA rules
    "color-contrast": { enabled: true },
    label: { enabled: true },
    keyboard: { enabled: true },
    "focus-order-semantics": { enabled: true },
  },
});
```

### 1.2 Component Accessibility Tests

```typescript
// tests/accessibility/button.axe.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Button } from '@agenticverdict/ui';

expect.extend(toHaveNoViolations);

describe('Button Accessibility', () => {
  it('should have no violations - Primary', async () => {
    const { container } = render(<Button variant="primary">Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations - Icon only with aria-label', async () => {
    const { container } = render(
      <Button ariaLabel="Close">
        <Icon icon={IconX} />
      </Button>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations - Loading state', async () => {
    const { container } = render(<Button loading>Loading...</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations - Disabled state', async () => {
    const { container } = render(<Button disabled>Disabled</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

```typescript
// tests/accessibility/input.axe.test.tsx
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { Input, FormField } from '@agenticverdict/ui';

expect.extend(toHaveNoViolations);

describe('Input Accessibility', () => {
  it('should have no violations - With label', async () => {
    const { container } = render(
      <FormField label="Email">
        <Input type="email" />
      </FormField>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations - Error state', async () => {
    const { container } = render(
      <FormField label="Email" error="Invalid email format">
        <Input type="email" error ariaErrorMessage="email-error" />
      </FormField>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no violations - Required field', async () => {
    const { container } = render(
      <FormField label="Password" required>
        <Input type="password" required />
      </FormField>
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### 1.3 CI Pipeline Integration

```yaml
# .github/workflows/accessibility.yml
name: Accessibility Tests

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  accessibility:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install
      - name: Run axe-core tests
        run: pnpm test:accessibility
      - name: Upload results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: accessibility-results
          path: coverage/accessibility/
```

---

## 2. Manual Verification

### 2.1 Keyboard Navigation Testing

**Procedure:**

1. Load component page/story
2. Press `Tab` to navigate through all interactive elements
3. Verify focus is visible on each element
4. Press `Enter` or `Space` to activate buttons/links
5. Press `Escape` to close overlays/modals
6. Verify focus returns to trigger element

**Expected Results:**

- ✅ Focus moves logically through all interactive elements
- ✅ Focus indicator is clearly visible (2px solid outline)
- ✅ All actions can be performed with keyboard
- ✅ Focus trap works correctly in modals/overlays
- ✅ Focus returns to trigger when overlay closes

### 2.2 Screen Reader Testing

**Tools:**

- **macOS:** VoiceOver (Cmd+F5)
- **Windows:** NVDA (free) or JAWS
- **Browser:** ChromeVox (Chrome extension)

**Procedure:**

1. Enable screen reader
2. Navigate through component using screen reader controls
3. Verify component purpose and state are announced
4. Interact with component (click, toggle, etc.)
5. Verify state changes are announced

**Expected Results:**

- ✅ Component role and name announced
- ✅ Current state announced (checked, expanded, selected)
- ✅ State changes announced (toggle, open/close)
- ✅ Error messages announced
- ✅ Form labels associated with inputs

### 2.3 Color Contrast Testing

**Tools:**

- **Browser DevTools:** Chrome/Firebox built-in contrast checker
- **Extensions:** WCAG Contrast Checker
- **CLI:** pa11y

**Procedure:**

1. Inspect each text element
2. Measure contrast ratio against background
3. Verify ratios meet minimums:
   - Normal text (<18pt): ≥4.5:1
   - Large text (≥18pt): ≥3:1
   - UI components: ≥3:1

**Expected Results:**

- ✅ All normal text meets 4.5:1
- ✅ All large text meets 3:1
- ✅ All UI elements meet 3:1
- ✅ Focus indicators meet 3:1
- ✅ Error/warning/success states meet requirements

### 2.4 Touch Target Testing

**Procedure:**

1. Inspect all interactive elements
2. Measure bounding box dimensions
3. Verify minimum 44×44 CSS pixels
4. Verify 8px minimum spacing between adjacent targets

**Expected Results:**

- ✅ All buttons meet 44×44px
- ✅ All inputs meet 44×44px height
- ✅ All checkboxes/radios meet 44×44px (via label)
- ✅ Adjacent targets have 8px+ spacing

---

## 3. Component-Specific Checklists

### 3.1 Button

| Test                | Method             | Expected Result                   |
| ------------------- | ------------------ | --------------------------------- |
| Keyboard activation | Enter/Space        | Button activates                  |
| Focus indicator     | Tab to button      | 2px solid outline visible         |
| Icon-only button    | Screen reader      | aria-label announced              |
| Loading state       | Screen reader      | "Loading" announced via aria-live |
| Disabled state      | Screen reader      | "Disabled" announced              |
| Color contrast      | Contrast checker   | All states meet 4.5:1             |
| Touch target        | Measure dimensions | 44×44px minimum                   |

### 3.2 Input

| Test              | Method             | Expected Result                              |
| ----------------- | ------------------ | -------------------------------------------- |
| Label association | Screen reader      | Label announced when input focused           |
| Error state       | Screen reader      | Error message announced via aria-describedby |
| Required field    | Screen reader      | "Required" announced                         |
| Focus indicator   | Tab to input       | 2px solid outline visible                    |
| Validation states | Visual inspection  | Error/warning/success visually distinct      |
| Color contrast    | Contrast checker   | All text meets 4.5:1                         |
| Touch target      | Measure dimensions | 44×44px minimum height                       |

### 3.3 Checkbox

| Test                 | Method             | Expected Result                          |
| -------------------- | ------------------ | ---------------------------------------- |
| Toggle with keyboard | Space key          | Checkbox toggles                         |
| State announcement   | Screen reader      | "Checked" or "Unchecked" announced       |
| Indeterminate state  | Screen reader      | "Mixed" or "Partially checked" announced |
| Label association    | Screen reader      | Label announced with checkbox            |
| Focus indicator      | Tab to checkbox    | 2px solid outline visible                |
| Touch target         | Measure dimensions | 44×44px minimum (via label)              |

### 3.4 Radio

| Test                 | Method                  | Expected Result                        |
| -------------------- | ----------------------- | -------------------------------------- |
| Arrow key navigation | Arrow keys within group | Moves between options                  |
| Selection with Space | Space key               | Selected option activates              |
| Group announcement   | Screen reader           | Group label announced                  |
| State announcement   | Screen reader           | "Selected" or "Not selected" announced |
| Label association    | Screen reader           | Label announced with radio             |
| Focus indicator      | Tab to radio            | 2px solid outline visible              |

### 3.5 Switch

| Test                 | Method             | Expected Result             |
| -------------------- | ------------------ | --------------------------- |
| Toggle with keyboard | Space key          | Switch toggles              |
| State announcement   | Screen reader      | "On" or "Off" announced     |
| Role announcement    | Screen reader      | "Switch" announced          |
| Label association    | Screen reader      | Label announced with switch |
| Focus indicator      | Tab to switch      | 2px solid outline visible   |
| Touch target         | Measure dimensions | 44×44px minimum             |

### 3.6 Card (Clickable)

| Test                | Method             | Expected Result                         |
| ------------------- | ------------------ | --------------------------------------- |
| Keyboard activation | Enter/Space        | Card activates                          |
| Focus indicator     | Tab to card        | 2px solid outline visible               |
| Heading hierarchy   | Screen reader      | Card heading announced at correct level |
| Content structure   | Screen reader      | Heading, content announced in order     |
| Touch target        | Measure dimensions | 44×44px minimum                         |

### 3.7 Dropdown

| Test               | Method                 | Expected Result                     |
| ------------------ | ---------------------- | ----------------------------------- |
| Open with keyboard | Enter/Space on trigger | Menu opens                          |
| Navigate items     | Arrow keys             | Moves between menu items            |
| Select item        | Enter on item          | Item activates, menu closes         |
| Close with Escape  | Escape key             | Menu closes                         |
| Focus management   | Open menu              | Focus moves to first item           |
| Focus return       | Close menu             | Focus returns to trigger            |
| State announcement | Screen reader          | "Expanded" or "Collapsed" announced |
| Item position      | Screen reader          | "Item 1 of 5" announced             |

### 3.8 Tooltip

| Test                | Method                | Expected Result           |
| ------------------- | --------------------- | ------------------------- |
| Appears on focus    | Tab to trigger        | Tooltip appears           |
| Content announced   | Screen reader         | Tooltip content announced |
| Disappears on blur  | Tab away              | Tooltip disappears        |
| Keyboard accessible | Not blocking keyboard | User can tab past trigger |

### 3.9 Alert

| Test                | Method                     | Expected Result                              |
| ------------------- | -------------------------- | -------------------------------------------- |
| Auto-announcement   | Mount alert                | Content announced immediately                |
| Close with keyboard | Tab to close button, Enter | Alert closes                                 |
| Icon purpose        | Visual inspection          | Icon reinforces message (not sole indicator) |
| Color contrast      | Contrast checker           | Text meets 4.5:1 against background          |

### 3.10 Toast

| Test                | Method               | Expected Result                       |
| ------------------- | -------------------- | ------------------------------------- |
| Auto-announcement   | Mount toast          | Content announced immediately         |
| Action button       | Tab to action, Enter | Action activates                      |
| Close with keyboard | Tab to close, Enter  | Toast closes                          |
| Auto-dismiss        | Wait for timeout     | Toast dismisses, focus managed        |
| Timeout announced   | Screen reader        | "Will dismiss in 5 seconds" announced |

---

## 4. RTL/LTR Accessibility Verification

### 4.1 Keyboard Navigation in RTL

| Test                   | Method                        | Expected Result                               |
| ---------------------- | ----------------------------- | --------------------------------------------- |
| Tab order              | Tab through page              | Order remains logical (not mirrored)          |
| Arrow keys in dropdown | Arrow keys in RTL menu        | Direction mirrors (Left=next, Right=previous) |
| Arrow keys in radio    | Arrow keys in RTL radio group | Direction mirrors                             |

### 4.2 Screen Reader in RTL

| Test                   | Method                    | Expected Result                         |
| ---------------------- | ------------------------- | --------------------------------------- |
| Text reading order     | Screen reader in Arabic   | Text reads right-to-left                |
| Component announcement | Screen reader in RTL      | Component structure announced correctly |
| Form labels            | Screen reader in RTL form | Labels associated with inputs correctly |

---

## 5. Verification Results Template

### Component: [Component Name]

| Test                | Status            | Notes           |
| ------------------- | ----------------- | --------------- |
| Keyboard navigation | ✅ Pass / ❌ Fail | Details         |
| Focus indicator     | ✅ Pass / ❌ Fail | Details         |
| Screen reader       | ✅ Pass / ❌ Fail | Details         |
| Color contrast      | ✅ Pass / ❌ Fail | Ratio: X:1      |
| Touch target        | ✅ Pass / ❌ Fail | Dimensions: W×H |
| ARIA attributes     | ✅ Pass / ❌ Fail | Details         |
| RTL support         | ✅ Pass / ❌ Fail | Details         |

**Overall Status:** ✅ Pass / ❌ Fail

**Issues Found:**

1. [Issue description]
   - Severity: Critical / Serious / Moderate / Minor
   - WCAG Criterion: X.X.X
   - Resolution: [How to fix]

---

## 6. Common Issues and Resolutions

### Issue: Color contrast fails on light backgrounds

**Severity:** Critical
**WCAG Criterion:** 1.4.3 Contrast (Minimum)
**Resolution:** Darken text color or lighten background to achieve ≥4.5:1 ratio

### Issue: Focus indicator not visible

**Severity:** Critical
**WCAG Criterion:** 2.4.7 Focus Visible
**Resolution:** Add `outline: 2px solid --focus-ring-color` to `:focus` state

### Issue: Icon-only button lacks accessible name

**Severity:** Critical
**WCAG Criterion:** 4.1.2 Name, Role, Value
**Resolution:** Add `aria-label` prop to icon-only buttons

### Issue: Error message not announced

**Severity:** Critical
**WCAG Criterion:** 3.3.1 Error Identification
**Resolution:** Add `aria-describedby` pointing to error message element

### Issue: Touch targets too small

**Severity:** Serious
**WCAG Criterion:** 2.5.5 Target Size
**Resolution:** Increase padding to ensure 44×44px minimum

### Issue: Tab order illogical

**Severity:** Serious
**WCAG Criterion:** 2.4.3 Focus Order
**Resolution:** Reorder DOM elements or use `tabIndex` to correct order

---

## 7. Continuous Monitoring

### 7.1 Automated Scans

Schedule weekly automated accessibility scans using:

```bash
# Run axe-core on all component stories
pnpm test:accessibility -- --watchAll=false --coverage

# Run pa11y CI on production URLs
pa11y-ci --config .pa11yci.json
```

### 7.2 Manual Audits

Conduct manual accessibility audits quarterly:

1. Test with multiple screen readers
2. Test with keyboard only
3. Test in high contrast mode
4. Test with reduced motion
5. Test in RTL and LTR modes

### 7.3 User Testing

Include users with disabilities in testing:

- Recruit users with various abilities
- Test real-world scenarios
- Gather feedback on accessibility
- Iterate based on findings

---

## 8. Compliance Certification

### Self-Certification Statement

The AgenticVerdict Design System components have been tested against WCAG 2.1 AA standards using:

- Automated testing with axe-core (zero violations)
- Manual keyboard navigation testing
- Screen reader testing (VoiceOver, NVDA)
- Color contrast verification
- Touch target measurement
- RTL/LTR layout verification

**Date:** 2026-04-14
**Tested By:** Design System Team
**Status:** WCAG 2.1 AA Compliant

---

**Document End**
