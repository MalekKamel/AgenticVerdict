/**
 * Checkbox Component
 *
 * Based on design-system/atoms/checkbox.pen specifications:
 * - Box size: 20x20px
 * - Border radius: 4px
 * - Border: 1px #E0E0E0
 * - Gap: 8px between checkbox and label
 * - Check color: #1976D2
 * - Label: Inter, 16px, #212121
 * - States: unchecked, checked, indeterminate
 */

"use client";

import React, { type InputHTMLAttributes, forwardRef, useId, useState } from "react";
import clsx from "clsx";

/**
 * Checkbox states
 */
export type CheckboxState = "unchecked" | "checked" | "indeterminate";

/**
 * Checkbox props
 */
export interface CheckboxProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "checked" | "defaultChecked"
> {
  /**
   * Controlled checked state
   */
  checked?: boolean;

  /**
   * Default checked state for uncontrolled component
   */
  defaultChecked?: boolean;

  /**
   * Indeterminate state
   * @default false
   */
  indeterminate?: boolean;

  /**
   * Checkbox label
   */
  label?: string;

  /**
   * Callback when checked state changes
   */
  onCheckedChange?: (checked: boolean) => void;
}

/**
 * Checkbox styles
 */
const checkboxStyles = {
  base: "peer relative inline-flex items-center gap-2 cursor-pointer",
  input:
    "appearance-none w-5 h-5 rounded border border-gray-300 bg-white checked:bg-blue-600 checked:border-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 transition-colors duration-150",
  checkmark:
    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none text-white opacity-0 peer-checked:opacity-100 peer-indeterminate:opacity-100 transition-opacity duration-150",
  indeterminate:
    "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-0.5 bg-white pointer-events-none opacity-0 peer-indeterminate:opacity-100 transition-opacity duration-150",
  label: "text-base font-normal text-gray-900 select-none",
};

/**
 * Checkbox component
 *
 * Renders a checkbox with label support
 * Supports controlled and uncontrolled modes
 * Accessible with keyboard navigation and screen reader support
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked: controlledChecked,
      defaultChecked = false,
      indeterminate = false,
      label,
      onCheckedChange,
      onChange: inputOnChange,
      className,
      id,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [internalChecked, setInternalChecked] = useState(defaultChecked);

    const isControlled = controlledChecked !== undefined;
    const checked = isControlled ? controlledChecked : internalChecked;

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      const newChecked = event.target.checked;
      if (!isControlled) {
        setInternalChecked(newChecked);
      }
      inputOnChange?.(event);
      onCheckedChange?.(newChecked);
    };

    const generatedId = useId();
    const checkboxId = id || `checkbox-${generatedId}`;

    return (
      <label
        htmlFor={checkboxId}
        className={clsx(
          checkboxStyles.base,
          disabled && "cursor-not-allowed opacity-50",
          className,
        )}
      >
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          checked={checked}
          data-indeterminate={indeterminate}
          className={clsx(
            checkboxStyles.input,
            indeterminate &&
              "data-[indeterminate=true]:bg-blue-600 data-[indeterminate=true]:border-blue-600",
          )}
          onChange={handleChange}
          disabled={disabled}
          aria-checked={indeterminate ? "mixed" : checked}
          {...props}
        />
        {/* Checkmark icon */}
        <svg
          className={clsx(checkboxStyles.checkmark, !indeterminate && "peer-checked:opacity-100")}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="20 6 9 17 4 12" />
        </svg>
        {/* Indeterminate mark */}
        <div className={clsx(checkboxStyles.indeterminate, indeterminate && "opacity-100")} />
        {label && <span className={checkboxStyles.label}>{label}</span>}
      </label>
    );
  },
);

Checkbox.displayName = "Checkbox";

/**
 * Default export for convenience
 */
export default Checkbox;
