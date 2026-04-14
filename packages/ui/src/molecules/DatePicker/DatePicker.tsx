/**
 * DatePicker Component
 *
 * Based on design-system/molecules/date-picker.pen specifications:
 * - Sizes: sm, md (40px), lg
 * - Features: calendar icon, date picker
 * - Border radius: 8px
 */

"use client";

import React, { forwardRef, useId, useState } from "react";
import clsx from "clsx";
import type { DatePickerProps } from "./DatePicker.types";

/**
 * DatePicker size styles
 */
const sizeStyles = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-12 text-lg",
};

/**
 * Calendar icon SVG
 */
const CalendarIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
    />
  </svg>
);

/**
 * Format date for display
 */
function formatDate(date: Date | string | null, format: string = "YYYY-MM-DD"): string {
  if (!date) return "";

  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";

  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return format.replace("YYYY", String(year)).replace("MM", month).replace("DD", day);
}

/**
 * DatePicker component
 *
 * Renders a date picker input with calendar icon
 * Accessible with proper ARIA attributes
 */
export const DatePicker = forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      size = "md",
      value,
      onChange,
      minDate,
      maxDate,
      withTime = false,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      format = "YYYY-MM-DD",
      placeholder = "Select date...",
      label,
      error,
      description,
      required = false,
      disabled = false,
      loading = false,
      className,
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
    const [internalValue, setInternalValue] = useState(value);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);

      if (onChange) {
        const date = newValue ? new Date(newValue) : null;
        onChange(date && !isNaN(date.getTime()) ? date : null);
      }
    };

    const inputType = withTime ? "datetime-local" : "date";

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

        {/* Input wrapper */}
        <div className="relative">
          <input
            ref={ref}
            id={id}
            type={inputType}
            value={
              typeof internalValue === "string"
                ? internalValue
                : internalValue
                  ? formatDate(internalValue)
                  : ""
            }
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled || loading}
            required={required}
            min={minDate ? formatDate(minDate) : undefined}
            max={maxDate ? formatDate(maxDate) : undefined}
            aria-disabled={disabled || loading}
            aria-required={required}
            aria-invalid={hasError}
            aria-describedby={hasError ? errorId : description ? descriptionId : undefined}
            aria-label={ariaLabel || label}
            className={clsx(
              "w-full rounded-lg border border-gray-300 bg-white transition-colors duration-150",
              "pl-10 pr-4",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
              "placeholder:text-gray-400",
              sizeStyles[size],
              hasError && "border-red-500 focus:ring-red-500",
              (disabled || loading) && "opacity-50 cursor-not-allowed",
            )}
            {...props}
          />

          {/* Calendar icon */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <CalendarIcon />
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

DatePicker.displayName = "DatePicker";

/**
 * Default export for convenience
 */
export default DatePicker;
