"use client";

import { useState } from "react";
import {
  Box,
  SimpleGrid,
  Paper,
  Stack,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Switch,
  Tooltip,
  ThemeIcon,
} from "@mantine/core";
import {
  IconDotsVertical,
  IconSettings,
  IconCheck,
  IconBolt,
  IconAlertCircle,
  IconWorld,
  IconBrandOpenai,
  IconBrain,
} from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import { useTestAiProviderConnection } from "@/hooks/useAiProviders";
import type { AiProviderDetail } from "@agenticverdict/types";

const providerIcons: Record<string, React.ReactNode> = {
  openai: <IconBrandOpenai size={24} />,
  anthropic: <IconBrain size={24} />,
  default: <IconWorld size={24} />,
};

interface ProviderGridProps {
  providers: AiProviderDetail[];
  onEdit?: (provider: AiProviderDetail) => void;
  onDelete?: (provider: AiProviderDetail) => void;
  onToggle?: (provider: AiProviderDetail) => void;
  readOnly?: boolean;
}

export function ProviderGrid({
  providers,
  onEdit,
  onDelete,
  onToggle,
  readOnly = false,
}: ProviderGridProps) {
  const t = useTranslations("components.providerGrid");
  const testMutation = useTestAiProviderConnection();

  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTestConnection = async (provider: AiProviderDetail) => {
    setTestingId(provider.id);
    try {
      await testMutation.mutateAsync({ providerId: provider.id });
    } finally {
      setTestingId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "green";
      case "unhealthy":
        return "red";
      default:
        return "gray";
    }
  };

  const getCostTierColor = (tier?: string) => {
    switch (tier) {
      case "premium":
        return "blue";
      case "standard":
        return "yellow";
      case "economy":
        return "green";
      default:
        return "gray";
    }
  };

  if (!providers || providers.length === 0) {
    return (
      <Box py="xl">
        <Text c="dimmed" ta="center">
          {t("noProviders")}
        </Text>
      </Box>
    );
  }

  return (
    <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
      {providers.map((provider) => (
        <Paper key={provider.id} p="md" withBorder>
          <Stack gap="xs">
            {/* Header with icon and menu */}
            <Group justify="space-between">
              <ThemeIcon size="lg" variant="light" color="blue" style={{ borderRadius: 8 }}>
                {providerIcons[provider.providerType as keyof typeof providerIcons] ||
                  providerIcons.default}
              </ThemeIcon>

              {!readOnly && (
                <Menu withinPortal>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="sm">
                      <IconDotsVertical size={16} />
                    </ActionIcon>
                  </Menu.Target>
                  <Menu.Dropdown>
                    {onEdit && (
                      <Menu.Item
                        leftSection={<IconSettings size={14} />}
                        onClick={() => onEdit(provider)}
                      >
                        {t("actions.edit")}
                      </Menu.Item>
                    )}
                    <Menu.Item
                      leftSection={<IconBolt size={14} />}
                      onClick={() => handleTestConnection(provider)}
                      disabled={testingId === provider.id}
                    >
                      {t("actions.testConnection")}
                    </Menu.Item>
                    {onDelete && (
                      <Menu.Item
                        color="red"
                        leftSection={<IconAlertCircle size={14} />}
                        onClick={() => onDelete(provider)}
                      >
                        {t("actions.delete")}
                      </Menu.Item>
                    )}
                  </Menu.Dropdown>
                </Menu>
              )}
            </Group>

            {/* Provider name and type */}
            <Stack gap="xs">
              <Text fw={600} size="lg" lineClamp={1}>
                {provider.name}
              </Text>
              <Text size="sm" c="dimmed">
                {provider.providerType}
              </Text>
            </Stack>

            {/* Badges */}
            <Group gap="xs">
              <Badge color={getStatusColor(provider.status)} variant="light" size="sm">
                {t(`status.${provider.status}`)}
              </Badge>

              {provider.costTier && (
                <Badge color={getCostTierColor(provider.costTier)} variant="outline" size="sm">
                  {t(`costTier.${provider.costTier}`)}
                </Badge>
              )}

              {provider.isDefault && (
                <Badge color="blue" variant="light" size="sm">
                  {t("badges.default")}
                </Badge>
              )}
            </Group>

            {/* Enabled toggle */}
            {!readOnly && onToggle && (
              <Group justify="space-between" mt="xs">
                <Text size="sm">{t("common.enabled")}</Text>
                <Switch checked={provider.enabled} onChange={() => onToggle(provider)} size="sm" />
              </Group>
            )}

            {/* Connection test result */}
            {testingId === provider.id && (
              <Text size="xs" c="blue">
                {t("messages.testingConnection")}
              </Text>
            )}

            {testMutation.error && testingId === provider.id && (
              <Group gap="xs" c="red">
                <IconAlertCircle size={14} />
                <Text size="xs">{t("messages.connectionFailed")}</Text>
              </Group>
            )}

            {testMutation.isSuccess && testingId === provider.id && (
              <Group gap="xs" c="green">
                <IconCheck size={14} />
                <Text size="xs">{t("messages.connectionSuccess")}</Text>
              </Group>
            )}

            {/* Tooltip for long descriptions */}
            {provider.description && (
              <Tooltip label={provider.description} withArrow>
                <Text size="xs" c="dimmed" lineClamp={2}>
                  {provider.description}
                </Text>
              </Tooltip>
            )}
          </Stack>
        </Paper>
      ))}
    </SimpleGrid>
  );
}
