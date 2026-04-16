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
--global-color-blue-50:  #E7F5FF
--global-color-blue-100: #D0EBFF
--global-color-blue-200: #A5D8FF
--global-color-blue-300: #74C0FC
--global-color-blue-400: #4DABF7
--global-color-blue-500: #228BE6  ← Primary brand blue
--global-color-blue-600: #1C7ED6
--global-color-blue-700: #1976D2
--global-color-blue-800: #1864AB
--global-color-blue-900: #1971C2
```

#### Grays (Neutral Scale)

```
--global-color-gray-0:   #FFFFFF
--global-color-gray-50:  #F8F9FA
--global-color-gray-100: #F1F3F5
--global-color-gray-200: #E9ECEF
--global-color-gray-300: #DEE2E6
--global-color-gray-400: #CED4DA
--global-color-gray-500: #ADB5BD
--global-color-gray-600: #868E96
--global-color-gray-700: #495057
--global-color-gray-800: #343A40
--global-color-gray-900: #212529
--global-color-gray-1000:#000000
```

#### Semantic Colors

```
# Success (Green)
--global-color-green-500:  #40C057
--global-color-green-600:  #37B24D
--global-color-green-700:  #2F9E44

# Warning (Yellow)
--global-color-yellow-500: #FCC419
--global-color-yellow-600: #F59F00
--global-color-yellow-700: #E67700

# Danger (Red)
--global-color-red-500:    #FF6B6B
--global-color-red-600:    #FA5252
--global-color-red-700:    #F03E3E

# Info (Cyan)
--global-color-cyan-500:   #22B8CF
--global-color-cyan-600:   #18A5B8
--global-color-cyan-700:   #1098AD
```

### Spacing Scale (4px Base)

```
--global-spacing-xs:   4px    (0.25rem)
--global-spacing-sm:   8px    (0.5rem)
--global-spacing-md:   16px   (1rem)
--global-spacing-lg:   24px   (1.5rem)
--global-spacing-xl:   32px   (2rem)
--global-spacing-2xl:  48px   (3rem)
--global-spacing-3xl:  64px   (4rem)
```

### Typography Scale

```
--global-font-size-xs:     12px   (0.75rem)
--global-font-size-sm:     14px   (0.875rem)
--global-font-size-base:   16px   (1rem)
--global-font-size-lg:     18px   (1.125rem)
--global-font-size-xl:     20px   (1.25rem)
--global-font-size-2xl:    24px   (1.5rem)
--global-font-size-3xl:    30px   (1.875rem)
--global-font-size-4xl:    36px   (2.25rem)

--global-font-weight-light:     300
--global-font-weight-normal:    400
--global-font-weight-medium:    500
--global-font-weight-semibold:  600
--global-font-weight-bold:      700

--global-line-height-tight:   1.2
--global-line-height-normal:  1.5
--global-line-height-relaxed: 1.75

