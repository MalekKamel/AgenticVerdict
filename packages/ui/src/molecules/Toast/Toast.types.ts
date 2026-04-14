/**
 * Toast.types
 *
 * TypeScript interfaces for Toast component
 */

import type { HTMLAttributes } from "react";

/**
 * Toast variants
 */
export type ToastVariant = "default" | "success" | "warning" | "error" | "info";

/**
 * Toast positions
 */
export type ToastPosition =
  | "top-right"
  | "top-left"
  | "bottom-right"
  | "bottom-left"
  | "top-center"
  | "bottom-center";

/**
 * Toast component props
 */
export interface ToastProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Toast title
   */
  title: string;

  /**
   * Toast message
   */
  message?: string;

  /**
   * Toast variant
   * @default 'default'
   */
  variant?: ToastVariant;

  /**
   * Whether the toast is visible
   * @default true
   */
  open?: boolean;

  /**
   * Close handler
   */
  onClose?: () => void;

  /**
   * Auto-close duration in ms
   * @default 5000
   */
  duration?: number;

  /**
   * Action buttons
   */
  actions?: React.ReactNode;

  /**
   * Icon override
   */
  icon?: React.ReactNode;
}

/**
 * Toast container props (for toast manager)
 */
export interface ToastContainerProps {
  /**
   * Toast position on screen
   * @default 'top-right'
   */
  position?: ToastPosition;

  /**
   * Maximum number of visible toasts
   * @default 5
   */
  maxToasts?: number;

  /**
   * Toasts stack gap
   * @default '0.75rem'
   */
  gap?: string;
}
