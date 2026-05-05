"use client";

import { Stack, Box, Text, Group, Badge, Divider, Title } from "@mantine/core";
import { useFormContext } from "react-hook-form";

interface ReviewValues {
  name: string;
  description?: string;
  domain: string;
  connectorIds: string[];
  selectedMetrics: Record<string, string[]>;
  model: string;
  quality: number;
  detailLevel: string;
  customPrompt?: string;
  frequency: string;
  time: string;
  format: string;
  emailRecipients: string[];
  webhookUrl?: string;
  enableWebhook: boolean;
}

interface ReviewStepProps {
  connectors: Array<{ id: string; name: string }>;
}

export function ReviewStep({ connectors }: ReviewStepProps) {
  const { getValues } = useFormContext<ReviewValues>();
  const values = getValues();

  const selectedConnectors = connectors.filter((c) => values.connectorIds.includes(c.id));
  const totalMetrics = Object.values(values.selectedMetrics || {}).reduce(
    (acc, metrics: string[]) => acc + metrics.length,
    0,
  );

  return (
    <Stack gap="md">
      <Title order={4}>Review Configuration</Title>

      <Box>
        <Text fw={600} mb="xs">
          Basic Information
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">Name:</Text>
            <Text>{values.name}</Text>
          </Group>
          {values.description && (
            <Group gap="xs" align="flex-start">
              <Text c="dimmed">Description:</Text>
              <Text>{values.description}</Text>
            </Group>
          )}
          <Group gap="xs">
            <Text c="dimmed">Domain:</Text>
            <Badge>{values.domain}</Badge>
          </Group>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text fw={600} mb="xs">
          Connectors & Metrics
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">Selected Connectors:</Text>
            <Text>
              {selectedConnectors.length} ({selectedConnectors.map((c) => c.name).join(", ")})
            </Text>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">Total Metrics:</Text>
            <Text>{totalMetrics}</Text>
          </Group>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text fw={600} mb="xs">
          AI Settings
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">Model:</Text>
            <Badge>{values.model}</Badge>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">Quality:</Text>
            <Text>{values.quality}%</Text>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">Detail Level:</Text>
            <Badge>{values.detailLevel}</Badge>
          </Group>
          {values.customPrompt && (
            <Group gap="xs" align="flex-start">
              <Text c="dimmed">Custom Instructions:</Text>
              <Text style={{ flex: 1 }}>{values.customPrompt}</Text>
            </Group>
          )}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text fw={600} mb="xs">
          Schedule & Delivery
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">Frequency:</Text>
            <Badge>{values.frequency}</Badge>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">Time:</Text>
            <Text>{values.time}:00</Text>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">Format:</Text>
            <Badge>{values.format}</Badge>
          </Group>
          <Group gap="xs" align="flex-start">
            <Text c="dimmed">Email Recipients:</Text>
            <Stack gap={2}>
              {values.emailRecipients.map((email: string, index: number) => (
                <Text key={index} size="sm">
                  {email}
                </Text>
              ))}
            </Stack>
          </Group>
          {values.enableWebhook && values.webhookUrl && (
            <Group gap="xs" align="flex-start">
              <Text c="dimmed">Webhook:</Text>
              <Text size="sm">{values.webhookUrl}</Text>
            </Group>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
