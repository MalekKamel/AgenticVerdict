/**
 * Opaque credential bag for platform SDKs. Phase 1 adapters map encrypted DB rows here.
 */
export type ConnectorCredentials = Readonly<Record<string, string>>;
