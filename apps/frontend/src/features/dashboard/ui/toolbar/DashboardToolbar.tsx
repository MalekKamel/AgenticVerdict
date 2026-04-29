"use client";

import { Button, Group, Select, Stack, Switch, Text } from "@mantine/core";

import type { DashboardDatePreset } from "@/features/dashboard/model/contracts";
import {
  bumpManualDashboardRefresh,
  setDashboardComparisonEnabled,
  setDashboardDatePreset,
  useDashboardStore,
} from "@/features/dashboard/model/dashboard-store";

export type DashboardToolbarProps = {
  presetLabel: string;
  comparisonLabel: string;
  refreshLabel: string;
  freshnessTemplate: string;
  presets: { value: DashboardDatePreset; label: string }[];
};

export function DashboardToolbar({
  presetLabel,
  comparisonLabel,
  refreshLabel,
  freshnessTemplate,
  presets,
}: DashboardToolbarProps) {
  const datePreset = useDashboardStore((s) => s.datePreset);
  const comparisonEnabled = useDashboardStore((s) => s.comparisonEnabled);
  const lastAt = useDashboardStore((s) => s.lastSuccessfulDataAtMs);

  const freshness =
    lastAt === null
      ? ""
      : freshnessTemplate.replace("{time}", new Date(lastAt).toLocaleTimeString());

  return (
    <Stack gap="sm" mb="lg" data-testid="dashboard-toolbar">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <Select
          label={presetLabel}
          aria-label={presetLabel}
          data={presets}
          value={datePreset}
          onChange={(v) => {
            if (v) {
              setDashboardDatePreset(v as DashboardDatePreset);
            }
          }}
          w={{ base: "100%", sm: 280 }}
        />
        <Switch
          label={comparisonLabel}
          checked={comparisonEnabled}
          onChange={(e) => {
            setDashboardComparisonEnabled(e.currentTarget.checked);
          }}
        />
        <Button
          type="button"
          variant="light"
          onClick={() => bumpManualDashboardRefresh()}
          aria-label={refreshLabel}
        >
          {refreshLabel}
        </Button>
      </Group>
      {freshness ? (
        <Text size="sm" c="dimmed" role="status">
          {freshness}
        </Text>
      ) : null}
    </Stack>
  );
}
