"use client";

import { Stack, Group, Box, Text, Badge, Button, Checkbox } from "@mantine/core";
import { IconPlugConnected, IconPlugX, IconPlus } from "@tabler/icons-react";
import { useFormContext } from "react-hook-form";

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
        <Text c="dimmed">Loading connectors...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="red">Failed to load connectors</Text>
        <Button variant="outline" size="sm" onClick={onManageConnectors}>
          Try Again
        </Button>
      </Stack>
    );
  }

  if (connectors.length === 0) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="dimmed">No connectors available</Text>
        <Button leftSection={<IconPlus size={16} />} onClick={onManageConnectors}>
          Add Connector
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text fw={500}>Select Connectors</Text>
        <Button variant="subtle" size="sm" onClick={onManageConnectors}>
          Manage Connectors
        </Button>
      </Group>

      {connectors.map((connector) => (
        <Box
          key={connector.id}
          p="md"
          style={{
            border: "1px solid #e9ecef",
            borderRadius: 8,
            backgroundColor: selectedIds.includes(connector.id) ? "#f8f9fa" : "transparent",
          }}
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
                    {connector.isHealthy ? "Connected" : "Disconnected"}
                  </Badge>
                </Group>
                <Text size="sm" c="dimmed">
                  {connector.type}
                  {connector.lastSyncedAt &&
                    ` • Last synced: ${connector.lastSyncedAt.toLocaleDateString()}`}
                </Text>
              </Stack>
            </Group>
          </Group>
        </Box>
      ))}

      {errors.connectorIds && (
        <Text size="sm" c="red">
          {errors.connectorIds.message}
        </Text>
      )}
    </Stack>
  );
}
