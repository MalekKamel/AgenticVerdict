/**
 * Tooltip Component
 *
 * Based on design-system/molecules/tooltip.pen specifications:
 * - Positions: top, bottom, left, right
 * - Variants: default, dark, light, success, warning, danger
 * - Border radius: 6px
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import type { TooltipProps } from "./Tooltip.types";

/**
 * Position styles
 */
const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
  left: "right-full top-1/2 -translate-y-1/2 mr-2",
  right: "left-full top-1/2 -translate-y-1/2 ml-2",
};

/**
 * Arrow styles based on position
 */
const arrowStyles: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1 rotate-180",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1 -rotate-90",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1 rotate-90",
};

/**
 * Variant styles
 */
const variantStyles = {
  default: "bg-gray-900 text-white",
  dark: "bg-gray-900 text-white",
  light: "bg-white text-gray-900 border border-gray-200",
  success: "bg-green-600 text-white",
  warning: "bg-orange-600 text-white",
  danger: "bg-red-600 text-white",
};

/**
 * Tooltip component
 *
 * Renders a tooltip on hover/focus
 * Accessible with proper ARIA attributes
 */
export const Tooltip = ({
  content,
  children,
  position = "top",
  variant = "default",
  delay = 300,
  open: controlledOpen,
  onOpenChange,
  maxWidth = "20rem",
  withArrow = true,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ariaLabel,
  ...props
}: TooltipProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (onOpenChange) {
        onOpenChange(true);
      } else {
        setInternalOpen(true);
      }
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (onOpenChange) {
      onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const child = React.Children.only(children) as React.ReactElement<
    Record<string, unknown>,
    string | React.JSXElementConstructor<unknown>
  >;

  const clonedChild = React.cloneElement(child, {
    onMouseEnter: showTooltip,
    onMouseLeave: hideTooltip,
    onFocus: showTooltip,
    onBlur: hideTooltip,
    "aria-describedby": isOpen ? "tooltip" : undefined,
  }) as React.ReactElement;

  return (
    <div className="relative inline-block">
      {clonedChild}

      {isOpen && (
        <div
          ref={tooltipRef}
          id="tooltip"
          role="tooltip"
          className={clsx(
            "absolute z-50 px-3 py-2 text-sm rounded-md shadow-sm whitespace-pre-line",
            positionStyles[position],
            variantStyles[variant],
            className,
          )}
          style={{ maxWidth }}
          {...props}
        >
          {content}
          {withArrow && (
            <div
              className={clsx(
                "absolute w-2 h-2 rotate-45 bg-gray-900",
                arrowStyles[position],
                variant === "light" && "bg-white border border-gray-200",
                variant === "success" && "bg-green-600",
                variant === "warning" && "bg-orange-600",
                variant === "danger" && "bg-red-600",
              )}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
};

Tooltip.displayName = "Tooltip";

/**
 * Default export for convenience
 */
export default Tooltip;
