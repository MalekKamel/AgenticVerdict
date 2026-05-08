import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { ProviderFactory } from "@agenticverdict/agent-runtime";
import { z } from "zod";

describe("Insight Router - Provider Validation", () => {
  beforeEach(() => {
    // Register default providers for tests
    ProviderFactory.registerDefaultProviders();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe("ProviderFactory validation", () => {
    it("lists all registered providers", () => {
      const providers = ProviderFactory.listProviders();

      expect(providers).toContain("anthropic");
      expect(providers).toContain("openai");
      expect(providers).toContain("google");
      expect(providers).toContain("bedrock");
      expect(providers).toContain("openai-compatible");
      expect(providers.length).toBeGreaterThanOrEqual(5);
    });

    it("checks if provider is registered", () => {
      expect(ProviderFactory.isRegistered("anthropic")).toBe(true);
      expect(ProviderFactory.isRegistered("openai")).toBe(true);
      expect(ProviderFactory.isRegistered("google")).toBe(true);
      expect(ProviderFactory.isRegistered("bedrock")).toBe(true);
      expect(ProviderFactory.isRegistered("openai-compatible")).toBe(true);
      expect(ProviderFactory.isRegistered("invalid-provider")).toBe(false);
      expect(ProviderFactory.isRegistered("")).toBe(false);
      expect(ProviderFactory.isRegistered("nonexistent")).toBe(false);
    });
  });

  describe("Schema validation", () => {
    it("accepts valid provider IDs in schema", () => {
      const providerIdSchema = z.string().min(1).max(64);

      // Valid providers should pass schema validation
      expect(() => providerIdSchema.parse("anthropic")).not.toThrow();
      expect(() => providerIdSchema.parse("openai")).not.toThrow();
      expect(() => providerIdSchema.parse("google")).not.toThrow();
      expect(() => providerIdSchema.parse("bedrock")).not.toThrow();
      expect(() => providerIdSchema.parse("openai-compatible")).not.toThrow();
    });

    it("rejects empty provider IDs in schema", () => {
      const providerIdSchema = z.string().min(1).max(64);

      expect(() => providerIdSchema.parse("")).toThrow();
    });

    it("rejects very long provider IDs in schema", () => {
      const providerIdSchema = z.string().min(1).max(64);

      expect(() => providerIdSchema.parse("a".repeat(65))).toThrow();
    });
  });

  describe("validateProvider helper function simulation", () => {
    /**
     * Simulates the validateProvider function from insights.ts
     * This tests the validation logic without needing full tRPC setup
     */
    function validateProvider(providerId?: string) {
      if (!providerId) {
        return; // Provider is optional, use default
      }

      if (!ProviderFactory.isRegistered(providerId)) {
        const availableProviders = ProviderFactory.listProviders();
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: `Provider "${providerId}" is not available. Available providers: ${availableProviders.join(", ")}`,
        });
      }
    }

    it("accepts valid registered providers", () => {
      expect(() => validateProvider("anthropic")).not.toThrow();
      expect(() => validateProvider("openai")).not.toThrow();
      expect(() => validateProvider("google")).not.toThrow();
      expect(() => validateProvider("bedrock")).not.toThrow();
      expect(() => validateProvider("openai-compatible")).not.toThrow();
    });

    it("accepts undefined provider (uses default)", () => {
      expect(() => validateProvider(undefined)).not.toThrow();
    });

    it("rejects unregistered provider with BAD_REQUEST error", () => {
      expect(() => validateProvider("invalid-provider")).toThrow(TRPCError);

      try {
        validateProvider("fake-provider");
        expect.fail("Should have thrown TRPCError");
      } catch (error) {
        expect(error).toBeInstanceOf(TRPCError);
        if (error instanceof TRPCError) {
          expect(error.code).toBe("BAD_REQUEST");
          expect(error.message).toContain("fake-provider");
          expect(error.message).toContain("not available");
        }
      }
    });

    it("rejects empty string provider", () => {
      // Empty string would be caught by schema validation first (min length 1)
      // But if it somehow gets through, runtime validation would also reject it
      expect(ProviderFactory.isRegistered("")).toBe(false);

      // Demonstrate that empty string is not a valid registered provider
      expect(() => {
        if (!ProviderFactory.isRegistered("")) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: 'Provider "" is not available',
          });
        }
      }).toThrow(TRPCError);
    });

    it("includes available providers in error message", () => {
      try {
        validateProvider("nonexistent");
        expect.fail("Should have thrown TRPCError");
      } catch (error) {
        if (error instanceof TRPCError) {
          expect(error.message).toContain("anthropic");
          expect(error.message).toContain("openai");
        }
      }
    });
  });

  describe("AI Config schema with dynamic provider", () => {
    it("accepts aiConfig with valid provider", () => {
      const providerIdSchema = z.string().min(1).max(64);
      const aiConfigSchema = z.object({
        model: z.string(),
        provider: providerIdSchema.optional(),
        detailLevel: z.enum(["executive", "standard", "comprehensive"]),
      });

      expect(() =>
        aiConfigSchema.parse({
          model: "claude-3-5-sonnet-20241022",
          provider: "anthropic",
          detailLevel: "standard",
        }),
      ).not.toThrow();
    });

    it("accepts aiConfig without provider (optional field)", () => {
      const providerIdSchema = z.string().min(1).max(64);
      const aiConfigSchema = z.object({
        model: z.string(),
        provider: providerIdSchema.optional(),
        detailLevel: z.enum(["executive", "standard", "comprehensive"]),
      });

      expect(() =>
        aiConfigSchema.parse({
          model: "claude-3-5-sonnet-20241022",
          detailLevel: "standard",
        }),
      ).not.toThrow();
    });

    it("accepts aiConfig with any new provider (schema flexibility)", () => {
      const providerIdSchema = z.string().min(1).max(64);
      const aiConfigSchema = z.object({
        model: z.string(),
        provider: providerIdSchema.optional(),
        detailLevel: z.enum(["executive", "standard", "comprehensive"]),
      });

      // Schema accepts any string provider (runtime validation handles registration check)
      expect(() =>
        aiConfigSchema.parse({
          model: "custom-model",
          provider: "future-provider",
          detailLevel: "standard",
        }),
      ).not.toThrow();
      // Note: Runtime validation would reject this if not registered
    });
  });

  describe("Provider registration dynamics", () => {
    it("validates against currently registered providers", () => {
      // Initially registered
      expect(ProviderFactory.isRegistered("anthropic")).toBe(true);

      // Schema accepts the string
      const providerIdSchema = z.string().min(1).max(64);
      expect(() => providerIdSchema.parse("anthropic")).not.toThrow();

      // Runtime validation passes
      expect(() => {
        if (!ProviderFactory.isRegistered("anthropic")) {
          throw new Error("Not registered");
        }
      }).not.toThrow();
    });

    it("would reject deregistered provider at runtime", () => {
      // This demonstrates the dynamic validation behavior
      const testProvider = "test-temp-provider";

      // Initially not registered
      expect(ProviderFactory.isRegistered(testProvider)).toBe(false);

      // If we tried to validate it, it would fail
      expect(() => {
        if (!ProviderFactory.isRegistered(testProvider)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Provider "${testProvider}" is not available`,
          });
        }
      }).toThrow(TRPCError);
    });
  });
});
