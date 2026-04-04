import type { PlatformType } from "@agenticverdict/types";

import type { PlatformAdapter } from "./adapter";
import { PlatformError } from "./errors";

export type AdapterFactory<TContext> = (context: TContext) => PlatformAdapter;

export interface PlatformAdapterRegistry<TContext = unknown> {
  register(platform: PlatformType, factory: AdapterFactory<TContext>): void;
  resolve(platform: PlatformType, context: TContext): PlatformAdapter;
  has(platform: PlatformType): boolean;
  platforms(): PlatformType[];
}

export function createAdapterRegistry<TContext = unknown>(): PlatformAdapterRegistry<TContext> {
  const factories = new Map<PlatformType, AdapterFactory<TContext>>();

  return {
    register(platform, factory) {
      factories.set(platform, factory);
    },
    resolve(platform, context) {
      const factory = factories.get(platform);
      if (!factory) {
        throw new PlatformError(
          platform,
          "not_registered",
          `No adapter registered for platform "${platform}"`,
        );
      }
      return factory(context);
    },
    has(platform) {
      return factories.has(platform);
    },
    platforms() {
      return [...factories.keys()];
    },
  };
}
