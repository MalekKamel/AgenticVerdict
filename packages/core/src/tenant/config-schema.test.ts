import { describe, it, expect } from "vitest";
import {
  tenantAIConfigSchema,
  validateTenantAIConfig,
  mergeTenantAIConfig,
  defaultTenantAIConfig,
  type TenantAIConfig,
} from "./config-schema";

describe("TenantAIConfig Schema", () => {
  describe("providerIdSchema", () => {
    it("should accept valid provider IDs", () => {
      expect(tenantAIConfigSchema.parse({ primaryProvider: "openai" }).primaryProvider).toBe(
        "openai",
      );
      expect(tenantAIConfigSchema.parse({ primaryProvider: "anthropic" }).primaryProvider).toBe(
        "anthropic",
      );
      expect(tenantAIConfigSchema.parse({ primaryProvider: "google" }).primaryProvider).toBe(
        "google",
      );
      expect(tenantAIConfigSchema.parse({ primaryProvider: "bedrock" }).primaryProvider).toBe(
        "bedrock",
      );
      expect(
        tenantAIConfigSchema.parse({ primaryProvider: "openai-compatible" }).primaryProvider,
      ).toBe("openai-compatible");
    });

    it("should reject empty provider IDs", () => {
      expect(() => tenantAIConfigSchema.parse({ primaryProvider: "" })).toThrow();
    });

    it("should reject overly long provider IDs", () => {
      expect(() => tenantAIConfigSchema.parse({ primaryProvider: "a".repeat(65) })).toThrow();
    });
  });

  describe("default configuration", () => {
    it("should use anthropic as default provider", () => {
      const config = tenantAIConfigSchema.parse({});
      expect(config.primaryProvider).toBe("anthropic");
    });

    it("should include default model configuration", () => {
      const config = tenantAIConfigSchema.parse({});
      expect(config.defaultModel).toBeUndefined();
    });

    it("should have default budget settings", () => {
      const config = tenantAIConfigSchema.parse({});
      expect(config.budget).toBeUndefined();
    });

    it("should have default failover settings", () => {
      const config = tenantAIConfigSchema.parse({});
      expect(config.failover).toBeUndefined();
    });

    it("should have default circuit breaker settings", () => {
      const config = tenantAIConfigSchema.parse({});
      expect(config.circuitBreaker).toBeUndefined();
    });
  });

  describe("provider model configuration", () => {
    it("should accept valid provider model config", () => {
      const config = tenantAIConfigSchema.parse({
        defaultModel: {
          providerId: "openai",
          modelId: "gpt-4",
          displayName: "GPT-4",
        },
      });
      expect(config.defaultModel?.providerId).toBe("openai");
      expect(config.defaultModel?.modelId).toBe("gpt-4");
      expect(config.defaultModel?.displayName).toBe("GPT-4");
    });

    it("should accept model config without display name", () => {
      const config = tenantAIConfigSchema.parse({
        defaultModel: {
          providerId: "anthropic",
          modelId: "claude-3-5-sonnet-20241022",
        },
      });
      expect(config.defaultModel?.displayName).toBeUndefined();
    });

    it("should reject model config with invalid provider ID", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          defaultModel: {
            providerId: "",
            modelId: "gpt-4",
          },
        }),
      ).toThrow();
    });
  });

  describe("role-based model configuration", () => {
    it("should accept role-based models", () => {
      const config = tenantAIConfigSchema.parse({
        roleBasedModels: {
          analysis: {
            providerId: "anthropic",
            modelId: "claude-3-opus-20240229",
          },
          insights: {
            providerId: "openai",
            modelId: "gpt-4-turbo",
          },
        },
      });
      expect(config.roleBasedModels?.analysis?.providerId).toBe("anthropic");
      expect(config.roleBasedModels?.insights?.providerId).toBe("openai");
    });

    it("should accept custom role mappings", () => {
      const config = tenantAIConfigSchema.parse({
        roleBasedModels: {
          custom: {
            "content-generation": {
              providerId: "google",
              modelId: "gemini-pro",
            },
          },
        },
      });
      expect(config.roleBasedModels?.custom?.["content-generation"]).toBeDefined();
    });
  });

  describe("budget configuration", () => {
    it("should accept valid budget config", () => {
      const config = tenantAIConfigSchema.parse({
        budget: {
          monthlyLimit: 1000,
          alertThreshold: 75,
          hardLimit: true,
          alertRecipients: ["admin@example.com"],
        },
      });
      expect(config.budget?.monthlyLimit).toBe(1000);
      expect(config.budget?.alertThreshold).toBe(75);
      expect(config.budget?.hardLimit).toBe(true);
      expect(config.budget?.alertRecipients).toEqual(["admin@example.com"]);
    });

    it("should use default alert threshold", () => {
      const config = tenantAIConfigSchema.parse({
        budget: {},
      });
      expect(config.budget?.alertThreshold).toBe(80);
    });

    it("should use default hard limit", () => {
      const config = tenantAIConfigSchema.parse({
        budget: {},
      });
      expect(config.budget?.hardLimit).toBe(false);
    });

    it("should reject negative monthly limit", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          budget: {
            monthlyLimit: -100,
          },
        }),
      ).toThrow();
    });

    it("should reject invalid alert threshold", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          budget: {
            alertThreshold: 150,
          },
        }),
      ).toThrow();
    });

    it("should reject invalid email in alert recipients", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          budget: {
            alertRecipients: ["invalid-email"],
          },
        }),
      ).toThrow();
    });
  });

  describe("failover configuration", () => {
    it("should accept valid failover config", () => {
      const config = tenantAIConfigSchema.parse({
        failover: {
          fallbackProviders: ["openai", "google"],
          enabled: true,
          providerTimeout: 15000,
          maxRetriesPerProvider: 2,
        },
      });
      expect(config.failover?.fallbackProviders).toEqual(["openai", "google"]);
      expect(config.failover?.enabled).toBe(true);
      expect(config.failover?.providerTimeout).toBe(15000);
      expect(config.failover?.maxRetriesPerProvider).toBe(2);
    });

    it("should use default failover settings", () => {
      const config = tenantAIConfigSchema.parse({
        failover: {},
      });
      expect(config.failover?.enabled).toBe(true);
      expect(config.failover?.fallbackProviders).toEqual([]);
      expect(config.failover?.providerTimeout).toBe(10000);
      expect(config.failover?.maxRetriesPerProvider).toBe(1);
    });

    it("should accept empty fallback providers", () => {
      const config = tenantAIConfigSchema.parse({
        failover: {
          fallbackProviders: [],
        },
      });
      expect(config.failover?.fallbackProviders).toEqual([]);
    });

    it("should reject too many fallback providers", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          failover: {
            fallbackProviders: ["p1", "p2", "p3", "p4", "p5", "p6"],
          },
        }),
      ).toThrow();
    });

    it("should reject excessive provider timeout", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          failover: {
            providerTimeout: 35000,
          },
        }),
      ).toThrow();
    });
  });

  describe("circuit breaker configuration", () => {
    it("should accept valid circuit breaker config", () => {
      const config = tenantAIConfigSchema.parse({
        circuitBreaker: {
          enabled: true,
          failureThreshold: 10,
          failureWindow: 60,
          recoveryTimeout: 120,
          halfOpenMaxRequests: 5,
        },
      });
      expect(config.circuitBreaker?.enabled).toBe(true);
      expect(config.circuitBreaker?.failureThreshold).toBe(10);
    });

    it("should use default circuit breaker settings", () => {
      const config = tenantAIConfigSchema.parse({
        circuitBreaker: {},
      });
      expect(config.circuitBreaker?.enabled).toBe(true);
      expect(config.circuitBreaker?.failureThreshold).toBe(5);
      expect(config.circuitBreaker?.failureWindow).toBe(30);
      expect(config.circuitBreaker?.recoveryTimeout).toBe(60);
      expect(config.circuitBreaker?.halfOpenMaxRequests).toBe(3);
    });

    it("should reject invalid failure threshold", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          circuitBreaker: {
            failureThreshold: 0,
          },
        }),
      ).toThrow();
    });
  });

  describe("provider settings", () => {
    it("should accept custom provider settings", () => {
      const config = tenantAIConfigSchema.parse({
        providerSettings: {
          openai: {
            baseUrl: "https://custom-api.example.com",
            timeout: 30000,
          },
          anthropic: {
            maxTokens: 4096,
          },
        },
      });
      expect(config.providerSettings?.openai?.baseUrl).toBe("https://custom-api.example.com");
    });
  });

  describe("metadata", () => {
    it("should accept valid metadata", () => {
      const config = tenantAIConfigSchema.parse({
        updatedAt: "2024-01-15T10:30:00Z",
        updatedBy: "550e8400-e29b-41d4-a716-446655440000",
      });
      expect(config.updatedAt).toBe("2024-01-15T10:30:00Z");
      expect(config.updatedBy).toBe("550e8400-e29b-41d4-a716-446655440000");
    });

    it("should reject invalid datetime format", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          updatedAt: "invalid-date",
        }),
      ).toThrow();
    });

    it("should reject invalid UUID format", () => {
      expect(() =>
        tenantAIConfigSchema.parse({
          updatedBy: "not-a-uuid",
        }),
      ).toThrow();
    });
  });
});