--global-font-family-primary: 'Inter', system-ui, -apple-system, sans-serif
--global-font-family-mono:    'JetBrains Mono', 'Consolas', monospace
```

### Border Radius

```
--global-radius-xs:  2px
--global-radius-sm:  4px
--global-radius-md:  8px
--global-radius-lg:  12px
--global-radius-xl:  16px
--global-radius-full: 9999px
```

### Shadows

```
--global-shadow-sm:   0 1px 2px rgba(0, 0, 0, 0.05)
--global-shadow-md:   0 4px 6px rgba(0, 0, 0, 0.1)
--global-shadow-lg:   0 10px 15px rgba(0, 0, 0, 0.1)
--global-shadow-xl:   0 20px 25px rgba(0, 0, 0, 0.15)
```

### Transitions

```
--global-transition-fast:   100ms ease-in-out
--global-transition-normal: 200ms ease-in-out
--global-transition-slow:   300ms ease-in-out
```

### Z-Index Scale

```
--global-z-index-base:      1
--global-z-index-dropdown:  100
--global-z-index-sticky:    200
--global-z-index-overlay:   300
--global-z-index-modal:     400
--global-z-index-popover:   500
--global-z-index-toast:     600
```

---

## 2. Brand Tokens (Tenant-Specific Overrides)

### Default Brand Configuration

```
--brand-color-primary:    var(--global-color-blue-700, #1976D2)
--brand-color-secondary:  var(--global-color-blue-400, #4DABF7)
--brand-color-accent:     var(--global-color-cyan-500, #22B8CF)

--brand-font-family:      var(--global-font-family-primary)

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
--button-primary-text:      var(--global-color-gray-0)
--button-primary-hover:     var(--brand-color-secondary)
--button-primary-active:    var(--brand-color-primary)
--button-primary-disabled:  var(--global-color-gray-300)
--button-primary-focus:     var(--brand-color-secondary)

--button-secondary-bg:      transparent
--button-secondary-text:    var(--brand-color-primary)
--button-secondary-border:  var(--brand-color-primary)
--button-secondary-hover:   var(--global-color-blue-50)

--button-ghost-text:        var(--global-color-gray-700)
--button-ghost-hover:       var(--global-color-gray-100)

--button-danger-bg:         var(--global-color-red-600)
--button-danger-text:       var(--global-color-gray-0)
--button-danger-hover:      var(--global-color-red-700)

--button-success-bg:        var(--global-color-green-600)
--button-success-text:      var(--global-color-gray-0)
--button-success-hover:     var(--global-color-green-700)

--button-warning-bg:        var(--global-color-yellow-500)
--button-warning-text:      var(--global-color-gray-900)
--button-warning-hover:     var(--global-color-yellow-600)

--button-height-xs:         28px
--button-height-sm:         32px
--button-height-md:         40px
--button-height-lg:         48px
--button-height-xl:         56px

--button-padding-x-xs:      var(--global-spacing-sm)
--button-padding-x-sm:      var(--global-spacing-md)
--button-padding-x-md:      var(--global-spacing-lg)
--button-padding-x-lg:      var(--global-spacing-xl)
--button-padding-x-xl:      var(--global-spacing-2xl)
```

### Input Tokens

```
--input-bg:                 var(--global-color-gray-0)
--input-text:               var(--global-color-gray-900)
--input-border:             var(--global-color-gray-300)
--input-border-hover:       var(--global-color-gray-400)
--input-border-focus:       var(--brand-color-primary)
--input-placeholder:        var(--global-color-gray-500)

--input-error-border:       var(--global-color-red-500)
--input-error-text:         var(--global-color-red-600)
--input-warning-border:     var(--global-color-yellow-500)
--input-warning-text:       var(--global-color-yellow-600)
--input-success-border:     var(--global-color-green-500)
--input-success-text:       var(--global-color-green-600)

--input-height-sm:          32px
--input-height-md:          40px
--input-height-lg:          48px

--input-padding-x-sm:       var(--global-spacing-sm)
--input-padding-x-md:       var(--global-spacing-md)
--input-padding-x-lg:       var(--global-spacing-lg)
```

### Card Tokens

```
--card-bg:                  var(--global-color-gray-0)
--card-border:              var(--global-color-gray-200)
--card-text:                var(--global-color-gray-900)
--card-heading:             var(--global-color-gray-900)

--card-padding:             var(--global-spacing-md)
--card-radius:              var(--global-radius-lg)
--card-shadow:              var(--global-shadow-md)
```

### Badge Tokens

```
--badge-default-bg:         var(--global-color-gray-100)
--badge-default-text:       var(--global-color-gray-700)

--badge-primary-bg:         var(--global-color-blue-100)
--badge-primary-text:       var(--global-color-blue-800)

--badge-success-bg:         var(--global-color-green-100)
--badge-success-text:       var(--global-color-green-800)

--badge-warning-bg:         var(--global-color-yellow-100)
--badge-warning-text:       var(--global-color-yellow-800)

--badge-danger-bg:          var(--global-color-red-100)
--badge-danger-text:        var(--global-color-red-800)
```

### Form Field Tokens

```
--form-field-label:         var(--global-color-gray-700)
--form-field-helper:        var(--global-color-gray-500)
--form-field-error:         var(--global-color-red-600)
--form-field-required:      var(--global-color-red-500)
```

### Alert Tokens

```
--alert-info-bg:            var(--global-color-blue-50)
--alert-info-text:          var(--global-color-blue-800)
--alert-info-border:        var(--global-color-blue-300)

--alert-success-bg:         var(--global-color-green-50)
--alert-success-text:       var(--global-color-green-800)
--alert-success-border:     var(--global-color-green-300)

--alert-warning-bg:         var(--global-color-yellow-50)
--alert-warning-text:       var(--global-color-yellow-800)
--alert-warning-border:     var(--global-color-yellow-300)

--alert-error-bg:           var(--global-color-red-50)
--alert-error-text:         var(--global-color-red-800)
--alert-error-border:       var(--global-color-red-300)
```

### Tooltip/Popover Tokens

```
--tooltip-bg:               var(--global-color-gray-900)
--tooltip-text:             var(--global-color-gray-0)
--popover-bg:               var(--global-color-gray-0)
--popover-text:             var(--global-color-gray-900)
--popover-border:           var(--global-color-gray-200)
--popover-shadow:           var(--global-shadow-lg)
```

### Toast Tokens

```
--toast-bg:                 var(--global-color-gray-0)
--toast-text:               var(--global-color-gray-900)
--toast-border:             var(--global-color-gray-200)
--toast-shadow:             var(--global-shadow-xl)
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
