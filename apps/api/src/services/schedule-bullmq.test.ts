/**
 * Cron Parsing Unit Tests
 *
 * Tests for cron-parser validation, frequency-to-cron conversion,
 * and timezone-aware nextRun computation.
 */

import { describe, it, expect } from "vitest";
import {
  isValidCronExpression,
  frequencyToCron,
  computeNextRun,
  computeNextRuns,
} from "./schedule-bullmq";

describe("cron parsing", () => {
  describe("isValidCronExpression", () => {
    it("should accept valid cron expressions", () => {
      expect(isValidCronExpression("0 9 * * *")).toBe(true);
      expect(isValidCronExpression("30 14 * * 1")).toBe(true);
      expect(isValidCronExpression("0 0 1 * *")).toBe(true);
      expect(isValidCronExpression("0 0 1 1,4,7,10 *")).toBe(true);
      expect(isValidCronExpression("*/5 * * * *")).toBe(true);
    });

    it("should reject invalid cron expressions", () => {
      expect(isValidCronExpression("not-a-cron")).toBe(false);
      expect(isValidCronExpression("abc def ghi jkl mno")).toBe(false);
    });
  });

  describe("frequencyToCron", () => {
    it("should convert daily frequency to cron", () => {
      expect(frequencyToCron("daily", 9)).toBe("0 9 * * *");
      expect(frequencyToCron("daily", 0)).toBe("0 0 * * *");
      expect(frequencyToCron("daily", 23)).toBe("0 23 * * *");
    });

    it("should convert weekly frequency to cron", () => {
      expect(frequencyToCron("weekly", 9)).toBe("0 9 * * 1");
    });

    it("should convert monthly frequency to cron", () => {
      expect(frequencyToCron("monthly", 9)).toBe("0 9 1 * *");
    });

    it("should convert quarterly frequency to cron", () => {
      expect(frequencyToCron("quarterly", 9)).toBe("0 9 1 1,4,7,10 *");
    });

    it("should clamp time to valid range", () => {
      expect(frequencyToCron("daily", -1)).toBe("0 0 * * *");
      expect(frequencyToCron("daily", 24)).toBe("0 23 * * *");
      expect(frequencyToCron("daily", 100)).toBe("0 23 * * *");
    });
  });

  describe("computeNextRun", () => {
    it("should compute next run for daily cron", () => {
      const nextRun = computeNextRun("0 9 * * *", "UTC");
      expect(nextRun).toBeInstanceOf(Date);
      expect(nextRun!.getUTCHours()).toBe(9);
      expect(nextRun!.getUTCMinutes()).toBe(0);
    });

    it("should compute next run with timezone", () => {
      const nextRun = computeNextRun("0 9 * * *", "America/New_York");
      expect(nextRun).toBeInstanceOf(Date);
    });

    it("should return null for invalid cron", () => {
      const nextRun = computeNextRun("invalid", "UTC");
      expect(nextRun).toBeNull();
    });

    it("should return null for invalid timezone", () => {
      const nextRun = computeNextRun("0 9 * * *", "Invalid/Timezone");
      expect(nextRun).toBeNull();
    });
  });

  describe("computeNextRuns", () => {
    it("should return multiple next run times", () => {
      const nextRuns = computeNextRuns("0 9 * * *", "UTC", 3);
      expect(nextRuns).toHaveLength(3);
      expect(nextRuns[0]).toBeInstanceOf(Date);
      expect(nextRuns[1]).toBeInstanceOf(Date);
      expect(nextRuns[2]).toBeInstanceOf(Date);
    });

    it("should return runs in ascending order", () => {
      const nextRuns = computeNextRuns("0 9 * * *", "UTC", 3);
      expect(nextRuns[0].getTime()).toBeLessThan(nextRuns[1].getTime());
      expect(nextRuns[1].getTime()).toBeLessThan(nextRuns[2].getTime());
    });

    it("should return empty array for invalid cron", () => {
      const nextRuns = computeNextRuns("invalid", "UTC", 3);
      expect(nextRuns).toHaveLength(0);
    });

    it("should default to 3 runs", () => {
      const nextRuns = computeNextRuns("0 9 * * *", "UTC");
      expect(nextRuns).toHaveLength(3);
    });
  });
});
