import { useState } from "react";
import {
  Badge,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Text,
  Title,
  ActionIcon,
} from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { useTemplateList } from "@/features/insights/api/template-api";
import { templateService } from "@/features/insights/services/template-service";
import { TemplatePreviewModal } from "./TemplatePreviewModal";
import { useTranslations } from "@/i18n/react";

interface TemplateBrowserProps {
  onSelectTemplate: (templateId: string) => void;
  onStartFromScratch: () => void;
}

export function TemplateBrowser({ onSelectTemplate, onStartFromScratch }: TemplateBrowserProps) {
  const t = useTranslations("insights");
  const [domainFilter, setDomainFilter] = useState<string | undefined>(undefined);
  const [previewTemplateId, setPreviewTemplateId] = useState<string | null>(null);

  const { data: templates, isLoading, error } = useTemplateList(domainFilter);

  const availableDomains = templates ? templateService.getAvailableDomains(templates) : [];

  const filteredTemplates = domainFilter
    ? templateService.getTemplatesByDomain(templates || [], domainFilter)
    : templates || [];

  if (error) {
    return (
      <Stack gap="md">
        <Title order={3}>{t("templates.chooseStartingPoint")}</Title>
        <Text c="dimmed">{t("templates.failedToLoad")}</Text>
        <Button onClick={onStartFromScratch} leftSection={<IconPlus size={16} />}>
          {t("templates.startFromScratch")}
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Stack gap={4}>
          <Title order={3}>{t("templates.chooseStartingPoint")}</Title>
          <Text c="dimmed" size="sm">
            {t("templates.chooseStartingPointDesc")}
          </Text>
        </Stack>
        <Button onClick={onStartFromScratch} variant="outline" leftSection={<IconPlus size={16} />}>
          {t("templates.startFromScratch")}
        </Button>
      </Group>

      {availableDomains.length > 0 && (
        <Group gap="xs" wrap="wrap">
          <Badge
            variant={!domainFilter ? "filled" : "outline"}
            onClick={() => setDomainFilter(undefined)}
            style={{ cursor: "pointer" }}
          >
            {t("templates.all")}
          </Badge>
          {availableDomains.map((domain) => (
            <Badge
              key={domain}
              variant={domainFilter === domain ? "filled" : "outline"}
              onClick={() => setDomainFilter(domain)}
              style={{ cursor: "pointer" }}
            >
              {domain}
            </Badge>
          ))}
        </Group>
      )}

      {isLoading ? (
        <Text c="dimmed">{t("templates.loading")}</Text>
      ) : filteredTemplates.length === 0 ? (
        <Text c="dimmed">{t("templates.noTemplatesFoundAction")}</Text>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filteredTemplates.map((template) => (
            <Card key={template.id} withBorder radius="md">
              <Stack gap="xs">
                <Group justify="space-between" align="flex-start">
                  <Text size="xl">{template.icon}</Text>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    onClick={() => setPreviewTemplateId(template.id)}
                    aria-label="Preview template"
                  >
                    👁
                  </ActionIcon>
                </Group>

                <Stack gap={2}>
                  <Title order={5}>{template.name}</Title>
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {template.description}
                  </Text>
                </Stack>

                <Group gap="xs" wrap="wrap">
                  {template.domains.slice(0, 3).map((domain) => (
                    <Badge key={domain.id} variant="light" size="sm">
                      {domain.name}
                    </Badge>
                  ))}
                  {template.domains.length > 3 && (
                    <Badge variant="light" size="sm">
                      +{template.domains.length - 3}
                    </Badge>
                  )}
                </Group>

                <Text size="xs" c="dimmed">
                  {t("templates.connectorCount", { count: template.connectorCount })}
                </Text>

                <Button size="sm" fullWidth onClick={() => onSelectTemplate(template.id)}>
                  {t("templates.useTemplate")}
                </Button>
              </Stack>
            </Card>
          ))}
        </SimpleGrid>
      )}

      <TemplatePreviewModal
        templateId={previewTemplateId}
        onClose={() => setPreviewTemplateId(null)}
        onApply={(id) => {
          setPreviewTemplateId(null);
          onSelectTemplate(id);
        }}
      />
    </Stack>
  );
}
