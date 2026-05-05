import type { ProviderConfig, ProviderRuntime } from "./BaseProvider";
import { ProviderRegistry } from "./ProviderRegistry";

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
}
