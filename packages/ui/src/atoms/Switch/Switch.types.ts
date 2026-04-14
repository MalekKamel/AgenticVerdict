/**
 * Switch.types
 *
 * TypeScript interfaces for Switch component
 */

import type { InputHTMLAttributes } from "react";

/**
 * Switch sizes
 */
export type SwitchSize = "xs" | "sm" | "md" | "lg";

/**
 * Switch color variants
 */
export type SwitchVariant = "default" | "primary" | "success" | "warning" | "danger";

/**
 * Switch component props
 */
export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Switch size
   * @default 'md'
   */
  size?: SwitchSize;

  /**
   * Switch color variant
   * @default 'default'
   */
  variant?: SwitchVariant;

  /**
   * Switch label text
   */
  label?: string;

  /**
   * Position of label relative to switch
   * @default 'right'
   */
  labelPosition?: "left" | "right";

  /**
   * Label for checked state
   */
  checkedLabel?: string;

  /**
   * Label for unchecked state
   */
  uncheckedLabel?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Description text
   */
  description?: string;

  /**
   * Show loading state
   * @default false
   */
  loading?: boolean;
}
