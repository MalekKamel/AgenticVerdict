import { Badge } from "@mantine/core";

export type FreshnessState = "real-time" | "recent" | "stale" | "outdated";

export interface DataFreshnessBadgeProps {
  lastSyncAt: string | null | Date;
  labels?: Partial<Record<FreshnessState, string>>;
}

function resolveFreshness(lastSyncAt: string | null | Date): {
  state: FreshnessState;
  label: string;
  color: string;
} {
  if (!lastSyncAt) {
    return { state: "outdated", label: "Outdated", color: "gray" };
  }

  const date = typeof lastSyncAt === "string" ? new Date(lastSyncAt) : lastSyncAt;
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 5) {
    return { state: "real-time", label: "Real-time", color: "green" };
  }
  if (diffMins < 60) {
    return { state: "recent", label: "Recent", color: "blue" };
  }
  if (diffMins < 24 * 60) {
    return { state: "stale", label: "Stale", color: "yellow" };
  }
  return { state: "outdated", label: "Outdated", color: "gray" };
}

export function DataFreshnessBadge({ lastSyncAt, labels }: DataFreshnessBadgeProps) {
  const { state, label, color } = resolveFreshness(lastSyncAt);
  return (
    <Badge color={color} variant="light" size="sm">
      {labels?.[state] ?? label}
    </Badge>
  );
}
