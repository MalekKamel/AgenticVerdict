"use client";

import { useState, useEffect } from "react";
import {
  Container,
  Stack,
  TextInput,
  Select,
  Button,
  Group,
  Text,
  Skeleton,
  SimpleGrid,
  Badge,
  ActionIcon,
  Center,
  Title,
  Switch,
  Tooltip,
  Card,
} from "@mantine/core";
import { useSearch } from "@/router/hooks/useSearch";
import { useRouter } from "@/i18n/navigation";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import { IconSearch, IconPlus, IconSettings, IconEye, IconPlayerPlay } from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import {
  useInsightList,
  useInsightRun,
  useInsightUpdate,
  useConnectorDomains,
} from "@/features/insights/api/insight-api";
import { PageErrorBoundary } from "@/components/error-boundaries";
import { getInsightErrorMessage } from "../utils/error-translator";
import type { InsightOutput } from "@agenticverdict/types";
import { ScheduleStatusBadge } from "@/features/shared/ui/ScheduleStatusBadge";
import { scheduleService } from "@/features/schedules/services/schedule-service";

function InsightListSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {[...Array(6)].map((_, i) => (
        <Card key={i} withBorder radius="md" p="md">
          <Stack gap="xs">
            <Skeleton height={20} width={100} />
            <Skeleton height={30} />
            <Skeleton height={20} />
            <Group gap="xs">
              <Skeleton height={20} width={80} />
              <Skeleton height={20} width={80} />
            </Group>
          </Stack>
        </Card>
      ))}
    </SimpleGrid>
  );
}

function EmptyState() {
  const t = useTranslations("insights");
  const router = useRouter();

  return (
    <Center style={{ width: "100%", padding: "4rem 0" }}>
      <Stack align="center" gap="md">
        <Text size="lg" c="dimmed">
          {t("list.emptyState.title")}
        </Text>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => router.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_NEW)}
        >
          {t("list.emptyState.createFirst")}
        </Button>
      </Stack>
    </Center>
  );
}

