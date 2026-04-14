/**
 * Separator Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Color: #DEE2E6
 * - Height: 1px (horizontal), Width: 1px (vertical)
 * - Supports solid, dashed, and dotted styles
 * - Supports label/text between separators
 */

"use client";

import type { HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Separator orientation
 */
export type SeparatorOrientation = "horizontal" | "vertical";

/**
 * Separator style
 */
export type SeparatorStyle = "solid" | "dashed" | "dotted";

/**
 * Separator props
 */
export interface SeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, "style"> {
  /**
   * Separator orientation
   * @default 'horizontal'
   */
  orientation?: SeparatorOrientation;

  /**
   * Separator style
   * @default 'solid'
   */
  style?: SeparatorStyle;

  /**
   * Optional label/text to display
   */
  label?: string;

  /**
   * Separator thickness in pixels
   * @default 1
   */
  thickness?: number;
}

/**
 * Separator styles
 */
const separatorStyles = {
  base: "flex shrink-0 bg-gray-300",
  horizontal: "w-full h-px flex-col",
  vertical: "h-full w-px",
  styles: {
    solid: "",
    dashed: "border-dashed",
    dotted: "border-dotted",
  },
  labeled: "items-center gap-4",
  labelLine: "flex-1 h-px bg-gray-300",
  label: "text-sm text-gray-500 font-medium whitespace-nowrap px-2",
};

/**
 * Separator component
 *
 * Displays a visual separator between content sections
 * Supports horizontal, vertical, dashed, dotted, and labeled variants
 */
export function Separator({
  orientation = "horizontal",
  style: separatorStyle = "solid",
  label,
  thickness = 1,
  className,
  ...props
}: SeparatorProps) {
  if (label) {
    return (
      <div
        className={clsx(
          "flex",
          orientation === "horizontal" ? "flex-row" : "flex-col",
          separatorStyles.labeled,
          className,
        )}
        role="separator"
        aria-orientation={orientation}
        {...props}
      >
        <div className={separatorStyles.labelLine} style={{ height: thickness }} />
        <span className={separatorStyles.label}>{label}</span>
        <div className={separatorStyles.labelLine} style={{ height: thickness }} />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        separatorStyles.base,
        orientation === "horizontal" ? separatorStyles.horizontal : separatorStyles.vertical,
        separatorStyle !== "solid" && separatorStyles.styles[separatorStyle],
        className,
      )}
      role="separator"
      aria-orientation={orientation}
      style={orientation === "horizontal" ? { height: thickness } : { width: thickness }}
      {...props}
    />
  );
}

/**
 * Default export for convenience
 */
export default Separator;
