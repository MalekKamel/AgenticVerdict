import { CircuitBreaker, CircuitState } from "./circuitBreaker";

export interface ProviderHealth {
  providerId: string;
  isHealthy: boolean;
  lastChecked: Date;
  errorRate?: number;
  latencyMs?: number;
}

export interface FailoverChainConfig {
  /** Ordered list of provider IDs (primary, secondary, tertiary, ...) */
  providers: string[];
  /** Skip unhealthy providers automatically */
  skipUnhealthy?: boolean;
}

export interface FailoverEvent {
  tenantId: string;
  fromProvider: string;
  toProvider: string;
  error: Error;
  timestamp: Date;
  attemptNumber: number;
}

export interface FailoverHandlerOptions {
  tenantId: string;
  /** Circuit breaker options for each provider */
  circuitBreakerOptions?: Partial<ConstructorParameters<typeof CircuitBreaker>[0]>;
  /** Called when a failover occurs */
  onFailover?: (event: FailoverEvent) => void;
  /** Called to check provider health */
  healthChecker?: (providerId: string) => Promise<ProviderHealth>;
}

export class FailoverHandler {
  private readonly tenantId: string;
  private readonly circuitBreakers: Map<string, CircuitBreaker> = new Map();
  private readonly circuitBreakerOptions: Partial<ConstructorParameters<typeof CircuitBreaker>[0]>;
  private readonly onFailover?: (event: FailoverEvent) => void;
  private readonly healthChecker?: (providerId: string) => Promise<ProviderHealth>;
  private readonly providerHealthCache: Map<string, ProviderHealth> = new Map();
  private readonly healthCacheTTL: number = 30000;
  private readonly healthLastChecked: Map<string, number> = new Map();

  constructor(options: FailoverHandlerOptions) {
    this.tenantId = options.tenantId;
    this.circuitBreakerOptions = options.circuitBreakerOptions ?? {};
    this.onFailover = options.onFailover;
    this.healthChecker = options.healthChecker;
  }

  getCircuitBreaker(providerId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(providerId)) {
      const circuitBreaker = new CircuitBreaker({
        ...this.circuitBreakerOptions,
        providerId,
        tenantId: this.tenantId,
      });
      this.circuitBreakers.set(providerId, circuitBreaker);
    }
    return this.circuitBreakers.get(providerId)!;
  }

  async executeWithFailover<T>(
    chain: FailoverChainConfig,
    executor: (providerId: string) => Promise<T>,
  ): Promise<T> {
    const providersToTry = await this.getHealthyProviders(chain);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < providersToTry.length; attempt++) {
      const providerId = providersToTry[attempt];
      const circuitBreaker = this.getCircuitBreaker(providerId);

      try {
        return await circuitBreaker.execute(async () => {
          return executor(providerId);
        });
      } catch (error) {
        lastError = error as Error;

        if (attempt < providersToTry.length - 1) {
          const nextProvider = providersToTry[attempt + 1];
          await this.emitFailoverEvent(providerId, nextProvider, lastError, attempt + 1);
        }
      }
    }

    throw lastError ?? new Error("All providers in failover chain failed");
  }

  async executeWithHealthCheck<T>(
    chain: FailoverChainConfig,
    executor: (providerId: string) => Promise<T>,
  ): Promise<T> {
    const healthyProviders = await this.getHealthyProviders(chain);

    if (healthyProviders.length === 0) {
      throw new Error("No healthy providers available in failover chain");
    }

    return this.executeWithFailover({ ...chain, providers: healthyProviders }, executor);
  }

  async checkProviderHealth(providerId: string): Promise<ProviderHealth> {
    const now = Date.now();
    const lastChecked = this.healthLastChecked.get(providerId);

    if (lastChecked && now - lastChecked < this.healthCacheTTL) {
      const cached = this.providerHealthCache.get(providerId);
      if (cached) {
        return cached;
      }
    }

    if (!this.healthChecker) {
      const health: ProviderHealth = {
        providerId,
        isHealthy: true,
        lastChecked: new Date(),
      };
      this.providerHealthCache.set(providerId, health);
      this.healthLastChecked.set(providerId, now);
      return health;
    }

    const health = await this.healthChecker(providerId);
    this.providerHealthCache.set(providerId, health);
    this.healthLastChecked.set(providerId, now);
    return health;
  }

  async getHealthyProviders(chain: FailoverChainConfig): Promise<string[]> {
    if (!chain.skipUnhealthy || !this.healthChecker) {
      return chain.providers;
    }

    const healthyProviders: string[] = [];

    for (const providerId of chain.providers) {
      const circuitBreaker = this.getCircuitBreaker(providerId);

      if (circuitBreaker.isOpen()) {
        continue;
      }

      if (this.healthChecker) {
        const health = await this.checkProviderHealth(providerId);
        if (!health.isHealthy) {
          continue;
        }
      }

      healthyProviders.push(providerId);
    }

    return healthyProviders;
  }

  isProviderHealthy(providerId: string): boolean {
    const circuitBreaker = this.getCircuitBreaker(providerId);
    return !circuitBreaker.isOpen();
  }

  async refreshHealthCache(): Promise<void> {
    if (!this.healthChecker) {
      return;
    }

    const providerIds = Array.from(this.circuitBreakers.keys());
    await Promise.all(providerIds.map((providerId) => this.checkProviderHealth(providerId)));
  }

  clearHealthCache(): void {
    this.providerHealthCache.clear();
    this.healthLastChecked.clear();
  }

  resetCircuitBreaker(providerId: string): void {
    const circuitBreaker = this.getCircuitBreaker(providerId);
    circuitBreaker.reset();
  }

  resetAllCircuitBreakers(): void {
    this.circuitBreakers.forEach((cb) => cb.reset());
  }

  getCircuitBreakerState(providerId: string): CircuitState {
    const circuitBreaker = this.getCircuitBreaker(providerId);
    return circuitBreaker.getState();
  }

  private async emitFailoverEvent(
    fromProvider: string,
    toProvider: string,
    error: Error,
    attemptNumber: number,
  ): Promise<void> {
    const event: FailoverEvent = {
      tenantId: this.tenantId,
      fromProvider,
      toProvider,
      error,
      timestamp: new Date(),
      attemptNumber,
    };

    this.onFailover?.(event);
  }
}
