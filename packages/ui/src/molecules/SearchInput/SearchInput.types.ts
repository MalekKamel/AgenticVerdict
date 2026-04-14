/**
 * SearchInput.types
 *
 * TypeScript interfaces for SearchInput component
 */

import type { InputHTMLAttributes } from "react";

/**
 * SearchInput sizes
 */
export type SearchInputSize = "sm" | "md" | "lg";

/**
 * SearchInput component props
 */
export interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  /**
   * SearchInput size
   * @default 'md'
   */
  size?: SearchInputSize;

  /**
   * Placeholder text
   * @default 'Search...'
   */
  placeholder?: string;

  /**
   * Whether the input has a clear button
   * @default true
   */
  clearable?: boolean;

  /**
   * Whether the input is in loading state
   * @default false
   */
  loading?: boolean;

  /**
   * Icon to display on the left
   */
  leftIcon?: React.ReactNode;

  /**
   * Error message
   */
  error?: string;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;
}
