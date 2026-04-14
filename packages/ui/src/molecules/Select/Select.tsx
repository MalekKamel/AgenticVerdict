/**
 * Select Component
 *
 * Based on design-system/molecules/select.pen specifications:
 * - Sizes: sm, md (40px), lg
 * - Variants: default, filled, unstyled
 * - States: default, focus, error, disabled
 */

"use client";

import { forwardRef, useId } from "react";
import clsx from "clsx";
import type { SelectProps } from "./Select.types";

/**
 * Select size styles
 */
const sizeStyles = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-12 text-lg",
};

/**
 * Select variant styles
 */
const variantStyles = {
  default: "border border-gray-300 bg-white hover:border-gray-400 focus:border-blue-600",
  filled: "border-0 bg-gray-100 hover:bg-gray-200 focus:bg-white",
  unstyled: "border-0 bg-transparent",
};

/**
 * Chevron down icon
 */
const ChevronDown = () => (
  <svg
    className="w-4 h-4 text-gray-400 pointer-events-none"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

/**
 * Loading spinner
 */
const LoadingSpinner = () => (
  <svg
    className="animate-spin w-4 h-4 text-gray-400"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

/**
 * Select component
 *
 * Renders a select input with options, label, and error support
 * Accessible with proper ARIA attributes
 */
export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = "md",
      variant = "default",
      options,
      placeholder,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      searchable = false,
      multiple = false,
      error,
      description,
      label,
      required = false,
      disabled = false,
      loading = false,
      className,
      value,
      onChange,
      ariaLabel,
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

    // Group options by group
    const groupedOptions = options.reduce(
      (acc, option) => {
        const group = option.group || "__ungrouped__";
        if (!acc[group]) {
          acc[group] = [];
        }
        acc[group].push(option);
        return acc;
      },
      {} as Record<string, typeof options>,
    );

    const hasGroups = Object.keys(groupedOptions).length > 1;

    return (
      <div className={clsx("w-full", className)}>
        {/* Label */}
        {label && (
          <label
            id={labelId}
            htmlFor={id}
            className={clsx(
              "block text-sm font-medium mb-1",
              hasError && "text-red-600",
              disabled && "opacity-50",
            )}
          >
            {label}
            {required && (
              <span className="text-red-600 ml-1" aria-hidden="true">
                *
              </span>
            )}
          </label>
        )}

        {/* Select wrapper */}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            value={value}
            onChange={onChange}
            disabled={disabled || loading}
            required={required}
            multiple={multiple}
            aria-disabled={disabled || loading}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : description ? descriptionId : undefined}
            aria-label={ariaLabel || label}
            className={clsx(
              "w-full rounded-lg appearance-none transition-colors duration-150",
              "pr-10",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
              sizeStyles[size],
              variantStyles[variant],
              hasError && "border-red-500 focus:ring-red-500",
              (disabled || loading) && "opacity-50 cursor-not-allowed",
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}

            {!hasGroups
              ? options.map((option) => (
                  <option key={option.value} value={option.value} disabled={option.disabled}>
                    {option.label}
                  </option>
                ))
              : Object.entries(groupedOptions).map(([group, opts]) =>
                  group === "__ungrouped__" ? (
                    opts.map((option) => (
                      <option key={option.value} value={option.value} disabled={option.disabled}>
                        {option.label}
                      </option>
                    ))
                  ) : (
                    <optgroup key={group} label={group}>
                      {opts.map((option) => (
                        <option key={option.value} value={option.value} disabled={option.disabled}>
                          {option.label}
                        </option>
                      ))}
                    </optgroup>
                  ),
                )}
          </select>

          {/* Chevron icon */}
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {loading ? <LoadingSpinner /> : <ChevronDown />}
          </div>
        </div>

        {/* Description */}
        {description && !hasError && (
          <p id={descriptionId} className="mt-1 text-sm text-gray-500">
            {description}
          </p>
        )}

        {/* Error message */}
        {hasError && (
          <p id={errorId} role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = "Select";

/**
 * Default export for convenience
 */
export default Select;
