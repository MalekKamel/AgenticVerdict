/**
 * Radio Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Sizes: xs (12px), sm (16px), md (20px), lg (24px)
 * - States: unchecked, checked, disabled, error
 * - Border radius: 50% (circular)
 * - Gap: 8px for label
 */

"use client";

import { forwardRef, useId } from "react";
import clsx from "clsx";
import type { RadioProps } from "./Radio.types";

/**
 * Radio size to dimension mapping
 */
const sizeMap = {
  xs: "h-3 w-3", // 12px
  sm: "h-4 w-4", // 16px
  md: "h-5 w-5", // 20px
  lg: "h-6 w-6", // 24px
};

/**
 * Radio variant styles
 */
const variantStyles = {
  default:
    "border-gray-300 checked:border-blue-600 checked:bg-blue-600 focus-visible:ring-blue-600",
  primary:
    "border-blue-600 checked:border-blue-600 checked:bg-blue-600 focus-visible:ring-blue-600",
  success:
    "border-green-600 checked:border-green-600 checked:bg-green-600 focus-visible:ring-green-600",
  warning:
    "border-orange-600 checked:border-orange-600 checked:bg-orange-600 focus-visible:ring-orange-600",
  danger: "border-red-600 checked:border-red-600 checked:bg-red-600 focus-visible:ring-red-600",
};

/**
 * Radio component
 *
 * Renders a radio input with label support
 * Accessible with keyboard navigation and screen reader support
 */
export const Radio = forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      size = "md",
      variant = "default",
      label,
      labelPosition = "right",
      error,
      description,
      className,
      disabled = false,
      required = false,
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

    return (
      <div className={clsx("flex flex-col", className)}>
        <div
          className={clsx(
            "flex items-center gap-2",
            labelPosition === "left" && "flex-row-reverse justify-end",
            disabled && "opacity-50 cursor-not-allowed",
          )}
        >
          <input
            ref={ref}
            id={id}
            type="radio"
            disabled={disabled}
            required={required}
            aria-disabled={disabled}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={error ? errorId : description ? descriptionId : undefined}
            className={clsx(
              "appearance-none rounded-full border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 cursor-pointer transition-colors duration-150",
              sizeMap[size],
              variantStyles[variant],
              hasError && "border-red-500 focus-visible:ring-red-500",
              disabled && "cursor-not-allowed opacity-50",
            )}
            {...props}
          />
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
              {label}
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

Radio.displayName = "Radio";

/**
 * Default export for convenience
 */
export default Radio;
