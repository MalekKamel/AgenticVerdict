/**
 * Select.types
 *
 * TypeScript interfaces for Select component
 */

import type { SelectHTMLAttributes } from "react";

/**
 * Select sizes
 */
export type SelectSize = "sm" | "md" | "lg";

/**
 * Select variants
 */
export type SelectVariant = "default" | "filled" | "unstyled";

/**
 * Select option
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  group?: string;
}

/**
 * Select component props
 */
export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  /**
   * Select size
   * @default 'md'
   */
  size?: SelectSize;

  /**
   * Select variant
   * @default 'default'
   */
  variant?: SelectVariant;

  /**
   * Select options
   */
  options: SelectOption[];

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the select is searchable
   * @default false
   */
  searchable?: boolean;

  /**
   * Whether multiple options can be selected
   * @default false
   */
  multiple?: boolean;

  /**
   * Error message
   */
  error?: string;

  /**
   * Helper text
   */
  description?: string;

  /**
   * Label
   */
  label?: string;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Whether the select is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the select is in loading state
   * @default false
   */
  loading?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}
