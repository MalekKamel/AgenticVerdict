/**
 * Global Test Setup
 *
 * This file is loaded before all tests to ensure proper cleanup
 * and prevent hanging processes.
 */

import { afterAll, beforeEach, afterEach } from "vitest";
import { runGlobalCleanup, clearAllTimers, clearAllImmediates } from "./test-cleanup";

let testCount = 0;
let cleanupCount = 0;

beforeEach(() => {
  testCount++;
});

afterEach(async () => {
  cleanupCount++;

  if (cleanupCount % 50 === 0) {
    console.log(`[test-setup] Completed ${cleanupCount} test cleanups`);
  }
});

afterAll(async () => {
  console.log(`[test-setup] Running final global cleanup after ${testCount} tests`);

  try {
    await Promise.race([
      runGlobalCleanup(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Global cleanup timeout after 30s")), 30000),
      ),
    ]);
    console.log("[test-setup] Global cleanup completed successfully");
  } catch (error) {
    console.error("[test-setup] Global cleanup failed or timed out:", error);
  }

  clearAllTimers();
  clearAllImmediates();

  console.log("[test-setup] All timers and immediates cleared");
});
