/**
 * Component tokens - composed from global and brand tokens
 * These tokens provide the actual values used by components
 */

import type { ComponentTokens } from "./types";

/**
 * Component token definitions
 * Each token uses CSS custom properties with fallbacks to global tokens
 */
export const componentTokens: ComponentTokens = {
  button: {
    primary: {
      bg: "var(--brand-color-primary, var(--av-color-blue-600))",
      text: "#FFFFFF",
      hover: "var(--av-color-blue-700)",
      active: "var(--av-color-blue-800)",
      disabled: "var(--av-color-gray-400)",
    },
    secondary: {
      bg: "var(--av-color-blue-50)",
      text: "var(--brand-color-primary, var(--av-color-blue-600))",
      border: "var(--brand-color-primary, var(--av-color-blue-600))",
      hover: "var(--av-color-blue-100)",
    },
    ghost: {
      bg: "transparent",
      text: "var(--brand-color-primary, var(--av-color-blue-600))",
      hover: "var(--av-color-blue-50)",
    },
    danger: {
      bg: "var(--brand-color-danger, var(--av-color-red-600))",
      text: "#FFFFFF",
      hover: "var(--av-color-red-700)",
    },
    success: {
      bg: "var(--brand-color-success, var(--av-color-green-600))",
      text: "#FFFFFF",
    },
    warning: {
      bg: "var(--brand-color-warning, var(--av-color-orange-600))",
      text: "#FFFFFF",
    },
  },
  input: {
    default: {
      bg: "#FFFFFF",
      border: "var(--av-color-gray-300)",
      text: "var(--av-color-gray-900)",
      placeholder: "var(--av-color-gray-500)",
    },
    error: {
      border: "var(--brand-color-danger, var(--av-color-red-600))",
      text: "var(--brand-color-danger, var(--av-color-red-600))",
      bg: "var(--av-color-red-50)",
    },
    focus: {
      border: "var(--brand-color-primary, var(--av-color-blue-600))",
      ring: "var(--av-color-blue-200)",
    },
  },
  card: {
    default: {
      bg: "#FFFFFF",
      border: "var(--av-color-gray-200)",
      shadow: "var(--av-shadow-sm)",
    },
    elevated: {
      bg: "#FFFFFF",
      border: "transparent",
      shadow: "var(--av-shadow-md)",
    },
  },
};

/**
 * CSS custom properties for component tokens
 * These are applied to :root and used by component styles
 */
export const componentCSSVariables = {
  // Button tokens
  "--button-primary-bg": componentTokens.button.primary.bg,
  "--button-primary-text": componentTokens.button.primary.text,
  "--button-primary-hover": componentTokens.button.primary.hover,
  "--button-primary-active": componentTokens.button.primary.active,
  "--button-primary-disabled": componentTokens.button.primary.disabled,

  "--button-secondary-bg": componentTokens.button.secondary.bg,
  "--button-secondary-text": componentTokens.button.secondary.text,
  "--button-secondary-border": componentTokens.button.secondary.border,
  "--button-secondary-hover": componentTokens.button.secondary.hover,

  "--button-ghost-bg": componentTokens.button.ghost.bg,
  "--button-ghost-text": componentTokens.button.ghost.text,
  "--button-ghost-hover": componentTokens.button.ghost.hover,

  "--button-danger-bg": componentTokens.button.danger.bg,
  "--button-danger-text": componentTokens.button.danger.text,
  "--button-danger-hover": componentTokens.button.danger.hover,

  "--button-success-bg": componentTokens.button.success.bg,
  "--button-success-text": componentTokens.button.success.text,

  "--button-warning-bg": componentTokens.button.warning.bg,
  "--button-warning-text": componentTokens.button.warning.text,

  // Input tokens
  "--input-default-bg": componentTokens.input.default.bg,
  "--input-default-border": componentTokens.input.default.border,
  "--input-default-text": componentTokens.input.default.text,
  "--input-default-placeholder": componentTokens.input.default.placeholder,

  "--input-error-border": componentTokens.input.error.border,
  "--input-error-text": componentTokens.input.error.text,
  "--input-error-bg": componentTokens.input.error.bg,

  "--input-focus-border": componentTokens.input.focus.border,
  "--input-focus-ring": componentTokens.input.focus.ring,

  // Card tokens
  "--card-default-bg": componentTokens.card.default.bg,
  "--card-default-border": componentTokens.card.default.border,
  "--card-default-shadow": componentTokens.card.default.shadow,

  "--card-elevated-bg": componentTokens.card.elevated.bg,
  "--card-elevated-border": componentTokens.card.elevated.border,
  "--card-elevated-shadow": componentTokens.card.elevated.shadow,
} as const;
