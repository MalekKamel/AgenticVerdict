import { createPinoLogger } from "@agenticverdict/observability";
import { ProviderRegistry } from "./ProviderRegistry";
import {
  CircuitBreaker,
  type CircuitBreakerOptions as CircuitBreakerConfig,
} from "../resilience/circuitBreaker";

const log = createPinoLogger("agent-runtime");

/**
 * Error thrown when all providers in the failover chain have failed.
 */
export class ProviderFailoverExhaustedError extends Error {
  public readonly errors: Array<{ providerId: string; error: Error }>;

  constructor(errors: Array<{ providerId: string; error: Error }>) {
    super(`All providers failed. Attempted: ${errors.map((e) => e.providerId).join(", ")}`);
    this.name = "ProviderFailoverExhaustedError";
    this.errors = errors;
  }
}

/**
 * Determines if an error is retryable (should trigger failover).
 * Non-retryable errors (auth, validation) should fail immediately.
 */
export function isRetryableError(error: Error): boolean {
  const errorMessage = error.message.toLowerCase();
  const nonRetryablePatterns = [
    "authentication",
    "unauthorized",
    "forbidden",
    "invalid api key",
    "permission denied",
    "quota exceeded",
  ];

  // Rate limits are non-retryable in failover context (wait instead)
  if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
    return false;
  }

  // Auth errors are non-retryable
  if (nonRetryablePatterns.some((pattern) => errorMessage.includes(pattern))) {
    return false;
  }

  // Network errors, timeouts, server errors are retryable
  const retryablePatterns = [
    "timeout",
    "network",
    "connection",
    "econnrefused",
    "etimedout",
    "internal server error",
    "service unavailable",
    "bad gateway",
    "gateway timeout",
    "temporarily unavailable",
  ];

  return retryablePatterns.some((pattern) => errorMessage.includes(pattern));
}

/**
 * Circuit breaker configuration extended for failover.
 */
export interface FailoverCircuitBreakerOptions extends CircuitBreakerConfig {
  /** Tenant ID for context */
  tenantId?: string;
}

/**
 * Failover event for logging.
 */
export interface FailoverEvent {
  tenantId: string;
  primaryProvider: string;
  fallbackProvider?: string;
  error?: Error;
  eventType: "failover" | "circuit-open" | "circuit-closed" | "circuit-half-open";
  timestamp: Date;
}

/**
 * ProviderFailover handles sequential failover across providers with circuit breaker integration.
 *
 * Features:
 * - Sequential failover based on tenant-configured provider priority
 * - Circuit breaker integration to prevent cascading failures
 * - Tenant context preservation throughout failover
 * - Comprehensive failover event logging
 */
export class ProviderFailover {
  private static readonly circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Get or create a circuit breaker for a specific provider.
   * Circuit breakers are keyed by tenant:provider for proper isolation.
   */
  private static getCircuitBreaker(
    tenantId: string,
    providerId: string,
    options?: FailoverCircuitBreakerOptions,
  ): CircuitBreaker {
    const key = `tenant:${tenantId}:provider:${providerId}`;

    if (this.circuitBreakers.has(key)) {
      return this.circuitBreakers.get(key)!;
    }

    const breaker = new CircuitBreaker({
      failureThreshold: options?.failureThreshold ?? 5,
      resetTimeoutMs: options?.resetTimeoutMs ?? 60000,
      monitoringWindowMs: options?.monitoringWindowMs ?? 30000,
      providerId,
      tenantId,
    });

    // Log circuit breaker state changes
    breaker.on("stateChange", (event: { fromState: string; toState: string }) => {
      log.warn(
        {
          tenantId,
          providerId,
          fromState: event.fromState,
          toState: event.toState,
          event: "circuit-state-change",
        },
        "Circuit breaker state changed",
      );
    });

    this.circuitBreakers.set(key, breaker);
    return breaker;
  }

