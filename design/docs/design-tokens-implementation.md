# Design Tokens Implementation Guide

**File:** `design-tokens.pen`
**Created:** 2026-04-14
**Status:** Implementation Blueprint

---

## Overview

This document defines the complete design token system for AgenticVerdict. The tokens are organized in a three-tier hierarchy: Global → Brand → Component.

---

## 1. Global Tokens (Brand-Agnostic Primitives)

### Color Palette

#### Primary Blues

```
--av-color-blue-50:  #E7F5FF
--av-color-blue-100: #D0EBFF
--av-color-blue-200: #A5D8FF
--av-color-blue-300: #74C0FC
--av-color-blue-400: #4DABF7
--av-color-blue-500: #228BE6  ← Primary brand blue
--av-color-blue-600: #1C7ED6
--av-color-blue-700: #1976D2
--av-color-blue-800: #1864AB
--av-color-blue-900: #1971C2
```

#### Grays (Neutral Scale)

```
--av-color-gray-0:   #FFFFFF
--av-color-gray-50:  #F8F9FA
--av-color-gray-100: #F1F3F5
--av-color-gray-200: #E9ECEF
--av-color-gray-300: #DEE2E6
--av-color-gray-400: #CED4DA
--av-color-gray-500: #ADB5BD
--av-color-gray-600: #868E96
--av-color-gray-700: #495057
--av-color-gray-800: #343A40
--av-color-gray-900: #212529
--av-color-gray-1000:#000000
```

#### Semantic Colors

```
# Success (Green)
--av-color-green-500:  #40C057
--av-color-green-600:  #37B24D
--av-color-green-700:  #2F9E44

# Warning (Yellow)
--av-color-yellow-500: #FCC419
--av-color-yellow-600: #F59F00
--av-color-yellow-700: #E67700

# Danger (Red)
--av-color-red-500:    #FF6B6B
--av-color-red-600:    #FA5252
--av-color-red-700:    #F03E3E

# Info (Cyan)
--av-color-cyan-500:   #22B8CF
--av-color-cyan-600:   #18A5B8
--av-color-cyan-700:   #1098AD
```

### Spacing Scale (4px Base)

```
--av-spacing-xs:   4px    (0.25rem)
--av-spacing-sm:   8px    (0.5rem)
--av-spacing-md:   16px   (1rem)
--av-spacing-lg:   24px   (1.5rem)
--av-spacing-xl:   32px   (2rem)
--av-spacing-2xl:  48px   (3rem)
--av-spacing-3xl:  64px   (4rem)
```

### Typography Scale

```
--av-font-size-xs:     12px   (0.75rem)
--av-font-size-sm:     14px   (0.875rem)
--av-font-size-base:   16px   (1rem)
--av-font-size-lg:     18px   (1.125rem)
--av-font-size-xl:     20px   (1.25rem)
--av-font-size-2xl:    24px   (1.5rem)
--av-font-size-3xl:    30px   (1.875rem)
--av-font-size-4xl:    36px   (2.25rem)

--av-font-weight-light:     300
--av-font-weight-normal:    400
--av-font-weight-medium:    500
--av-font-weight-semibold:  600
--av-font-weight-bold:      700

--av-line-height-tight:   1.2
--av-line-height-normal:  1.5
--av-line-height-relaxed: 1.75

--av-font-family-primary: 'Inter', system-ui, -apple-system, sans-serif
--av-font-family-mono:    'JetBrains Mono', 'Consolas', monospace
```

### Border Radius

```
--av-radius-xs:  2px
--av-radius-sm:  4px
--av-radius-md:  8px
--av-radius-lg:  12px
--av-radius-xl:  16px
--av-radius-full: 9999px
```

### Shadows

```
--av-shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
--av-shadow-md:   0 4px 6px rgba(0, 0, 0, 0.1)
--av-shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.1)
--av-shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.15)
```

### Transitions

```
--av-transition-fast:   100ms ease-in-out
--av-transition-normal: 200ms ease-in-out
--av-transition-slow:   300ms ease-in-out
```

### Z-Index Scale

