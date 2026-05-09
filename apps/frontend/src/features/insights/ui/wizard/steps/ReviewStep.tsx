"use client";

import { Stack, Box, Text, Group, Badge, Divider, Title } from "@mantine/core";
import { useFormContext } from "react-hook-form";
import { useTranslations } from "@/i18n/react";

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
  const t = useTranslations("insights");
  const { getValues } = useFormContext<ReviewValues>();
  const values = getValues();

  const selectedConnectors = connectors.filter((c) => values.connectorIds.includes(c.id));
  const totalMetrics = Object.values(values.selectedMetrics || {}).reduce(
    (acc, metrics: string[]) => acc + metrics.length,
    0,
  );

  return (
    <Stack gap="md">
      <Title order={4}>{t("wizard.steps.review.title")}</Title>

      <Box>
        <Text fw={600} mb="xs">
          {t("wizard.steps.review.sections.basicInfo")}
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.name")}:</Text>
            <Text>{values.name}</Text>
          </Group>
          {values.description && (
            <Group gap="xs" align="flex-start">
              <Text c="dimmed">{t("wizard.steps.review.fields.description")}:</Text>
              <Text>{values.description}</Text>
            </Group>
          )}
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.domain")}:</Text>
            <Badge>{values.domain}</Badge>
          </Group>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text fw={600} mb="xs">
          {t("wizard.steps.review.sections.connectors")}
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.selectedConnectors")}:</Text>
            <Text>
              {selectedConnectors.length} ({selectedConnectors.map((c) => c.name).join(", ")})
            </Text>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.totalMetrics")}:</Text>
            <Text>{totalMetrics}</Text>
          </Group>
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text fw={600} mb="xs">
          {t("wizard.steps.review.sections.aiSettings")}
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.model")}:</Text>
            <Badge>{values.model}</Badge>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.quality")}:</Text>
            <Text>{values.quality}%</Text>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.detailLevel")}:</Text>
            <Badge>{values.detailLevel}</Badge>
          </Group>
          {values.customPrompt && (
            <Group gap="xs" align="flex-start">
              <Text c="dimmed">{t("wizard.steps.review.fields.customInstructions")}:</Text>
              <Text style={{ flex: 1 }}>{values.customPrompt}</Text>
            </Group>
          )}
        </Stack>
      </Box>

      <Divider />

      <Box>
        <Text fw={600} mb="xs">
          {t("wizard.steps.review.sections.schedule")}
        </Text>
        <Stack gap="xs">
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.frequency")}:</Text>
            <Badge>{values.frequency}</Badge>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.time")}:</Text>
            <Text>{values.time}:00</Text>
          </Group>
          <Group gap="xs">
            <Text c="dimmed">{t("wizard.steps.review.fields.format")}:</Text>
            <Badge>{values.format}</Badge>
          </Group>
          <Group gap="xs" align="flex-start">
            <Text c="dimmed">{t("wizard.steps.review.fields.emailRecipients")}:</Text>
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
              <Text c="dimmed">{t("wizard.steps.review.fields.webhook")}:</Text>
              <Text size="sm">{values.webhookUrl}</Text>
            </Group>
          )}
        </Stack>
      </Box>
    </Stack>
  );
}