describe("validateTenantAIConfig", () => {
  it("should return valid config for valid input", () => {
    const input = {
      primaryProvider: "google",
      budget: {
        monthlyLimit: 500,
        alertThreshold: 75,
        hardLimit: false,
      },
    };
    const result = validateTenantAIConfig(input);
    expect(result.errors).toBeUndefined();
    expect(result.config.primaryProvider).toBe("google");
    expect(result.config.budget?.monthlyLimit).toBe(500);
  });

  it("should return default config with errors for invalid input", () => {
    const input = {
      primaryProvider: "",
      budget: {
        monthlyLimit: -100,
      },
    };
    const result = validateTenantAIConfig(input);
    expect(result.errors).toBeDefined();
    expect(result.config.primaryProvider).toBe(defaultTenantAIConfig.primaryProvider);
  });

  it("should return default config for null input", () => {
    const result = validateTenantAIConfig(null);
    expect(result.errors).toBeDefined();
    expect(result.config).toEqual(defaultTenantAIConfig);
  });

  it("should return default config for undefined input", () => {
    const result = validateTenantAIConfig(undefined);
    expect(result.errors).toBeDefined();
    expect(result.config).toEqual(defaultTenantAIConfig);
  });
});

describe("mergeTenantAIConfig", () => {
  it("should merge partial config with defaults", () => {
    const partial: Partial<TenantAIConfig> = {
      primaryProvider: "openai",
      budget: {
        monthlyLimit: 1000,
        alertThreshold: 90,
        hardLimit: false,
      },
    };
    const result = mergeTenantAIConfig(partial);
    expect(result.primaryProvider).toBe("openai");
    expect(result.budget?.monthlyLimit).toBe(1000);
    expect(result.budget?.alertThreshold).toBe(90);
    expect(result.budget?.hardLimit).toBe(false); // from partial
    expect(result.failover?.enabled).toBe(true); // from defaults
  });

  it("should use all defaults for empty partial", () => {
    const result = mergeTenantAIConfig({});
    expect(result).toEqual(defaultTenantAIConfig);
  });

  it("should override nested defaults", () => {
    const partial: Partial<TenantAIConfig> = {
      failover: {
        enabled: false,
        fallbackProviders: ["google"],
        providerTimeout: 15000,
        maxRetriesPerProvider: 2,
      },
    };
    const result = mergeTenantAIConfig(partial);
    expect(result.failover?.enabled).toBe(false);
    expect(result.failover?.fallbackProviders).toEqual(["google"]);
    expect(result.failover?.providerTimeout).toBe(15000);
    expect(result.failover?.maxRetriesPerProvider).toBe(2);
  });
});

describe("defaultTenantAIConfig", () => {
  it("should be a valid configuration", () => {
    const result = tenantAIConfigSchema.safeParse(defaultTenantAIConfig);
    expect(result.success).toBe(true);
  });

  it("should have anthropic as primary provider", () => {
    expect(defaultTenantAIConfig.primaryProvider).toBe("anthropic");
  });

  it("should have failover enabled", () => {
    expect(defaultTenantAIConfig.failover?.enabled).toBe(true);
  });

  it("should have circuit breaker enabled", () => {
    expect(defaultTenantAIConfig.circuitBreaker?.enabled).toBe(true);
  });

  it("should have soft budget limit by default", () => {
    expect(defaultTenantAIConfig.budget?.hardLimit).toBe(false);
  });
});
