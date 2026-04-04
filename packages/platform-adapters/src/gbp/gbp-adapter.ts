import type { PlatformType } from "@agenticverdict/types";

import { BasePlatformAdapter, type BasePlatformAdapterOptions } from "../adapter";
import type { PlatformCredentials } from "../credentials";
import type { DateRangeIso } from "../date-range";
import { PlatformAuthError, PlatformError } from "../errors";
import {
  refreshGoogleAccessTokenForPlatform,
  validateGoogleAccessTokenForPlatform,
} from "../google/oauth";
import type { NormalizedPlatformSnapshot } from "../normalization";
import { createPlatformTokenBucket } from "../platform-rate-config";
import type { TokenBucket } from "../token-bucket";
import {
  gbpFetchPerformanceForLocation,
  gbpListAllAccounts,
  gbpListAllLocationsForAccount,
  gbpListReviewsForLocation,
  locationIdFromResourceName,
  type GbpRequestOptions,
} from "./api-client";
import type { GbpAccount, GbpLocationBundle, GbpRawMetricsPayload } from "./models";
import { normalizeGbpRawMetrics } from "./transformers";

export const gbpCredentialKeys = {
  accessToken: "accessToken",
  refreshToken: "refreshToken",
  clientId: "clientId",
  clientSecret: "clientSecret",
  /** Optional `accounts/{id}` to scope listing (multi-account tenants). */
  accountResourceName: "accountResourceName",
} as const;

export interface GbpPlatformAdapterOptions extends BasePlatformAdapterOptions {
  fetchImpl?: typeof fetch;
  /** Defaults to {@link createPlatformTokenBucket}("gbp"). */
  requestTokenBucket?: TokenBucket | null;
  /** Stop after N locations (useful for tests and large chains). */
  maxLocations?: number;
}

export class GbpPlatformAdapter extends BasePlatformAdapter {
  readonly platform: PlatformType = "gbp";

  private accessToken: string | null = null;
  private accountFilter: string | null = null;
  private readonly fetchImpl: typeof fetch;
  private readonly perRequestBucket: TokenBucket | null;
  private readonly maxLocations: number | null;

  constructor(options: GbpPlatformAdapterOptions) {
    const { fetchImpl, requestTokenBucket, maxLocations, ...baseRest } = options;
    super("gbp", { ...baseRest, tokenBucket: null });
    this.fetchImpl = fetchImpl ?? globalThis.fetch.bind(globalThis);
    this.perRequestBucket =
      requestTokenBucket !== undefined ? requestTokenBucket : createPlatformTokenBucket("gbp");
    this.maxLocations =
      typeof maxLocations === "number" && maxLocations > 0 ? Math.floor(maxLocations) : null;
  }

  private gbpOpts(): GbpRequestOptions {
    if (!this.accessToken) {
      throw new PlatformAuthError("gbp", "authenticate() must be called first");
    }
    return {
      accessToken: this.accessToken,
      fetchImpl: this.fetchImpl,
      beforeRequest: async () => {
        if (this.perRequestBucket) {
          await this.perRequestBucket.consume();
        }
      },
    };
  }

  protected async doAuthenticate(credentials: PlatformCredentials): Promise<void> {
    const rawAccount = credentials[gbpCredentialKeys.accountResourceName];
    this.accountFilter =
      typeof rawAccount === "string" && rawAccount.trim().length > 0 ? rawAccount.trim() : null;

    const clientId =
      typeof credentials[gbpCredentialKeys.clientId] === "string"
        ? credentials[gbpCredentialKeys.clientId].trim()
        : "";
    const clientSecret =
      typeof credentials[gbpCredentialKeys.clientSecret] === "string"
        ? credentials[gbpCredentialKeys.clientSecret].trim()
        : "";
    const refreshToken =
      typeof credentials[gbpCredentialKeys.refreshToken] === "string"
        ? credentials[gbpCredentialKeys.refreshToken].trim()
        : "";

    let accessToken =
      typeof credentials[gbpCredentialKeys.accessToken] === "string"
        ? credentials[gbpCredentialKeys.accessToken].trim()
        : "";

    if (clientId.length > 0 && clientSecret.length > 0 && refreshToken.length > 0) {
      const refreshed = await refreshGoogleAccessTokenForPlatform({
        platform: "gbp",
        clientId,
        clientSecret,
        refreshToken,
        fetchImpl: this.fetchImpl,
      });
      accessToken = refreshed.accessToken;
    }

    if (accessToken.length === 0) {
      throw new PlatformAuthError(
        "gbp",
        "accessToken is required unless clientId, clientSecret, and refreshToken are provided",
      );
    }

    await validateGoogleAccessTokenForPlatform("gbp", accessToken, this.fetchImpl);
    this.accessToken = accessToken;
  }

  protected async fetchRawMetrics(dateRange: DateRangeIso): Promise<GbpRawMetricsPayload> {
    const opts = this.gbpOpts();
    let accounts = await gbpListAllAccounts(opts);

    if (this.accountFilter) {
      accounts = accounts.filter((a) => a.name === this.accountFilter);
      if (accounts.length === 0) {
        throw new PlatformError(
          "gbp",
          "not_found",
          `No account matched accountResourceName "${this.accountFilter}"`,
        );
      }
    }

    const bundles: GbpLocationBundle[] = [];
    const keptAccounts: GbpAccount[] = [];

    outer: for (const acc of accounts) {
      if (!acc.name) {
        continue;
      }
      keptAccounts.push(acc);
      const locs = await gbpListAllLocationsForAccount(acc.name, opts);
      for (const loc of locs) {
        if (!loc.name) {
          continue;
        }
        if (this.maxLocations !== null && bundles.length >= this.maxLocations) {
          break outer;
        }

        let reviews: GbpLocationBundle["reviews"] = null;
        try {
          reviews = await gbpListReviewsForLocation(loc.name, opts);
        } catch {
          reviews = null;
        }

        let performance: GbpLocationBundle["performance"] = null;
        let performanceError: string | undefined;
        const locId = locationIdFromResourceName(loc.name);
        if (locId) {
          try {
            performance = await gbpFetchPerformanceForLocation(
              locId,
              dateRange.startInclusive,
              dateRange.endInclusive,
              opts,
            );
          } catch (e) {
            performanceError = e instanceof Error ? e.message : String(e);
          }
        }

        bundles.push({
          accountName: acc.name,
          location: loc,
          reviews,
          performance,
          performanceError,
        });
      }
    }

    return {
      fetchedAt: new Date().toISOString(),
      requestedRange: dateRange,
      accounts: keptAccounts,
      locations: bundles,
    };
  }

  normalizeData(rawData: unknown, dateRange: DateRangeIso): NormalizedPlatformSnapshot {
    return normalizeGbpRawMetrics(rawData, dateRange);
  }
}
