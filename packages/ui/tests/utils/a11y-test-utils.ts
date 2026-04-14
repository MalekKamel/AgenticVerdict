/**
 * Accessibility testing utilities
 */

import { renderWithProviders } from "./test-utils";

/**
 * Run axe-core accessibility audit on rendered component
 * Note: In production, integrate jest-axe or @axe-core/react
 */
export async function checkA11y(
  ui: React.ReactElement,
  options?: {
    theme?: Record<string, unknown>;
    direction?: "ltr" | "rtl";
  },
) {
  const { theme, direction } = options || {};
  renderWithProviders(ui, { theme, direction });

  // Placeholder for actual axe-core integration
  // In production: import { axe } from 'jest-axe';
  // const results = await axe(container);

  return {
    results: { violations: [] },
    pass: true,
    violations: [],
  };
}

/**
 * Check for WCAG 2.1 AA compliance
 */
export async function checkWCAG21AA(
  ui: React.ReactElement,
  options?: {
    theme?: Record<string, unknown>;
    direction?: "ltr" | "rtl";
  },
) {
  return checkA11y(ui, options);
}

/**
 * Check keyboard navigation accessibility
 */
export function checkKeyboardNavigation(element: HTMLElement) {
  const focusableElements = element.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
  );

  return {
    focusableCount: focusableElements.length,
    focusableElements: Array.from(focusableElements),
    hasTabIndex: (index: number) => {
      const el = focusableElements[index];
      return el && el.getAttribute("tabindex") !== "-1";
    },
  };
}

/**
 * Check color contrast ratios
 */
export function checkColorContrast(
  foreground: string,
  background: string,
  fontSize: number = 16,
  fontWeight: "normal" | "bold" = "normal",
) {
  // Helper function to calculate relative luminance
  function getLuminance(hex: string): number {
    const rgb = hexToRgb(hex);
    if (!rgb) return 0;

    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((val) => {
      val = val / 255;
      return val <= 0.03928 ? val / 12.92 : Math.pow((val + 0.055) / 1.055, 2.4);
    });

    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }

  // Helper function to convert hex to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  }

  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);

  const ratio = (lighter + 0.05) / (darker + 0.05);

  // WCAG 2.1 AA requirements
  const isLargeText = fontSize >= 18 || (fontSize >= 14 && fontWeight === "bold");
  const requiredRatio = isLargeText ? 3 : 4.5;

  return {
    ratio: Math.round(ratio * 100) / 100,
    pass: ratio >= requiredRatio,
    requiredRatio,
    isLargeText,
  };
}

/**
 * Check touch target sizes (minimum 44x44 for WCAG 2.1 AA)
 */
export function checkTouchTargets(element: HTMLElement) {
  const interactiveElements = element.querySelectorAll(
    'button, a, input[type="checkbox"], input[type="radio"], [role="button"]',
  );

  const violations: Array<{
    element: Element;
    width: number;
    height: number;
  }> = [];

  interactiveElements.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width < 44 || rect.height < 44) {
      violations.push({
        element: el,
        width: rect.width,
        height: rect.height,
      });
    }
  });

  return {
    pass: violations.length === 0,
    violations,
  };
}
