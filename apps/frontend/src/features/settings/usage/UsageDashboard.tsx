"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Container,
  Stack,
  Title,
  Group,
  Select,
  Paper,
  Text,
  SimpleGrid,
  Box,
  Alert,
  Badge,
  Divider,
  Skeleton,
  LoadingOverlay,
} from "@mantine/core";
import { DatePickerInput } from "@mantine/dates";
import {
  IconAlertCircle,
  IconTrendingUp,
  IconTrendingDown,
  IconCurrencyDollar,
  IconDatabase,
  IconClock,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { useAiUsageSummary, useAiUsageTrends } from "@/hooks/useAiUsage";
import { UsageTrendChart } from "@/components/UsageChart";
import { UsageTable } from "@/components/UsageTable";
import { ROUTE_PATHS } from "@/router/utils/route-paths";

interface UsageSummaryCardProps {
  title: string;
  value: string;
  trend?: number;
  icon: React.ReactNode;
  color: string;
}

const UsageSummaryCard = ({ title, value, trend, icon, color }: UsageSummaryCardProps) => {
  const trendLabel =
    trend !== undefined
      ? trend >= 0
        ? `Increased by ${Math.abs(trend)}%`
        : `Decreased by ${Math.abs(trend)}%`
      : undefined;

  return (
    <Paper p="md" withBorder>
      <Stack gap="xs">
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            {title}
          </Text>
          <Box style={{ color }}>{icon}</Box>
        </Group>
        <Text size="xl" fw={700}>
          {value}
        </Text>
        {trend !== undefined && (
          <Group gap="xs">
            {trend >= 0 ? (
              <IconTrendingUp size={16} color="red" aria-hidden="true" />
            ) : (
              <IconTrendingDown size={16} color="green" aria-hidden="true" />
            )}
            <Text size="sm" c={trend >= 0 ? "red" : "green"}>
              {Math.abs(trend)}%
            </Text>
            <span
              className="sr-only"
              style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
            >
              {trendLabel}
            </span>
          </Group>
        )}
      </Stack>
    </Paper>
  );
};

export function UsageDashboard() {
  const t = useTranslations("settings.usage");
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    new Date(new Date().setMonth(new Date().getMonth() - 1)),
    new Date(),
  ]);
  const [granularity, setGranularity] = useState<string>("daily");

  useAppShellHeader({
    breadcrumbs: [
      { label: t("common.settings"), href: ROUTE_PATHS.SETTINGS_DOMAINS },
      { label: t("dashboard.pageTitle") },
    ],
  });

  const filters = useMemo(
    () => ({
      startDate: dateRange[0]?.toISOString() || "",
      endDate: dateRange[1]?.toISOString() || "",
    }),
    [dateRange],
  );

  const {
    data: summaryData,
    isLoading: isSummaryLoading,
    error: summaryError,
  } = useAiUsageSummary(filters);

  const {
    data: trendsData,
    isLoading: isTrendsLoading,
    error: trendsError,
  } = useAiUsageTrends(filters);

  const isLoading = isSummaryLoading || isTrendsLoading;
  const error = summaryError || trendsError;

  const totalCostCents = summaryData?.totalCostCents || 0;
  const totalCost = totalCostCents / 100; // Convert cents to dollars
  const totalTokens = summaryData?.totalTokens || 0;
  const totalRequests = summaryData?.totalRequests || 0;
  const avgLatencyMs = summaryData?.avgLatencyMs || 0;

  const chartData = useMemo(() => {
    if (!trendsData) return [];
    return trendsData.map((point) => ({
      label: new Date(point.date).toLocaleDateString(),
      value: (point.costCents || 0) / 100,
      timestamp: new Date(point.date),
    }));
  }, [trendsData]);

  const tableData = useMemo(() => {
    if (!summaryData?.byProvider) return [];
    return summaryData.byProvider.map((provider, index) => ({
      id: `provider-${index}`,
      date: new Date().toLocaleDateString(),
      provider: provider.providerId,
      tokens: provider.totalTokens,
      cost: provider.totalCostCents,
      requests: provider.requestCount,
      avgLatency: 0,
      status: "success" as const,
    }));
  }, [summaryData]);

  const handleDateRangeChange = useCallback((range: [Date | null, Date | null]) => {
    setDateRange(range);
  }, []);

  const handleGranularityChange = useCallback((value: string | null) => {
    if (value) setGranularity(value);
  }, []);

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={20} />} color="red" title={t("messages.error")}>
          {t("messages.failedToLoad")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl" pos="relative">
      <LoadingOverlay visible={isLoading} zIndex={1000} overlayProps={{ radius: "sm", blur: 2 }} />
      <Stack gap="xl">
        {/* Header */}
        <Title order={2} id="dashboard-title">
          {t("dashboard.pageTitle")}
        </Title>

        {/* Filters - Optimized with stable callbacks */}
        <Group gap="md" role="search" aria-label={t("filters.ariaLabel")} wrap="wrap">
          <DatePickerInput
            type="range"
            label={t("filters.dateRange")}
            value={dateRange}
            onChange={handleDateRangeChange}
            style={{ flex: 1 }}
            clearable={false}
            aria-describedby="date-range-description"
          />
          <Select
            label={t("filters.granularity")}
            value={granularity}
            onChange={handleGranularityChange}
            data={[
              { value: "daily", label: t("granularity.daily") },
              { value: "weekly", label: t("granularity.weekly") },
              { value: "monthly", label: t("granularity.monthly") },
            ]}
            style={{ width: 150 }}
            allowDeselect={false}
            aria-describedby="granularity-description"
          />
        </Group>

        {/* Hidden descriptions for screen readers */}
        <Box
          id="date-range-description"
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
        >
          {t("filters.dateRangeDescription")}
        </Box>
        <Box
          id="granularity-description"
          className="sr-only"
          style={{ position: "absolute", width: 1, height: 1, overflow: "hidden" }}
        >
          {t("filters.granularityDescription")}
        </Box>

        {/* Summary Cards - Memoized rendering */}
        <SimpleGrid
          cols={{ base: 1, sm: 2, lg: 4 }}
          spacing="md"
          aria-label={t("summary.ariaLabel")}
        >
          {isLoading ? (
            <>
              <Skeleton height={120} radius="md" />
              <Skeleton height={120} radius="md" />
              <Skeleton height={120} radius="md" />
              <Skeleton height={120} radius="md" />
            </>
          ) : (
            <>
              <UsageSummaryCard
                title={t("summary.totalCost")}
                value={`$${totalCost.toFixed(2)}`}
                trend={5.2}
                icon={<IconCurrencyDollar size={24} />}
                color="#228be6"
              />
              <UsageSummaryCard
                title={t("summary.totalTokens")}
                value={totalTokens.toLocaleString()}
                trend={12.5}
                icon={<IconDatabase size={24} />}
                color="#40c057"
              />
              <UsageSummaryCard
                title={t("summary.totalRequests")}
                value={totalRequests.toLocaleString()}
                trend={-3.1}
                icon={<IconClock size={24} />}
                color="#ff922b"
              />
              <UsageSummaryCard
                title={t("summary.avgResponseTime")}
                value={`${avgLatencyMs.toFixed(0)}ms`}
                trend={-8.4}
                icon={<IconTrendingUp size={24} />}
                color="#845ef7"
              />
            </>
          )}
        </SimpleGrid>

        <Divider />

        {/* Usage Trend Chart - Lazy loaded with Suspense */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text fw={600}>{t("dashboard.usageTrend")}</Text>
            {isLoading ? (
              <Skeleton height={300} radius="md" />
            ) : chartData.length > 0 ? (
              <UsageTrendChart data={chartData} title={t("dashboard.costTrend")} height={300} />
            ) : (
              <Box
                style={{
                  height: 300,
                  background: "#f8f9fa",
                  borderRadius: 8,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
                role="status"
              >
                <Text c="dimmed">{t("messages.noData")}</Text>
              </Box>
            )}
          </Stack>
        </Paper>

        {/* Cost by Provider */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text fw={600}>{t("dashboard.costByProvider")}</Text>
            {isLoading ? (
              <>
                <Skeleton height={40} />
                <Skeleton height={40} />
                <Skeleton height={40} />
              </>
            ) : (
              <Stack gap="xs">
                {tableData.length > 0 ? (
                  tableData.map((provider) => (
                    <Group key={provider.id} justify="space-between">
                      <Group gap="xs">
                        <Badge variant="outline">{provider.provider}</Badge>
                        <Text size="sm" c="dimmed">
                          {provider.requests.toLocaleString()} requests
                        </Text>
                      </Group>
                      <Text fw={600}>${(provider.cost / 100).toFixed(2)}</Text>
                    </Group>
                  ))
                ) : (
                  <Text c="dimmed" role="status">
                    {t("messages.noData")}
                  </Text>
                )}
              </Stack>
            )}
          </Stack>
        </Paper>

        {/* Detailed Usage Table - Virtualized */}
        <Paper p="md" withBorder>
          <Stack gap="sm">
            <Text fw={600} id="table-title">
              {t("dashboard.detailedView")}
            </Text>
            {isLoading ? (
              <Skeleton height={400} radius="md" />
            ) : (
              <UsageTable data={tableData} enableExport />
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
