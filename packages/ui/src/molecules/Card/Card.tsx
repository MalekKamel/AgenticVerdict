/**
 * Card Component
 *
 * Based on design-system/molecules/card.pen specifications:
 * - Variants: default, elevated, outlined, filled
 * - Border radius: 8px
 * - Padding: 16px for header, body, footer
 * - Background: #FFFFFF
 * - Border: 1px #E0E0E0 (default)
 * - Shadow for elevated: 0 2px 4px rgba(0,0,0,0.1)
 */

"use client";

import React, { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Card variants
 */
export type CardVariant = "default" | "elevated" | "outlined" | "filled";

/**
 * Card padding options
 */
export type CardPadding = "none" | "xs" | "sm" | "md" | "lg";

/**
 * Card props
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Card variant
   * @default 'default'
   */
  variant?: CardVariant;

  /**
   * Card padding
   * @default 'md'
   */
  padding?: CardPadding;

  /**
   * Make card clickable
   * @default false
   */
  clickable?: boolean;

  /**
   * Card header content
   */
  header?: React.ReactNode;

  /**
   * Card footer content
   */
  footer?: React.ReactNode;

  /**
   * Card content
   */
  children: React.ReactNode;
}

/**
 * Card styles based on variant
 */
const cardStyles = {
  base: "rounded-lg bg-white transition-all duration-150",

  variants: {
    default: "border border-gray-300",
    elevated: "shadow-md hover:shadow-lg",
    outlined: "border-2 border-gray-300",
    filled: "bg-gray-50 border border-gray-200",
  },

  clickable:
    "cursor-pointer hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600",

  paddings: {
    none: "",
    xs: "p-2",
    sm: "p-3",
    md: "p-4",
    lg: "p-6",
  },

  section: {
    header: "border-b border-gray-200 pb-4 mb-4",
    footer: "border-t border-gray-200 pt-4 mt-4",
  },
};

/**
 * Card component
 *
 * Container for grouping related content
 * Supports header, body, and footer sections
 */
export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = "default",
      padding = "md",
      clickable = false,
      header,
      footer,
      children,
      className,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={clsx(
          cardStyles.base,
          cardStyles.variants[variant],
          clickable && cardStyles.clickable,
          padding !== "none" && cardStyles.paddings[padding],
          className,
        )}
        {...props}
      >
        {header && (
          <div className={clsx(padding === "none" ? "" : cardStyles.section.header)}>{header}</div>
        )}

        <div className="flex-1">{children}</div>

        {footer && (
          <div className={clsx(padding === "none" ? "" : cardStyles.section.footer)}>{footer}</div>
        )}
      </div>
    );
  },
);

Card.displayName = "Card";

/**
 * Card subcomponents for convenience
 */
interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <div className={clsx("mb-4", className)} {...props}>
      {children}
    </div>
  );
}

interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardBody({ className, children, ...props }: CardBodyProps) {
  return (
    <div className={clsx("flex-1", className)} {...props}>
      {children}
    </div>
  );
}

interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <div className={clsx("mt-4", className)} {...props}>
      {children}
    </div>
  );
}

/**
 * Default export for convenience
 */
export default Card;
