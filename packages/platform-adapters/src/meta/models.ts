/**
 * Meta Marketing API (Graph API) shapes used by {@link MetaPlatformAdapter}.
 * Field lists are intentionally narrow; extend as reporting needs grow.
 */

export interface MetaPaging {
  readonly cursors?: { readonly before?: string; readonly after?: string };
  readonly next?: string;
  readonly previous?: string;
}

export interface MetaListResponse<T = unknown> {
  readonly data?: T[];
  readonly paging?: MetaPaging;
}

export interface MetaGraphErrorBody {
  readonly error?: {
    readonly message?: string;
    readonly type?: string;
    readonly code?: number;
    readonly error_subcode?: number;
    readonly fbtrace_id?: string;
  };
}

export interface MetaCampaign {
  readonly id?: string;
  readonly name?: string;
  readonly status?: string;
  readonly objective?: string;
  readonly daily_budget?: string;
  readonly lifetime_budget?: string;
  readonly account_id?: string;
}

export interface MetaAdSet {
  readonly id?: string;
  readonly name?: string;
  readonly status?: string;
  readonly campaign_id?: string;
  readonly daily_budget?: string;
  readonly lifetime_budget?: string;
}

export interface MetaAd {
  readonly id?: string;
  readonly name?: string;
  readonly status?: string;
  readonly adset_id?: string;
  readonly campaign_id?: string;
}

export interface MetaInsightAction {
  readonly action_type?: string;
  readonly value?: string;
}

export interface MetaInsightRow {
  readonly campaign_id?: string;
  readonly campaign_name?: string;
  readonly adset_id?: string;
  readonly adset_name?: string;
  readonly ad_id?: string;
  readonly ad_name?: string;
  readonly impressions?: string;
  readonly clicks?: string;
  readonly spend?: string;
  readonly ctr?: string;
  readonly cpc?: string;
  readonly reach?: string;
  readonly actions?: MetaInsightAction[];
  readonly date_start?: string;
  readonly date_stop?: string;
}

export interface MetaRawMetricsPayload {
  readonly adAccountId: string;
  readonly campaigns: MetaCampaign[];
  readonly adSets: MetaAdSet[];
  readonly ads: MetaAd[];
  readonly insights: MetaInsightRow[];
  readonly fetchedAt: string;
}
