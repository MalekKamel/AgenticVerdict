/**
 * Icon Component
 *
 * Wrapper for displaying icons
 * Supports lucide-react icons or custom SVG icons
 */

"use client";

import React, { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Icon sizes
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Icon props
 */
export interface IconProps extends HTMLAttributes<HTMLSpanElement> {
  /**
   * Icon size
   * @default 'md'
   */
  size?: IconSize;

  /**
   * Icon content - typically an SVG or icon component
   */
  children: React.ReactNode;
}

/**
 * Icon styles based on size
 */
const iconStyles = {
  base: "inline-flex items-center justify-center flex-shrink-0",

  sizes: {
    xs: "w-3 h-3", // 12px
    sm: "w-4 h-4", // 16px
    md: "w-5 h-5", // 20px
    lg: "w-6 h-6", // 24px
    xl: "w-8 h-8", // 32px
  },
};

/**
 * Icon component
 *
 * Wraps icon content for consistent sizing and behavior
 * Use with lucide-react icons or custom SVG icons
 */
export const Icon = forwardRef<HTMLSpanElement, IconProps>(
  ({ size = "md", className, children, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={clsx(iconStyles.base, iconStyles.sizes[size], className)}
        {...props}
      >
        {children}
      </span>
    );
  },
);

Icon.displayName = "Icon";

/**
 * Default export for convenience
 */
export default Icon;
