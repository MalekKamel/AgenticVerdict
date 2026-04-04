import type { PlatformType } from "@agenticverdict/types";

import { BasePlatformAdapter, type BasePlatformAdapterOptions } from "./adapter";
import type { PlatformCredentials } from "./credentials";
import type { DateRangeIso } from "./date-range";
import { PlatformAuthError } from "./errors";
import type { NormalizedMetricRecord, NormalizedPlatformSnapshot } from "./normalization";

export interface MockPlatformAdapterOptions extends BasePlatformAdapterOptions {
  /** Simulated raw payload returned from fetch. */
  rawResponse?: unknown;
  /** If set, authenticate fails with this message. */
  authFailureMessage?: string;
  /** Optional override for normalized records (ignores rawResponse shape). */
  records?: NormalizedMetricRecord[];
}

/**
 * Deterministic adapter for unit tests and local demos (no network).
 */
export class MockPlatformAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType;
  private credentials: PlatformCredentials | null = null;
  private readonly rawResponse: unknown;
  private readonly authFailureMessage?: string;
  private readonly records?: NormalizedMetricRecord[];

  constructor(platform: PlatformType, options: MockPlatformAdapterOptions = {}) {
    const { rawResponse, authFailureMessage, records, ...baseOptions } = options;
    super(baseOptions);
    this.platform = platform;
    this.rawResponse = rawResponse ?? { mock: true, platform };
    this.authFailureMessage = authFailureMessage;
    this.records = records;
  }

  async authenticate(credentials: PlatformCredentials): Promise<void> {
    if (this.authFailureMessage) {
      throw new PlatformAuthError(this.platform, this.authFailureMessage);
    }
    this.credentials = credentials;
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<unknown> {
    void dateRange;
    if (!this.credentials) {
      throw new PlatformAuthError(this.platform, "authenticate() must be called first");
    }
    return this.rawResponse;
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot {
    if (this.records) {
      return { platform: this.platform, dateRange, records: [...this.records] };
    }
    const payload = rawData as { records?: NormalizedMetricRecord[] };
    return {
      platform: this.platform,
      dateRange,
      records: payload.records ?? [],
    };
  }
}
