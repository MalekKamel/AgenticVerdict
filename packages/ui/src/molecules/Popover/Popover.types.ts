/**
 * Popover.types
 *
 * TypeScript interfaces for Popover component
 */

import type { HTMLAttributes } from "react";

/**
 * Popover positions
 */
export type PopoverPosition = "top" | "bottom" | "left" | "right";

/**
 * Popover component props
 */
export interface PopoverProps extends Omit<HTMLAttributes<HTMLDivElement>, "content"> {
  /**
   * Popover content
   */
  content: React.ReactNode;

  /**
   * Popover trigger element
   */
  children: React.ReactElement;

  /**
   * Popover position relative to trigger
   * @default 'bottom'
   */
  position?: PopoverPosition;

  /**
   * Whether the popover is open
   */
  open?: boolean;

  /**
   * Open change handler
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Popover title
   */
  title?: string;

  /**
   * Popover width
   * @default 'auto'
   */
  width?: string;

  /**
   * Whether to close on outside click
   * @default true
   */
  closeOnOutsideClick?: boolean;

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
