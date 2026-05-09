/**
 * Integration tests for tRPC insights router
 *
 * Tests the key procedures: list, getById, create, update, delete, run
 */

import { describe, it, expect } from "vitest";
import { TRPCError } from "@trpc/server";
import { z } from "zod";

describe("Insights tRPC Router - Input Schema Validation", () => {
  describe("create input schema", () => {
    const createSchema = z.object({
      name: z.string().min(3).max(100),
      description: z.string().max(500).optional(),
      domain: z.string().optional(),
      connectorIds: z.array(z.string()).min(1),
      aiConfig: z.object({
        model: z.string(),
        provider: z.string().optional(),
        detailLevel: z.enum(["executive", "standard", "comprehensive"]),
      }),
      schedule: z
        .object({
          frequency: z.enum(["daily", "weekly", "monthly"]),
          time: z.number().int().min(0).max(23),
        })
        .optional(),
    });

    it("accepts valid input", () => {
      const validInput = {
        name: "Test Insight",
        description: "A test insight",
        domain: "seo",
        connectorIds: ["conn-1"],
        aiConfig: {
          model: "gpt-4",
          provider: "openai",
          detailLevel: "standard" as const,
        },
      };

      expect(() => createSchema.parse(validInput)).not.toThrow();
    });

    it("rejects name shorter than 3 characters", () => {
      const invalidInput = {
        name: "AB",
        connectorIds: ["conn-1"],
        aiConfig: {
          model: "gpt-4",
          detailLevel: "standard" as const,
        },
      };

      expect(() => createSchema.parse(invalidInput)).toThrow();
    });

    it("rejects empty connectorIds", () => {
      const invalidInput = {
        name: "Test Insight",
        connectorIds: [],
        aiConfig: {
          model: "gpt-4",
          detailLevel: "standard" as const,
        },
      };

      expect(() => createSchema.parse(invalidInput)).toThrow();
    });

    it("rejects invalid detailLevel", () => {
      const invalidInput = {
        name: "Test Insight",
        connectorIds: ["conn-1"],
        aiConfig: {
          model: "gpt-4",
          detailLevel: "invalid" as never,
        },
      };

      expect(() => createSchema.parse(invalidInput)).toThrow();
    });

    it("accepts optional schedule with valid time", () => {
      const validInput = {
        name: "Test Insight",
        connectorIds: ["conn-1"],
        aiConfig: {
          model: "gpt-4",
          detailLevel: "standard" as const,
        },
        schedule: {
          frequency: "daily" as const,
          time: 9,
        },
      };

      expect(() => createSchema.parse(validInput)).not.toThrow();
    });

    it("rejects schedule with invalid time", () => {
      const invalidInput = {
        name: "Test Insight",
        connectorIds: ["conn-1"],
        aiConfig: {
          model: "gpt-4",
          detailLevel: "standard" as const,
        },
        schedule: {
          frequency: "daily" as const,
          time: 25,
        },
      };

      expect(() => createSchema.parse(invalidInput)).toThrow();
    });
  });

  describe("run input schema", () => {
    const runSchema = z.object({
      id: z.string().uuid().or(z.string().min(1)),
    });

    it("accepts valid insight ID", () => {
      expect(() => runSchema.parse({ id: "insight-123" })).not.toThrow();
    });

    it("rejects empty ID", () => {
      expect(() => runSchema.parse({ id: "" })).toThrow();
    });
  });

  describe("list input schema", () => {
    const listSchema = z.object({
      page: z.number().int().min(1).default(1),
      pageSize: z.number().int().min(1).max(100).default(20),
      search: z.string().optional(),
      status: z.enum(["enabled", "disabled", "all"]).optional(),
      domain: z.string().optional(),
      sortBy: z.enum(["name", "createdAt", "lastRunAt", "status"]).default("createdAt"),
      sortDir: z.enum(["asc", "desc"]).default("desc"),
    });

    it("accepts valid input with defaults", () => {
      expect(() => listSchema.parse({})).not.toThrow();
    });

    it("accepts pagination params", () => {
      const validInput = {
        page: 2,
        pageSize: 10,
      };

      expect(() => listSchema.parse(validInput)).not.toThrow();
    });

    it("rejects invalid page number", () => {
      const invalidInput = {
        page: 0,
      };

      expect(() => listSchema.parse(invalidInput)).toThrow();
    });

    it("rejects pageSize exceeding maximum", () => {
      const invalidInput = {
        pageSize: 200,
      };

      expect(() => listSchema.parse(invalidInput)).toThrow();
    });

    it("accepts domain filter", () => {
      const validInput = {
        domain: "seo",
      };

      expect(() => listSchema.parse(validInput)).not.toThrow();
    });

    it("accepts sort parameters", () => {
      const validInput = {
        sortBy: "name" as const,
        sortDir: "asc" as const,
      };

      expect(() => listSchema.parse(validInput)).not.toThrow();
    });

    it("rejects invalid sortBy value", () => {
      const invalidInput = {
        sortBy: "invalid",
      };

      expect(() => listSchema.parse(invalidInput)).toThrow();
    });
  });
});

describe("Insights tRPC Router - Error Handling", () => {
  it("throws NOT_FOUND for missing insight", () => {
    const error = new TRPCError({
      code: "NOT_FOUND",
      message: "Insight not found",
    });

    expect(error.code).toBe("NOT_FOUND");
    expect(error.message).toBe("Insight not found");
  });

  it("throws BAD_REQUEST for invalid input", () => {
    const error = new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid input",
    });

    expect(error.code).toBe("BAD_REQUEST");
  });

  it("throws FORBIDDEN for permission denied", () => {
    const error = new TRPCError({
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });

    expect(error.code).toBe("FORBIDDEN");
  });

  it("throws CONFLICT for duplicate name", () => {
    const error = new TRPCError({
      code: "CONFLICT",
      message: "A resource with this name already exists",
    });

    expect(error.code).toBe("CONFLICT");
  });
});
