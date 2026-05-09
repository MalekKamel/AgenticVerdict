/**
 * DirectionProvider - Manages RTL/LTR text direction
 * Essential for Arabic and other RTL language support
 */

"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { TextDirection } from "@agenticverdict/types";

export type { TextDirection };

/**
 * Locale to direction mapping
 * Add locales as needed for internationalization
 */
const LOCALE_TO_DIRECTION: Record<string, TextDirection> = {
  // RTL languages
  ar: "rtl",
  he: "rtl",
  fa: "rtl",
  ur: "rtl",
  ku: "rtl",
  yi: "rtl",

  // LTR languages (explicit)
  en: "ltr",
  fr: "ltr",
  de: "ltr",
  es: "ltr",
  it: "ltr",
  pt: "ltr",
  ru: "ltr",
  zh: "ltr",
  ja: "ltr",
  ko: "ltr",
};

/**
 * Direction context interface
 */
interface DirectionContextValue {
  direction: TextDirection;
  setDirection: (direction: TextDirection) => void;
  setLocale: (locale: string) => void;
  isRTL: boolean;
}

const DirectionContext = createContext<DirectionContextValue | undefined>(undefined);

/**
 * Direction provider props
 */
export interface DirectionProviderProps {
  children: React.ReactNode;
  /** Initial direction - defaults to 'ltr' */
  initialDirection?: TextDirection;
  /** Initial locale - will be mapped to direction */
  initialLocale?: string;
}

/**
 * DirectionProvider component
 * Manages text direction for RTL/LTR support
 */
export function DirectionProvider({
  children,
  initialDirection = "ltr",
  initialLocale,
}: DirectionProviderProps) {
  // Determine initial direction from locale if provided
  const getInitialDirection = (): TextDirection => {
    if (initialLocale) {
      return LOCALE_TO_DIRECTION[initialLocale] || "ltr";
    }
    return initialDirection;
  };

  const [direction, setDirectionState] = useState<TextDirection>(getInitialDirection());

  // SPA locale changes update `initialLocale` without remounting this provider. If we only
  // read it in useState's initializer, `direction` (and thus `documentElement.dir`) can stay
  // stale while route markup uses the correct inner `dir`. Mantine AppShell matches
  // `:where([dir="rtl"]) …` on *any* ancestor, so a stale `html[dir="rtl"]` incorrectly applies
  // RTL navbar transforms in an LTR subtree (navbar appears to slide the wrong way).
  useEffect(() => {
    if (!initialLocale) {
      return;
    }
    const nextDirection = LOCALE_TO_DIRECTION[initialLocale] ?? "ltr";
    setDirectionState((current) => (current === nextDirection ? current : nextDirection));
  }, [initialLocale]);

  // Apply direction to document
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("dir", direction);
  }, [direction]);

  /**
   * Set direction directly
   */
  const setDirection = (newDirection: TextDirection) => {
    setDirectionState(newDirection);
  };

  /**
   * Set direction based on locale
   * Automatically detects RTL languages
   */
  const setLocale = (locale: string) => {
    const detectedDirection = LOCALE_TO_DIRECTION[locale] || "ltr";
    setDirectionState(detectedDirection);
  };

  const contextValue: DirectionContextValue = {
    direction,
    setDirection,
    setLocale,
    isRTL: direction === "rtl",
  };

  return <DirectionContext.Provider value={contextValue}>{children}</DirectionContext.Provider>;
}

/**
 * useDirection hook
 * Access direction context in components
 */
export function useDirection() {
  const context = useContext(DirectionContext);
  if (!context) {
    throw new Error("useDirection must be used within DirectionProvider");
  }
  return context;
}

/**
 * Utility to get logical property value based on direction
 * Use this instead of left/right in styles
 */
export function getLogicalProperty({
  start,
  end,
  direction,
}: {
  start: string;
  end: string;
  direction: TextDirection;
}): { inlineStart: string; inlineEnd: string } {
  return {
    inlineStart: direction === "rtl" ? end : start,
    inlineEnd: direction === "rtl" ? start : end,
  };
}

/**
 * Utility to flip directional values for RTL
 * Useful for icon transforms and directional UI elements
 */
export function flipForRTL<T extends number | string>(
  value: T,
  direction: TextDirection,
  multiplier: number = 1,
): T {
  if (direction === "rtl") {
    if (typeof value === "number") {
      return (value * -1 * multiplier) as T;
    }
    // For string values like '100%', '16px', etc.
    const numericValue = parseFloat(value);
    if (!isNaN(numericValue)) {
      const unit = value.replace(/[0-9.-]/g, "");
      return `${numericValue * -1 * multiplier}${unit}` as T;
    }
  }
  return value;
}
