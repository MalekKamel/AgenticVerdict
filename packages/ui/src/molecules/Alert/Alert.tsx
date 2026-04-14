/**
 * Alert Component
 *
 * Based on design/system/molecules.lib.pen specifications:
 * - Variants: info, success, warning, error
 * - Border radius: 8px
 * - Padding: 12px
 * - Gap: 12px between icon, content, and close button
 * - Icon: 20x20px, lucide icons
 * - Title: Inter, 16px, 600 weight
 * - Message: Inter, 14px, normal weight
 * - Colors match variant theme
 */

"use client";

import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import { X } from "lucide-react";

/**
 * Alert variants
 */
export type AlertVariant = "info" | "success" | "warning" | "error";

/**
 * Alert props
 */
export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Alert variant
   * @default 'info'
   */
  variant?: AlertVariant;

  /**
   * Alert title
   */
  title?: string;

  /**
   * Show close button
   * @default false
   */
  closable?: boolean;

  /**
   * Callback when close button is clicked
   */
  onClose?: () => void;

  /**
   * Alert content or message
   */
  children: ReactNode;
}

/**
 * Alert styles
 */
const alertStyles = {
  base: "flex items-start gap-3 rounded-lg border p-3",
  closable: "pr-10", // Extra padding for close button

  variants: {
    info: "bg-blue-50 border-blue-600 text-blue-700",
    success: "bg-green-50 border-green-600 text-green-700",
    warning: "bg-orange-50 border-orange-600 text-orange-700",
    error: "bg-red-50 border-red-600 text-red-700",
  },

  icon: "flex-shrink-0 w-5 h-5 mt-0.5",
  content: "flex-1",
  title: "font-semibold text-base mb-1",
  message: "text-sm",
  closeButton:
    "absolute top-3 right-3 flex-shrink-0 rounded p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-current",
};

/**
 * Alert component
 *
 * Displays important information with variant-specific styling
 * Supports optional title and close button
 */
export function Alert({
  variant = "info",
  title,
  closable = false,
  onClose,
  children,
  className,
  ...props
}: AlertProps) {
  return (
    <div
      role="alert"
      className={clsx(
        alertStyles.base,
        alertStyles.variants[variant],
        closable && alertStyles.closable,
        "relative",
        className,
      )}
      {...props}
    >
      {/* Icon placeholder - would use lucide-react icons in full implementation */}
      <div className={alertStyles.icon} aria-hidden="true">
        <span className="text-lg">
          {variant === "info" && "ℹ️"}
          {variant === "success" && "✓"}
          {variant === "warning" && "⚠️"}
          {variant === "error" && "✕"}
        </span>
      </div>

      <div className={alertStyles.content}>
        {title && <div className={alertStyles.title}>{title}</div>}
        <div className={alertStyles.message}>{children}</div>
      </div>

      {closable && (
        <button
          type="button"
          onClick={onClose}
          className={alertStyles.closeButton}
          aria-label="Close alert"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

/**
 * Default export for convenience
 */
export default Alert;
