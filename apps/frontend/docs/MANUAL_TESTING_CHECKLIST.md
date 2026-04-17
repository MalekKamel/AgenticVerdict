# Manual Testing Checklist for Auth Implementation

This checklist provides manual testing procedures for the authentication system that cannot be automated through E2E tests.

## Prerequisites

- [ ] Dev server running on port 3000
- [ ] Modern browser (Chrome/Firefox/Safari)
- [ ] Screen reader software (NVDA/JAWS/VoiceOver)
- [ ] Device with keyboard for accessibility testing

## Accessibility Testing (T113)

### Screen Reader Testing

#### NVDA (Windows) / JAWS (Windows)

- [ ] **Login Page**
  - [ ] Navigate to `/auth/login`
  - [ ] Verify page title is announced: "Sign In - Masafh"
  - [ ] Tab to email field - label "Email" is announced
  - [ ] Tab to password field - label "Password" is announced
  - [ ] Tab to remember me checkbox - "Remember me" with state is announced
  - [ ] Tab to show/hide password button - "Toggle password visibility, button" is announced
  - [ ] Tab to sign in button - "Sign In, button" is announced
  - [ ] Enter invalid credentials - error is announced with role="alert"

#### VoiceOver (macOS/iOS)

- [ ] **Login Page**
  - [ ] Press VO+Right arrow to navigate through elements
  - [ ] Verify each interactive element is announced properly
  - [ ] Test rotor navigation (VO+U) to navigate by headings, form controls, landmarks
  - [ ] Verify ARIA landmarks are recognized

## RTL Layout Testing (T114)

### Arabic Language Testing

- [ ] **Language Switch**
  - [ ] Switch to Arabic (عربي)
  - [ ] Verify `dir="rtl"` is set on document element
  - [ ] Verify page text direction is right-to-left

- [ ] **Layout Mirroring**
  - [ ] Check logo alignment (should be right-aligned)
  - [ ] Check form fields (labels should be right-aligned)
  - [ ] Check navigation links (should be right-to-left)

## Keyboard Navigation Testing (T115)

- [ ] **Tab Order**
  - [ ] Press Tab repeatedly - verify logical tab order
  - [ ] First Tab focuses on first input (email)
  - [ ] Focus indicators are visible

- [ ] **Enter Key**
  - [ ] Press Enter on form field - form submits
  - [ ] Press Enter on buttons - activates them

**Date Created**: 2026-04-14
**Version**: 1.0.0