```
--av-z-index-base:      1
--av-z-index-dropdown:  100
--av-z-index-sticky:    200
--av-z-index-overlay:   300
--av-z-index-modal:     400
--av-z-index-popover:   500
--av-z-index-toast:     600
```

---

## 2. Brand Tokens (Tenant-Specific Overrides)

### Default Brand Configuration

```
--brand-color-primary:    var(--av-color-blue-700, #1976D2)
--brand-color-secondary:  var(--av-color-blue-400, #4DABF7)
--brand-color-accent:     var(--av-color-cyan-500, #22B8CF)

--brand-font-family:      var(--av-font-family-primary)

--brand-logo-url:         url('/logos/default.svg')
--brand-logo-width:       150px
--brand-logo-height:      40px
```

### Masafh Theme Configuration (Example Tenant)

```
--brand-color-primary:    #FF6B35  (Masafh Orange)
--brand-color-secondary:  #4C6EF5  (Companion Blue)
--brand-color-accent:     #FFD43B  (Gold)

--brand-font-family:      'Inter', system-ui, -apple-system, sans-serif

--brand-logo-url:         url('/logos/masafh.svg')
--brand-logo-width:       150px
--brand-logo-height:      40px
```

---

## 3. Component Tokens (Composed from Global/Brand)

### Button Tokens

```
--button-primary-bg:        var(--brand-color-primary)
--button-primary-text:      var(--av-color-gray-0)
--button-primary-hover:     var(--brand-color-secondary)
--button-primary-active:    var(--brand-color-primary)
--button-primary-disabled:  var(--av-color-gray-300)
--button-primary-focus:     var(--brand-color-secondary)

--button-secondary-bg:      transparent
--button-secondary-text:    var(--brand-color-primary)
--button-secondary-border:  var(--brand-color-primary)
--button-secondary-hover:   var(--av-color-blue-50)

--button-ghost-text:        var(--av-color-gray-700)
--button-ghost-hover:       var(--av-color-gray-100)

--button-danger-bg:         var(--av-color-red-600)
--button-danger-text:       var(--av-color-gray-0)
--button-danger-hover:      var(--av-color-red-700)

--button-success-bg:        var(--av-color-green-600)
--button-success-text:      var(--av-color-gray-0)
--button-success-hover:     var(--av-color-green-700)

--button-warning-bg:        var(--av-color-yellow-500)
--button-warning-text:      var(--av-color-gray-900)
--button-warning-hover:     var(--av-color-yellow-600)

--button-height-xs:         28px
--button-height-sm:         32px
--button-height-md:         40px
--button-height-lg:         48px
--button-height-xl:         56px

--button-padding-x-xs:      var(--av-spacing-sm)
--button-padding-x-sm:      var(--av-spacing-md)
--button-padding-x-md:      var(--av-spacing-lg)
--button-padding-x-lg:      var(--av-spacing-xl)
--button-padding-x-xl:      var(--av-spacing-2xl)
```

### Input Tokens

```
--input-bg:                 var(--av-color-gray-0)
--input-text:               var(--av-color-gray-900)
--input-border:             var(--av-color-gray-300)
--input-border-hover:       var(--av-color-gray-400)
--input-border-focus:       var(--brand-color-primary)
--input-placeholder:        var(--av-color-gray-500)

--input-error-border:       var(--av-color-red-500)
--input-error-text:         var(--av-color-red-600)
--input-warning-border:     var(--av-color-yellow-500)
--input-warning-text:       var(--av-color-yellow-600)
--input-success-border:     var(--av-color-green-500)
--input-success-text:       var(--av-color-green-600)

--input-height-sm:          32px
--input-height-md:          40px
--input-height-lg:          48px

--input-padding-x-sm:       var(--av-spacing-sm)
--input-padding-x-md:       var(--av-spacing-md)
--input-padding-x-lg:       var(--av-spacing-lg)
```

### Card Tokens

```
--card-bg:                  var(--av-color-gray-0)
--card-border:              var(--av-color-gray-200)
--card-text:                var(--av-color-gray-900)
--card-heading:             var(--av-color-gray-900)

--card-padding:             var(--av-spacing-md)
--card-radius:              var(--av-radius-lg)
--card-shadow:              var(--av-shadow-md)
```

### Badge Tokens

