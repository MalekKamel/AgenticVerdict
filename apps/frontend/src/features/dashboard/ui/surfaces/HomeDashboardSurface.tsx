"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Anchor, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

import type { AuthUserData } from "@/lib/api/auth-api";
import {
  fetchDashboardConnectorsOnly,
  fetchDashboardInsightsOnly,
  fetchDashboardKpisOnly,
} from "@/features/dashboard/api/dashboard-api";
import { isDashboardTypedError } from "@/features/dashboard/model/dashboard-errors";
import {
  dashboardConnectorsKey,
  dashboardInsightsKey,
  dashboardKpisKey,
} from "@/features/dashboard/model/dashboard-query-keys";
import {
  combineHomeSurfaceStatus,
  resolveAsyncSectionStatus,
} from "@/features/dashboard/model/dashboard-state-transitions";
import {
  markDashboardDataFresh,
  setDashboardContext,
  useDashboardStore,
} from "@/features/dashboard/model/dashboard-store";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import { useTenant } from "@/providers/TenantProvider";

import { DashboardAsyncSection } from "@/features/dashboard/ui/section/DashboardAsyncSection";
import { DashboardStatusAnnouncer } from "@/features/dashboard/ui/announcer/DashboardStatusAnnouncer";
import { DashboardToolbar } from "@/features/dashboard/ui/toolbar/DashboardToolbar";
import { resolveDashboardPermissions } from "./dashboard-permissions";

export type HomeDashboardSurfaceProps = {
  user: AuthUserData | null;
  /** When set, cache keys and context are scoped for agency client mode (task 4.2). */
  scopedClientId?: string;
};

