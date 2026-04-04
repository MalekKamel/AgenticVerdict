/**
 * Mutable controls for chaos / fault-injection scenarios against the mock gateway.
 */
export interface MockGatewayChaosState {
  /**
   * When > 0, the next matching Meta Graph GET returns HTTP 500 and this counter decrements.
   * Applies to paths under `graph.facebook.com` (excluding `/oauth/access_token` and `/me` when
   * `protectMetaAuthPaths` is true).
   */
  metaGraph500Remaining: number;
  /** When true, `/me` and `/oauth/access_token` still succeed while `metaGraph500Remaining` burns other calls. */
  protectMetaAuthPaths: boolean;
}

export function createDefaultChaosState(): MockGatewayChaosState {
  return {
    metaGraph500Remaining: 0,
    protectMetaAuthPaths: true,
  };
}
