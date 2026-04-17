/**
 * E2E Test Helper Functions
 *
 * Utility functions for Playwright E2E tests to handle common patterns.
 */

import type { Page, Locator } from "@playwright/test";

/**
 * Check if a locator is focused
 *
 * Playwright's Locator doesn't have an isFocused() method, so we need to use evaluate.
 *
 * @param locator - The locator to check
 * @returns Promise resolving to true if the element is focused
 */
export async function isFocused(locator: Locator): Promise<boolean> {
  return await locator.evaluate((el) => el === document.activeElement);
}

/**
 * Wait for an element to be focused
 *
 * @param locator - The locator to wait for focus
 * @param timeout - Optional timeout in milliseconds (default 5000)
 */
export async function waitForFocus(locator: Locator, timeout = 5000): Promise<void> {
  await locator.waitFor({ state: "attached", timeout });
  const startTime = Date.now();
  while (Date.now() - startTime < timeout) {
    if (await isFocused(locator)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Element did not receive focus within ${timeout}ms`);
}

/**
 * Get the currently focused element
 *
 * @param page - The Playwright page object
 * @returns The focused element as a Locator
 */
export function getFocusedElement(page: Page): Locator {
  return page.locator(':has-text("")').filter({ has: page.locator(":focus") });
}
