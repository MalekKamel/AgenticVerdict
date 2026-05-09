"use client";

import { useState } from "react";
import {
  Container,
  Stack,
  Title,
  Group,
  TextInput,
  Select,
  ActionIcon,
  Button,
  SimpleGrid,
  Text,
  Badge,
  Paper,
  Box,
  Alert,
  Modal,
  Divider,
  Menu,
} from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import {
  IconPlus,
  IconSearch,
  IconRefresh,
  IconDotsVertical,
  IconEye,
  IconDownload,
  IconTrash,
  IconAlertCircle,
  IconTemplate,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import { useAiTemplates, useDeleteAiTemplate, useDeployAiTemplate } from "@/hooks/useAiTemplates";
import { showInfoNotification, showSuccessNotification } from "@/lib/notifications";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import type { AiTemplate } from "@agenticverdict/types";

function TemplateCard({
  template,
  onPreview,
  onDeploy,
  onDelete,
}: {
  template: AiTemplate;
  onPreview: (template: AiTemplate) => void;
  onDeploy: (template: AiTemplate) => void;
  onDelete: (template: AiTemplate) => void;
}) {
  const t = useTranslations("settings");

  return (
    <Paper p="md" withBorder>
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
            {t(`status.${template.status}`)}
          </Badge>
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEye size={14} />} onClick={() => onPreview(template)}>
                {t("actions.preview")}
              </Menu.Item>
              <Menu.Item
                leftSection={<IconDownload size={14} />}
                onClick={() => onDeploy(template)}
              >
                {t("actions.deploy")}
              </Menu.Item>
              <Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(template)}
              >
                {t("actions.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        <Group gap="xs">
          <IconTemplate size={20} color="#666" />
          <Text fw={600} size="lg" lineClamp={1}>
            {template.name}
          </Text>
        </Group>

        {template.description && (
          <Text size="sm" c="dimmed" lineClamp={2}>
            {template.description}
          </Text>
        )}

        <Group gap="xs">
          <Badge variant="outline" size="sm">
            {template.type ?? "unknown"}
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
  );
}

export function ProviderTemplatesLibrary() {
  const t = useTranslations("settings");
  const isSmallScreen = useMediaQuery("(max-width: 576px)");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<AiTemplate | null>(null);
  const [deployTemplate, setDeployTemplate] = useState<AiTemplate | null>(null);
  const [templateToDelete, setTemplateToDelete] = useState<AiTemplate | null>(null);

  useAppShellHeader({
    breadcrumbs: [
      { label: t("common.settings"), href: ROUTE_PATHS.SETTINGS_DOMAINS },
      { label: t("library.pageTitle") },
    ],
  });

  const { data: templates, isLoading, error, refetch } = useAiTemplates();
  const deleteMutation = useDeleteAiTemplate({
    onSuccess: () => {
      setTemplateToDelete(null);
      showSuccessNotification({ title: t("actions.delete") });
    },
  });
  const deployMutation = useDeployAiTemplate({
    onSuccess: () => {
      setDeployTemplate(null);
      showSuccessNotification({ title: t("actions.deploy") });
    },
  });

  const filteredTemplates = templates?.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = !statusFilter || template.status === statusFilter;
    const matchesType = !typeFilter || template.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const handleDeploy = (template: AiTemplate) => {
    setDeployTemplate(template);
  };

  const handleDelete = (template: AiTemplate) => {
    setTemplateToDelete(template);
  };

  const confirmDelete = () => {
    if (!templateToDelete) return;
    deleteMutation.mutate({ templateId: templateToDelete.id });
  };

  const confirmDeploy = () => {
    if (!deployTemplate) return;
    deployMutation.mutate({ templateId: deployTemplate.id, targetScope: "tenant" });
  };

  if (error) {
    return (
      <Container size="lg" py="xl">
        <Alert icon={<IconAlertCircle size={20} />} color="red" title={t("messages.error")}>
          {t("messages.failedToLoad")}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="lg" py="xl">
      <Stack gap="xl">
        {/* Header - Responsive */}
        <Group justify="space-between" wrap="wrap" gap="sm">
          <Title order={2}>{t("library.pageTitle")}</Title>
          <Button
            leftSection={<IconPlus size={18} />}
            onClick={() => {
              showInfoNotification({
                title: t("actions.createTemplate"),
                message: t("library.info"),
              });
            }}
            fullWidth={isSmallScreen}
          >
            {t("actions.createTemplate")}
          </Button>
        </Group>

        {/* Info Alert */}
        <Alert icon={<IconAlertCircle size={20} />} color="blue">
          {t("library.info")}
        </Alert>

        {/* Filters - Responsive */}
        <Group gap="md" wrap="wrap">
          <TextInput
            placeholder={t("filters.search")}
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: isSmallScreen ? "1 1 100%" : "1 1 200px" }}
          />
          <Select
            placeholder={t("filters.status")}
            data={[
              { value: "active", label: t("status.active") },
              { value: "draft", label: t("status.draft") },
              { value: "archived", label: t("status.archived") },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
            clearable
            style={{ width: isSmallScreen ? "100%" : 150 }}
          />
          <Select
            placeholder={t("filters.type")}
            data={[
              { value: "openai", label: "OpenAI" },
              { value: "anthropic", label: "Anthropic" },
            ]}
            value={typeFilter}
            onChange={setTypeFilter}
            clearable
            style={{ width: isSmallScreen ? "100%" : 150 }}
          />
          <ActionIcon
            onClick={() => refetch()}
            loading={isLoading}
            style={{ width: isSmallScreen ? "100%" : 36 }}
          >
            <IconRefresh size={18} />
          </ActionIcon>
        </Group>

        {/* Template Grid - Responsive breakpoints */}
        {isLoading ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Paper key={i} p="md" withBorder>
                <Stack gap="xs">
                  <Box
                    style={{
                      height: 20,
                      width: 100,
                      background: "#e9ecef",
                      borderRadius: 4,
                    }}
                  />
                  <Box
                    style={{
                      height: 30,
                      width: 200,
                      background: "#f1f3f5",
                      borderRadius: 4,
                    }}
                  />
                  <Box
                    style={{
                      height: 16,
                      width: 150,
                      background: "#e9ecef",
                      borderRadius: 4,
                    }}
                  />
                  <Box
                    style={{
                      height: 20,
                      width: 80,
                      background: "#f1f3f5",
                      borderRadius: 4,
                    }}
                  />
                </Stack>
              </Paper>
            ))}
          </SimpleGrid>
        ) : filteredTemplates && filteredTemplates.length > 0 ? (
          <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
            {filteredTemplates?.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                onPreview={setPreviewTemplate}
                onDeploy={handleDeploy}
                onDelete={handleDelete}
              />
            ))}
          </SimpleGrid>
        ) : (
          <Alert icon={<IconAlertCircle size={20} />} color="yellow">
            {t("messages.noTemplates")}
          </Alert>
        )}
      </Stack>

      {/* Preview Modal - Responsive */}
      <Modal
        opened={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={t("modals.preview")}
        size="lg"
        fullScreen={isSmallScreen}
      >
        {previewTemplate && (
          <Stack>
            <Text fw={600}>{previewTemplate.name}</Text>
            <Text c="dimmed">{previewTemplate.description}</Text>
            <Divider />
            <Box
              style={{
                background: "#f8f9fa",
                padding: 16,
                borderRadius: 8,
                maxHeight: "400px",
                overflow: "auto",
              }}
            >
              <pre
                style={{
                  margin: 0,
                  whiteSpace: "pre-wrap",
                  wordBreak: "break-word",
                }}
              >
                {previewTemplate.content}
              </pre>
            </Box>
            <Group justify="flex-end">
              <Button onClick={() => handleDeploy(previewTemplate)}>{t("actions.deploy")}</Button>
            </Group>
          </Stack>
        )}
      </Modal>

      {/* Deploy Modal - Responsive */}
      <Modal
        opened={!!deployTemplate}
        onClose={() => setDeployTemplate(null)}
        title={t("modals.deploy")}
        size="md"
        fullScreen={isSmallScreen}
      >
        {deployTemplate && (
          <Stack>
            <Text>{t("messages.confirmDeploy", { name: deployTemplate.name })}</Text>
            <Group justify="flex-end">
              <Button
                variant="default"
                onClick={() => setDeployTemplate(null)}
                fullWidth={isSmallScreen}
              >
                {t("common.cancel")}
              </Button>
              <Button
                fullWidth={isSmallScreen}
                onClick={confirmDeploy}
                loading={deployMutation.isPending}
              >
                {t("actions.deploy")}
              </Button>
            </Group>
          </Stack>
        )}
      </Modal>

      <Modal
        opened={!!templateToDelete}
        onClose={() => setTemplateToDelete(null)}
        title={t("actions.delete")}
        size="sm"
      >
        <Stack gap="md">
          <Text>{t("messages.confirmDelete", { name: templateToDelete?.name ?? "" })}</Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setTemplateToDelete(null)}>
              {t("common.cancel")}
            </Button>
            <Button color="red" onClick={confirmDelete} loading={deleteMutation.isPending}>
              {t("actions.delete")}
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Container>
  );
}
