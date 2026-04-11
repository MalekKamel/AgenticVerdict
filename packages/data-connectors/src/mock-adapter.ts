import type { ConnectorType } from "@agenticverdict/types";

import { BaseConnectorAdapter, type BaseConnectorAdapterOptions } from "./adapter";
import type { ConnectorCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import { PlatformAuthError, PlatformError, type PlatformErrorCode } from "./errors";
import type { NormalizedMetricRecord, NormalizedConnectorSnapshot } from "./normalization";

export interface MockConnectorAdapterOptions extends BaseConnectorAdapterOptions {
  /** Simulated raw payload returned from fetch. */
  rawResponse?: unknown;
  /** If set, authenticate fails with this message. */
  authFailureMessage?: string;
  /** Optional override for normalized records (ignores rawResponse shape). */
  records?: NormalizedMetricRecord[];
  /** If set (after successful auth), {@link fetchRawMetrics} throws {@link PlatformError}. */
  fetchFailureMessage?: string;
  fetchFailureCode?: PlatformErrorCode;
}

/**
 * Deterministic adapter for unit tests and local demos (no network).
 */
export class MockConnectorAdapter extends BaseConnectorAdapter {
  readonly connector: ConnectorType;
  private credentials: ConnectorCredentials | null = null;
  private readonly rawResponse: unknown;
  private readonly authFailureMessage?: string;
  private readonly records?: NormalizedMetricRecord[];
  private readonly fetchFailureMessage?: string;
  private readonly fetchFailureCode: PlatformErrorCode;

  constructor(connector: ConnectorType, options: MockConnectorAdapterOptions) {
    const {
      rawResponse,
      authFailureMessage,
      records,
      fetchFailureMessage,
      fetchFailureCode,
      ...baseOptions
    } = options;
    super(connector, baseOptions);
    this.connector = connector;
    this.rawResponse = rawResponse ?? { mock: true, connector };
    this.authFailureMessage = authFailureMessage;
    this.records = records;
    this.fetchFailureMessage = fetchFailureMessage;
    this.fetchFailureCode = fetchFailureCode ?? "upstream_error";
  }

  protected async doAuthenticate(credentials: ConnectorCredentials): Promise<void> {
    if (this.authFailureMessage) {
      throw new PlatformAuthError(this.connector, this.authFailureMessage);
    }
    this.credentials = credentials;
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown> {
    void dateRange;
    if (!this.credentials) {
      throw new PlatformAuthError(this.connector, "authenticate() must be called first");
    }
    if (this.fetchFailureMessage) {
      throw new PlatformError(this.connector, this.fetchFailureCode, this.fetchFailureMessage);
    }
    return this.rawResponse;
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedConnectorSnapshot {
    if (this.records) {
      return { connector: this.connector, dateRange, records: [...this.records] };
    }
    const payload = rawData as { records?: NormalizedMetricRecord[] };
    return {
      connector: this.connector,
      dateRange,
      records: payload.records ?? [],
    };
  }
}
