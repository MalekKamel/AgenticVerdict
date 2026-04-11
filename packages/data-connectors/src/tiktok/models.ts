/**
 * TikTok Marketing API (Open API v1.3) shapes used by {@link TikTokConnectorAdapter}.
 * Field lists are intentionally narrow; extend as reporting needs grow.
 */

export interface TikTokPageInfo {
  readonly page?: number;
  readonly page_size?: number;
  readonly total_number?: number;
  readonly total_page?: number;
}

export interface TikTokListData<T = unknown> {
  readonly list?: T[];
  readonly page_info?: TikTokPageInfo;
}

export interface TikTokEnvelope<T = unknown> {
  readonly code: number;
  readonly message?: string;
  readonly data?: T;
  readonly request_id?: string;
}

export interface TikTokOAuthTokenData {
  readonly access_token?: string;
  readonly refresh_token?: string;
  readonly expires_in?: number;
  readonly refresh_token_expires_in?: number;
}

export interface TikTokCampaign {
  readonly campaign_id?: string;
  readonly campaign_name?: string;
  readonly operation_status?: string;
  readonly objective_type?: string;
  readonly budget?: number | string;
  readonly budget_mode?: string;
  readonly create_time?: string;
  readonly modify_time?: string;
}

export interface TikTokAdGroup {
  readonly adgroup_id?: string;
  readonly adgroup_name?: string;
  readonly campaign_id?: string;
  readonly operation_status?: string;
  readonly budget?: number | string;
  readonly budget_mode?: string;
  readonly create_time?: string;
  readonly modify_time?: string;
}

export interface TikTokAd {
  readonly ad_id?: string;
  readonly ad_name?: string;
  readonly adgroup_id?: string;
  readonly campaign_id?: string;
  readonly operation_status?: string;
  readonly create_time?: string;
  readonly modify_time?: string;
}

/** Row from `report/integrated/get/` with BASIC + AUCTION_CAMPAIGN + stat_time_day. */
export interface TikTokIntegratedCampaignRow {
  readonly metrics?: Record<string, string | number | undefined>;
  readonly dimensions?: Record<string, string | undefined>;
}

export interface TikTokRawMetricsPayload {
  readonly advertiserId: string;
  readonly campaigns: TikTokCampaign[];
  readonly adGroups: TikTokAdGroup[];
  readonly ads: TikTokAd[];
  readonly integratedRows: TikTokIntegratedCampaignRow[];
  readonly fetchedAt: string;
}
