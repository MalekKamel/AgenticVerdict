import {
  createTestTenantConfig,
  createTestTenantContext,
  TEST_TENANT_ALPHA,
  TEST_TENANT_BETA,
} from "@agenticverdict/testing";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { runAgentJob } from "./agent-job";
import { AgentFactory } from "./agent-factory";
import type { TenantAIConfig } from "@agenticverdict/core/tenant/config-schema";
import { ProviderFactory } from "./core/ProviderFactory";
type ProviderSelectionResult = {
  providerId: string;
  modelId: string;
  fallbackProviderId?: string;
  fallbackModelId?: string;
};

type FallbackProviderResult = {
  fallbackProviderId?: string;
  fallbackModelId?: string;
} | null;

describe("AgentFactory - Provider Selection Integration Tests", () => {
  let factory: AgentFactory;

  beforeEach(() => {
    factory = new AgentFactory({ llmEnv: {} });
    ProviderFactory.registerDefaultProviders();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    ProviderFactory.unregister("mock");
  });

  describe("Multi-tenant provider isolation", () => {
    it("maintains separate provider configurations for different tenants", async () => {
      // Tenant Alpha uses OpenAI
      const tenantAlphaConfig: TenantAIConfig = {
        primaryProvider: "openai",
        defaultModel: { providerId: "openai", modelId: "gpt-4o" },
        roleBasedModels: {
          analysis: { providerId: "openai", modelId: "gpt-4o" },
        },
      };

      // Tenant Beta uses Anthropic
      const tenantBetaConfig: TenantAIConfig = {
        primaryProvider: "anthropic",
        defaultModel: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        roleBasedModels: {
          analysis: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        },
      };

      const tenantAlpha = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantAlphaConfig }),
      });

      const tenantBeta = createTestTenantContext({
        tenantId: TEST_TENANT_BETA,
        tenantConfig: createTestTenantConfig({ ai: tenantBetaConfig }),
      });

      let alphaProvider: string | undefined;
      let betaProvider: string | undefined;

      // Run concurrently to verify isolation
      await Promise.all([
        runAgentJob({ tenant: tenantAlpha }, async () => {
          const result = (
            factory as unknown as {
              selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
            }
          ).selectProviderFromTenantConfig("analysis");
          alphaProvider = result.providerId;
        }),
        runAgentJob({ tenant: tenantBeta }, async () => {
          const result = (
            factory as unknown as {
              selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
            }
          ).selectProviderFromTenantConfig("analysis");
          betaProvider = result.providerId;
        }),
      ]);

      expect(alphaProvider).toBe("openai");
      expect(betaProvider).toBe("anthropic");
    });

    it("respects tenant-specific failover configurations", async () => {
      // Tenant Alpha fails over to Google
      const tenantAlphaConfig: TenantAIConfig = {
        primaryProvider: "openai",
        defaultModel: { providerId: "openai", modelId: "gpt-4o" },
        failover: {
          enabled: true,
          fallbackProviders: ["google"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      // Tenant Beta fails over to Bedrock
      const tenantBetaConfig: TenantAIConfig = {
        primaryProvider: "anthropic",
        defaultModel: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        failover: {
          enabled: true,
          fallbackProviders: ["bedrock"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenantAlpha = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantAlphaConfig }),
      });

      const tenantBeta = createTestTenantContext({
        tenantId: TEST_TENANT_BETA,
        tenantConfig: createTestTenantConfig({ ai: tenantBetaConfig }),
      });

      let alphaFallback: FallbackProviderResult;
      let betaFallback: FallbackProviderResult;

      await Promise.all([
        runAgentJob({ tenant: tenantAlpha }, async () => {
          alphaFallback = (
            factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
          ).selectFallbackProvider();
        }),
        runAgentJob({ tenant: tenantBeta }, async () => {
          betaFallback = (
            factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
          ).selectFallbackProvider();
        }),
      ]);

      expect(alphaFallback?.fallbackProviderId).toBe("google");
      expect(betaFallback?.fallbackProviderId).toBe("bedrock");
    });
  });

  describe("Role-based provider selection", () => {
    it("selects different providers for different agent roles", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "openai",
        roleBasedModels: {
          analysis: { providerId: "openai", modelId: "gpt-4o" },
          insights: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
          reports: { providerId: "google", modelId: "gemini-1.5-pro" },
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      const getProviderForRole = async (role: "analysis" | "insights" | "verdict") => {
        let result: ProviderSelectionResult;
        await runAgentJob({ tenant }, async () => {
          result = (
            factory as unknown as {
              selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
            }
          ).selectProviderFromTenantConfig(role);
        });
        return result;
      };

      const analysisProvider = await getProviderForRole("analysis");
      const insightsProvider = await getProviderForRole("insights");
      const verdictProvider = await getProviderForRole("verdict");

      expect(analysisProvider.providerId).toBe("openai");
      expect(insightsProvider.providerId).toBe("anthropic");
      expect(verdictProvider.providerId).toBe("google");
    });

    it("uses primary provider when role-specific model not configured", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "anthropic",
        defaultModel: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        roleBasedModels: {
          // Only insights configured, analysis and verdict should use default
          insights: { providerId: "google", modelId: "gemini-1.5-pro" },
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let analysisResult: ProviderSelectionResult;
      let insightsResult: ProviderSelectionResult;
      let verdictResult: ProviderSelectionResult;

      await runAgentJob({ tenant }, async () => {
        analysisResult = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("analysis");
        insightsResult = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("insights");
        verdictResult = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("verdict");
      });

      // Analysis and verdict should use default model
      expect(analysisResult.providerId).toBe("anthropic");
      expect(analysisResult.modelId).toBe("claude-3-5-sonnet-20241022");

      // Insights should use role-specific configuration
      expect(insightsResult.providerId).toBe("google");
      expect(insightsResult.modelId).toBe("gemini-1.5-pro");

      expect(verdictResult.providerId).toBe("anthropic");
      expect(verdictResult.modelId).toBe("claude-3-5-sonnet-20241022");
    });
  });

  describe("Failover scenarios", () => {
    it("uses first fallback provider when multiple configured", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "openai",
        defaultModel: { providerId: "openai", modelId: "gpt-4o" },
        failover: {
          enabled: true,
          fallbackProviders: ["anthropic", "google", "bedrock"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let fallback: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        fallback = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      // Should use first fallback provider
      expect(fallback?.fallbackProviderId).toBe("anthropic");
    });

    it("handles disabled failover gracefully", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "openai",
        defaultModel: { providerId: "openai", modelId: "gpt-4o" },
        failover: {
          enabled: false,
          fallbackProviders: ["anthropic"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let fallback: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        fallback = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(fallback).toBeNull();
    });
  });

  describe("Provider selection with ProviderAgent integration", () => {
    it("creates agent with correct provider based on tenant config", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "google",
        defaultModel: { providerId: "google", modelId: "gemini-1.5-pro" },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let selectedProvider: string | undefined;
      let selectedModel: string | undefined;

      await runAgentJob({ tenant }, async () => {
        const result = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("analysis");
        selectedProvider = result.providerId;
        selectedModel = result.modelId;
      });

      expect(selectedProvider).toBe("google");
      expect(selectedModel).toBe("gemini-1.5-pro");

      // Verify we can create a test agent with these settings
      const agent = factory.createTestAgent(
        {
          name: "Test Agent",
          role: "analysis",
          systemMessage: "Test",
          memoryMode: "buffer",
        },
        undefined,
      );

      expect(agent).toBeDefined();
    });

    it("handles provider selection for test agents", async () => {
      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig(),
      });

      await runAgentJob({ tenant }, async () => {
        const agent = factory.createTestAgent(
          {
            name: "Test Agent",
            role: "analysis",
            systemMessage: "Test",
            memoryMode: "buffer",
          },
          undefined,
        );

        expect(agent).toBeDefined();
      });
    });
  });

  describe("Configuration edge cases", () => {
    it("handles empty roleBasedModels object", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "openai",
        defaultModel: { providerId: "openai", modelId: "gpt-4o" },
        roleBasedModels: {},
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: ProviderSelectionResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("analysis");
      });

      // Should fall back to default model
      expect(result.providerId).toBe("openai");
      expect(result.modelId).toBe("gpt-4o");
    });

    it("handles missing defaultModel with roleBasedModels", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "anthropic",
        roleBasedModels: {
          analysis: { providerId: "openai", modelId: "gpt-4o" },
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let analysisResult: ProviderSelectionResult;
      let insightsResult: ProviderSelectionResult;

      await runAgentJob({ tenant }, async () => {
        analysisResult = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("analysis");
        insightsResult = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("insights");
      });

      // Analysis should use role-based config
      expect(analysisResult.providerId).toBe("openai");
      expect(analysisResult.modelId).toBe("gpt-4o");

      // Insights should fall back to primary provider with default model
      expect(insightsResult.providerId).toBe("anthropic");
      expect(insightsResult.modelId).toBe("claude-3-5-sonnet-20241022");
    });

    it("handles failover with empty fallback list", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "openai",
        defaultModel: { providerId: "openai", modelId: "gpt-4o" },
        failover: {
          enabled: true,
          fallbackProviders: [],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let fallback: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        fallback = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(fallback).toBeNull();
    });
  });

  describe("Concurrent tenant requests", () => {
    it("handles 10+ concurrent tenant requests without context leakage", async () => {
      const tenants = Array.from({ length: 10 }, (_, i) => {
        const tenantConfig: TenantAIConfig = {
          primaryProvider: i % 2 === 0 ? "openai" : "anthropic",
          defaultModel: {
            providerId: i % 2 === 0 ? "openai" : "anthropic",
            modelId: i % 2 === 0 ? "gpt-4o" : "claude-3-5-sonnet-20241022",
          },
        };

        return createTestTenantContext({
          tenantId: `00000000-0000-0000-0000-00000000000${i}`,
          tenantConfig: createTestTenantConfig({
            tenantId: `00000000-0000-0000-0000-00000000000${i}`,
            ai: tenantConfig,
          }),
        });
      });

      const results = await Promise.all(
        tenants.map(async (tenant) => {
          let result: ProviderSelectionResult;
          await runAgentJob({ tenant }, async () => {
            result = (
              factory as unknown as {
                selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
              }
            ).selectProviderFromTenantConfig("analysis");
          });
          return { tenantId: tenant.tenantId, provider: result.providerId };
        }),
      );

      // Verify each tenant got their correct provider
      results.forEach((r) => {
        const tenantIndex = parseInt(r.tenantId.split("-")[4]);
        const expectedProvider = tenantIndex % 2 === 0 ? "openai" : "anthropic";
        expect(r.provider).toBe(expectedProvider);
      });
    });
  });
});
