import { type ProviderConfig, type ProviderRuntime } from "./BaseProvider";
import { AgentRuntimeError, AgentRuntimeErrorCode } from "../errors/AgentRuntimeError";

export class ProviderRegistry {
  private static registry = new Map<string, new (config: ProviderConfig) => ProviderRuntime>();

  static register(
    providerId: string,
    providerClass: new (config: ProviderConfig) => ProviderRuntime,
  ): void {
    if (this.registry.has(providerId)) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_ALREADY_REGISTERED,
        message: `Provider "${providerId}" is already registered`,
        providerId,
      });
    }

    this.registry.set(providerId, providerClass);
  }

  static unregister(providerId: string): void {
    this.registry.delete(providerId);
  }

  static create(providerId: string, config: ProviderConfig): ProviderRuntime {
    const ProviderClass = this.registry.get(providerId);

    if (!ProviderClass) {
      throw new AgentRuntimeError({
        code: AgentRuntimeErrorCode.PROVIDER_NOT_FOUND,
        message: `Provider "${providerId}" not found. Available providers: ${this.listProviders().join(", ")}`,
        providerId,
      });
    }

    return new ProviderClass(config);
  }

  static listProviders(): string[] {
    return Array.from(this.registry.keys());
  }

  static isRegistered(providerId: string): boolean {
    return this.registry.has(providerId);
  }

  static clear(): void {
    this.registry.clear();
  }
}
