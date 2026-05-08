import {
  createTestTenantConfig,
  createTestTenantContext,
  TEST_TENANT_ALPHA,
} from "@agenticverdict/testing";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { runAgentJob } from "./agent-job";
import { AgentFactory } from "./agent-factory";
import type { TenantAIConfig } from "@agenticverdict/core/tenant/config-schema";
import { defaultTenantAIConfig } from "@agenticverdict/core/tenant/config-schema";
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

describe("AgentFactory - Provider Selection Logic", () => {
  let factory: AgentFactory;

  beforeEach(() => {
    factory = new AgentFactory({ llmEnv: {} });
    ProviderFactory.registerDefaultProviders();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    ProviderFactory.unregister("mock");
  });

  describe("selectProviderFromTenantConfig", () => {
    it("uses role-based model for analysis role when configured", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        roleBasedModels: {
          analysis: {
            providerId: "openai",
            modelId: "gpt-4o",
            displayName: "OpenAI GPT-4o",
          },
          insights: {
            providerId: "anthropic",
            modelId: "claude-3-5-sonnet-20241022",
          },
          reports: {
            providerId: "google",
            modelId: "gemini-1.5-pro",
          },
        },
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

      expect(selectedProvider).toBe("openai");
      expect(selectedModel).toBe("gpt-4o");
    });

    it("uses role-based model for insights role when configured", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        roleBasedModels: {
          insights: {
            providerId: "google",
            modelId: "gemini-1.5-pro",
          },
        },
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
        ).selectProviderFromTenantConfig("insights");
        selectedProvider = result.providerId;
        selectedModel = result.modelId;
      });

      expect(selectedProvider).toBe("google");
      expect(selectedModel).toBe("gemini-1.5-pro");
    });

    it("uses role-based model for verdict role when configured", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        roleBasedModels: {
          reports: {
            providerId: "bedrock",
            modelId: "anthropic.claude-3-5-sonnet-20241022-v1:0",
          },
        },
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
        ).selectProviderFromTenantConfig("verdict");
        selectedProvider = result.providerId;
        selectedModel = result.modelId;
      });

      expect(selectedProvider).toBe("bedrock");
      expect(selectedModel).toBe("anthropic.claude-3-5-sonnet-20241022-v1:0");
    });

    it("falls back to defaultModel when role-based model not configured", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        defaultModel: {
          providerId: "anthropic",
          modelId: "claude-3-opus-20240229",
        },
        roleBasedModels: undefined,
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

      expect(selectedProvider).toBe("anthropic");
      expect(selectedModel).toBe("claude-3-opus-20240229");
    });

    it("uses primaryProvider with default models when no defaultModel or roleBasedModels", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "openai",
        roleBasedModels: undefined,
        defaultModel: undefined,
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

      expect(selectedProvider).toBe("openai");
      expect(selectedModel).toBe("claude-3-5-sonnet-20241022");
    });

    it("uses different models for different roles when roleBasedModels configured", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
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

      const analysis = await getProviderForRole("analysis");
      const insights = await getProviderForRole("insights");
      const verdict = await getProviderForRole("verdict");

      expect(analysis.providerId).toBe("openai");
      expect(analysis.modelId).toBe("gpt-4o");

      expect(insights.providerId).toBe("anthropic");
      expect(insights.modelId).toBe("claude-3-5-sonnet-20241022");

      expect(verdict.providerId).toBe("google");
      expect(verdict.modelId).toBe("gemini-1.5-pro");
    });

    it("uses default tenant config when tenant has no AI config", async () => {
      const tenantConfig = createTestTenantConfig({ ai: undefined });
      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig,
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

      expect(selectedProvider).toBe(defaultTenantAIConfig.primaryProvider);
      expect(selectedModel).toBe(defaultTenantAIConfig.defaultModel?.modelId);
    });
  });

  describe("selectFallbackProvider", () => {
    it("returns null when failover is disabled", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        failover: {
          enabled: false,
          fallbackProviders: ["openai"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result).toBeNull();
    });

    it("returns null when no fallback providers configured", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
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

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result).toBeNull();
    });

    it("returns first fallback provider with model from roleBasedModels", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        failover: {
          enabled: true,
          fallbackProviders: ["google", "bedrock"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
        roleBasedModels: {
          analysis: { providerId: "google", modelId: "gemini-1.5-pro" },
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result?.fallbackProviderId).toBe("google");
      expect(result?.fallbackModelId).toBe("gemini-1.5-pro");
    });

    it("uses default model for fallback provider when not in roleBasedModels", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        failover: {
          enabled: true,
          fallbackProviders: ["openai"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
        roleBasedModels: {
          analysis: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result?.fallbackProviderId).toBe("openai");
      expect(result?.fallbackModelId).toBe("gpt-4o");
    });

    it("uses correct default model for google fallback provider", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        failover: {
          enabled: true,
          fallbackProviders: ["google"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result?.fallbackProviderId).toBe("google");
      expect(result?.fallbackModelId).toBe("gemini-1.5-pro");
    });

    it("uses correct default model for bedrock fallback provider", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        failover: {
          enabled: true,
          fallbackProviders: ["bedrock"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result?.fallbackProviderId).toBe("bedrock");
      expect(result?.fallbackModelId).toBe("claude-3-5-sonnet-20241022");
    });

    it("searches all roles to find model for fallback provider", async () => {
      const tenantConfig: TenantAIConfig = {
        ...defaultTenantAIConfig,
        failover: {
          enabled: true,
          fallbackProviders: ["google"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
        roleBasedModels: {
          analysis: { providerId: "openai", modelId: "gpt-4o" },
          insights: { providerId: "google", modelId: "gemini-1.5-pro" },
          reports: { providerId: "bedrock", modelId: "anthropic.claude-3-5-sonnet" },
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let result: FallbackProviderResult;
      await runAgentJob({ tenant }, async () => {
        result = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(result?.fallbackProviderId).toBe("google");
      expect(result?.fallbackModelId).toBe("gemini-1.5-pro");
    });
  });

  describe("createChatModels integration", () => {
    it("combines primary and fallback provider selection", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "anthropic",
        defaultModel: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        roleBasedModels: {
          analysis: { providerId: "anthropic", modelId: "claude-3-5-sonnet-20241022" },
        },
        failover: {
          enabled: true,
          fallbackProviders: ["openai"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let primary: ProviderSelectionResult;
      let fallback: FallbackProviderResult;

      await runAgentJob({ tenant }, async () => {
        primary = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("analysis");
        fallback = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(primary.providerId).toBe("anthropic");
      expect(primary.modelId).toBe("claude-3-5-sonnet-20241022");
      expect(fallback?.fallbackProviderId).toBe("openai");
      expect(fallback?.fallbackModelId).toBe("gpt-4o");
    });

    it("returns only primary when failover disabled", async () => {
      const tenantConfig: TenantAIConfig = {
        primaryProvider: "google",
        defaultModel: { providerId: "google", modelId: "gemini-1.5-pro" },
        failover: {
          enabled: false,
          fallbackProviders: ["openai"],
          providerTimeout: 30000,
          maxRetriesPerProvider: 3,
        },
      };

      const tenant = createTestTenantContext({
        tenantId: TEST_TENANT_ALPHA,
        tenantConfig: createTestTenantConfig({ ai: tenantConfig }),
      });

      let primary: ProviderSelectionResult;
      let fallback: FallbackProviderResult;

      await runAgentJob({ tenant }, async () => {
        primary = (
          factory as unknown as {
            selectProviderFromTenantConfig: (role: string) => ProviderSelectionResult;
          }
        ).selectProviderFromTenantConfig("analysis");
        fallback = (
          factory as unknown as { selectFallbackProvider: () => FallbackProviderResult }
        ).selectFallbackProvider();
      });

      expect(primary.providerId).toBe("google");
      expect(primary.modelId).toBe("gemini-1.5-pro");
      expect(fallback).toBeNull();
    });
  });
});
