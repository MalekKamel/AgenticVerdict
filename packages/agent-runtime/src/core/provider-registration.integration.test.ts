import { beforeEach, describe, expect, it } from "vitest";

import type { ProviderConfig } from "./BaseProvider";
import { ProviderFactory } from "./ProviderFactory";
import { ProviderRegistry } from "./ProviderRegistry";

describe("ProviderFactory default registration", () => {
  beforeEach(() => {
    ProviderRegistry.clear();
  });

  it("registers all required default providers", () => {
    ProviderFactory.registerDefaultProviders();

    expect(ProviderFactory.listProviders().sort()).toEqual([
      "anthropic",
      "bedrock",
      "google",
      "openai",
      "openai-compatible",
    ]);
  });

  it("creates runtime instances for each default provider", () => {
    ProviderFactory.registerDefaultProviders();

    const providerConfigs: Record<string, ProviderConfig> = {
      openai: { providerId: "openai", apiKey: "test-key" },
      anthropic: { providerId: "anthropic", apiKey: "test-key" },
      google: { providerId: "google", apiKey: "test-key" },
      bedrock: { providerId: "bedrock", region: "us-east-1" },
      "openai-compatible": {
        providerId: "openai-compatible",
        apiKey: "test-key",
        baseURL: "https://api.openai.com/v1",
        name: "OpenAI Compatible",
      },
    };

    for (const [providerId, config] of Object.entries(providerConfigs)) {
      const provider = ProviderFactory.create(providerId, config);
      expect(provider).toBeDefined();
      expect(typeof provider.chat).toBe("function");
    }
  });
});
