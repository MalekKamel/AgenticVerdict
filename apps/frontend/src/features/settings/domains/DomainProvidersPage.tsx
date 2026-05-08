"use client";

import { useState } from "react";
import {
  Container,
  Stack,
  Title,
  Paper,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Box,
  Switch,
  Alert,
  Select,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconSettings,
  IconAlertCircle,
  IconArrowRight,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { useAiDomains } from "@/hooks/useAiDomains";
import { showInfoNotification } from "@/lib/notifications";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import type { BusinessDomainWithProviders } from "@agenticverdict/types";

function DomainProviderRow({
  domain,
  onOverride,
  onInherit,
}: {
  domain: BusinessDomainWithProviders;
  onOverride: (domainId: string) => void;
  onInherit: (domainId: string) => void;
}) {
  const t = useTranslations("settings.domains");

  const hasOverride = domain.providerConfig?.scope === "domain";

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Text fw={600} size="lg">
            {domain.name}
          </Text>
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item
                leftSection={<IconSettings size={14} />}
                onClick={() => onOverride(domain.id)}
              >
                {t("providers.overrideProvider")}
              </Menu.Item>
              {hasOverride && (
                <Menu.Item
                  leftSection={<IconArrowRight size={14} />}
                  onClick={() => onInherit(domain.id)}
                >
                  {t("providers.inheritFromTenant")}
                </Menu.Item>
              )}
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Text size="sm" c="dimmed">
          {domain.description || t("common.noDescription")}
        </Text>

        <Group gap="xs">
          {hasOverride ? (
            <Badge color="blue" variant="light">
              {t("providers.usingOverride")}
            </Badge>
          ) : (
            <Badge color="gray" variant="outline">
              {t("providers.inheritedFromTenant")}
            </Badge>
          )}
        </Group>

        {domain.providerConfig && (
          <Box pl="md" mt="xs" style={{ borderLeft: "2px solid #e9ecef" }}>
            <Stack gap="xs">
              <Group gap="xs">
                <IconArrowRight size={16} color="#666" />
                <Text size="sm" fw={500}>
                  {domain.providerConfig.providerName}
                </Text>
              </Group>
              <Group gap="xs">
                <Badge size="xs" variant="outline">
                  {t(`costTier.${domain.providerConfig.costTier || "unknown"}`)}
                </Badge>
                <Switch
                  checked={domain.providerConfig.enabled}
                  disabled
                  size="xs"
                  label={domain.providerConfig.enabled ? t("common.enabled") : t("common.disabled")}
                />
              </Group>
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}

export function DomainProvidersPage() {
  const t = useTranslations("settings.domains");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  useAppShellHeader({
    breadcrumbs: [
      { label: t("common.settings"), href: ROUTE_PATHS.SETTINGS_DOMAINS },
      { label: t("providers.pageTitle") },
    ],
  });

  const { data: domains, isLoading, error } = useAiDomains();

  const handleOverride = (domainId: string) => {
    const domainName = domains?.find((domain) => domain.id === domainId)?.name;
    showInfoNotification({
      title: t("providers.overrideProvider"),
      message: domainName ?? t("providers.info"),
    });
  };

  const handleInherit = (domainId: string) => {
    const domainName = domains?.find((domain) => domain.id === domainId)?.name;
    showInfoNotification({
      title: t("providers.inheritFromTenant"),
      message: domainName ?? t("providers.info"),
    });
  };

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
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>{t("providers.pageTitle")}</Title>
          <Text size="sm" c="dimmed">
            {t("providers.description")}
          </Text>
        </Group>

        {/* Info Alert */}
        <Alert icon={<IconAlertCircle size={20} />} color="blue">
          {t("providers.info")}
        </Alert>

        {/* Filters */}
        <Group gap="md">
          <Select
            placeholder={t("filters.status")}
            data={[
              { value: "override", label: t("status.override") },
              { value: "inherited", label: t("status.inherited") },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: 200 }}
          />
        </Group>

        {/* Domain List */}
        {isLoading ? (
          <Stack gap="md">
            {[1, 2, 3].map((i) => (
              <Paper key={i} p="md" withBorder>
                <Stack gap="xs">
                  <Box style={{ height: 24, width: 200, background: "#e9ecef", borderRadius: 4 }} />
                  <Box style={{ height: 16, width: 300, background: "#f1f3f5", borderRadius: 4 }} />
                  <Box style={{ height: 20, width: 150, background: "#e9ecef", borderRadius: 4 }} />
                </Stack>
              </Paper>
            ))}
          </Stack>
        ) : domains && domains.length > 0 ? (
          <Stack gap="md">
            {domains?.map((domain: BusinessDomainWithProviders) => (
              <DomainProviderRow
                key={domain.id}
                domain={domain}
                onOverride={handleOverride}
                onInherit={handleInherit}
              />
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconAlertCircle size={20} />} color="yellow">
            {t("messages.noDomains")}
          </Alert>
        )}
      </Stack>
    </Container>
  );
}
