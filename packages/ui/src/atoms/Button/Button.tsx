/**
 * Button Component
 *
 * Based on design-system/atoms/button.pen specifications:
 * - Variants: primary, secondary, ghost, danger, success, warning
 * - Sizes: xs (24px), sm (32px), md (40px), lg (48px), xl (56px)
 * - States: default, hover, active, disabled, loading
 * - Border radius: 8px
 * - Font: Inter
 * - Gap: 8px for icons
 */

"use client";

import React, { type ButtonHTMLAttributes, forwardRef } from "react";
import clsx from "clsx";

/**
 * Button variants
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "success" | "warning";

/**
 * Button sizes
 */
export type ButtonSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Button props
 */
export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button variant - determines color scheme
   * @default 'primary'
   */
  variant?: ButtonVariant;

  /**
   * Button size - determines height and padding
   * @default 'md'
   */
  size?: ButtonSize;

  /**
   * Disable the button
   * @default false
   */
  disabled?: boolean;

  /**
   * Show loading state with spinner
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display on the left
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right
   */
  rightIcon?: React.ReactNode;

  /**
   * Make button full width of parent
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Button content
   */
  children: React.ReactNode;
}

/**
 * Button styles based on variant and size from .pen specifications
 */
const buttonStyles = {
  base: "inline-flex items-center justify-center gap-2 font-medium transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-lg",

  variants: {
    primary:
      "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 focus-visible:ring-blue-600",
    secondary:
      "bg-blue-50 text-blue-600 border border-blue-600 hover:bg-blue-100 focus-visible:ring-blue-600",
    ghost: "bg-transparent text-blue-600 hover:bg-blue-50 focus-visible:ring-blue-600",
    danger: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 focus-visible:ring-red-600",
    success:
      "bg-green-600 text-white hover:bg-green-700 active:bg-green-800 focus-visible:ring-green-600",
    warning:
      "bg-orange-600 text-white hover:bg-orange-700 active:bg-orange-800 focus-visible:ring-orange-600",
  },

  sizes: {
    xs: "h-6 px-3 text-xs", // 24px height, 12px padding
    sm: "h-8 px-3 text-sm", // 32px height, 12px padding
    md: "h-10 px-4 text-base", // 40px height, 16px padding
    lg: "h-12 px-5 text-lg", // 48px height, 20px padding
    xl: "h-14 px-6 text-xl", // 56px height, 24px padding
  },
};

/**
 * Button component
 *
 * Renders a button with variant, size, and state support
 * Accessible with keyboard navigation and screen reader support
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      disabled = false,
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      className,
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={clsx(
          buttonStyles.base,
          buttonStyles.variants[variant],
          buttonStyles.sizes[size],
          fullWidth && "w-full",
          className,
        )}
        aria-disabled={isDisabled}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span aria-hidden="true">{rightIcon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";

/**
 * Default export for convenience
 */
export default Button;
