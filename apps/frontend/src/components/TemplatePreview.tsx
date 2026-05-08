"use client";

import {
  Stack,
  Paper,
  Group,
  Text,
  Badge,
  Button,
  Box,
  Divider,
  Alert,
  ScrollArea,
  Code,
} from "@mantine/core";
import { IconDownload, IconAlertCircle, IconCheck } from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import type { AiTemplate } from "@agenticverdict/types";

interface TemplatePreviewProps {
  template: AiTemplate;
  onDeploy?: (templateId: string, targetScope: { type: string; id?: string }) => void;
  isDeploying?: boolean;
}

export function TemplatePreview({ template, onDeploy, isDeploying = false }: TemplatePreviewProps) {
  const t = useTranslations("components.templatePreview");

  const handleDeploy = () => {
    // Default deployment to tenant level
    onDeploy?.(template.id, { type: "tenant" });
  };

  return (
    <Paper p="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between">
          <Badge
            color={
              template.status === "active"
                ? "green"
                : template.status === "draft"
                  ? "yellow"
                  : "gray"
            }
            variant="light"
          >
            {t(`status.${template.status}`)}
          </Badge>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleDeploy}
            loading={isDeploying}
          >
            {t("actions.deploy")}
          </Button>
        </Group>

        {/* Template Info */}
        <Stack gap="xs">
          <Text fw={600} size="xl">
            {template.name}
          </Text>
          {template.description && (
            <Text size="sm" c="dimmed">
              {template.description}
            </Text>
          )}
        </Stack>

        {/* Metadata */}
        <Group gap="xs">
          <Badge variant="outline">{template.providerType}</Badge>
          <Badge variant="outline">v{template.version}</Badge>
          {template.domainScope && (
            <Badge variant="light" color="blue">
              {template.domainScope}
            </Badge>
          )}
        </Group>

        <Divider />

        {/* Template Content */}
        <Stack gap="xs">
          <Text fw={600} size="sm">
            {t("content")}
          </Text>
          <ScrollArea.Autosize mah={400}>
            <Box
              style={{
                background: "#f8f9fa",
                padding: 16,
                borderRadius: 8,
                fontFamily: "monospace",
                fontSize: 12,
                whiteSpace: "pre-wrap",
                overflow: "auto",
              }}
            >
              <Code c="dimmed">{template.content}</Code>
            </Box>
          </ScrollArea.Autosize>
        </Stack>

        {/* Variables */}
        {template.variables && template.variables.length > 0 && (
          <Stack gap="xs">
            <Text fw={600} size="sm">
              {t("variables")}
            </Text>
            <Stack gap="xs">
              {template.variables.map((variable, index) => (
                <Paper key={index} p="xs" withBorder>
                  <Group justify="space-between">
                    <Text size="sm" fw={500}>
                      {variable.name}
                    </Text>
                    <Badge size="xs" variant="outline">
                      {variable.type}
                    </Badge>
                  </Group>
                  {variable.description && (
                    <Text size="xs" c="dimmed" mt="xs">
                      {variable.description}
                    </Text>
                  )}
                  {variable.required && (
                    <Badge size="xs" color="red" variant="light" mt="xs">
                      {t("required")}
                    </Badge>
                  )}
                </Paper>
              ))}
            </Stack>
          </Stack>
        )}

        {/* Deployment Info */}
        <Alert icon={<IconAlertCircle size={16} />} color="blue">
          <Text size="xs">{t("deploymentInfo")}</Text>
        </Alert>

        {/* Success Message */}
        {!isDeploying && (
          <Alert icon={<IconCheck size={16} />} color="green">
            <Text size="xs">{t("readyToDeploy")}</Text>
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
