/**
 * Spinner Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Sizes: xs (12px), sm (16px), md (24px), lg (32px), xl (48px)
 * - Border radius: 9999px (circle)
 * - Stroke: 2px
 * - Color: #1976D2
 * - Transparent fill
 */

"use client";

import type { HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Spinner sizes
 */
export type SpinnerSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Spinner props
 */
export interface SpinnerProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Spinner size
   * @default 'md'
   */
  size?: SpinnerSize;

  /**
   * Custom color class
   * @default 'text-blue-600'
   */
  color?: string;
}

/**
 * Spinner styles based on size
 */
const spinnerStyles = {
  base: "inline-block rounded-full border-2 border-current animate-spin",

  sizes: {
    xs: "w-3 h-3", // 12px
    sm: "w-4 h-4", // 16px
    md: "w-6 h-6", // 24px
    lg: "w-8 h-8", // 32px
    xl: "w-12 h-12", // 48px
  },
};

/**
 * Spinner component
 *
 * Displays a loading spinner
 * Accessible with aria-busy and proper role
 */
export function Spinner({
  size = "md",
  color = "text-blue-600",
  className,
  role = "status",
  ...props
}: SpinnerProps) {
  return (
    <div role={role} aria-live="polite" aria-label="Loading" {...props}>
      <svg
        className={clsx("animate-spin", spinnerStyles.sizes[size], color, className)}
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
      <span className="sr-only">Loading...</span>
    </div>
  );
}

/**
 * Default export for convenience
 */
export default Spinner;
