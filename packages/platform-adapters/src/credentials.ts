/**
 * Opaque credential bag for platform SDKs. Phase 1 adapters map encrypted DB rows here.
 */
export type PlatformCredentials = Readonly<Record<string, string>>;
