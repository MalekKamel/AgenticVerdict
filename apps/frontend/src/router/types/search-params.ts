export type ConnectorListSearch = {
  status?: "healthy" | "warning" | "error" | "inactive" | "syncing";
  domain?: string;
  search?: string;
  page?: number;
  pageSize?: number;
};

export type AuthRedirectSearch = {
  redirect?: string;
  session?: "expired";
  oauth?: "google" | "microsoft" | "apple";
};

export type DashboardDomainParams = {
  domain: string;
};

export type ConnectorIdParams = {
  id: string;
};

export type AgencyClientIdParams = {
  clientId: string;
};

export type HealthPlatformParams = {
  platform: string;
};
