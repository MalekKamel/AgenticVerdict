/**
 * Tooltip.types
 *
 * TypeScript interfaces for Tooltip component
 */

import type { HTMLAttributes } from "react";

/**
 * Tooltip positions
 */
export type TooltipPosition = "top" | "bottom" | "left" | "right";

/**
 * Tooltip variants
 */
export type TooltipVariant = "default" | "dark" | "light" | "success" | "warning" | "danger";

/**
 * Tooltip component props
 */
export interface TooltipProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  /**
   * Tooltip content
   */
  content: React.ReactNode;

  /**
   * Tooltip trigger element
   */
  children: React.ReactElement;

  /**
   * Tooltip position relative to trigger
   * @default 'top'
   */
  position?: TooltipPosition;

  /**
   * Tooltip variant
   * @default 'default'
   */
  variant?: TooltipVariant;

  /**
   * Delay before showing tooltip (ms)
   * @default 300
   */
  delay?: number;

  /**
   * Whether tooltip is controlled
   */
  open?: boolean;

  /**
   * Open change handler
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Maximum width
   * @default '20rem'
   */
  maxWidth?: string;

  /**
   * Whether to show arrow
   * @default true
   */
  withArrow?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}
