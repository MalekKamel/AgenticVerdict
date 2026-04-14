/**
 * FormField Component
 *
 * Based on design-system/molecules/form-field.pen specifications:
 * - Gap: 4px between elements
 * - Layout: vertical
 * - Label: Inter, 14px, #212121
 * - Input: 40px height, 8px vertical padding, 12px horizontal padding
 * - Border radius: 8px
 * - Helper text: Inter, 12px, #757575
 * - Error text: Inter, 12px, #D32F2F
 * - States: default, error, warning, success, disabled
 */

"use client";

import React from "react";
import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { Input } from "../../atoms/Input";

/**
 * Form field states
 */
export type FormFieldState = "default" | "error" | "warning" | "success";

/**
 * Form field props
 */
export interface FormFieldProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Field label
   */
  label?: string;

  /**
   * Field ID for label association
   */
  id?: string;

  /**
   * Validation state
   * @default 'default'
   */
  state?: FormFieldState;

  /**
   * Helper text to display below input
   */
  helperText?: string;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Make field required
   * @default false
   */
  required?: boolean;

  /**
   * Disable the field
   * @default false
   */
  disabled?: boolean;

  /**
   * Input component or custom content
   */
  children: ReactNode;
}

/**
 * FormField styles
 */
const formFieldStyles = {
  base: "flex flex-col gap-1",

  label: "text-sm font-medium text-gray-900",
  labelRequired: 'after:content-["*"] after:ml-0.5 after:text-red-600',
  labelDisabled: "text-gray-500",

  helper: "text-xs text-gray-600",
  error: "text-xs text-red-600",
  warning: "text-xs text-orange-600",
  success: "text-xs text-green-600",
};

/**
 * FormField component
 *
 * Wraps form inputs with label, helper text, and error display
 * Provides proper accessibility with label association
 */
export function FormField({
  label,
  id,
  state = "default",
  helperText,
  error,
  required = false,
  disabled = false,
  children,
  className,
  ...props
}: FormFieldProps) {
  const fieldId = id || `field-${Math.random().toString(36).substring(2, 9)}`;
  const hasError = state === "error" || !!error;
  const errorMessageId = error && id ? `${id}-error` : undefined;

  // Determine state for input styling
  const inputState = hasError ? "error" : state;

  return (
    <div className={clsx(formFieldStyles.base, className)} {...props}>
      {label && (
        <label
          htmlFor={fieldId}
          className={clsx(
            formFieldStyles.label,
            required && formFieldStyles.labelRequired,
            disabled && formFieldStyles.labelDisabled,
          )}
        >
          {label}
        </label>
      )}

      {/* Clone children and inject state/disabled props if it's an Input */}
      {React.isValidElement(children) &&
      children.type === Input &&
      !(children.props as Record<string, unknown>).state &&
      !(children.props as Record<string, unknown>).disabled
        ? React.cloneElement(
            children as React.ReactElement,
            {
              id: fieldId,
              state: inputState,
              disabled,
              error: hasError ? error : undefined,
              "aria-describedby": errorMessageId,
            } as Record<string, unknown>,
          )
        : children}

      {hasError && error && (
        <p id={errorMessageId} className={formFieldStyles.error}>
          {error}
        </p>
      )}

      {!hasError && helperText && <p className={formFieldStyles.helper}>{helperText}</p>}
    </div>
  );
}

/**
 * FormFieldLabel subcomponent
 */
interface FormFieldLabelProps extends LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function FormFieldLabel({
  required = false,
  disabled = false,
  className,
  children,
  ...props
}: FormFieldLabelProps) {
  return (
    <label
      className={clsx(
        formFieldStyles.label,
        required && formFieldStyles.labelRequired,
        disabled && formFieldStyles.labelDisabled,
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
}

/**
 * FormFieldHelper subcomponent
 */
interface FormFieldHelperProps extends HTMLAttributes<HTMLParagraphElement> {
  state?: FormFieldState;
  children: ReactNode;
}

export function FormFieldHelper({
  state = "default",
  className,
  children,
  ...props
}: FormFieldHelperProps) {
  const stateStyles = {
    error: formFieldStyles.error,
    warning: formFieldStyles.warning,
    success: formFieldStyles.success,
    default: formFieldStyles.helper,
  };

  return (
    <p className={clsx(stateStyles[state], className)} {...props}>
      {children}
    </p>
  );
}

/**
 * Default export for convenience
 */
export default FormField;
