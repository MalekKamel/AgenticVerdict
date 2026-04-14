/**
 * Dropdown Component
 *
 * Based on design-system/molecules/dropdown.pen specifications:
 * - Positions: top, bottom, left, right
 * - States: default, open, disabled
 * - Border radius: 8px
 */

"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import type { DropdownProps } from "./Dropdown.types";

/**
 * Position styles for dropdown
 */
const positionStyles: Record<string, string> = {
  top: "bottom-full mb-2",
  bottom: "top-full mt-2",
  left: "right-full mr-2",
  right: "left-full ml-2",
};

/**
 * Alignment styles
 */
const alignmentStyles: Record<string, string> = {
  start: "left-0",
  center: "left-1/2 -translate-x-1/2",
  end: "right-0",
};

/**
 * Dropdown component
 *
 * Renders a dropdown menu with items
 * Accessible with proper ARIA attributes and keyboard navigation
 */
export const Dropdown = ({
  items,
  open: controlledOpen,
  onOpenChange,
  trigger,
  position = "bottom",
  alignment = "start",
  width = "auto",
  closeOnItemClick = true,
  className,
  ariaLabel,
  ...props
}: DropdownProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setInternalOpen(newOpen);
    }
  };

  const handleTriggerClick = () => {
    handleOpenChange(!isOpen);
  };

  const handleItemClick = (item: (typeof items)[0]) => {
    if (item.disabled || item.divider) return;

    item.onClick?.();

    if (closeOnItemClick) {
      handleOpenChange(false);
    }
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
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
  }, [isOpen]);

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

  return (
    <div className={clsx("relative inline-block", className)} {...props}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleTriggerClick}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={ariaLabel}
        className="inline-flex items-center"
      >
        {trigger}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          role="menu"
          aria-orientation="vertical"
          className={clsx(
            "absolute z-50 min-w-[8rem] overflow-hidden rounded-lg border border-gray-200 bg-white py-1 shadow-md",
            positionStyles[position],
            alignmentStyles[alignment],
          )}
          style={{ width }}
        >
          {items.map((item, index) => {
            if (item.divider) {
              return (
                <div key={`divider-${index}`} role="separator" className="my-1 h-px bg-gray-200" />
              );
            }

            return (
              <button
                key={item.id}
                role="menuitem"
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={clsx(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm transition-colors duration-150",
                  "focus:outline-none focus:bg-gray-100",
                  item.destructive
                    ? "text-red-600 hover:bg-red-50"
                    : "text-gray-700 hover:bg-gray-100",
                  item.disabled && "pointer-events-none opacity-50",
                )}
              >
                {item.icon && <span aria-hidden="true">{item.icon}</span>}
                <span className="flex-1 text-left">{item.label}</span>
                {item.rightIcon && <span aria-hidden="true">{item.rightIcon}</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

Dropdown.displayName = "Dropdown";

/**
 * Default export for convenience
 */
export default Dropdown;
