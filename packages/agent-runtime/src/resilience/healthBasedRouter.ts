import { FailoverHandler, FailoverChainConfig, ProviderHealth } from "./failoverHandler";
import { CircuitState } from "./circuitBreaker";

export interface HealthBasedRouterOptions {
  tenantId: string;
  /** Default provider to use when no health issues */
  defaultProvider: string;
  /** Failover chains for each provider */
  failoverChains?: Record<string, FailoverChainConfig>;
  /** Health check function for providers */
  healthChecker?: (providerId: string) => Promise<ProviderHealth>;
  /** Called when failover occurs */
  onFailover?: (event: {
    tenantId: string;
    fromProvider: string;
    toProvider: string;
    error: Error;
    timestamp: Date;
  }) => void;
  /** Threshold for error rate to consider provider unhealthy (default: 0.1 = 10%) */
  errorRateThreshold?: number;
  /** Threshold for latency to consider provider unhealthy (default: 5000ms) */
  latencyThresholdMs?: number;
}

export interface RoutingDecision {
  providerId: string;
  reason: "default" | "failover" | "health-based";
  originalProvider?: string;
  error?: Error;
}

export class HealthBasedRouter {
  private readonly failoverHandler: FailoverHandler;
  private readonly defaultProvider: string;
  private readonly failoverChains: Record<string, FailoverChainConfig>;
  private readonly errorRateThreshold: number;
  private readonly latencyThresholdMs: number;
  private readonly tenantId: string;
  private routingHistory: RoutingDecision[] = [];
  private readonly maxHistorySize = 100;

  constructor(options: HealthBasedRouterOptions) {
    this.tenantId = options.tenantId;
    this.defaultProvider = options.defaultProvider;
    this.failoverChains = options.failoverChains ?? {};
    this.errorRateThreshold = options.errorRateThreshold ?? 0.1;
    this.latencyThresholdMs = options.latencyThresholdMs ?? 5000;

    this.failoverHandler = new FailoverHandler({
      tenantId: options.tenantId,
      healthChecker: options.healthChecker,
      onFailover: options.onFailover,
    });
  }

  async route<T>(executor: (providerId: string) => Promise<T>, providerId?: string): Promise<T> {
    const targetProvider = providerId ?? this.defaultProvider;
    const chain = this.failoverChains[targetProvider] ?? {
      providers: [targetProvider],
      skipUnhealthy: true,
    };

    try {
      const result = await this.failoverHandler.executeWithHealthCheck(chain, executor);

      this.recordRoutingDecision({
        providerId: targetProvider,
        reason: "default",
      });

      return result;
    } catch (error) {
      const healthyProviders = await this.failoverHandler.getHealthyProviders(chain);
      const fallbackProvider = healthyProviders.find((p) => p !== targetProvider);

      if (fallbackProvider) {
        this.recordRoutingDecision({
          providerId: fallbackProvider,
          reason: "health-based",
          originalProvider: targetProvider,
          error: error as Error,
        });

        return executor(fallbackProvider);
      }

      throw error;
    }
  }

  async routeWithFailover<T>(
    chain: FailoverChainConfig,
    executor: (providerId: string) => Promise<T>,
  ): Promise<T> {
    const result = await this.failoverHandler.executeWithFailover(chain, executor);

    this.recordRoutingDecision({
      providerId: chain.providers[0],
      reason: "failover",
    });

    return result;
  }

  async checkHealth(providerId: string): Promise<ProviderHealth> {
    return this.failoverHandler.checkProviderHealth(providerId);
  }

  isProviderHealthy(providerId: string): boolean {
    const circuitState = this.failoverHandler.getCircuitBreakerState(providerId);
    const isCircuitHealthy = circuitState !== CircuitState.OPEN;

    if (!isCircuitHealthy) {
      return false;
    }

    return this.failoverHandler.isProviderHealthy(providerId);
  }

  async getHealthyProviders(providerIds: string[]): Promise<string[]> {
    const healthy: string[] = [];

    for (const providerId of providerIds) {
      if (this.isProviderHealthy(providerId)) {
        healthy.push(providerId);
      }
    }

    return healthy;
  }

  async evaluateHealthFromMetrics(
    providerId: string,
    metrics: {
      errorRate: number;
      latencyMs: number;
    },
  ): Promise<boolean> {
    const isHealthy =
      metrics.errorRate < this.errorRateThreshold && metrics.latencyMs < this.latencyThresholdMs;

    return isHealthy;
  }

  getRoutingHistory(): RoutingDecision[] {
    return [...this.routingHistory];
  }

  clearRoutingHistory(): void {
    this.routingHistory = [];
  }

  resetProvider(providerId: string): void {
    this.failoverHandler.resetCircuitBreaker(providerId);
  }

  resetAll(): void {
    this.failoverHandler.resetAllCircuitBreakers();
    this.clearRoutingHistory();
  }

  refreshHealthCache(): Promise<void> {
    return this.failoverHandler.refreshHealthCache();
  }

  clearHealthCache(): void {
    this.failoverHandler.clearHealthCache();
  }

  private recordRoutingDecision(decision: RoutingDecision): void {
    this.routingHistory.push(decision);

    if (this.routingHistory.length > this.maxHistorySize) {
      this.routingHistory.shift();
    }
  }
}
