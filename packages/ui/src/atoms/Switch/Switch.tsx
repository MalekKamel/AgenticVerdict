/**
 * Switch Component
 *
 * Based on design-system/atoms/switch.pen specifications:
 * - Sizes: xs (28×16px), sm (36×20px), md (44×24px), lg (52×28px)
 * - States: off, on, disabled, loading
 * - Border radius: full (pill shape)
 */

"use client";

import { forwardRef, useId } from "react";
import clsx from "clsx";
import type { SwitchProps } from "./Switch.types";

/**
 * Switch track sizes
 */
const trackSizes = {
  xs: "w-7 h-4", // 28×16px
  sm: "w-9 h-5", // 36×20px
  md: "w-11 h-6", // 44×24px
  lg: "w-13 h-7", // 52×28px (using w-13 = 52px)
};

/**
 * Switch thumb sizes
 */
const thumbSizes = {
  xs: "h-3 w-3", // 12px
  sm: "h-4 w-4", // 16px
  md: "h-5 w-5", // 20px
  lg: "h-6 w-6", // 24px
};

/**
 * Switch thumb positions
 */
const thumbPositions = {
  xs: "translate-x-3", // 12px offset
  sm: "translate-x-4", // 16px offset
  md: "translate-x-5", // 20px offset
  lg: "translate-x-6", // 24px offset
};

/**
 * Switch variant styles
 */
const variantStyles = {
  default: "bg-gray-200 peer-checked:bg-blue-600",
  primary: "bg-blue-200 peer-checked:bg-blue-600",
  success: "bg-green-200 peer-checked:bg-green-600",
  warning: "bg-orange-200 peer-checked:bg-orange-600",
  danger: "bg-red-200 peer-checked:bg-red-600",
};

/**
 * Switch component
 *
 * Renders a toggle switch with label support
 * Accessible with keyboard navigation and screen reader support
 */
export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  (
    {
      size = "md",
      variant = "default",
      label,
      labelPosition = "right",
      checkedLabel,
      uncheckedLabel,
      error,
      description,
      className,
      disabled = false,
      loading = false,
      checked = false,
      id: providedId,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const labelId = `${id}-label`;
    const descriptionId = `${id}-description`;
    const errorId = `${id}-error`;

    const hasError = !!error;
    const isLoading = loading;
    const statusLabel = checked ? checkedLabel : uncheckedLabel || label;

    return (
      <div className={clsx("flex flex-col", className)}>
        <div
          className={clsx(
            "flex items-center gap-3",
            labelPosition === "left" && "flex-row-reverse justify-end",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <div className="relative inline-flex items-center">
            <input
              ref={ref}
              id={id}
              type="checkbox"
              role="switch"
              disabled={disabled || isLoading}
              checked={checked}
              aria-disabled={disabled || isLoading}
              aria-checked={checked}
              aria-invalid={hasError}
              aria-describedby={error ? errorId : description ? descriptionId : undefined}
              aria-label={statusLabel || label}
              className="peer sr-only"
              {...props}
            />
            {/* Track */}
            <label
              htmlFor={id}
              className={clsx(
                "block rounded-full transition-colors duration-200 cursor-pointer",
                trackSizes[size],
                variantStyles[variant],
                hasError && "bg-red-200 peer-checked:bg-red-500",
                (disabled || isLoading) && "cursor-not-allowed opacity-50",
              )}
            >
              <span className="sr-only">{statusLabel || label}</span>
            </label>
            {/* Thumb */}
            <span
              className={clsx(
                "absolute left-0.5 top-0.5 rounded-full bg-white shadow-sm transition-transform duration-200 pointer-events-none",
                thumbSizes[size],
                checked && thumbPositions[size],
                (disabled || isLoading) && "opacity-50",
              )}
              aria-hidden="true"
            />
            {/* Loading indicator */}
            {isLoading && (
              <span
                className={clsx(
                  "absolute inset-0 flex items-center justify-center",
                  "text-gray-400",
                )}
                aria-hidden="true"
              >
                <svg
                  className="animate-spin h-3 w-3"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
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
              </span>
            )}
          </div>

          {label && (
            <label
              id={labelId}
              htmlFor={id}
              className={clsx(
                "text-sm font-medium cursor-pointer select-none",
                disabled && "cursor-not-allowed opacity-50",
                hasError && "text-red-600",
              )}
            >
              {statusLabel || label}
            </label>
          )}
        </div>

        {description && !hasError && (
          <span id={descriptionId} className="mt-1 text-xs text-gray-500">
            {description}
          </span>
        )}

        {hasError && (
          <span id={errorId} role="alert" className="mt-1 text-xs text-red-600">
            {error}
          </span>
        )}
      </div>
    );
  },
);

Switch.displayName = "Switch";

/**
 * Default export for convenience
 */
export default Switch;
