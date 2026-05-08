"use client";

import {
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  ThemeIcon,
  Box,
  Divider,
  Tooltip,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconFolder,
  IconUsers,
  IconSettings,
  IconArrowRight,
  IconHeartCancel,
} from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import type { BusinessDomainWithProviders } from "@agenticverdict/types";

interface DomainCardProps {
  domain: BusinessDomainWithProviders;
  onEdit?: (domain: BusinessDomainWithProviders) => void;
  onDelete?: (domain: BusinessDomainWithProviders) => void;
  onOverrideProvider?: (domainId: string) => void;
  onRevertToInherited?: (domainId: string) => void;
  showProviderInfo?: boolean;
  readOnly?: boolean;
}

export function DomainCard({
  domain,
  onEdit,
  onDelete,
  onOverrideProvider,
  onRevertToInherited,
  showProviderInfo = true,
  readOnly = false,
}: DomainCardProps) {
  const t = useTranslations("components.domainCard");

  const hasOverride = domain.providerConfig?.scope === "domain";

  const handleOverride = () => {
    if (onOverrideProvider) {
      onOverrideProvider(domain.id);
    }
  };

  const handleRevert = () => {
    if (onRevertToInherited) {
      onRevertToInherited(domain.id);
    }
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        {/* Header with icon and actions */}
        <Group justify="space-between">
          <Group gap="xs">
            <ThemeIcon size="lg" variant="light" color="blue" style={{ borderRadius: 8 }}>
              <IconFolder size={20} />
            </ThemeIcon>
            <Text fw={600} size="lg" lineClamp={1}>
              {domain.name}
            </Text>
          </Group>

          {!readOnly && (
            <Menu withinPortal>
              <Menu.Target>
                <ActionIcon variant="subtle" size="sm">
                  <IconDotsVertical size={16} />
                </ActionIcon>
              </Menu.Target>
              <Menu.Dropdown>
                {onEdit && (
                  <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(domain)}>
                    {t("actions.edit")}
                  </Menu.Item>
                )}
                {showProviderInfo && onOverrideProvider && (
                  <Menu.Item leftSection={<IconSettings size={14} />} onClick={handleOverride}>
                    {hasOverride ? t("actions.editOverride") : t("actions.overrideProvider")}
                  </Menu.Item>
                )}
                {hasOverride && onRevertToInherited && (
                  <Menu.Item leftSection={<IconHeartCancel size={14} />} onClick={handleRevert}>
                    {t("actions.revertToInherited")}
                  </Menu.Item>
                )}
                <Divider />
                {onDelete && (
                  <Menu.Item
                    color="red"
                    leftSection={<IconTrash size={14} />}
                    onClick={() => onDelete(domain)}
                  >
                    {t("actions.delete")}
                  </Menu.Item>
                )}
              </Menu.Dropdown>
            </Menu>
          )}
        </Group>

        {/* Description */}
        {domain.description && (
          <Text size="sm" c="dimmed">
            {domain.description}
          </Text>
        )}

        {/* Metadata badges */}
        <Group gap="xs">
          <Badge variant="outline" leftSection={<IconUsers size={12} />}>
            {t("badges.connectors", { count: domain.connectorCount || 0 })}
          </Badge>

          {showProviderInfo && (
            <>
              {hasOverride ? (
                <Badge color="blue" variant="light" size="sm">
                  {t("provider.override")}
                </Badge>
              ) : (
                <Badge color="gray" variant="outline" size="sm">
                  {t("provider.inherited")}
                </Badge>
              )}
            </>
          )}
        </Group>

        {/* Provider configuration info */}
        {showProviderInfo && domain.providerConfig && (
          <Box
            pl="md"
            mt="xs"
            style={{
              borderLeft: `2px solid ${hasOverride ? "#228be6" : "#adb5bd"}`,
              backgroundColor: hasOverride ? "#f8f9fa" : "transparent",
              borderRadius: 4,
              padding: 8,
            }}
          >
            <Stack gap="xs">
              <Group gap="xs">
                <IconArrowRight size={16} color="#666" />
                <Text size="sm" fw={500}>
                  {domain.providerConfig.providerName}
                </Text>
              </Group>

              <Group gap="xs">
                {domain.providerConfig.costTier && (
                  <Badge
                    size="xs"
                    variant="outline"
                    color={
                      domain.providerConfig.costTier === "premium"
                        ? "blue"
                        : domain.providerConfig.costTier === "standard"
                          ? "yellow"
                          : "green"
                    }
                  >
                    {t(`costTier.${domain.providerConfig.costTier}`)}
                  </Badge>
                )}

                <Tooltip
                  label={
                    domain.providerConfig.enabled ? t("provider.enabled") : t("provider.disabled")
                  }
                >
                  <Badge
                    size="xs"
                    color={domain.providerConfig.enabled ? "green" : "gray"}
                    variant="light"
                  >
                    {domain.providerConfig.enabled ? t("common.enabled") : t("common.disabled")}
                  </Badge>
                </Tooltip>
              </Group>

              {hasOverride && (
                <Text size="xs" c="dimmed" mt="xs">
                  {t("provider.overrideInfo")}
                </Text>
              )}
            </Stack>
          </Box>
        )}
      </Stack>
    </Paper>
  );
}
