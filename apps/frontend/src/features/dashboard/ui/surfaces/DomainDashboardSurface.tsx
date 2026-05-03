"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Anchor, Card, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { useMemo } from "react";

import type { DashboardDomainSlug } from "@/features/dashboard/model/contracts";
import { fetchDashboardDomainSummary } from "@/features/dashboard/api/dashboard-api";
import { isDashboardTypedError } from "@/features/dashboard/model/dashboard-errors";
import { dashboardDomainSummaryKey } from "@/features/dashboard/model/dashboard-query-keys";
import { resolveAsyncSectionStatus } from "@/features/dashboard/model/dashboard-state-transitions";
import { useDashboardStore } from "@/features/dashboard/model/dashboard-store";
import { Link } from "@/i18n/navigation";
import { useTranslations } from "@/i18n/react";
import { useTenant } from "@/features/auth/providers/TenantProvider";

import { DashboardAsyncSection } from "@/features/dashboard/ui/section/DashboardAsyncSection";
import { DashboardToolbar } from "@/features/dashboard/ui/toolbar/DashboardToolbar";

export type DomainDashboardSurfaceProps = {
  domain: DashboardDomainSlug;
};

export function DomainDashboardSurface({ domain }: DomainDashboardSurfaceProps) {
  const t = useTranslations("dashboard");
  const { tenantId } = useTenant();
  const queryClient = useQueryClient();
  const refreshToken = useDashboardStore((s) => s.manualRefreshToken);

  const scope = useMemo(
    () => ({ tenantId: tenantId ?? "", clientId: undefined as string | undefined, domain }),
    [tenantId, domain],
  );

  const summaryQuery = useQuery({
    queryKey: [...dashboardDomainSummaryKey(scope), refreshToken],
    queryFn: async () => {
      const r = await fetchDashboardDomainSummary(tenantId, domain);
      if (!r.ok) {
        throw r.error;
      }
      return r.data;
    },
    enabled: Boolean(tenantId),
  });

  const status = resolveAsyncSectionStatus(summaryQuery);

  const resolveThrown = (e: unknown) =>
    isDashboardTypedError(e) ? t(e.messageKey as never) : t("errors.generic");

  const domainLabel = t(`domains.${domain}` as never);

  if (!tenantId) {
    return (
      <Stack gap="md" role="alert">
        <Title order={1}>{t("domain.title", { domain: domainLabel })}</Title>
        <Text>{t("errors.tenantRequired")}</Text>
      </Stack>
    );
  }

  return (
    <Stack component="main" gap="xl" aria-label={t("domain.ariaMain")}>
      <Stack gap={4}>
        <Title order={1}>{t("domain.title", { domain: domainLabel })}</Title>
        <Text size="sm" c="dimmed">
          {t("domain.subtitle")}
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
        sectionId="domain-kpis"
        status={status}
        title={t("home.kpi.title")}
        loadingLabel={t("async.loadingSection")}
        emptyTitle={t("home.kpi.emptyTitle")}
        emptyDescription={t("home.kpi.emptyDescription")}
        errorTitle={t("errors.sectionTitle")}
        errorMessage={summaryQuery.error ? resolveThrown(summaryQuery.error) : undefined}
        onRetry={() =>
          void queryClient.invalidateQueries({ queryKey: dashboardDomainSummaryKey(scope) })
        }
        retryLabel={t("actions.retry")}
      >
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {(summaryQuery.data?.kpis ?? []).map((k) => (
            <Card key={k.id} withBorder padding="lg" radius="md" shadow="xs">
              <Text fw={600}>{t(k.labelKey as never)}</Text>
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
    </Stack>
  );
}