```
--badge-default-bg:         var(--av-color-gray-100)
--badge-default-text:       var(--av-color-gray-700)

--badge-primary-bg:         var(--av-color-blue-100)
--badge-primary-text:       var(--av-color-blue-800)

--badge-success-bg:         var(--av-color-green-100)
--badge-success-text:       var(--av-color-green-800)

--badge-warning-bg:         var(--av-color-yellow-100)
--badge-warning-text:       var(--av-color-yellow-800)

--badge-danger-bg:          var(--av-color-red-100)
--badge-danger-text:        var(--av-color-red-800)
```

### Form Field Tokens

```
--form-field-label:         var(--av-color-gray-700)
--form-field-helper:        var(--av-color-gray-500)
--form-field-error:         var(--av-color-red-600)
--form-field-required:      var(--av-color-red-500)
```

### Alert Tokens

```
--alert-info-bg:            var(--av-color-blue-50)
--alert-info-text:          var(--av-color-blue-800)
--alert-info-border:        var(--av-color-blue-300)

--alert-success-bg:         var(--av-color-green-50)
--alert-success-text:       var(--av-color-green-800)
--alert-success-border:     var(--av-color-green-300)

--alert-warning-bg:         var(--av-color-yellow-50)
--alert-warning-text:       var(--av-color-yellow-800)
--alert-warning-border:     var(--av-color-yellow-300)

--alert-error-bg:           var(--av-color-red-50)
--alert-error-text:         var(--av-color-red-800)
--alert-error-border:       var(--av-color-red-300)
```

### Tooltip/Popover Tokens

```
--tooltip-bg:               var(--av-color-gray-900)
--tooltip-text:             var(--av-color-gray-0)
--popover-bg:               var(--av-color-gray-0)
--popover-text:             var(--av-color-gray-900)
--popover-border:           var(--av-color-gray-200)
--popover-shadow:           var(--av-shadow-lg)
```

### Toast Tokens

```
--toast-bg:                 var(--av-color-gray-0)
--toast-text:               var(--av-color-gray-900)
--toast-border:             var(--av-color-gray-200)
--toast-shadow:             var(--av-shadow-xl)
```

---

## 4. Theme Axes Configuration

### Device Breakpoints

```
--device-phone:   320px
--device-tablet:  768px
--device-desktop: 1024px
```

### Density Modes

```
--density-compact-spacing-multiplier:  0.75
--density-default-spacing-multiplier:  1.0
--density-spacious-spacing-multiplier: 1.25
```

---

## 5. Accessibility Tokens

### Focus Indicators

```
--focus-ring-color:         var(--brand-color-secondary)
--focus-ring-width:         2px
--focus-ring-offset:        2px
```

### Color Contrast Compliance

```
--contrast-ratio-normal-text:    4.5:1   (WCAG 2.1 AA minimum)
--contrast-ratio-large-text:     3:1     (WCAG 2.1 AA minimum)
--contrast-ratio-ui-elements:    3:1     (WCAG 2.1 AA minimum)
```

### Touch Targets

```
--touch-target-min: 44px  (WCAG 2.1 AA minimum)
```

---

## 6. RTL/LTR Logical Properties

All directional tokens use logical properties:

```
--padding-inline-start    (left in LTR, right in RTL)
--padding-inline-end      (right in LTR, left in RTL)
--margin-inline-start     (left in LTR, right in RTL)
--margin-inline-end       (right in LTR, left in RTL)
--border-inline-start     (left border in LTR, right in RTL)
--border-inline-end       (right border in LTR, left in RTL)
```

Text alignment:

```
--text-align-start:   start (left in LTR, right in RTL)
--text-align-end:     end (right in LTR, left in RTL)
```

---

## Implementation Notes

1. **Token References:** Component tokens MUST reference global/brand tokens using `var()` syntax, not hardcoded values
2. **Fallback Values:** All token references should include fallback values for resilience
3. **Theme Application:** Brand tokens are overridden at runtime based on tenant context
4. **CSS Custom Properties:** Tokens are implemented as CSS custom properties for runtime modification
5. **Validation:** Theme configuration is validated before application; invalid values fall back to defaults

---

**Document End**