function InsightListContent() {
  const t = useTranslations("insights");
  const tNav = useTranslations("navigation");
  const router = useRouter();
  const searchParams = useSearch({ from: "/$locale/dashboard/insights/", strict: false }) as
    | Record<string, string>
    | undefined;

  const [filters, setFilters] = useState({
    status: searchParams?.status || "all",
    domain: searchParams?.domain || "",
    search: searchParams?.search || "",
    page: parseInt(searchParams?.page || "1", 10),
    sortField: (searchParams?.sortField || "createdAt") as
      | "name"
      | "createdAt"
      | "lastRunAt"
      | "status",
    sortDirection: (searchParams?.sortDirection || "desc") as "asc" | "desc",
  });

  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.status !== "all") params.set("status", filters.status);
    if (filters.domain) params.set("domain", filters.domain);
    if (filters.search) params.set("search", filters.search);
    if (filters.page > 1) params.set("page", String(filters.page));
    if (filters.sortField !== "createdAt") params.set("sortField", filters.sortField);
    if (filters.sortDirection !== "desc") params.set("sortDirection", filters.sortDirection);

    const queryString = params.toString();
    const newPath = queryString
      ? `${ROUTE_PATHS.DASHBOARD_INSIGHTS}?${queryString}`
      : ROUTE_PATHS.DASHBOARD_INSIGHTS;
    router.replace(newPath);
  }, [filters]);

  const updateMutation = useInsightUpdate();
  const runMutation = useInsightRun();

  const { data: domainData } = useConnectorDomains();
  const domainOptions = domainData?.domains.map((d) => ({ value: d.value, label: d.label })) || [];

  const { data, isLoading, error } = useInsightList({
    status: filters.status === "all" ? undefined : (filters.status as "enabled" | "disabled"),
    search: filters.search || undefined,
    domain: filters.domain || undefined,
    sortField: filters.sortField,
    sortDirection: filters.sortDirection,
    page: filters.page,
    pageSize: 20,
  });

  const insights = data?.insights || [];
  const totalPages = data?.total ? Math.ceil(data.total / 20) : 1;

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: ROUTE_PATHS.DASHBOARD },
      { label: tNav("insights"), href: ROUTE_PATHS.DASHBOARD_INSIGHTS },
    ],
    headerContext: (
      <Group justify="space-between">
        <div>
          <Title order={1}>{t("list.pageTitle")}</Title>
          <Text c="dimmed">{t("list.pageSubtitle")}</Text>
        </div>
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={() => router.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_NEW)}
        >
          {t("list.newInsight")}
        </Button>
      </Group>
    ),
  });

  if (error) {
    const errorMessage = getInsightErrorMessage(error);
    return (
      <Container size="xl">
        <Stack gap="md">
          <Title order={2}>{t("list.errorTitle")}</Title>
          <Text c="red">{errorMessage}</Text>
        </Stack>
      </Container>
    );
  }

  const handleToggleEnabled = (insight: InsightOutput) => {
    updateMutation.mutate({
      id: insight.id,
      data: { enabled: !insight.enabled },
    });
  };

  return (
    <Container size="xl">
      <Stack gap="md">
        <Group gap="md">
          <TextInput
            placeholder={t("list.searchPlaceholder")}
            leftSection={<IconSearch size={16} />}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            style={{ flex: 1 }}
          />
          <Select
            placeholder={t("list.filterByStatus")}
            value={filters.status}
            onChange={(value) => setFilters({ ...filters, status: value || "all", page: 1 })}
            data={[
              { value: "all", label: t("status.all") },
              { value: "enabled", label: t("status.enabled") },
              { value: "disabled", label: t("status.disabled") },
            ]}
            style={{ width: 200 }}
          />
          <Select
            placeholder={t("list.filterByDomain")}
            value={filters.domain || undefined}
            onChange={(value) => setFilters({ ...filters, domain: value || "", page: 1 })}
            data={domainOptions}
            clearable
            style={{ width: 180 }}
          />
          <Select
            placeholder={t("list.sortBy")}
            value={`${filters.sortField}-${filters.sortDirection}`}
            onChange={(value) => {
              if (!value) return;
              const [field, direction] = value.split("-") as [
                "name" | "createdAt" | "lastRunAt" | "status",
                "asc" | "desc",
              ];
              setFilters({ ...filters, sortField: field, sortDirection: direction, page: 1 });
            }}
            data={[
              { value: "name-asc", label: t("list.sort.nameAsc") },
              { value: "name-desc", label: t("list.sort.nameDesc") },
              { value: "createdAt-desc", label: t("list.sort.createdAtDesc") },
              { value: "createdAt-asc", label: t("list.sort.createdAtAsc") },
              { value: "lastRunAt-desc", label: t("list.sort.lastRunAtDesc") },
              { value: "lastRunAt-asc", label: t("list.sort.lastRunAtAsc") },
              { value: "status-asc", label: t("list.sort.statusAsc") },
              { value: "status-desc", label: t("list.sort.statusDesc") },
            ]}
            style={{ width: 200 }}
          />
        </Group>

        {isLoading ? (
          <InsightListSkeleton />
        ) : insights.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {insights.map((insight) => (
                <Card key={insight.id} withBorder radius="md" p="md">
                  <Stack gap="xs">
                    <Group justify="space-between">
                      <Group gap="xs">
                        <Badge variant={insight.enabled ? "success" : "default"}>
                          {t(`status.${insight.enabled ? "enabled" : "disabled"}`)}
                        </Badge>
                        {insight.status === "running" && (
                          <Badge
                            variant="blue"
                            leftSection={
                              <span
                                style={{
                                  animation: "spin 1s linear infinite",
                                  display: "inline-block",
                                }}
                              >
                                ⟳
                              </span>
                            }
                          >
                            {t("status.running")}
                          </Badge>
                        )}
                      </Group>
                      <Tooltip label={insight.enabled ? t("list.disable") : t("list.enable")}>
                        <Switch
                          size="sm"
                          checked={insight.enabled}
                          onChange={() => handleToggleEnabled(insight as InsightOutput)}
                          disabled={updateMutation.isPending}
                        />
                      </Tooltip>
                    </Group>
                    <Text fw={600} size="lg">
                      {insight.name}
                    </Text>
                    {insight.description && (
                      <Text size="sm" c="dimmed">
                        {insight.description}
                      </Text>
                    )}
                    <Group gap="xs">
                      {insight.domains && insight.domains.length > 0 ? (
                        insight.domains.map((domain) => (
                          <Badge key={domain} size="sm" variant="outline">
                            {domain}
                          </Badge>
                        ))
                      ) : (
                        <Badge size="sm" variant="outline">
                          {insight.domain || insight.connectors[0]?.connectorId || "Unknown"}
                        </Badge>
                      )}
                      <Badge size="sm" variant="outline">
                        {insight.connectors.length} {t("list.connectors")}
                      </Badge>
                      <ScheduleStatusBadge
                        schedule={
                          scheduleService.getScheduleStatus(null) === "manual"
                            ? null
                            : {
                                id: insight.id,
                                tenantId: insight.tenantId,
                                entityType: "insight",
                                entityId: insight.id,
                                cronExpression: "",
                                timezone: "UTC",
                                enabled: insight.enabled,
                                metadata: {},
                                nextRunAt: null,
                                lastRunAt: null,
                                createdAt: insight.createdAt,
                                updatedAt: insight.createdAt,
                              }
                        }
                      />
                    </Group>
                    <Group gap="xs">
                      <Text size="xs" c="dimmed">
                        {t("list.created")}:
                      </Text>
                      <Text size="xs" c="dimmed">
                        {new Date(insight.createdAt).toLocaleDateString()}
                      </Text>
                    </Group>
                    {insight.lastRunAt ? (
                      <Group gap="xs">
                        <Text size="xs" c="dimmed">
                          {t("list.lastRun")}:
                        </Text>
                        <Text size="xs" c="dimmed">
                          {new Date(insight.lastRunAt).toLocaleString()}
                        </Text>
                      </Group>
                    ) : (
                      <Text size="xs" c="dimmed">
                        {t("list.neverRun")}
                      </Text>
                    )}
                    <Group justify="flex-end" gap="xs">
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() =>
                          router.push(
                            ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL.replace("$id", insight.id),
                          )
                        }
                      >
                        <IconEye size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        onClick={() =>
                          router.push(
                            ROUTE_PATHS.DASHBOARD_INSIGHTS_EDIT.replace("$id", insight.id),
                          )
                        }
                      >
                        <IconSettings size={16} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        size="sm"
                        color="blue"
                        onClick={() => runMutation.mutate({ id: insight.id })}
                        disabled={insight.status === "running"}
                      >
                        <IconPlayerPlay size={16} />
                      </ActionIcon>
                    </Group>
                  </Stack>
                </Card>
              ))}
            </SimpleGrid>

            {totalPages > 1 && (
              <Group justify="center" gap="xs">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === 1}
                  onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                >
                  {t("list.previous")}
                </Button>
                <Text>
                  {t("list.page")} {filters.page} / {totalPages}
                </Text>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={filters.page === totalPages}
                  onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                >
                  {t("list.next")}
                </Button>
              </Group>
            )}
          </>
        )}
      </Stack>
    </Container>
  );
}

export default function InsightListPage() {
  return (
    <PageErrorBoundary pageName="InsightListPage">
      <InsightListContent />
    </PageErrorBoundary>
  );
}
