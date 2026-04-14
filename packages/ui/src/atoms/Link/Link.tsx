/**
 * Link Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Variants: default, primary, secondary, ghost, danger
 * - Sizes: xs, sm, md, lg
 * - Underline styles: always, hover, none
 * - External link indicator
 */

"use client";

import { forwardRef } from "react";
import clsx from "clsx";
import type { LinkProps } from "./Link.types";

/**
 * Link variant styles
 */
const variantStyles = {
  default: "text-blue-600 hover:text-blue-800",
  primary: "text-blue-600 hover:text-blue-800 font-medium",
  secondary: "text-gray-600 hover:text-gray-800",
  ghost: "text-gray-500 hover:text-gray-700",
  danger: "text-red-600 hover:text-red-800",
};

/**
 * Link size styles
 */
const sizeStyles = {
  xs: "text-xs",
  sm: "text-sm",
  md: "text-base",
  lg: "text-lg",
};

/**
 * Underline styles
 */
const underlineStyles = {
  always: "underline",
  hover: "no-underline hover:underline",
  none: "no-underline",
};

/**
 * External link icon
 */
const ExternalIcon = () => (
  <svg
    className="inline-block ml-1 w-3 h-3"
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
    />
  </svg>
);

/**
 * Link component
 *
 * Renders an anchor link with variant, size, and underline support
 * Accessible with proper ARIA attributes for external links
 */
export const Link = forwardRef<HTMLAnchorElement, LinkProps>(
  (
    {
      variant = "default",
      size = "md",
      underline = "hover",
      leftIcon,
      rightIcon,
      children,
      className,
      href,
      external = false,
      ariaLabel,
      target,
      rel,
      ...props
    },
    ref,
  ) => {
    const isExternal = external || (href && href.startsWith("http")) || false;
    const externalTarget = isExternal ? "_blank" : target;
    const externalRel = isExternal ? "noopener noreferrer" : rel;

    // Determine if right icon should be the external icon
    const showExternalIcon = isExternal && !rightIcon;

    return (
      <a
        ref={ref}
        href={href}
        target={externalTarget}
        rel={externalRel}
        className={clsx(
          "inline-flex items-center gap-1 transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded",
          variantStyles[variant],
          sizeStyles[size],
          underlineStyles[underline],
          className,
        )}
        aria-label={ariaLabel || (isExternal ? `${children} (opens in new tab)` : undefined)}
        {...props}
      >
        {leftIcon && <span aria-hidden="true">{leftIcon}</span>}
        {children}
        {rightIcon && <span aria-hidden="true">{rightIcon}</span>}
        {showExternalIcon && <ExternalIcon />}
      </a>
    );
  },
);

Link.displayName = "Link";

/**
 * Default export for convenience
 */
export default Link;
