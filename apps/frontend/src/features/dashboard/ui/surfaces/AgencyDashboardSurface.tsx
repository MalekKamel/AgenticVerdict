"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Anchor, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo } from "react";

import {
  fetchDashboardAgencyOverview,
  filterAgencyClientsForRendering,
} from "@/features/dashboard/api/dashboard-api";
import { isDashboardTypedError } from "@/features/dashboard/model/dashboard-errors";
import { dashboardAgencyOverviewKey } from "@/features/dashboard/model/dashboard-query-keys";
import { resolveAsyncSectionStatus } from "@/features/dashboard/model/dashboard-state-transitions";
import { setDashboardContext, useDashboardStore } from "@/features/dashboard/model/dashboard-store";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import { useTenant } from "@/features/auth/providers/TenantProvider";

import { DashboardAsyncSection } from "@/features/dashboard/ui/section/DashboardAsyncSection";
import { DashboardToolbar } from "@/features/dashboard/ui/toolbar/DashboardToolbar";

export function AgencyDashboardSurface() {
  const t = useTranslations("dashboard");
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const refreshToken = useDashboardStore((s) => s.manualRefreshToken);

  const scope = useMemo(() => ({ tenantId: tenantId ?? "" }), [tenantId]);

  const overviewQuery = useQuery({
    queryKey: [...dashboardAgencyOverviewKey(scope), refreshToken],
    queryFn: async () => {
      const r = await fetchDashboardAgencyOverview(tenantId);
      if (!r.ok) {
        throw r.error;
      }
      return r.data;
    },
    enabled: Boolean(tenantId),
  });

  const status = resolveAsyncSectionStatus(overviewQuery);

  const resolveThrown = (e: unknown) =>
    isDashboardTypedError(e) ? t(e.messageKey as never) : t("errors.generic");

  const permittedClients = useMemo(
    () => (overviewQuery.data ? filterAgencyClientsForRendering(overviewQuery.data) : []),
    [overviewQuery.data],
  );

  if (!tenantId) {
    return (
      <Stack gap="md" role="alert">
        <Title order={1}>{t("agency.title")}</Title>
        <Text>{t("errors.tenantRequired")}</Text>
      </Stack>
    );
  }

  return (
    <Stack component="main" gap="xl" aria-label={t("agency.ariaMain")}>
      <Stack gap={4}>
        <Title order={1}>{t("agency.title")}</Title>
        <Text size="sm" c="dimmed">
          {t("agency.subtitle")}
        </Text>
        <Anchor component={Link} href="/dashboard" size="sm">
          {t("home.title")}
        </Anchor>
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
        sectionId="agency-aggregate"
        status={status}
        title={t("home.kpi.title")}
        loadingLabel={t("async.loadingSection")}
        emptyTitle={t("home.kpi.emptyTitle")}
        emptyDescription={t("home.kpi.emptyDescription")}
        errorTitle={t("errors.sectionTitle")}
        errorMessage={overviewQuery.error ? resolveThrown(overviewQuery.error) : undefined}
        onRetry={() =>
          void queryClient.invalidateQueries({ queryKey: dashboardAgencyOverviewKey(scope) })
        }
        retryLabel={t("actions.retry")}
      >
        <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="md">
          {(overviewQuery.data?.aggregateKpis ?? []).map((k) => (
            <Card key={k.id} withBorder padding="lg" radius="md" shadow="xs">
              <Text fw={600}>{t(k.labelKey as never)}</Text>
              <Title order={3} mt="xs">
                {k.value}
              </Title>
            </Card>
          ))}
        </SimpleGrid>
      </DashboardAsyncSection>
      <section aria-labelledby="agency-clients-heading">
        <Text component="h2" id="agency-clients-heading" size="lg" fw={600} mb="sm">
          {t("agency.clientList")}
        </Text>
        <Stack gap="sm">
          {permittedClients.map((c) => (
            <Card key={c.clientId} withBorder padding="md" radius="md">
              <Group justify="space-between" wrap="wrap">
                <div>
                  <Text fw={600}>{c.name}</Text>
                  <Text size="sm" c="dimmed">
                    {t("home.kpi.totalInsights")}: {c.insightCount}
                  </Text>
                </div>
                <Group gap="xs">
                  <Badge variant="light">
                    {t(`connectorStatus.${c.connectorStatusKey}` as never)}
                  </Badge>
                  <Button
                    component={Link}
                    href={`/dashboard/agency/${c.clientId}`}
                    variant="light"
                    onClick={() =>
                      setDashboardContext({
                        contextMode: "agency_client",
                        activeClientId: c.clientId,
                      })
                    }
                  >
                    {t("agency.viewTenant")}
                  </Button>
                </Group>
              </Group>
            </Card>
          ))}
        </Stack>
      </section>
    </Stack>
  );
}
