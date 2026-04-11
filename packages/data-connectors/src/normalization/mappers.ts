/**
 * Static FX table for tests and offline normalization. Production callers should inject
 * refreshed rates via {@link applySpendCurrencyConversion}.
 */
export const DEFAULT_FX_RATES_TO_USD: Readonly<Record<string, number>> = {
  USD: 1,
  EUR: 1.08,
  GBP: 1.27,
  SAR: 0.267,
};

function normalizeCurrencyCode(raw: string): string {
  return raw.trim().toUpperCase();
}

/**
 * Converts an amount expressed in `fromCurrency` into USD using `rates[fromCurrency]`
 * as “units of USD per 1 unit of foreign currency” (e.g. 1 EUR → 1.08 USD).
 */
export function convertAmountToUsd(
  amount: number,
  fromCurrency: string,
  rates: Readonly<Record<string, number>> = DEFAULT_FX_RATES_TO_USD,
): number {
  const code = normalizeCurrencyCode(fromCurrency);
  const rate = rates[code];
  if (rate === undefined || !Number.isFinite(rate) || rate <= 0) {
    return amount;
  }
  return amount * rate;
}

function trimCollapse(s: string): string {
  return s.trim().replace(/\s+/g, " ");
}

/**
 * Normalizes dimension map keys (lower snake) and trims / collapses whitespace in values.
 */
export function standardizeDimensions(
  dimensions: Readonly<Record<string, string>> | undefined,
): Record<string, string> | undefined {
  if (dimensions === undefined) {
    return undefined;
  }
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(dimensions)) {
    const key = trimCollapse(k).toLowerCase().replace(/\s+/g, "_").replace(/_{2,}/g, "_");
    if (!key) {
      continue;
    }
    out[key] = trimCollapse(v);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

const COUNT_LIKE_SUFFIX_RE =
  /\.(impressions|clicks|reach|conversions|eventcount|activeusers|sessions|totalusers)$/i;

/**
 * Rounds non-negative “count-like” metrics to whole numbers. Leaves other metrics unchanged.
 */
export function normalizeCardinalityMetricValue(metricKey: string, value: number): number {
  if (!COUNT_LIKE_SUFFIX_RE.test(metricKey)) {
    return value;
  }
  if (!Number.isFinite(value)) {
    return value;
  }
  return Math.round(Math.max(0, value));
}

export interface SpendCurrencyConversionOptions {
  readonly rates?: Readonly<Record<string, number>>;
  /** Used when a record has no `dimensions.currency`. */
  readonly defaultCurrency?: string;
}

const SPEND_KEY_RE = /\.(spend|cost)$/i;

function readCurrencyFromDimensions(
  dimensions: Readonly<Record<string, string>> | undefined,
  fallback: string,
): string {
  if (!dimensions) {
    return fallback;
  }
  const direct = dimensions.currency ?? dimensions.Currency ?? dimensions.account_currency;
  if (typeof direct === "string" && direct.trim().length > 0) {
    return direct;
  }
  return fallback;
}

/**
 * Returns a shallow-cloned record array with spend-like metric values converted to USD.
 */
export function applySpendCurrencyConversion<
  T extends { metricKey: string; value: number; dimensions?: Readonly<Record<string, string>> },
>(records: readonly T[], options: SpendCurrencyConversionOptions = {}): T[] {
  const rates = options.rates ?? DEFAULT_FX_RATES_TO_USD;
  const defaultCurrency = normalizeCurrencyCode(options.defaultCurrency ?? "USD");

  return records.map((r) => {
    if (!SPEND_KEY_RE.test(r.metricKey)) {
      return r;
    }
    const cur = readCurrencyFromDimensions(r.dimensions, defaultCurrency);
    const usd = convertAmountToUsd(r.value, cur, rates);
    if (usd === r.value) {
      return r;
    }
    const dims =
      r.dimensions === undefined ? { currency: "USD" } : { ...r.dimensions, currency: "USD" };
    return { ...r, value: usd, dimensions: dims };
  });
}
