"use client";

import { Stack, Group, Box, Text, Checkbox, ScrollArea, Divider } from "@mantine/core";
import { useFormContext } from "react-hook-form";

interface Metric {
  id: string;
  name: string;
  description?: string;
}

interface ConnectorMetrics {
  connectorId: string;
  connectorName: string;
  metrics: Metric[];
}

interface MetricConfigValues {
  selectedMetrics: Record<string, string[]>;
}

interface MetricConfigurationStepProps {
  connectorMetrics: ConnectorMetrics[];
  loading?: boolean;
}

export function MetricConfigurationStep({
  connectorMetrics,
  loading,
}: MetricConfigurationStepProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = useFormContext<MetricConfigValues>();

  const selectedMetrics = watch("selectedMetrics") || {};

  if (loading) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="dimmed">Loading metrics...</Text>
      </Stack>
    );
  }

  if (connectorMetrics.length === 0) {
    return (
      <Stack align="center" gap="md" p="lg">
        <Text c="dimmed">No metrics available. Select connectors first.</Text>
      </Stack>
    );
  }

  const handleMetricToggle = (connectorId: string, metricId: string, isChecked: boolean) => {
    const connectorMetrics = selectedMetrics[connectorId] || [];
    const updated = isChecked
      ? [...connectorMetrics, metricId]
      : connectorMetrics.filter((id: string) => id !== metricId);

    setValue(
      "selectedMetrics",
      {
        ...selectedMetrics,
        [connectorId]: updated,
      },
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  };

  const handleSelectAll = (connectorId: string, metricIds: string[], isChecked: boolean) => {
    if (isChecked) {
      setValue(
        "selectedMetrics",
        {
          ...selectedMetrics,
          [connectorId]: [...new Set([...(selectedMetrics[connectorId] || []), ...metricIds])],
        },
        { shouldDirty: true, shouldTouch: true, shouldValidate: true },
      );
    } else {
      const { [connectorId]: _removed, ...rest } = selectedMetrics;
      void _removed;
      setValue("selectedMetrics", rest, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    }
  };

  return (
    <Stack gap="md">
      <Text fw={500}>Select Metrics for Each Connector</Text>

      <ScrollArea.Autosize mah={400}>
        <Stack gap="md">
          {connectorMetrics.map((connector, index) => (
            <Box key={connector.connectorId}>
              <Group justify="space-between" mb="xs">
                <Text fw={500}>{connector.connectorName}</Text>
                <Checkbox
                  checked={
                    connector.metrics.length > 0 &&
                    (selectedMetrics[connector.connectorId] || []).length ===
                      connector.metrics.length
                  }
                  indeterminate={
                    (selectedMetrics[connector.connectorId] || []).length > 0 &&
                    (selectedMetrics[connector.connectorId] || []).length < connector.metrics.length
                  }
                  onChange={(e) =>
                    handleSelectAll(
                      connector.connectorId,
                      connector.metrics.map((m) => m.id),
                      e.currentTarget.checked,
                    )
                  }
                />
              </Group>

              <Stack gap="xs" pl="md">
                {connector.metrics.map((metric) => (
                  <Group key={metric.id} gap="md">
                    <Checkbox
                      checked={(selectedMetrics[connector.connectorId] || []).includes(metric.id)}
                      onChange={(e) =>
                        handleMetricToggle(
                          connector.connectorId,
                          metric.id,
                          e.currentTarget.checked,
                        )
                      }
                    />
                    <Stack gap={2}>
                      <Text size="sm">{metric.name}</Text>
                      {metric.description && (
                        <Text size="xs" c="dimmed">
                          {metric.description}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                ))}
              </Stack>

              {index < connectorMetrics.length - 1 && <Divider mt="md" />}
            </Box>
          ))}
        </Stack>
      </ScrollArea.Autosize>

      {errors.selectedMetrics && (
        <Text size="sm" c="red">
          {typeof errors.selectedMetrics.message === "string"
            ? errors.selectedMetrics.message
            : "Please select metrics"}
        </Text>
      )}
    </Stack>
  );
}
