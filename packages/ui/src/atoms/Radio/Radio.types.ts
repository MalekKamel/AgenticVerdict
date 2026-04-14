/**
 * Radio.types
 *
 * TypeScript interfaces for Radio component
 */

import type { InputHTMLAttributes } from "react";

/**
 * Radio sizes
 */
export type RadioSize = "xs" | "sm" | "md" | "lg";

/**
 * Radio color variants
 */
export type RadioVariant = "default" | "primary" | "success" | "warning" | "danger";

/**
 * Radio component props
 */
export interface RadioProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * Radio size
   * @default 'md'
   */
  size?: RadioSize;

  /**
   * Radio color variant
   * @default 'default'
   */
  variant?: RadioVariant;

  /**
   * Radio label text
   */
  label?: string;

  /**
   * Position of label relative to radio
   * @default 'right'
   */
  labelPosition?: "left" | "right";

  /**
   * Error message
   */
  error?: string;

  /**
   * Description text
   */
  description?: string;
}

/**
 * Radio group props
 */
export interface RadioGroupProps {
  /**
   * Radio options
   */
  options: Array<{
    value: string;
    label: string;
    description?: string;
    disabled?: boolean;
  }>;

  /**
   * Selected value
   */
  value: string;

  /**
   * Change handler
   */
  onChange: (value: string) => void;

  /**
   * Group name (required for accessibility)
   */
  name: string;

  /**
   * Group label
   */
  label?: string;

  /**
   * Size for all radios in group
   * @default 'md'
   */
  size?: RadioSize;

  /**
   * Variant for all radios in group
   * @default 'default'
   */
  variant?: RadioVariant;

  /**
   * Error message for group
   */
  error?: string;

  /**
   * Disable all radios in group
   * @default false
   */
  disabled?: boolean;

  /**
   * Orientation
   * @default 'vertical'
   */
  orientation?: "horizontal" | "vertical";
}
