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
} from "@mantine/core";
import { useSearch } from "@/router/hooks/useSearch";
import { useRouter } from "@/i18n/navigation";
import {
  IconSearch,
  IconPlus,
  IconRefresh,
  IconDotsVertical,
  IconTrash,
  IconSettings,
  IconEye,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { useConnectorPermissions } from "@/features/connectors/hooks/useConnectorPermissions";
import { useConnectorList, useConnectorSync } from "@/features/connectors/api/connector-api";
import { StatusIndicator } from "@agenticverdict/ui";
import type { ConnectorListItem } from "@agenticverdict/types";

function ConnectorCard({ connector }: { connector: ConnectorListItem }) {
  const t = useTranslations("connectors");
  const perms = useConnectorPermissions();
  const router = useRouter();
  const syncMutation = useConnectorSync();

  const isSyncing = syncMutation.isPending || connector.status === "syncing";

  return (
    <Box p="md" style={{ border: "1px solid #e9ecef", borderRadius: 8 }}>
      <Stack gap="xs">
        <Group justify="space-between">
          <StatusIndicator
            variant={connector.status === "syncing" ? "healthy" : connector.status}
            label={t(`status.${connector.status === "syncing" ? "syncing" : connector.status}`)}
          />
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconEye size={14} />}
                onClick={() => router.push(`/dashboard/connectors/${connector.id}`)}
              >
                {t("list.actions.viewDetails")}
              </Menu.Item>
              {perms.canSync && (
                <Menu.Item
                  leftSection={<IconRefresh size={14} />}
                  onClick={() => syncMutation.mutate({ id: connector.id })}
                  disabled={isSyncing}
                >
                  {t("list.actions.syncNow")}
                </Menu.Item>
              )}
              {perms.canConfigure && (
                <Menu.Item
                  leftSection={<IconSettings size={14} />}
                  onClick={() => router.push(`/dashboard/connectors/${connector.id}/configure`)}
                >
                  {t("common.configure")}
                </Menu.Item>
              )}
              {perms.canRemove && (
                <Menu.Item
                  color="red"
                  leftSection={<IconTrash size={14} />}
                  onClick={() => router.push(`/dashboard/connectors/${connector.id}/remove`)}
                >
                  {t("list.actions.disconnect")}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>
        <Text fw={600} size="lg">
          {connector.name}
        </Text>
        <Badge size="sm" variant="outline">
          {connector.platform.toUpperCase()}
        </Badge>
        {connector.domain ? (
          <Text size="sm" c="dimmed">
            {connector.domain}
          </Text>
        ) : null}
        {connector.lastSyncAt ? (
          <Text size="xs" c="dimmed">
            {t("list.card.lastSync", { date: new Date(connector.lastSyncAt).toLocaleString() })}
          </Text>
        ) : (
          <Text size="xs" c="dimmed">
            {t("list.card.noSyncHistory")}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

function ConnectorCardSkeleton() {
  return (
    <Box p="md" style={{ border: "1px solid #e9ecef", borderRadius: 8 }}>
      <Stack gap="xs">
        <Skeleton height={20} width="60%" />
        <Skeleton height={24} width="80%" />
        <Skeleton height={16} width="40%" />
        <Skeleton height={16} width="70%" />
      </Stack>
    </Box>
  );
}

export default function ConnectorListPage() {
  const tNav = useTranslations("navigation");
  const tActions = useTranslations("actions");
  const t = useTranslations("connectors");
  const perms = useConnectorPermissions();
  const router = useRouter();
  const search = useSearch({ from: "/$locale/dashboard/connectors/" }) as Record<string, unknown>;

  const [statusFilter, setStatusFilter] = useState<
    "healthy" | "warning" | "error" | "inactive" | "syncing" | null
  >((search.status as "healthy" | "warning" | "error" | "inactive" | "syncing") ?? null);
  const [domainFilter, setDomainFilter] = useState<string | null>(
    (search.domain as string) ?? null,
  );
  const [searchQuery, setSearchQuery] = useState<string>((search.search as string) ?? "");

  const { data, isLoading } = useConnectorList({
    status: statusFilter ?? undefined,
    domain: domainFilter ?? undefined,
    search: searchQuery || undefined,
    page: 1,
    pageSize: 50,
  });

  useAppShellHeader({
    breadcrumbs: [
      { label: tNav("dashboard"), href: "/dashboard" },
      { label: tNav("connectors"), href: "/dashboard/connectors" },
    ],
  });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const uniqueDomains = Array.from(
    new Set(items.map((c) => c.domain).filter((d): d is string => d !== null && d.length > 0)),
  ).sort();

  return (
    <Container py="xl" size="xl">
      <Stack gap="lg">
        <Group justify="space-between">
          <Text size="xl" fw={700}>
            {t("common.title")}
          </Text>
          {perms.canAdd && (
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={() => router.push("/dashboard/connectors/add")}
            >
              {t("list.actions.addConnector")}
            </Button>
          )}
        </Group>

        <Group>
          <Select
            placeholder={t("list.filters.allStatuses")}
            data={[
              { value: "healthy", label: t("status.healthy") },
              { value: "warning", label: t("status.warning") },
              { value: "inactive", label: t("status.inactive") },
            ]}
            value={statusFilter}
            onChange={(value) => setStatusFilter(value as typeof statusFilter)}
            clearable
            style={{ minWidth: 160 }}
          />
          <Select
            placeholder={t("list.filters.allDomains")}
            data={uniqueDomains.map((d) => ({ value: d, label: d }))}
            value={domainFilter}
            onChange={setDomainFilter}
            clearable
            style={{ minWidth: 160 }}
          />
          <TextInput
            placeholder={t("list.filters.searchPlaceholder")}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {(statusFilter || domainFilter || searchQuery) && (
            <Button
              variant="subtle"
              onClick={() => {
                setStatusFilter(null);
                setDomainFilter(null);
                setSearchQuery("");
              }}
            >
              {tActions("clear")}
            </Button>
          )}
        </Group>

        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
            {Array.from({ length: 6 }).map((_, i) => (
              <ConnectorCardSkeleton key={i} />
            ))}
          </SimpleGrid>
        ) : items.length === 0 ? (
          total === 0 ? (
            <Center py="xl">
              <Stack align="center" gap="sm">
                <Text c="dimmed">{t("list.empty.noConnectors")}</Text>
                {perms.canAdd && (
                  <Button
                    leftSection={<IconPlus size={16} />}
                    onClick={() => router.push("/dashboard/connectors/add")}
                  >
                    {t("list.actions.addFirstConnector")}
                  </Button>
                )}
              </Stack>
            </Center>
          ) : (
            <Center py="xl">
              <Stack align="center" gap="sm">
                <Text c="dimmed">{t("list.empty.noFilteredResults")}</Text>
                <Button
                  variant="subtle"
                  onClick={() => {
                    setStatusFilter(null);
                    setDomainFilter(null);
                    setSearchQuery("");
                  }}
                >
                  {tActions("clear")}
                </Button>
              </Stack>
            </Center>
          )
        ) : (
          <>
            <Text size="sm" c="dimmed">
              {t("list.results.showing", { shown: items.length, total })}
            </Text>
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
              {items.map((connector) => (
                <ConnectorCard key={connector.id} connector={connector} />
              ))}
            </SimpleGrid>
          </>
        )}
      </Stack>
    </Container>
  );
}
