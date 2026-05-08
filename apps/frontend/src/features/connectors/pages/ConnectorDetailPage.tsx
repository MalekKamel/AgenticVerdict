"use client";

import { useEffect, useState } from "react";
import {
  Container,
  Stack,
  Group,
  Text,
  Button,
  Badge,
  Table,
  Skeleton,
  Card,
  Box,
  SimpleGrid,
} from "@mantine/core";
import { useParams } from "@/router/hooks/useParams";
import { useRouter } from "@/i18n/navigation";
import { IconSettings, IconRefresh, IconCheck } from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useConnectorDetail, useConnectorSync } from "@/features/connectors/api/connector-api";
import { useConnectorPermissions } from "@/features/connectors/hooks/useConnectorPermissions";
import { useAiDomains } from "@/hooks/useAiDomains";
import { useTranslations } from "@/i18n/react";
import { StatusIndicator, DataFreshnessBadge } from "@agenticverdict/ui";

export default function ConnectorDetailPage() {
  const tNav = useTranslations("navigation");
  const t = useTranslations("connectors");
  const params = useParams({ from: "/$locale/dashboard/connectors/$id" }) as { id: string };
  const { id } = params;
  const router = useRouter();
  const perms = useConnectorPermissions();
  const { data, isLoading, refetch } = useConnectorDetail(id);
  const syncMutation = useConnectorSync();
  const { data: domainsData } = useAiDomains();
  const [polling, setPolling] = useState(false);

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("connectors"), href: "/dashboard/connectors" },
      { label: data?.name ?? t("common.connector"), href: `/dashboard/connectors/${id}` },
    ],
  });

  useEffect(() => {
    if (data?.status === "syncing") {
      setPolling(true);
      const interval = setInterval(() => {
        void refetch();
      }, 5000);
      return () => clearInterval(interval);
    }
    setPolling(false);
  }, [data?.status, refetch]);

  if (isLoading) {
    return (
      <Container py="xl" size="xl">
        <Stack gap="lg">
          <Skeleton height={40} width="40%" />
          <Skeleton height={200} />
          <Skeleton height={200} />
        </Stack>
      </Container>
    );
  }

  if (!data) {
    return (
      <Container py="xl" size="xl">
        <Text>{t("common.notFound")}</Text>
        <Button onClick={() => router.push("/dashboard/connectors")}>
          {t("detail.actions.backToConnectors")}
        </Button>
      </Container>
    );
  }

  return (
    <Container py="xl" size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Stack gap={0}>
            <Text size="xl" fw={700}>
              {data.name}
            </Text>
            <Group gap="xs">
              <StatusIndicator
                variant={data.status === "syncing" ? "healthy" : data.status}
                label={t(`status.${data.status === "syncing" ? "syncing" : data.status}`)}
              />
              <Badge size="sm" variant="outline">
                {data.platform.toUpperCase()}
              </Badge>
              {data.domainId ? (
                <Text size="sm" c="dimmed">
                  {domainsData?.find((d) => d.id === data.domainId)?.name ?? data.domainId}
                </Text>
              ) : null}
            </Group>
          </Stack>
          <Group>
            {perms.canSync && (
              <Button
                leftSection={<IconRefresh size={16} />}
                loading={syncMutation.isPending}
                disabled={data.status === "syncing"}
                onClick={() => syncMutation.mutate({ id: data.id })}
              >
                {t("list.actions.syncNow")}
              </Button>
            )}
            {perms.canConfigure && (
              <Button
                leftSection={<IconSettings size={16} />}
                variant="default"
                onClick={() => router.push(`/dashboard/connectors/${id}/configure`)}
              >
                {t("common.configure")}
              </Button>
            )}
          </Group>
        </Group>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Text fw={600}>{t("detail.sections.health")}</Text>
            <Group>
              <StatusIndicator
                variant={data.status === "syncing" ? "healthy" : data.status}
                label={t(`status.${data.status === "syncing" ? "syncing" : data.status}`)}
              />
              <DataFreshnessBadge
                lastSyncAt={data.lastSyncAt}
                labels={{
                  "real-time": t("freshness.realTime"),
                  recent: t("freshness.recent"),
                  stale: t("freshness.stale"),
                  outdated: t("freshness.outdated"),
                }}
              />
            </Group>
            {data.lastSyncAt && (
              <Text size="sm" c="dimmed">
                {t("detail.health.lastSync", { date: new Date(data.lastSyncAt).toLocaleString() })}
              </Text>
            )}
            {data.nextSyncAt && (
              <Text size="sm" c="dimmed">
                {t("detail.health.nextSync", { date: new Date(data.nextSyncAt).toLocaleString() })}
              </Text>
            )}
            {polling && (
              <Badge color="blue" variant="light" size="sm">
                {t("status.syncing")}
              </Badge>
            )}
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Text fw={600}>{t("detail.sections.recentData")}</Text>
            {data.recentData.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("detail.recentData.empty")}
              </Text>
            ) : (
              <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
                {data.recentData.map((d) => (
                  <Box key={d.metric}>
                    <Text size="xs" c="dimmed">
                      {d.metric}
                    </Text>
                    <Text fw={600}>{d.value}</Text>
                    <Text size="xs" c={d.delta >= 0 ? "green" : "red"}>
                      {d.delta >= 0 ? "+" : ""}
                      {d.delta}%
                    </Text>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600}>{t("detail.sections.syncHistory")}</Text>
              {data.syncHistory.length > 0 && (
                <Button variant="subtle" size="xs">
                  {t("detail.actions.viewAll")}
                </Button>
              )}
            </Group>
            {data.syncHistory.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("detail.syncHistory.empty")}
              </Text>
            ) : (
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>{t("detail.syncHistory.columns.date")}</Table.Th>
                    <Table.Th>{t("detail.syncHistory.columns.status")}</Table.Th>
                    <Table.Th>{t("detail.syncHistory.columns.records")}</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {data.syncHistory.slice(0, 10).map((entry) => (
                    <Table.Tr key={entry.id}>
                      <Table.Td>{new Date(entry.startedAt).toLocaleString()}</Table.Td>
                      <Table.Td>
                        <Badge
                          color={
                            entry.status === "success"
                              ? "green"
                              : entry.status === "warning"
                                ? "yellow"
                                : "red"
                          }
                          size="sm"
                        >
                          {entry.status}
                        </Badge>
                      </Table.Td>
                      <Table.Td>{entry.records ?? "—"}</Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            )}
          </Stack>
        </Card>

        <Card withBorder padding="md">
          <Stack gap="xs">
            <Group justify="space-between">
              <Text fw={600}>{t("detail.sections.connectedMetrics")}</Text>
              <Button
                variant="subtle"
                size="xs"
                onClick={() => router.push(`/dashboard/connectors/${id}/configure`)}
              >
                {t("detail.actions.manage")}
              </Button>
            </Group>
            {data.activeMetrics.length === 0 ? (
              <Text size="sm" c="dimmed">
                {t("detail.connectedMetrics.empty")}
              </Text>
            ) : (
              <Group gap="xs">
                {data.activeMetrics.map((m) => (
                  <Badge key={m} leftSection={<IconCheck size={12} />} variant="light" size="sm">
                    {m}
                  </Badge>
                ))}
              </Group>
            )}
          </Stack>
        </Card>

        {data.issues.length > 0 && (
          <Card withBorder padding="md">
            <Stack gap="xs">
              <Text fw={600}>{t("detail.sections.troubleshooting")}</Text>
              {data.issues.map((issue) => (
                <Group key={issue.id} justify="space-between">
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {issue.title}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {issue.description}
                    </Text>
                  </Stack>
                  {issue.actionLabel && issue.actionHref && (
                    <Button
                      size="xs"
                      variant="light"
                      component="a"
                      href={issue.actionHref ?? undefined}
                    >
                      {issue.actionLabel}
                    </Button>
                  )}
                </Group>
              ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Container>
  );
}
