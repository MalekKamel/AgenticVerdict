/**
 * Badge Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Border radius: 9999px (pill shape)
 * - Gap: 4px between icon and text
 * - Padding: 4px (xs), 6px (sm), 8px (md), 10px (lg), 12px (xl)
 * - Variants: light, filled, outline, success, warning, error
 * - Colors: #1976D2 (primary), with background variants
 * - Font: Inter, 14px
 */

"use client";

import React, { type HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Badge variants
 */
export type BadgeVariant =
  | "default"
  | "filled"
  | "light"
  | "outline"
  | "success"
  | "warning"
  | "error";

/**
 * Badge sizes
 */
export type BadgeSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Badge props
 */
export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Badge variant
   * @default 'default'
   */
  variant?: BadgeVariant;

  /**
   * Badge size
   * @default 'md'
   */
  size?: BadgeSize;

  /**
   * Optional icon to display
   */
  icon?: React.ReactNode;

  /**
   * Badge content
   */
  children: React.ReactNode;
}

/**
 * Badge styles based on variant and size
 */
const badgeStyles = {
  base: "inline-flex items-center gap-1 rounded-full font-medium",

  variants: {
    default: "bg-blue-50 text-blue-700",
    filled: "bg-blue-600 text-white",
    light: "bg-blue-50 text-blue-600",
    outline: "bg-transparent text-blue-600 border border-blue-600",
    success: "bg-green-50 text-green-700",
    warning: "bg-orange-50 text-orange-700",
    error: "bg-red-50 text-red-700",
  },

  sizes: {
    xs: "px-1.5 py-1 text-xs gap-0.5", // 4px padding
    sm: "px-2.5 py-1.5 text-xs gap-0.5", // 6px padding
    md: "px-3 py-2 text-sm gap-1", // 8px padding
    lg: "px-3 py-2.5 text-base gap-1", // 10px padding
    xl: "px-4 py-3 text-lg gap-1.5", // 12px padding
  },
};

/**
 * Badge component
 *
 * Displays a badge with optional icon
 * Useful for status indicators, counts, and labels
 */
export function Badge({
  variant = "default",
  size = "md",
  icon,
  className,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={clsx(
        badgeStyles.base,
        badgeStyles.variants[variant],
        badgeStyles.sizes[size],
        className,
      )}
      {...props}
    >
      {icon && (
        <span className="flex-shrink-0" aria-hidden="true">
          {icon}
        </span>
      )}
      <span className="truncate">{children}</span>
    </span>
  );
}

/**
 * Default export for convenience
 */
export default Badge;
