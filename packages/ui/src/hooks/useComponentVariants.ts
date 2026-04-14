/**
 * useComponentVariants hook
 * Generates variant styles for components based on design tokens
 */

import { useMemo } from "react";
import { useTheme } from "../providers/ThemeProvider";

/**
 * Button variant props
 */
export interface ButtonVariants {
  variant: "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";
  size: "xs" | "sm" | "md" | "lg" | "xl";
  disabled: boolean;
  loading: boolean;
}

/**
 * Get button styles based on variant and state
 */
export function useButtonVariants(props: ButtonVariants) {
  const { theme } = useTheme();

  return useMemo(() => {
    const { variant, size, disabled, loading } = props;

    // Variant styles
    const variantStyles = {
      primary: {
        backgroundColor: `var(--brand-color-primary, ${theme.colors.primary})`,
        color: "#FFFFFF",
        border: "none",
        opacity: disabled ? 0.5 : loading ? 0.7 : 1,
      },
      secondary: {
        backgroundColor: "var(--av-color-blue-50)",
        color: `var(--brand-color-primary, ${theme.colors.primary})`,
        border: `1px solid var(--brand-color-primary, ${theme.colors.primary})`,
        opacity: disabled ? 0.5 : loading ? 0.7 : 1,
      },
      ghost: {
        backgroundColor: "transparent",
        color: `var(--brand-color-primary, ${theme.colors.primary})`,
        border: "none",
        opacity: disabled ? 0.5 : loading ? 0.7 : 1,
      },
      danger: {
        backgroundColor: `var(--brand-color-danger, ${theme.colors.danger})`,
        color: "#FFFFFF",
        border: "none",
        opacity: disabled ? 0.5 : loading ? 0.7 : 1,
      },
      success: {
        backgroundColor: `var(--brand-color-success, ${theme.colors.success})`,
        color: "#FFFFFF",
        border: "none",
        opacity: disabled ? 0.5 : loading ? 0.7 : 1,
      },
      warning: {
        backgroundColor: `var(--brand-color-warning, ${theme.colors.warning})`,
        color: "#FFFFFF",
        border: "none",
        opacity: disabled ? 0.5 : loading ? 0.7 : 1,
      },
    };

    // Size styles
    const sizeStyles = {
      xs: { padding: "6px 12px", height: "24px", fontSize: "0.75rem" },
      sm: { padding: "6px 12px", height: "32px", fontSize: "0.875rem" },
      md: { padding: "8px 16px", height: "40px", fontSize: "1rem" },
      lg: { padding: "10px 20px", height: "48px", fontSize: "1.125rem" },
      xl: { padding: "12px 24px", height: "56px", fontSize: "1.25rem" },
    };

    return {
      variant: variantStyles[variant],
      size: sizeStyles[size],
      cursor: disabled ? "not-allowed" : "pointer",
    };
  }, [props, theme]);
}

/**
 * Input variant props
 */
export interface InputVariants {
  size: "sm" | "md" | "lg";
  error: boolean;
  disabled: boolean;
}

/**
 * Get input styles based on variant and state
 */
export function useInputVariants(props: InputVariants) {
  const { theme } = useTheme();

  return useMemo(() => {
    const { size, error, disabled } = props;

    // State styles
    const stateStyles = error
      ? {
          borderColor: `var(--brand-color-danger, ${theme.colors.danger})`,
          backgroundColor: "var(--av-color-red-50)",
        }
      : {
          borderColor: "var(--av-color-gray-300)",
          backgroundColor: "#FFFFFF",
        };

    // Size styles
    const sizeStyles = {
      sm: { padding: "6px 12px", height: "32px", fontSize: "0.875rem" },
      md: { padding: "8px 12px", height: "40px", fontSize: "1rem" },
      lg: { padding: "10px 12px", height: "48px", fontSize: "1.125rem" },
    };

    return {
      ...stateStyles,
      ...sizeStyles[size],
      opacity: disabled ? 0.5 : 1,
      cursor: disabled ? "not-allowed" : "text",
    };
  }, [props, theme]);
}

/**
 * Card variant props
 */
export interface CardVariants {
  variant: "default" | "elevated" | "outlined";
  padding: "none" | "xs" | "sm" | "md" | "lg";
}

/**
 * Get card styles based on variant
 */
export function useCardVariants(props: CardVariants) {
  return useMemo(() => {
    const { variant, padding } = props;

    const variantStyles = {
      default: {
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--av-color-gray-200)",
        boxShadow: "var(--av-shadow-sm)",
      },
      elevated: {
        backgroundColor: "#FFFFFF",
        border: "none",
        boxShadow: "var(--av-shadow-md)",
      },
      outlined: {
        backgroundColor: "#FFFFFF",
        border: "1px solid var(--av-color-gray-300)",
        boxShadow: "none",
      },
    };

    const paddingStyles = {
      none: { padding: "0" },
      xs: { padding: "var(--av-spacing-2)" },
      sm: { padding: "var(--av-spacing-3)" },
      md: { padding: "var(--av-spacing-4)" },
      lg: { padding: "var(--av-spacing-6)" },
    };

    return {
      ...variantStyles[variant],
      ...paddingStyles[padding],
      borderRadius: "var(--av-radius-md)",
    };
  }, [props]);
}

/**
 * Badge variant props
 */
export interface BadgeVariants {
  variant: "default" | "filled" | "light" | "outline";
  size: "xs" | "sm" | "md" | "lg";
}

/**
 * Get badge styles based on variant
 */
export function useBadgeVariants(props: BadgeVariants) {
  const { theme } = useTheme();

  return useMemo(() => {
    const { variant, size } = props;

    const variantStyles = {
      default: {
        backgroundColor: "var(--av-color-blue-50)",
        color: "var(--av-color-blue-700)",
        border: "none",
      },
      filled: {
        backgroundColor: `var(--brand-color-primary, ${theme.colors.primary})`,
        color: "#FFFFFF",
        border: "none",
      },
      light: {
        backgroundColor: "var(--av-color-blue-50)",
        color: `var(--brand-color-primary, ${theme.colors.primary})`,
        border: "none",
      },
      outline: {
        backgroundColor: "transparent",
        color: `var(--brand-color-primary, ${theme.colors.primary})`,
        border: "1px solid var(--av-color-gray-300)",
      },
    };

    const sizeStyles = {
      xs: { padding: "2px 8px", fontSize: "0.75rem" },
      sm: { padding: "4px 8px", fontSize: "0.875rem" },
      md: { padding: "6px 12px", fontSize: "1rem" },
      lg: { padding: "8px 16px", fontSize: "1.125rem" },
    };

    return {
      ...variantStyles[variant],
      ...sizeStyles[size],
      borderRadius: "var(--av-radius-full)",
      display: "inline-flex",
      alignItems: "center",
      fontWeight: "500",
    };
  }, [props, theme]);
}
