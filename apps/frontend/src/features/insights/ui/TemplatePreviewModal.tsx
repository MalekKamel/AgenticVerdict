import { Badge, Button, Divider, Group, Modal, Stack, Text, Title } from "@mantine/core";
import { useTemplateDetail } from "@/features/insights/api/template-api";
import { useTranslations } from "@/i18n/react";

interface TemplatePreviewModalProps {
  templateId: string | null;
  onClose: () => void;
  onApply: (templateId: string) => void;
}

export function TemplatePreviewModal({ templateId, onClose, onApply }: TemplatePreviewModalProps) {
  const t = useTranslations("insights");
  const { data: template, isLoading } = useTemplateDetail(templateId || "");

  const isOpen = !!templateId;

  return (
    <Modal opened={isOpen} onClose={onClose} title={t("templates.previewTitle")} size="lg">
      {isLoading ? (
        <Text c="dimmed">{t("templates.loadingDetails")}</Text>
      ) : template ? (
        <Stack gap="md">
          <Group>
            <Text size="xl">{template.icon}</Text>
            <Stack gap={2}>
              <Title order={4}>{template.name}</Title>
              <Text size="sm" c="dimmed">
                {template.description}
              </Text>
            </Stack>
          </Group>

          <Divider />

          <Stack gap="xs">
            <Title order={5}>{t("templates.domains")}</Title>
            <Group gap="xs" wrap="wrap">
              {template.domains.map((domain) => (
                <Badge key={domain.id} variant="light">
                  {domain.name}
                </Badge>
              ))}
            </Group>
          </Stack>

          <Stack gap="xs">
            <Title order={5}>{t("templates.connectorsMetrics")}</Title>
            {template.connectors.map((connector) => (
              <Stack key={connector.connectorId} gap={4}>
                <Text fw={500}>{connector.connectorName}</Text>
                <Group gap="xs" wrap="wrap">
                  {connector.metrics.map((metric) => (
                    <Badge key={metric} variant="outline" size="sm">
                      {metric}
                    </Badge>
                  ))}
                </Group>
              </Stack>
            ))}
          </Stack>

          <Stack gap="xs">
            <Title order={5}>{t("templates.schedule")}</Title>
            <Text size="sm">
              {template.schedule.frequency} at {template.schedule.time}:00
            </Text>
          </Stack>

          <Stack gap="xs">
            <Title order={5}>{t("templates.delivery")}</Title>
            <Text size="sm">
              {t("templates.formatLabel")}: {t(`templates.format.${template.delivery.format}`)}
              {template.delivery.enableWebhook && ` · ${t("templates.webhookEnabled")}`}
            </Text>
          </Stack>

          <Divider />

          <Group justify="flex-end">
            <Button variant="outline" onClick={onClose}>
              {t("templates.cancel")}
            </Button>
            <Button onClick={() => onApply(template.id)}>{t("templates.applyAndCustomize")}</Button>
          </Group>
        </Stack>
      ) : (
        <Text c="dimmed">{t("templates.templateNotFound")}</Text>
      )}
    </Modal>
  );
}
