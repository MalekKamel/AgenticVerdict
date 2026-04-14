/**
 * Input Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Height: 40px (md), 32px (sm), 48px (lg)
 * - Border radius: 8px
 * - Padding: 12px
 * - Border: 1px #E0E0E0
 * - Font: Inter, 16px
 * - Colors: #212121 text, placeholder #9E9E9E
 */

"use client";

import React, { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Input sizes
 */
export type InputSize = "sm" | "md" | "lg";

/**
 * Input validation states
 */
export type InputState = "default" | "error" | "warning" | "success";

/**
 * Input props
 */
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Input size
   * @default 'md'
   */
  size?: InputSize;

  /**
   * Validation state
   * @default 'default'
   */
  state?: InputState;

  /**
   * Error message to display
   */
  error?: string;

  /**
   * Icon to display on the left
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right
   */
  rightIcon?: React.ReactNode;

  /**
   * Make input full width of parent
   * @default false
   */
  fullWidth?: boolean;
}

/**
 * Input styles based on size and state
 */
const inputStyles = {
  base: "flex w-full rounded-lg border font-medium transition-colors duration-150 placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",

  sizes: {
    sm: "h-8 px-3 text-sm", // 32px height, 12px padding
    md: "h-10 px-3 text-base", // 40px height, 12px padding
    lg: "h-12 px-3 text-lg", // 48px height, 12px padding
  },

  states: {
    default:
      "border-gray-300 bg-white text-gray-900 focus-visible:border-blue-600 focus-visible:ring-blue-600",
    error:
      "border-red-600 bg-red-50 text-red-600 focus-visible:border-red-600 focus-visible:ring-red-600",
    warning:
      "border-orange-600 bg-orange-50 text-orange-900 focus-visible:border-orange-600 focus-visible:ring-orange-600",
    success:
      "border-green-600 bg-green-50 text-green-900 focus-visible:border-green-600 focus-visible:ring-green-600",
  },

  withLeftIcon: "pl-10",
  withRightIcon: "pr-10",
};

/**
 * Input component
 *
 * Renders a text input with size, state, and icon support
 * Accessible with proper label association and error announcements
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = "md",
      state = "default",
      error,
      leftIcon,
      rightIcon,
      fullWidth = true,
      className,
      id,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) => {
    const hasError = state === "error" || !!error;
    const inputState = hasError ? "error" : state;

    const errorMessageId = error && id ? `${id}-error` : undefined;
    const describedBy = clsx(ariaDescribedBy, errorMessageId);

    return (
      <div className={clsx("relative", fullWidth && "w-full")}>
        {leftIcon && (
          <div
            className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-500"
            aria-hidden="true"
          >
            {leftIcon}
          </div>
        )}

        <input
          ref={ref}
          id={id}
          className={clsx(
            inputStyles.base,
            inputStyles.sizes[size],
            inputStyles.states[inputState],
            leftIcon && inputStyles.withLeftIcon,
            rightIcon && inputStyles.withRightIcon,
            className,
          )}
          aria-invalid={hasError}
          aria-describedby={describedBy || undefined}
          {...props}
        />

        {rightIcon && (
          <div
            className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500"
            aria-hidden="true"
          >
            {rightIcon}
          </div>
        )}

        {error && errorMessageId && (
          <p id={errorMessageId} className="mt-1 text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

/**
 * Default export for convenience
 */
export default Input;
