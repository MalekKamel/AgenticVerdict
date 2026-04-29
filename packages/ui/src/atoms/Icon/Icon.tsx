/**
 * Icon Component
 *
 * Wrapper for displaying icons
 * Supports lucide-react icons or custom SVG icons
 */

"use client";

import React, { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { Box, type MantineSize } from "@mantine/core";

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
 * Mantine-compatible icon box sizes in rem
 */
const iconSizeMap: Record<IconSize, MantineSize | number> = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
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
      <Box
        component="span"
        ref={ref}
        className={className}
        style={{
          width: iconSizeMap[size],
          height: iconSizeMap[size],
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
        {...props}
      >
        {children}
      </Box>
    );
  },
);

Icon.displayName = "Icon";

/**
 * Default export for convenience
 */
export default Icon;
