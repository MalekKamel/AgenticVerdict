/**
 * Typography Component
 *
 * Based on design/system/atoms.lib.pen specifications:
 * - Font: Inter
 * - Base color: #212121
 * - Supports various sizes and weights
 */

"use client";

import React, { type ElementType } from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";

/**
 * Typography variants
 */
export type TypographyVariant =
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "body-lg"
  | "body"
  | "body-sm"
  | "caption"
  | "label"
  | "lead";

/**
 * Typography weights
 */
export type TypographyWeight = "normal" | "medium" | "semibold" | "bold";

/**
 * Typography props
 */
export interface TypographyProps extends HTMLAttributes<
  HTMLHeadingElement | HTMLParagraphElement | HTMLSpanElement
> {
  /**
   * Typography variant
   * @default 'body'
   */
  variant?: TypographyVariant;

  /**
   * Font weight
   * @default 'normal'
   */
  weight?: TypographyWeight;

  /**
   * Text color
   * @default 'default'
   */
  color?: "default" | "primary" | "secondary" | "success" | "warning" | "danger" | "info";

  /**
   * Make text unselectable
   * @default false
   */
  noSelect?: boolean;

  /**
   * Truncate text with ellipsis
   * @default false
   */
  truncate?: boolean;

  /**
   * Typography content
   */
  children: React.ReactNode;

  /**
   * HTML tag to render
   */
  as?: ElementType;
}

/**
 * Typography styles based on variant
 */
const typographyStyles = {
  base: "",

  variants: {
    h1: "text-4xl font-bold leading-tight",
    h2: "text-3xl font-semibold leading-tight",
    h3: "text-2xl font-semibold leading-tight",
    h4: "text-xl font-semibold leading-snug",
    h5: "text-lg font-semibold leading-snug",
    h6: "text-base font-semibold leading-snug",
    "body-lg": "text-lg font-normal leading-relaxed",
    body: "text-base font-normal leading-normal",
    "body-sm": "text-sm font-normal leading-normal",
    caption: "text-xs font-normal leading-normal",
    label: "text-sm font-medium leading-none",
    lead: "text-xl font-normal leading-relaxed",
  },

  weights: {
    normal: "font-normal",
    medium: "font-medium",
    semibold: "font-semibold",
    bold: "font-bold",
  },

  colors: {
    default: "text-gray-900",
    primary: "text-blue-600",
    secondary: "text-gray-600",
    success: "text-green-600",
    warning: "text-orange-600",
    danger: "text-red-600",
    info: "text-blue-500",
  },
};

/**
 * Default HTML tag for each variant
 */
const defaultTags: Record<TypographyVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  h5: "h5",
  h6: "h6",
  "body-lg": "p",
  body: "p",
  "body-sm": "p",
  caption: "span",
  label: "label",
  lead: "p",
};

/**
 * Typography component
 *
 * Renders text with consistent styling across the application
 * Supports various sizes, weights, and colors
 */
export function Typography({
  variant = "body",
  weight = "normal",
  color = "default",
  noSelect = false,
  truncate = false,
  className,
  children,
  as,
  ...props
}: TypographyProps) {
  const Tag = as || defaultTags[variant];

  return (
    <Tag
      className={clsx(
        typographyStyles.base,
        typographyStyles.variants[variant],
        weight !== "normal" && typographyStyles.weights[weight],
        typographyStyles.colors[color],
        noSelect && "select-none",
        truncate && "truncate",
        className,
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}

/**
 * Default export for convenience
 */
export default Typography;

/**
 * Convenience components for common typography use cases
 */
export const H1 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h1" {...props} />
);
export const H2 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h2" {...props} />
);
export const H3 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h3" {...props} />
);
export const H4 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h4" {...props} />
);
export const H5 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h5" {...props} />
);
export const H6 = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="h6" {...props} />
);
export const BodyLG = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="body-lg" {...props} />
);
export const Body = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="body" {...props} />
);
export const BodySM = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="body-sm" {...props} />
);
export const Caption = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="caption" {...props} />
);
export const Label = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="label" {...props} />
);
export const Lead = (props: Omit<TypographyProps, "variant">) => (
  <Typography variant="lead" {...props} />
);