export function HomeDashboardSurface({ user, scopedClientId }: HomeDashboardSurfaceProps) {
  const t = useTranslations("dashboard");
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const refreshToken = useDashboardStore((s) => s.manualRefreshToken);
  const permissions = useMemo(() => resolveDashboardPermissions(user), [user]);

  const scope = useMemo(
    () => ({
      tenantId: tenantId ?? "",
      clientId: scopedClientId,
    }),
    [tenantId, scopedClientId],
  );

  useEffect(() => {
    if (scopedClientId) {
      setDashboardContext({ contextMode: "agency_client", activeClientId: scopedClientId });
      return () => {
        setDashboardContext({ contextMode: "tenant" });
      };
    }
    return undefined;
  }, [scopedClientId]);

  const kpisQuery = useQuery({
    queryKey: [...dashboardKpisKey(scope), refreshToken],
    queryFn: async () => {
      const r = await fetchDashboardKpisOnly(tenantId);
      if (!r.ok) {
        throw r.error;
      }
      return r.data;
    },
    enabled: Boolean(tenantId),
  });

  const insightsQuery = useQuery({
    queryKey: [...dashboardInsightsKey(scope), refreshToken],
    queryFn: async () => {
      const r = await fetchDashboardInsightsOnly(tenantId);
      if (!r.ok) {
        throw r.error;
      }
      return r.data;
    },
    enabled: Boolean(tenantId),
  });

  const connectorsQuery = useQuery({
    queryKey: [...dashboardConnectorsKey(scope), refreshToken],
    queryFn: async () => {
      const r = await fetchDashboardConnectorsOnly(tenantId);
      if (!r.ok) {
        throw r.error;
      }
      return r.data;
    },
    enabled: Boolean(tenantId),
  });

  const kpiStatus = resolveAsyncSectionStatus(kpisQuery);
  const insightStatus = resolveAsyncSectionStatus(insightsQuery);
  const connectorStatus = resolveAsyncSectionStatus(connectorsQuery);

  const surfaceStatus = combineHomeSurfaceStatus({
    kpis: kpiStatus,
    insights: insightStatus,
    connectors: connectorStatus,
  });

  const [announcement, setAnnouncement] = useState<string | null>(null);

  useEffect(() => {
    if (!tenantId) {
      return;
    }
    if (surfaceStatus === "success" || surfaceStatus === "partial") {
      const latest = Math.max(
        kpisQuery.dataUpdatedAt,
        insightsQuery.dataUpdatedAt,
        connectorsQuery.dataUpdatedAt,
      );
      markDashboardDataFresh(latest);
    }
  }, [
    tenantId,
    surfaceStatus,
    kpisQuery.dataUpdatedAt,
    insightsQuery.dataUpdatedAt,
    connectorsQuery.dataUpdatedAt,
  ]);

  useEffect(() => {
    if (surfaceStatus === "loading") {
      setAnnouncement(t("async.loadingHome"));
      return;
    }
    if (surfaceStatus === "error") {
      setAnnouncement(t("async.errorHome"));
      return;
    }
    if (surfaceStatus === "success") {
      setAnnouncement(t("async.readyHome"));
    }
  }, [surfaceStatus, t]);

  const resolveThrown = (e: unknown) =>
    isDashboardTypedError(e) ? t(e.messageKey as never) : t("errors.generic");

  if (!tenantId) {
    return (
      <Stack gap="md" role="alert">
        <Title order={1}>{t("home.title")}</Title>
        <Text>{t("errors.tenantRequired")}</Text>
      </Stack>
    );
  }

  return (
    <Stack
      component="main"
      gap="xl"
      aria-label={t("home.ariaMain")}
      data-testid="home-dashboard-surface"
    >
      <DashboardStatusAnnouncer message={announcement} />
      <Stack gap={4}>
        <Title order={1}>{t("home.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("home.subtitle", { email: user?.email ?? "" })}
        </Text>
        {scopedClientId ? (
          <Text size="sm" role="status">
            {t("agency.clientContext", { id: scopedClientId })}
          </Text>
        ) : null}
      </Stack>
      <DashboardToolbar
        presetLabel={t("toolbar.preset")}
        comparisonLabel={t("toolbar.comparison")}
        refreshLabel={t("toolbar.refresh")}
        freshnessTemplate={t("toolbar.freshness", { time: "{time}" })}
        presets={[
          { value: "last_7_days", label: t("toolbar.presets.last7") },
          { value: "last_30_days", label: t("toolbar.presets.last30") },
          { value: "this_month", label: t("toolbar.presets.thisMonth") },
          { value: "last_month", label: t("toolbar.presets.lastMonth") },
        ]}
      />
      <DashboardAsyncSection
        sectionId="kpis"
        status={kpiStatus}
        title={t("home.kpi.title")}
        loadingLabel={t("async.loadingSection")}
        emptyTitle={t("home.kpi.emptyTitle")}
        emptyDescription={t("home.kpi.emptyDescription")}
        errorTitle={t("errors.sectionTitle")}
        errorMessage={kpisQuery.error ? resolveThrown(kpisQuery.error) : undefined}
        onRetry={() => void queryClient.invalidateQueries({ queryKey: dashboardKpisKey(scope) })}
        retryLabel={t("actions.retry")}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {(kpisQuery.data ?? []).map((k) => (
            <Card key={k.id} withBorder padding="lg" radius="md" shadow="xs">
              {k.href ? (
                <Anchor component={Link} href={k.href} fw={600}>
                  {t(k.labelKey as never)}
                </Anchor>
              ) : (
                <Text fw={600}>{t(k.labelKey as never)}</Text>
              )}
              <Title order={3} mt="xs">
                {k.value}
              </Title>
              {k.deltaLabelKey ? (
                <Text size="sm" c="dimmed">
                  {t(k.deltaLabelKey as never)}
                </Text>
              ) : null}
            </Card>
          ))}
        </SimpleGrid>
      </DashboardAsyncSection>
      <DashboardAsyncSection
        sectionId="insights"
        status={insightStatus}
        title={t("home.insights.title")}
        loadingLabel={t("async.loadingSection")}
        emptyTitle={t("home.insights.emptyTitle")}
        emptyDescription={t("home.insights.emptyDescription")}
        errorTitle={t("errors.sectionTitle")}
        errorMessage={insightsQuery.error ? resolveThrown(insightsQuery.error) : undefined}
        onRetry={() =>
          void queryClient.invalidateQueries({ queryKey: dashboardInsightsKey(scope) })
        }
        retryLabel={t("actions.retry")}
      >
        <Stack gap="md">
          {(insightsQuery.data ?? []).map((row) => (
            <Card key={row.id} withBorder padding="md" radius="md">
              <Group justify="space-between" wrap="wrap">
                <div>
                  <Text fw={600}>{t(row.titleKey as never)}</Text>
                  <Text size="sm" c="dimmed">
                    {t(row.bodyKey as never)}
                  </Text>
                </div>
                <Badge variant="light">{t(`domains.${row.domain}` as never)}</Badge>
              </Group>
              <Text size="xs" c="dimmed" mt="xs">
                {t(row.relativeTimeKey as never)}
              </Text>
            </Card>
          ))}
        </Stack>
      </DashboardAsyncSection>
      <DashboardAsyncSection
        sectionId="connectors"
        status={connectorStatus}
        title={t("home.connectors.title")}
        loadingLabel={t("async.loadingSection")}
        emptyTitle={t("home.connectors.emptyTitle")}
        emptyDescription={t("home.connectors.emptyDescription")}
        errorTitle={t("errors.sectionTitle")}
        errorMessage={connectorsQuery.error ? resolveThrown(connectorsQuery.error) : undefined}
        onRetry={() =>
          void queryClient.invalidateQueries({ queryKey: dashboardConnectorsKey(scope) })
        }
        retryLabel={t("actions.retry")}
      >
        <Group gap="sm" wrap="wrap">
          {(connectorsQuery.data ?? []).map((c) => (
            <Badge
              key={c.id}
              color={c.status === "healthy" ? "green" : c.status === "degraded" ? "yellow" : "red"}
              variant="light"
              size="lg"
            >
              {t(c.nameKey as never)} — {t(`connectorStatus.${c.status}` as never)}
            </Badge>
          ))}
        </Group>
      </DashboardAsyncSection>
      <section aria-labelledby="dash-quick-actions">
        <Text component="h2" id="dash-quick-actions" size="lg" fw={600} mb="sm">
          {t("home.quickActions.title")}
        </Text>
        <Group gap="sm" wrap="wrap">
          <Button
            component={Link}
            href="/dashboard/marketing"
            variant="light"
            disabled={!permissions.canUsePrivilegedQuickActions}
          >
            {t("home.quickActions.domainSample")}
          </Button>
          <Button variant="light" disabled={!permissions.canUsePrivilegedQuickActions}>
            {t("home.quickActions.createInsight")}
          </Button>
          <Button variant="light" disabled={!permissions.canUsePrivilegedQuickActions}>
            {t("home.quickActions.export")}
          </Button>
          <Button
            component={Link}
            href="/dashboard/customize"
            variant="default"
            disabled={!permissions.canCustomizeLayout}
          >
            {t("home.quickActions.customize")}
          </Button>
          <Button component={Link} href="/dashboard/agency" variant="outline">
            {t("home.quickActions.agency")}
          </Button>
        </Group>
      </section>
    </Stack>
  );
}
