/**
 * Popover Component
 *
 * Based on design-system/molecules/popover.pen specifications:
 * - Positions: top, bottom, left, right
 * - States: default, open
 * - Border radius: 8px
 */

"use client";

import React, { useState, useRef, useEffect } from "react";
import clsx from "clsx";
import type { PopoverProps } from "./Popover.types";

/**
 * Position styles
 */
const positionStyles: Record<string, string> = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  left: "right-full top-1/2 -translate-y-1/2 mr-3",
  right: "left-full top-1/2 -translate-y-1/2 ml-3",
};

/**
 * Arrow styles
 */
const arrowStyles: Record<string, string> = {
  top: "top-full left-1/2 -translate-x-1/2 -mt-1.5",
  bottom: "bottom-full left-1/2 -translate-x-1/2 -mb-1.5 rotate-180",
  left: "left-full top-1/2 -translate-y-1/2 -ml-1.5 -rotate-90",
  right: "right-full top-1/2 -translate-y-1/2 -mr-1.5 rotate-90",
};

/**
 * Popover component
 *
 * Renders a popover on click/focus
 * Accessible with proper ARIA attributes and keyboard navigation
 */
export const Popover = ({
  content,
  children,
  position = "bottom",
  open: controlledOpen,
  onOpenChange,
  title,
  width = "auto",
  closeOnOutsideClick = true,
  withArrow = true,
  className,
  ariaLabel,
  ...props
}: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleToggle = () => {
    handleOpenChange(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        handleOpenChange(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, closeOnOutsideClick]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        handleOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const child = React.Children.only(children) as React.ReactElement<
    unknown,
    string | React.JSXElementConstructor<unknown>
  >;

  const clonedChild = React.cloneElement(child, {
    ref: triggerRef,
    onClick: handleToggle,
    "aria-haspopup": "dialog",
    "aria-expanded": isOpen,
    "aria-label": ariaLabel,
  } as React.Attributes);

  return (
    <div className="relative inline-block">
      {clonedChild}

      {isOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          className={clsx(
            "absolute z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg",
            positionStyles[position],
            className,
          )}
          style={{ width }}
          {...props}
        >
          {title && (
            <div className="px-4 py-3 border-b border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
            </div>
          )}

          <div className="p-4">{content}</div>

          {withArrow && (
            <div
              className={clsx(
                "absolute w-3 h-3 rotate-45 bg-white border-gray-200",
                arrowStyles[position],
                position === "top" && "border-r border-b",
                position === "bottom" && "border-l border-t",
                position === "left" && "border-r border-t",
                position === "right" && "border-l border-b",
              )}
              aria-hidden="true"
            />
          )}
        </div>
      )}
    </div>
  );
};

Popover.displayName = "Popover";

/**
 * Default export for convenience
 */
export default Popover;
