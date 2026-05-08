import { type ProviderConfig, type ProviderRuntime } from "./BaseProvider";
import { ProviderRegistry } from "./ProviderRegistry";
import { AnthropicProvider } from "../providers/anthropic";
import { BedrockProvider } from "../providers/bedrock";
import { GoogleProvider } from "../providers/google";
import { OpenAIProvider } from "../providers/openai";
import { OpenAICompatibleProvider } from "../providers/openai-compatible";

export class ProviderFactory {
  static register(
    providerId: string,
    providerClass: new (config: ProviderConfig) => ProviderRuntime,
  ): void {
    ProviderRegistry.register(providerId, providerClass);
  }

  static create(providerId: string, config: ProviderConfig): ProviderRuntime {
    return ProviderRegistry.create(providerId, config);
  }

  static listProviders(): string[] {
    return ProviderRegistry.listProviders();
  }

  static isRegistered(providerId: string): boolean {
    return ProviderRegistry.isRegistered(providerId);
  }

  static unregister(providerId: string): void {
    ProviderRegistry.unregister(providerId);
  }

  static registerDefaultProviders(): void {
    const defaultProviders: Array<{
      id: "openai" | "anthropic" | "google" | "bedrock" | "openai-compatible";
      providerClass: new (config: ProviderConfig) => ProviderRuntime;
    }> = [
      {
        id: "openai",
        providerClass: OpenAIProvider as unknown as new (config: ProviderConfig) => ProviderRuntime,
      },
      {
        id: "anthropic",
        providerClass: AnthropicProvider as unknown as new (
          config: ProviderConfig,
        ) => ProviderRuntime,
      },
      {
        id: "google",
        providerClass: GoogleProvider as unknown as new (config: ProviderConfig) => ProviderRuntime,
      },
      {
        id: "bedrock",
        providerClass: BedrockProvider as unknown as new (
          config: ProviderConfig,
        ) => ProviderRuntime,
      },
      {
        id: "openai-compatible",
        providerClass: OpenAICompatibleProvider as unknown as new (
          config: ProviderConfig,
        ) => ProviderRuntime,
      },
    ];

    for (const provider of defaultProviders) {
      if (!this.isRegistered(provider.id)) {
        this.register(provider.id, provider.providerClass);
      }
    }
  }
}
