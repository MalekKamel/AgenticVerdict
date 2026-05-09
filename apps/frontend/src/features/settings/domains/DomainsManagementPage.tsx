"use client";

import { useState } from "react";
import {
  Container,
  Stack,
  Title,
  Paper,
  Group,
  Text,
  Badge,
  ActionIcon,
  Menu,
  Box,
  Button,
  Modal,
  TextInput,
  Textarea,
  Alert,
  Divider,
  LoadingOverlay,
} from "@mantine/core";
import { useForm } from "react-hook-form";
import {
  IconPlus,
  IconDotsVertical,
  IconTrash,
  IconEdit,
  IconAlertCircle,
  IconUsers,
  IconFolder,
} from "@tabler/icons-react";

import { useAppShellHeader } from "@/features/shell/ui/app-shell-context";
import { useTranslations } from "@/i18n/react";
import {
  useAiDomains,
  useCreateAiDomain,
  useUpdateAiDomain,
  useDeleteAiDomain,
} from "@/hooks/useAiDomains";
import { ROUTE_PATHS } from "@/router/utils/route-paths";
import type { BusinessDomain } from "@agenticverdict/types";

interface DomainFormData {
  name: string;
  description?: string;
}

function DomainCard({
  domain,
  onEdit,
  onDelete,
}: {
  domain: BusinessDomain;
  onEdit: (domain: BusinessDomain) => void;
  onDelete: (domain: BusinessDomain) => void;
}) {
  const t = useTranslations("settings");

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between">
          <Group gap="xs">
            <IconFolder size={20} color="#666" />
            <Text fw={600} size="lg">
              {domain.name}
            </Text>
          </Group>
          <Menu withinPortal>
            <Menu.Target>
              <ActionIcon variant="subtle" size="sm">
                <IconDotsVertical size={16} />
              </ActionIcon>
            </Menu.Target>
            <Menu.Dropdown>
              <Menu.Item leftSection={<IconEdit size={14} />} onClick={() => onEdit(domain)}>
                {t("common.edit")}
              </Menu.Item>
              <Divider />
              <Menu.Item
                color="red"
                leftSection={<IconTrash size={14} />}
                onClick={() => onDelete(domain)}
              >
                {t("actions.delete")}
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>

        {domain.description && (
          <Text size="sm" c="dimmed">
            {domain.description}
          </Text>
        )}

        <Group gap="xs">
          <Badge variant="outline" leftSection={<IconUsers size={12} />}>
            {t("badges.connectors", { count: domain.connectorCount || 0 })}
          </Badge>
        </Group>
      </Stack>
    </Paper>
  );
}

export function DomainsManagementPage() {
  const t = useTranslations("settings");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editDomain, setEditDomain] = useState<BusinessDomain | null>(null);
  const [domainToDelete, setDomainToDelete] = useState<BusinessDomain | null>(null);

  useAppShellHeader({
    breadcrumbs: [
      { label: t("common.settings"), href: ROUTE_PATHS.SETTINGS_DOMAINS },
      { label: t("management.pageTitle") },
    ],
  });

  const form = useForm<DomainFormData>({
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const { data: domains, isLoading, error, refetch } = useAiDomains();
  const createMutation = useCreateAiDomain({
    onSuccess: () => {
      setCreateModalOpen(false);
      form.reset();
      refetch();
    },
  });
  const updateMutation = useUpdateAiDomain({
    onSuccess: () => {
      setEditDomain(null);
      form.reset();
      refetch();
    },
  });
  const deleteMutation = useDeleteAiDomain({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreate = (data: DomainFormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description,
    });
  };

  const handleUpdate = (data: DomainFormData) => {
    if (!editDomain) return;
    updateMutation.mutate({
      domainId: editDomain.id,
      name: data.name,
      description: data.description,
    });
  };

  const handleDelete = (domain: BusinessDomain) => {
    setDomainToDelete(domain);
  };

  const confirmDelete = () => {
    if (!domainToDelete) return;
    deleteMutation.mutate(
      { domainId: domainToDelete.id },
      {
        onSuccess: () => {
          setDomainToDelete(null);
        },
      },
    );
  };

  const openEditModal = (domain: BusinessDomain) => {
    setEditDomain(domain);
    form.setValue("name", domain.name);
    form.setValue("description", domain.description || "");
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
        {/* Header */}
        <Group justify="space-between">
          <Title order={2}>{t("management.pageTitle")}</Title>
          <Button leftSection={<IconPlus size={18} />} onClick={() => setCreateModalOpen(true)}>
            {t("actions.addDomain")}
          </Button>
        </Group>

        {/* Info Alert */}
        <Alert icon={<IconAlertCircle size={20} />} color="blue">
          {t("management.info")}
        </Alert>

        {/* Domain Grid */}
        {isLoading ? (
          <Box style={{ position: "relative", minHeight: 200 }}>
            <LoadingOverlay visible />
          </Box>
        ) : domains && domains.length > 0 ? (
          <Stack gap="md">
            {domains?.map((domain: BusinessDomain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                onEdit={openEditModal}
                onDelete={handleDelete}
              />
            ))}
          </Stack>
        ) : (
          <Alert icon={<IconAlertCircle size={20} />} color="yellow">
            {t("messages.noDomains")}
          </Alert>
        )}
      </Stack>

      {/* Create Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          form.reset();
        }}
        title={t("modals.addDomain")}
        size="md"
      >
        <form onSubmit={form.handleSubmit(handleCreate)}>
          <Stack gap="md">
            <TextInput
              label={t("form.name")}
              placeholder={t("form.namePlaceholder")}
              {...form.register("name", { required: t("form.nameRequired") })}
              error={form.formState.errors.name?.message}
            />
            <Textarea
              label={t("form.description")}
              placeholder={t("form.descriptionPlaceholder")}
              {...form.register("description")}
              error={form.formState.errors.description?.message}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setCreateModalOpen(false)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={createMutation.isPending}>
                {t("actions.create")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Edit Modal */}
      <Modal
        opened={!!editDomain}
        onClose={() => {
          setEditDomain(null);
          form.reset();
        }}
        title={t("modals.editDomain")}
        size="md"
      >
        <form onSubmit={form.handleSubmit(handleUpdate)}>
          <Stack gap="md">
            <TextInput
              label={t("form.name")}
              placeholder={t("form.namePlaceholder")}
              {...form.register("name", { required: t("form.nameRequired") })}
              error={form.formState.errors.name?.message}
            />
            <Textarea
              label={t("form.description")}
              placeholder={t("form.descriptionPlaceholder")}
              {...form.register("description")}
              error={form.formState.errors.description?.message}
            />
            <Group justify="flex-end" mt="md">
              <Button variant="default" onClick={() => setEditDomain(null)}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" loading={updateMutation.isPending}>
                {t("actions.update")}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      <Modal
        opened={!!domainToDelete}
        onClose={() => setDomainToDelete(null)}
        title={t("actions.delete")}
        size="sm"
      >
        <Stack gap="md">
          <Text>
            {domainToDelete?.connectorCount && domainToDelete.connectorCount > 0
              ? t("messages.confirmDeleteWithConnectors", {
                  name: domainToDelete!.name,
                  count: domainToDelete!.connectorCount,
                })
              : t("messages.confirmDelete", { name: domainToDelete?.name ?? "" })}
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDomainToDelete(null)}>
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
