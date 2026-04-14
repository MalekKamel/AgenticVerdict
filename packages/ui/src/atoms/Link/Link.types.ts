/**
 * Link.types
 *
 * TypeScript interfaces for Link component
 */

import type { AnchorHTMLAttributes } from "react";

/**
 * Link variants
 */
export type LinkVariant = "default" | "primary" | "secondary" | "ghost" | "danger";

/**
 * Link sizes
 */
export type LinkSize = "xs" | "sm" | "md" | "lg";

/**
 * Underline options
 */
export type UnderlineStyle = "always" | "hover" | "none";

/**
 * Link component props
 */
export interface LinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  /**
   * Link variant
   * @default 'default'
   */
  variant?: LinkVariant;

  /**
   * Link size
   * @default 'md'
   */
  size?: LinkSize;

  /**
   * Underline style
   * @default 'hover'
   */
  underline?: UnderlineStyle;

  /**
   * Icon to display on the left
   */
  leftIcon?: React.ReactNode;

  /**
   * Icon to display on the right
   */
  rightIcon?: React.ReactNode;

  /**
   * Link content
   */
  children: React.ReactNode;

  /**
   * Whether the link is external
   * @default false
   */
  external?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}
