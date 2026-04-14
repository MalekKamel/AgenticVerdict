/**
 * DatePicker.types
 *
 * TypeScript interfaces for DatePicker component
 */

/**
 * DatePicker sizes
 */
export type DatePickerSize = "sm" | "md" | "lg";

/**
 * DatePicker component props
 */
export interface DatePickerProps {
  /**
   * DatePicker size
   * @default 'md'
   */
  size?: DatePickerSize;

  /**
   * Selected date
   */
  value?: Date | string | null;

  /**
   * Change handler
   */
  onChange?: (date: Date | null) => void;

  /**
   * Minimum selectable date
   */
  minDate?: Date;

  /**
   * Maximum selectable date
   */
  maxDate?: Date;

  /**
   * Whether to show time picker
   * @default false
   */
  withTime?: boolean;

  /**
   * Date format for display
   * @default 'YYYY-MM-DD'
   */
  format?: string;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Label
   */
  label?: string;

  /**
   * Error message
   */
  error?: string;

  /**
   * Helper text
   */
  description?: string;

  /**
   * Whether the field is required
   * @default false
   */
  required?: boolean;

  /**
   * Whether the DatePicker is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Whether the DatePicker is in loading state
   * @default false
   */
  loading?: boolean;

  /**
   * ARIA label for accessibility
   */
  ariaLabel?: string;

  /**
   * Additional CSS className
   */
  className?: string;

  /**
   * Component id
   */
  id?: string;
}
