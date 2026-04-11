import type { ConnectorType } from "@agenticverdict/types";

import type { ConnectorAdapter } from "./adapter";
import { PlatformError } from "./errors";

/**
 * Produces a fresh {@link ConnectorAdapter} for the given application context (for example tenant
 * credentials, cache handles, or rate limiters). Called on every {@link ConnectorAdapterRegistry.resolve}.
 */
export type AdapterFactory<TContext> = (context: TContext) => ConnectorAdapter;

/**
 * In-process registry of connector factories. Prefer this over static singleton adapters so each
 * resolution can inject tenant-scoped dependencies without importing `@agenticverdict/core`.
 */
export interface ConnectorAdapterRegistry<TContext = unknown> {
  /** Registers or replaces the factory for a connector id. */
  register(connector: ConnectorType, factory: AdapterFactory<TContext>): void;
  /**
   * Instantiates an adapter via the registered factory.
   *
   * @param context - Opaque context (e.g. tenant record); forwarded to the factory.
   */
  resolve(connector: ConnectorType, context: TContext): ConnectorAdapter;
  has(connector: ConnectorType): boolean;
  /** Lists connector ids that currently have factories. */
  connectors(): ConnectorType[];
}

/**
 * Creates an empty {@link ConnectorAdapterRegistry}.
 *
 * @typeParam TContext - Context type passed to {@link AdapterFactory} on each `resolve`.
 *
 * @example
 * ```ts
 * const registry = createAdapterRegistry<{ tenantId: string }>();
 * registry.register("ga4", (ctx) => new Ga4ConnectorAdapter({ tenantId: ctx.tenantId, ... }));
 * const adapter = registry.resolve("ga4", { tenantId: "…" });
 * ```
 */
export function createAdapterRegistry<TContext = unknown>(): ConnectorAdapterRegistry<TContext> {
  const factories = new Map<ConnectorType, AdapterFactory<TContext>>();

  return {
    register(connector, factory) {
      factories.set(connector, factory);
    },
    resolve(connector, context) {
      const factory = factories.get(connector);
      if (!factory) {
        throw new PlatformError(
          connector,
          "not_registered",
          `No adapter registered for connector "${connector}"`,
        );
      }
      return factory(context);
    },
    has(connector) {
      return factories.has(connector);
    },
    connectors() {
      return [...factories.keys()];
    },
  };
}
