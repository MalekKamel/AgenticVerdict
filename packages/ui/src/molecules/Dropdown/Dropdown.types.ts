/**
 * Dropdown.types
 *
 * TypeScript interfaces for Dropdown component
 */

import type { HTMLAttributes } from "react";

/**
 * Dropdown positions
 */
export type DropdownPosition = "top" | "bottom" | "left" | "right";

/**
 * Dropdown alignment
 */
export type DropdownAlignment = "start" | "center" | "end";

/**
 * Dropdown item
 */
export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  divider?: boolean;
  onClick?: () => void;
}

/**
 * Dropdown component props
 */
export interface DropdownProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Dropdown items
   */
  items: DropdownItem[];

  /**
   * Whether the dropdown is open
   * @default false
   */
  open?: boolean;

  /**
   * Open change handler
   */
  onOpenChange?: (open: boolean) => void;

  /**
   * Dropdown trigger element
   */
  trigger: React.ReactNode;

  /**
   * Dropdown position relative to trigger
   * @default 'bottom'
   */
  position?: DropdownPosition;

  /**
   * Dropdown alignment
   * @default 'start'
   */
  alignment?: DropdownAlignment;

  /**
   * Dropdown width
   */
  width?: number | string;

  /**
   * Whether to close on item click
   * @default true
   */
  closeOnItemClick?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}
