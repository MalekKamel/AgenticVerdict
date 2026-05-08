"use client";

import { useState } from "react";
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
  Menu,
  Box,
  Center,
  Title,
} from "@mantine/core";
import { useSearch } from "@/router/hooks/useSearch";
import { useRouter } from "@/i18n/navigation";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import {
  IconSearch,
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconSettings,
  IconEye,
  IconPlayerPlay,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import {
  useInsightList,
  useInsightDelete,
  useInsightRun,
} from "@/features/insights/api/insight-api";
import { PageErrorBoundary } from "@/components/error-boundaries";
import { getInsightErrorMessage } from "../utils/error-translator";
import type { InsightListItem } from "../schemas";

function InsightCard({ insight: insightRaw }: { insight: InsightListItem }) {
  const t = useTranslations("insights");
  const router = useRouter();
  const deleteMutation = useInsightDelete();
  const runMutation = useInsightRun();

  const insight = insightRaw as InsightListItem;

  const status = insight.enabled ? "enabled" : "disabled";
  const isRunning = insight.status === "running";
  const connectorCount = insight.connectors.length;
  const domain =
    (insight as { domain?: string }).domain || insight.connectors[0]?.connectorId || "Unknown";
  const lastRunAt = insight.lastRunAt;
  const lastRunStatus = insight.lastRunStatus || "idle";

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "enabled":
        return "success";
      case "disabled":
        return "default";
      case "running":
        return "blue";
      case "failed":
        return "red";
      default:
        return "default";
    }
  };

  return (
    <Box p="md" style={{ border: "1px solid #e9ecef", borderRadius: 8 }}>
      <Stack gap="xs">
        <Group justify="space-between">
          <Group gap="xs">
            <Badge variant={getStatusVariant(status)}>{t(`status.${status}`)}</Badge>
            {isRunning && (
              <Badge
                variant="blue"
                leftSection={
                  <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>
                    ⟳
                  </span>
                }
              >
                {t("status.running")}
              </Badge>
            )}
            {lastRunStatus && lastRunStatus !== "idle" && !isRunning && (
              <Badge variant={lastRunStatus === "completed" ? "success" : "red"}>
                {t(`list.lastRunStatus.${lastRunStatus}`)}
              </Badge>
            )}
          </Group>
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() =>
                  router.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_DETAIL.replace("$id", insight.id))
                }
              >
                {t("list.actions.viewDetails")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconPlayerPlay size={14} />}
                onClick={() => runMutation.mutate({ id: insight.id })}
                disabled={isRunning}
              >
                {t("list.actions.runNow")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconSettings size={14} />}
                onClick={() =>
                  router.push(ROUTE_PATHS.DASHBOARD_INSIGHTS_EDIT.replace("$id", insight.id))
                }
              >
                {t("list.actions.edit")}
              </Menu.Item>
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => {
                  if (confirm(t("list.actions.deleteConfirm"))) {
                    deleteMutation.mutate({ id: insight.id });
                  }
                }}
              >
                {t("list.actions.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
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
          <Badge size="sm" variant="outline">
            {domain}
          </Badge>
          <Badge size="sm" variant="outline">
            {connectorCount} {t("list.connectors")}
          </Badge>
        </Group>
        <Group gap="xs" style={{ fontSize: 12, color: "#6c757d" }}>
          <Text>{t("list.created")}:</Text>
          <Text>{new Date(insight.createdAt).toLocaleDateString()}</Text>
        </Group>
        {lastRunAt ? (
          <Group gap="xs" style={{ fontSize: 12, color: "#6c757d" }}>
            <Text>{t("list.lastRun")}:</Text>
            <Text>{new Date(lastRunAt).toLocaleString()}</Text>
          </Group>
        ) : (
          <Text size="xs" c="dimmed">
            {t("list.neverRun")}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

function InsightListSkeleton() {
  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
      {[...Array(6)].map((_, i) => (
        <Box key={i} p="md" style={{ border: "1px solid #e9ecef", borderRadius: 8 }}>
          <Stack gap="xs">
            <Skeleton height={20} width={100} />
            <Skeleton height={30} />
            <Skeleton height={20} />
            <Group gap="xs">
              <Skeleton height={20} width={80} />
              <Skeleton height={20} width={80} />
            </Group>
          </Stack>
        </Box>
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
  });

  const { data, isLoading, error } = useInsightList({
    status: filters.status === "all" ? undefined : (filters.status as "enabled" | "disabled"),
    search: filters.search || undefined,
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
        </Group>

        {isLoading ? (
          <InsightListSkeleton />
        ) : insights.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }}>
              {insights.map((insight) => (
                <InsightCard key={insight.id} insight={insight as InsightListItem} />
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
