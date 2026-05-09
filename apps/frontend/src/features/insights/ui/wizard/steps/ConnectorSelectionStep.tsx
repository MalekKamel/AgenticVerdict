"use client";

import { Stack, Group, Text, Badge, Button, Checkbox, Card } from "@mantine/core";
import { IconPlugConnected, IconPlugX, IconPlus } from "@tabler/icons-react";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "@/i18n/react";

interface Connector {
  id: string;
  name: string;
  type: string;
  isHealthy: boolean;
  lastSyncedAt: Date | null;
}

interface ConnectorSelectionValues {
  connectorIds: string[];
}

interface ConnectorSelectionStepProps {
  connectors: Connector[];
  onManageConnectors: () => void;
  onConnectorsChange?: (connectorIds: string[]) => void;
  loading?: boolean;
  error?: unknown | null;
}

export function ConnectorSelectionStep({
  connectors,
  onManageConnectors,
  onConnectorsChange,
  loading,
  error,
}: ConnectorSelectionStepProps) {
  const t = useTranslations("insights");
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<ConnectorSelectionValues>();

  const selectedIds = watch("connectorIds") || [];

  const handleConnectorToggle = (connectorId: string, isChecked: boolean) => {
    const updated = isChecked
      ? [...selectedIds, connectorId]
      : selectedIds.filter((id: string) => id !== connectorId);
    setValue("connectorIds", updated, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    onConnectorsChange?.(updated);
  };

  if (loading) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="dimmed">{t("wizard.steps.connectors.loading")}</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="red">{t("wizard.steps.connectors.error")}</Text>
        <Button variant="outline" size="sm" onClick={onManageConnectors}>
          {t("wizard.steps.connectors.tryAgain")}
        </Button>
      </Stack>
    );
  }

  if (connectors.length === 0) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="dimmed">{t("wizard.steps.connectors.empty")}</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={onManageConnectors}>
          {t("wizard.steps.connectors.addConnector")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>{t("wizard.steps.connectors.selectTitle")}</Text>
        <Button variant="subtle" size="sm" onClick={onManageConnectors}>
          {t("wizard.steps.connectors.manage")}
        </Button>
      </Group>

      {connectors.map((connector) => (
        <Card
          key={connector.id}
          withBorder
          radius="md"
          p="md"
          bg={selectedIds.includes(connector.id) ? "var(--mantine-color-gray-0)" : "transparent"}
        >
          <Group justify="space-between">
            <Group gap="md">
              <Checkbox
                checked={selectedIds.includes(connector.id)}
                onChange={(e) => handleConnectorToggle(connector.id, e.currentTarget.checked)}
              />
              <Stack gap={2}>
                <Group gap="xs">
                  <Text fw={500}>{connector.name}</Text>
                  <Badge
                    size="sm"
                    variant={connector.isHealthy ? "success" : "danger"}
                    leftSection={
                      connector.isHealthy ? (
                        <IconPlugConnected size={12} />
                      ) : (
                        <IconPlugX size={12} />
                      )
                    }
                  >
                    {connector.isHealthy
                      ? t("wizard.steps.connectors.connected")
                      : t("wizard.steps.connectors.disconnected")}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {connector.type}
                  {connector.lastSyncedAt &&
                    ` • ${t("wizard.steps.connectors.lastSynced")}: ${connector.lastSyncedAt.toLocaleDateString()}`}
                </Text>
              </Stack>
            </Group>
          </Group>
        </Card>
      ))}

      {errors.connectorIds && (
        <Text size="sm" c="red">
          {errors.connectorIds.message}
        </Text>
      )}
    </Stack>
  );
}
