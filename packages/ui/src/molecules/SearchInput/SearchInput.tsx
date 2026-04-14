/**
 * SearchInput Component
 *
 * Based on design/system/molecules.lib.pen specifications:
 * - Sizes: sm, md (40px), lg
 * - Features: search icon, clear button, loading state
 * - Border radius: 8px
 */

"use client";

import React, { forwardRef, useState } from "react";
import clsx from "clsx";
import type { SearchInputProps } from "./SearchInput.types";

/**
 * SearchInput size styles
 */
const sizeStyles = {
  sm: "h-8 text-sm",
  md: "h-10 text-base",
  lg: "h-12 text-lg",
};

/**
 * Search icon SVG
 */
const SearchIcon = () => (
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
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

/**
 * Clear icon SVG
 */
const ClearIcon = () => (
  <svg
    className="w-4 h-4 text-gray-400 hover:text-gray-600"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Loading spinner SVG
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
 * SearchInput component
 *
 * Renders a search input with icon, clear button, and loading state
 * Accessible with proper ARIA attributes
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      size = "md",
      placeholder = "Search...",
      clearable = true,
      loading = false,
      leftIcon,
      error,
      className,
      value,
      onChange,
      ariaLabel,
      disabled = false,
      ...props
    },
    ref,
  ) => {
    const [internalValue, setInternalValue] = useState(value || "");
    const hasValue = !!(value ?? internalValue);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInternalValue(newValue);
      onChange?.(e);
    };

    const handleClear = () => {
      setInternalValue("");
      // Dispatch change event
      if (onChange) {
        const event = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(event);
      }
    };

    const hasError = !!error;

    return (
      <div className={clsx("relative w-full", className)}>
        <div className="relative">
          {/* Search icon or custom left icon */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            {loading ? <LoadingSpinner /> : leftIcon || <SearchIcon />}
          </div>

          {/* Input */}
          <input
            ref={ref}
            type="search"
            value={value ?? internalValue}
            onChange={handleChange}
            placeholder={placeholder}
            disabled={disabled || loading}
            aria-disabled={disabled || loading}
            aria-invalid={hasError}
            aria-label={ariaLabel || "Search"}
            className={clsx(
              "w-full rounded-lg border border-gray-300 bg-white transition-colors duration-150",
              "pl-10 pr-10",
              "focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent",
              "placeholder:text-gray-400",
              sizeStyles[size],
              hasError && "border-red-500 focus:ring-red-500",
              (disabled || loading) && "opacity-50 cursor-not-allowed",
            )}
            {...props}
          />

          {/* Clear button */}
          {clearable && hasValue && !loading && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-3"
              aria-label="Clear search"
              tabIndex={-1}
            >
              <ClearIcon />
            </button>
          )}
        </div>

        {/* Error message */}
        {hasError && (
          <p role="alert" className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

/**
 * Default export for convenience
 */
export default SearchInput;
