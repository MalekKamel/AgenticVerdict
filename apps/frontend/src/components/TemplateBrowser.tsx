"use client";

import { useState, useMemo } from "react";
import {
  Stack,
  TextInput,
  Select,
  Group,
  SimpleGrid,
  Paper,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Divider,
} from "@mantine/core";
import {
  IconSearch,
  IconDotsVertical,
  IconEye,
  IconDownload,
  IconTrash,
} from "@tabler/icons-react";

import { useTranslations } from "@/i18n/react";
import type { AiTemplate } from "@agenticverdict/types";

interface TemplateBrowserProps {
  templates: AiTemplate[];
  isLoading?: boolean;
  onPreview?: (template: AiTemplate) => void;
  onDeploy?: (template: AiTemplate) => void;
  onDelete?: (template: AiTemplate) => void;
}

export function TemplateBrowser({
  templates = [],
  isLoading = false,
  onPreview,
  onDeploy,
  onDelete,
}: TemplateBrowserProps) {
  const t = useTranslations("components");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const matchesSearch =
        template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.description?.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = !statusFilter || template.status === statusFilter;
      const matchesType = !typeFilter || template.providerType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [templates, searchQuery, statusFilter, typeFilter]);

  return (
    <Stack gap="md">
      {/* Filters */}
      <Group gap="md">
        <TextInput
          placeholder={t("templateBrowser.filters.search")}
          leftSection={<IconSearch size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Select
          placeholder={t("templateBrowser.filters.status")}
          data={[
            { value: "active", label: t("templateBrowser.status.active") },
            { value: "draft", label: t("templateBrowser.status.draft") },
            { value: "archived", label: t("templateBrowser.status.archived") },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          style={{ width: 150 }}
        />
        <Select
          placeholder={t("templateBrowser.filters.type")}
          data={[
            { value: "openai", label: "OpenAI" },
            { value: "anthropic", label: "Anthropic" },
          ]}
          value={typeFilter}
          onChange={setTypeFilter}
          clearable
          style={{ width: 150 }}
        />
      </Group>

      {/* Template Grid */}
      {isLoading ? (
        <Text c="dimmed" ta="center">
          {t("templateBrowser.loading")}
        </Text>
      ) : filteredTemplates.length > 0 ? (
        <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
          {filteredTemplates.map((template) => (
            <Paper key={template.id} p="md" withBorder>
              <Stack gap="xs">
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
                    {t(`templateBrowser.status.${template.status}`)}
                  </Badge>
                  <Menu withinPortal>
                    <Menu.Target>
                      <ActionIcon variant="subtle" size="sm">
                        <IconDotsVertical size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEye size={14} />}
                        onClick={() => onPreview?.(template)}
                      >
                        {t("templateBrowser.actions.preview")}
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconDownload size={14} />}
                        onClick={() => onDeploy?.(template)}
                      >
                        {t("templateBrowser.actions.deploy")}
                      </Menu.Item>
                      <Divider />
                      <Menu.Item
                        color="red"
                        leftSection={<IconTrash size={14} />}
                        onClick={() => onDelete?.(template)}
                      >
                        {t("templateBrowser.actions.delete")}
                      </Menu.Item>
                    </Menu.Dropdown>
                  </Menu>
                </Group>

                <Text fw={600} size="lg" lineClamp={1}>
                  {template.name}
                </Text>

                {template.description && (
                  <Text size="sm" c="dimmed" lineClamp={2}>
                    {template.description}
                  </Text>
                )}

                <Group gap="xs">
                  <Badge variant="outline" size="sm">
                    {template.providerType}
                  </Badge>
                  <Badge variant="outline" size="sm">
                    v{template.version}
                  </Badge>
                </Group>

                {template.domainScope && (
                  <Badge size="xs" variant="light" color="blue">
                    {template.domainScope}
                  </Badge>
                )}
              </Stack>
            </Paper>
          ))}
        </SimpleGrid>
      ) : (
        <Text c="dimmed" ta="center">
          {t("templateBrowser.noTemplates")}
        </Text>
      )}
    </Stack>
  );
}
