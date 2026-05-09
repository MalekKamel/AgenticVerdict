import type { ConnectorListInput } from "@agenticverdict/types";

export type ConnectorListSearch = ConnectorListInput;

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
