/**
 * Toast Component
 *
 * Based on design-system/molecules/toast.pen specifications:
 * - Variants: default, success, warning, error, info
 * - Auto-dismiss with duration
 * - Dismissible with close button
 * - Border radius: 8px
 */

"use client";

import React, { useEffect, useRef } from "react";
import clsx from "clsx";
import type { ToastProps } from "./Toast.types";

/**
 * Variant styles
 */
const variantStyles = {
  default: "bg-white border-gray-200",
  success: "bg-green-50 border-green-200",
  warning: "bg-orange-50 border-orange-200",
  error: "bg-red-50 border-red-200",
  info: "bg-blue-50 border-blue-200",
};

/**
 * Variant icons
 */
const variantIcons: Record<string, React.ReactNode> = {
  success: (
    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
};

/**
 * Close icon
 */
const CloseIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

/**
 * Toast component
 *
 * Renders a notification toast with auto-dismiss
 * Accessible with proper ARIA attributes and live regions
 */
export const Toast = ({
  title,
  message,
  variant = "default",
  open = true,
  onClose,
  duration = 5000,
  actions,
  icon,
  className,
  ...props
}: ToastProps) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (duration > 0 && open) {
      timeoutRef.current = setTimeout(() => {
        onClose?.();
      }, duration);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, open, onClose]);

  if (!open) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className={clsx(
        "flex items-start gap-3 w-full max-w-sm rounded-lg border shadow-lg px-4 py-3",
        variantStyles[variant],
        className,
      )}
      {...props}
    >
      {/* Icon */}
      {icon || (variant !== "default" && variantIcons[variant]) ? (
        <div className="flex-shrink-0">{icon || variantIcons[variant]}</div>
      ) : null}

      {/* Content */}
      <div className="flex-1 min-w-0">
        {title && <p className="text-sm font-semibold text-gray-900">{title}</p>}
        {message && <p className="mt-1 text-sm text-gray-600">{message}</p>}
        {actions && <div className="mt-2 flex gap-2">{actions}</div>}
      </div>

      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 p-1 rounded text-gray-400 hover:text-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-600"
          aria-label="Close notification"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

Toast.displayName = "Toast";

/**
 * Default export for convenience
 */
export default Toast;
