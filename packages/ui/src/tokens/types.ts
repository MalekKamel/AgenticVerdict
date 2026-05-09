/**
 * Design token types for the AgenticVerdict design system
 * Implements a three-tier token hierarchy: global → brand → component
 */

/**
 * Token categories for organizing design tokens
 */
export enum TokenCategory {
  COLOR = "color",
  SPACING = "spacing",
  TYPOGRAPHY = "typography",
  RADIUS = "radius",
  SHADOW = "shadow",
  TRANSITION = "transition",
  BORDER = "border",
}

/**
 * Token tiers in the three-tier hierarchy
 * - Global: Brand-agnostic primitives
 * - Brand: Tenant-specific overrides
 * - Component: Composed from global/brand tokens
 */
export enum TokenTier {
  GLOBAL = "global",
  BRAND = "brand",
  COMPONENT = "component",
}

/**
 * Base design token interface
 */
export interface DesignToken<T = string | number> {
  name: string;
  category: TokenCategory;
  tier: TokenTier;
  value: T;
  cssVariable: string;
  description?: string;
}

/**
 * Color token with optional opacity
 */
export interface ColorToken extends DesignToken<string> {
  category: TokenCategory.COLOR;
  opacity?: number;
}

/**
 * Spacing token in pixels
 */
export interface SpacingToken extends DesignToken<number> {
  category: TokenCategory.SPACING;
  unit: "px" | "rem" | "em";
}

/**
 * Typography token
 */
export interface TypographyToken extends DesignToken {
  category: TokenCategory.TYPOGRAPHY;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
}

/**
 * Shadow token definition
 */
export interface ShadowToken extends DesignToken<string> {
  category: TokenCategory.SHADOW;
  offsetX?: number;
  offsetY?: number;
  blur?: number;
  spread?: number;
}

/**
 * Border radius token
 */
export interface RadiusToken extends DesignToken<number | string> {
  category: TokenCategory.RADIUS;
}

/**
 * Global design tokens - brand-agnostic primitives
 */
export interface GlobalTokens {
  color: {
    blue: ColorScale;
    gray: ColorScale;
    green: ColorScale;
    orange: ColorScale;
    red: ColorScale;
  };
  spacing: {
    0: string;
    1: string;
    2: string;
    3: string;
    4: string;
    5: string;
    6: string;
    8: string;
    10: string;
    12: string;
    16: string;
    20: string;
    24: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
  };
  fontWeight: {
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  radius: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  shadow: {
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

/**
 * Color scale interface for semantic color tokens
 */
export interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
}

/**
 * Component tokens - composed from global and brand tokens
 */
export interface ComponentTokens {
  button: {
    primary: {
      bg: string;
      text: string;
      hover: string;
      active: string;
      disabled: string;
    };
    secondary: {
      bg: string;
      text: string;
      border: string;
      hover: string;
    };
    ghost: {
      bg: string;
      text: string;
      hover: string;
    };
    danger: {
      bg: string;
      text: string;
      hover: string;
    };
    success: {
      bg: string;
      text: string;
    };
    warning: {
      bg: string;
      text: string;
    };
  };
  input: {
    default: {
      bg: string;
      border: string;
      text: string;
      placeholder: string;
    };
    error: {
      border: string;
      text: string;
      bg: string;
    };
    focus: {
      border: string;
      ring: string;
    };
  };
  card: {
    default: {
      bg: string;
      border: string;
      shadow: string;
    };
    elevated: {
      bg: string;
      border: string;
      shadow: string;
    };
  };
}