  /**
   * Execute a provider operation with failover support.
   *
   * @param tenantContext - Tenant context for configuration and logging
   * @param providerIds - Ordered list of providers to try (priority order)
   * @param operation - Async operation to execute with provider
   * @param options - Optional circuit breaker configuration
   * @returns Result from the first successful provider
   * @throws ProviderFailoverExhaustedError if all providers fail
   */
  static async executeWithFailover<T>(
    tenantContext: { tenantId: string },
    providerIds: string[],
    operation: (providerId: string) => Promise<T>,
    options?: FailoverCircuitBreakerOptions,
  ): Promise<T> {
    if (providerIds.length === 0) {
      throw new Error("At least one provider must be configured for failover");
    }

    const errors: Array<{ providerId: string; error: Error }> = [];

    for (let i = 0; i < providerIds.length; i++) {
      const providerId = providerIds[i];
      const isPrimary = i === 0;

      // Check if provider is registered
      if (!ProviderRegistry.isRegistered(providerId)) {
        log.warn(
          {
            tenantId: tenantContext.tenantId,
            providerId,
          },
          "Provider not registered, skipping",
        );
        continue;
      }

      // Get circuit breaker for this tenant+provider
      const breaker = this.getCircuitBreaker(tenantContext.tenantId, providerId, options);

      if (breaker.isOpen()) {
        log.warn(
          {
            tenantId: tenantContext.tenantId,
            providerId,
            event: "circuit-open",
          },
          "Circuit breaker open, skipping provider",
        );

        // If this is the primary and circuit is open, try fallback
        if (isPrimary && i < providerIds.length - 1) {
          continue;
        }

        throw new Error(`Circuit breaker open for provider: ${providerId}`);
      }

      try {
        // Execute operation with circuit breaker
        const result = await breaker.execute(() => operation(providerId));

        // Success - log if this was a failover (not primary)
        if (!isPrimary) {
          log.info(
            {
              tenantId: tenantContext.tenantId,
              primaryProvider: providerIds[0],
              fallbackProvider: providerId,
              event: "failover",
              timestamp: new Date(),
            },
            "Failover succeeded",
          );
        }

        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        errors.push({ providerId, error: err });

        log.warn(
          {
            tenantId: tenantContext.tenantId,
            providerId,
            error: err.message,
            isRetryable: isRetryableError(err),
          },
          "Provider failed",
        );

        // If non-retryable error, fail immediately without trying fallbacks
        if (!isRetryableError(err)) {
          log.error(
            {
              tenantId: tenantContext.tenantId,
              providerId,
              error: err.message,
            },
            "Non-retryable error, failing immediately",
          );
          throw err;
        }

        // If we have more providers to try, continue to next
        if (i < providerIds.length - 1) {
          log.info(
            {
              tenantId: tenantContext.tenantId,
              fromProvider: providerId,
              toProvider: providerIds[i + 1],
              event: "failover",
              timestamp: new Date(),
            },
            "Attempting failover",
          );
          continue;
        }

        // No more providers - exhaust failover
        log.error(
          {
            tenantId: tenantContext.tenantId,
            attemptedProviders: providerIds,
            errorCount: errors.length,
          },
          "All providers exhausted",
        );
        throw new ProviderFailoverExhaustedError(errors);
      }
    }

    // Should not reach here, but TypeScript needs it
    throw new ProviderFailoverExhaustedError(errors);
  }

  /**
   * Get circuit breaker status for a provider.
   */
  static getCircuitBreakerStatus(
    tenantId: string,
    providerId: string,
  ): {
    isOpen: boolean;
    isHalfOpen: boolean;
    isClosed: boolean;
    failureCount: number;
    state: string;
  } {
    const key = `tenant:${tenantId}:provider:${providerId}`;
    const breaker = this.circuitBreakers.get(key);

    if (!breaker) {
      return {
        isOpen: false,
        isHalfOpen: false,
        isClosed: true,
        failureCount: 0,
        state: "CLOSED",
      };
    }

    return {
      isOpen: breaker.isOpen(),
      isHalfOpen: breaker.isHalfOpen(),
      isClosed: breaker.isClosed(),
      failureCount: breaker.getFailureCount(),
      state: breaker.getState(),
    };
  }

  /**
   * Reset circuit breaker for a provider (admin operation).
   */
  static resetCircuitBreaker(tenantId: string, providerId: string): void {
    const key = `tenant:${tenantId}:provider:${providerId}`;
    const breaker = this.circuitBreakers.get(key);

    if (breaker) {
      breaker.reset();
      log.info(
        {
          tenantId,
          providerId,
        },
        "Circuit breaker manually reset",
      );
    }
  }

  /**
   * Clear all circuit breakers (useful for testing).
   */
  static clearAllCircuitBreakers(): void {
    for (const breaker of this.circuitBreakers.values()) {
      breaker.removeAllListeners();
    }
    this.circuitBreakers.clear();
    log.info("All circuit breakers cleared");
  }
}
